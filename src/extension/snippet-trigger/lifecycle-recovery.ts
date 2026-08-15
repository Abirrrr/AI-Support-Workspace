export const SUPPORTED_WEBPAGE_MATCHES = ['http://*/*', 'https://*/*'] as const;

const MAX_CONCURRENT_TAB_RECOVERIES = 4;

export type LifecycleRecoveryReason =
  'install' | 'update' | 'chrome-update' | 'startup';

export type TabRecoveryStatus =
  'recovered' | 'not-loaded' | 'unsupported' | 'injection-failed';

export interface TabRecoveryResult {
  readonly tabId?: number;
  readonly status: TabRecoveryStatus;
}

export interface LifecycleRecoveryResult {
  readonly reason: LifecycleRecoveryReason;
  readonly status: 'completed' | 'query-failed';
  readonly tabs: readonly TabRecoveryResult[];
}

interface RecoverableTab {
  readonly id?: number;
  readonly discarded?: boolean;
}

export interface ContentScriptRecoveryChromeApi {
  readonly tabs: {
    query(queryInfo: {
      readonly url: readonly string[];
    }): Promise<readonly RecoverableTab[]>;
  };
  readonly scripting: {
    executeScript(injection: {
      readonly target: {
        readonly tabId: number;
        readonly allFrames: true;
      };
      readonly files: readonly string[];
    }): Promise<readonly unknown[]>;
  };
}

interface ListenerEvent<Listener> {
  addListener(listener: Listener): void;
  removeListener(listener: Listener): void;
}

type InstalledReason =
  'install' | 'update' | 'chrome_update' | 'shared_module_update';

export interface LifecycleRecoveryRuntime {
  readonly onInstalled: ListenerEvent<
    (details: { readonly reason: InstalledReason }) => void
  >;
  readonly onStartup: ListenerEvent<() => void>;
  getManifest(): {
    readonly content_scripts?: readonly {
      readonly matches?: readonly string[];
      readonly all_frames?: boolean;
      readonly js?: readonly string[];
    }[];
  };
}

async function mapWithConcurrency<Item, Result>(
  items: readonly Item[],
  concurrency: number,
  operation: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const results = new Array<Result>(items.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      if (item !== undefined) results[index] = await operation(item);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () =>
      worker(),
    ),
  );
  return results;
}

export function resolveStaticContentScriptFiles(
  runtime: LifecycleRecoveryRuntime,
): readonly string[] | undefined {
  const registration = runtime
    .getManifest()
    .content_scripts?.find(
      ({ matches, all_frames: allFrames }) =>
        allFrames === true &&
        matches?.length === SUPPORTED_WEBPAGE_MATCHES.length &&
        SUPPORTED_WEBPAGE_MATCHES.every((match) => matches.includes(match)),
    );
  return registration?.js !== undefined && registration.js.length > 0
    ? [...registration.js]
    : undefined;
}

export class ContentScriptLifecycleRecovery {
  private activeCycle: Promise<LifecycleRecoveryResult> | undefined;

  constructor(
    private readonly chromeApi: ContentScriptRecoveryChromeApi,
    private readonly contentScriptFiles: readonly string[],
  ) {}

  recover(reason: LifecycleRecoveryReason): Promise<LifecycleRecoveryResult> {
    if (this.activeCycle !== undefined) return this.activeCycle;
    const cycle = this.runCycle(reason).catch(() => ({
      reason,
      status: 'query-failed' as const,
      tabs: [],
    }));
    this.activeCycle = cycle;
    void cycle.finally(() => {
      if (this.activeCycle === cycle) this.activeCycle = undefined;
    });
    return cycle;
  }

  private async runCycle(
    reason: LifecycleRecoveryReason,
  ): Promise<LifecycleRecoveryResult> {
    let tabs: readonly RecoverableTab[];
    try {
      tabs = await this.chromeApi.tabs.query({
        url: SUPPORTED_WEBPAGE_MATCHES,
      });
    } catch {
      return { reason, status: 'query-failed', tabs: [] };
    }

    const results = await mapWithConcurrency(
      tabs,
      MAX_CONCURRENT_TAB_RECOVERIES,
      async (tab): Promise<TabRecoveryResult> => {
        if (tab.id === undefined) return { status: 'unsupported' };
        if (tab.discarded === true) {
          return { tabId: tab.id, status: 'not-loaded' };
        }
        try {
          const injections = await this.chromeApi.scripting.executeScript({
            target: { tabId: tab.id, allFrames: true },
            files: this.contentScriptFiles,
          });
          return {
            tabId: tab.id,
            status: injections.length > 0 ? 'recovered' : 'unsupported',
          };
        } catch {
          return { tabId: tab.id, status: 'injection-failed' };
        }
      },
    );
    return { reason, status: 'completed', tabs: results };
  }
}

export function registerContentScriptLifecycleRecovery(
  runtime: LifecycleRecoveryRuntime,
  coordinator: ContentScriptLifecycleRecovery,
): () => void {
  const installedListener = (details: { readonly reason: InstalledReason }) => {
    const reason =
      details.reason === 'chrome_update'
        ? 'chrome-update'
        : details.reason === 'install' || details.reason === 'update'
          ? details.reason
          : undefined;
    if (reason !== undefined) void coordinator.recover(reason);
  };
  const startupListener = () => {
    void coordinator.recover('startup');
  };
  runtime.onInstalled.addListener(installedListener);
  runtime.onStartup.addListener(startupListener);
  return () => {
    runtime.onInstalled.removeListener(installedListener);
    runtime.onStartup.removeListener(startupListener);
  };
}
