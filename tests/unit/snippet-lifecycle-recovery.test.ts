// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import {
  SNIPPET_CONTENT_RUNTIME_REGISTRY_KEY,
  SnippetContentRuntime,
  bootstrapSnippetContentRuntime,
  type RecoverableSnippetContentRuntime,
  type SnippetContentRuntimeApi,
} from '../../src/extension/snippet-trigger/content-runtime';
import {
  ContentScriptLifecycleRecovery,
  registerContentScriptLifecycleRecovery,
  resolveStaticContentScriptFiles,
  SUPPORTED_WEBPAGE_MATCHES,
  type ContentScriptRecoveryChromeApi,
  type LifecycleRecoveryRuntime,
} from '../../src/extension/snippet-trigger/lifecycle-recovery';

class EventHub<Listener> {
  readonly listeners = new Set<Listener>();
  addListener = (listener: Listener) => this.listeners.add(listener);
  removeListener = (listener: Listener) => this.listeners.delete(listener);
}

function runtimeApi(): SnippetContentRuntimeApi {
  return {
    connect: vi.fn(() => {
      throw new Error('not used by bootstrap seam test');
    }),
    sendMessage: vi.fn(async () => undefined),
  };
}

function recoverableRuntime(
  owner: SnippetContentRuntimeApi,
  activationListeners: Set<() => void>,
  recover = vi.fn(() => true),
) {
  const activationListener = vi.fn();
  const runtime: RecoverableSnippetContentRuntime = {
    owner,
    start: vi.fn(() => activationListeners.add(activationListener)),
    recover,
    dispose: vi.fn(() => activationListeners.delete(activationListener)),
  };
  return { activationListener, runtime };
}

function lifecycleRuntime(): LifecycleRecoveryRuntime & {
  readonly installed: EventHub<
    (details: {
      reason: 'install' | 'update' | 'chrome_update' | 'shared_module_update';
    }) => void
  >;
  readonly startup: EventHub<() => void>;
} {
  const installed = new EventHub<
    (details: {
      reason: 'install' | 'update' | 'chrome_update' | 'shared_module_update';
    }) => void
  >();
  const startup = new EventHub<() => void>();
  return {
    installed,
    startup,
    onInstalled: installed,
    onStartup: startup,
    getManifest: () => ({
      content_scripts: [
        {
          matches: [...SUPPORTED_WEBPAGE_MATCHES],
          all_frames: true,
          js: ['content-scripts/content.js'],
        },
      ],
    }),
  };
}

describe('idempotent snippet content runtime bootstrap', () => {
  it('starts one runtime and reuses it for repeated recovery without duplicate activation', () => {
    const scope: Record<string, unknown> = {};
    const owner = runtimeApi();
    const activationListeners = new Set<() => void>();
    const first = recoverableRuntime(owner, activationListeners);
    const create = vi.fn(() => first.runtime);

    expect(bootstrapSnippetContentRuntime(scope, owner, create)).toBe(
      'started',
    );
    expect(bootstrapSnippetContentRuntime(scope, owner, create)).toBe(
      'recovered',
    );
    expect(create).toHaveBeenCalledOnce();
    expect(first.runtime.start).toHaveBeenCalledOnce();
    expect(first.runtime.recover).toHaveBeenCalledOnce();

    for (const listener of activationListeners) listener();
    expect(first.activationListener).toHaveBeenCalledOnce();
    expect(activationListeners.size).toBe(1);
  });

  it('restarts once when the current runtime cannot reconnect', () => {
    const scope: Record<string, unknown> = {};
    const owner = runtimeApi();
    const activationListeners = new Set<() => void>();
    const stale = recoverableRuntime(
      owner,
      activationListeners,
      vi.fn(() => false),
    );
    const current = recoverableRuntime(owner, activationListeners);
    const create = vi
      .fn<() => RecoverableSnippetContentRuntime>()
      .mockReturnValueOnce(stale.runtime)
      .mockReturnValueOnce(current.runtime);

    bootstrapSnippetContentRuntime(scope, owner, create);
    expect(bootstrapSnippetContentRuntime(scope, owner, create)).toBe(
      'restarted',
    );
    expect(stale.runtime.recover).toHaveBeenCalledOnce();
    expect(stale.runtime.dispose).toHaveBeenCalledOnce();
    expect(current.runtime.start).toHaveBeenCalledOnce();
    expect(activationListeners.size).toBe(1);
  });

  it('replaces an old extension-context runtime without retaining its listener', () => {
    const scope: Record<string, unknown> = {};
    const oldOwner = runtimeApi();
    const currentOwner = runtimeApi();
    const activationListeners = new Set<() => void>();
    const oldRuntime = recoverableRuntime(oldOwner, activationListeners);
    const currentRuntime = recoverableRuntime(
      currentOwner,
      activationListeners,
    );

    bootstrapSnippetContentRuntime(scope, oldOwner, () => oldRuntime.runtime);
    expect(
      bootstrapSnippetContentRuntime(
        scope,
        currentOwner,
        () => currentRuntime.runtime,
      ),
    ).toBe('restarted');

    expect(oldRuntime.runtime.recover).not.toHaveBeenCalled();
    expect(oldRuntime.runtime.dispose).toHaveBeenCalledOnce();
    expect(currentRuntime.runtime.start).toHaveBeenCalledOnce();
    expect(activationListeners.size).toBe(1);
    expect(scope[SNIPPET_CONTENT_RUNTIME_REGISTRY_KEY]).toBeDefined();
  });

  it('reconnects on the next input after a worker port disconnect without adding listeners', () => {
    const firstMessages = new EventHub<(message: unknown) => void>();
    const firstDisconnects = new EventHub<() => void>();
    const secondMessages = new EventHub<(message: unknown) => void>();
    const secondDisconnects = new EventHub<() => void>();
    const firstPost = vi.fn();
    const secondPost = vi.fn();
    const owner: SnippetContentRuntimeApi = {
      connect: vi
        .fn()
        .mockReturnValueOnce({
          onMessage: firstMessages,
          onDisconnect: firstDisconnects,
          postMessage: firstPost,
        })
        .mockReturnValueOnce({
          onMessage: secondMessages,
          onDisconnect: secondDisconnects,
          postMessage: secondPost,
        }),
      sendMessage: vi.fn(async () => undefined),
    };
    const runtime = new SnippetContentRuntime(owner, document, globalThis);
    runtime.start();
    for (const listener of firstDisconnects.listeners) listener();

    const input = new Event('beforeinput', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperties(input, {
      inputType: { value: 'insertText' },
      data: { value: ';' },
      isComposing: { value: false },
    });
    document.dispatchEvent(input);
    document.dispatchEvent(
      Object.assign(new Event('focusin', { bubbles: true })),
    );

    expect(owner.connect).toHaveBeenCalledTimes(2);
    expect(secondPost).toHaveBeenCalledOnce();
    expect(owner.sendMessage).not.toHaveBeenCalled();
    runtime.dispose();
  });
});

describe('content-script lifecycle recovery coordinator', () => {
  it('resolves the established all-frame static content script from the manifest', () => {
    expect(resolveStaticContentScriptFiles(lifecycleRuntime())).toEqual([
      'content-scripts/content.js',
    ]);
  });

  it('recovers valid tabs across partial failures without inspecting page content', async () => {
    const query = vi.fn(async () => [
      { id: 1 },
      { id: 2 },
      { id: 3, discarded: true },
      {},
    ]);
    const executeScript = vi.fn(
      async ({ target }: { target: { tabId: number } }) => {
        if (target.tabId === 2) throw new Error('restricted');
        return [{ frameId: 0 }];
      },
    );
    const coordinator = new ContentScriptLifecycleRecovery(
      {
        tabs: { query },
        scripting: { executeScript },
      } as ContentScriptRecoveryChromeApi,
      ['content-scripts/content.js'],
    );

    await expect(coordinator.recover('update')).resolves.toEqual({
      reason: 'update',
      status: 'completed',
      tabs: [
        { tabId: 1, status: 'recovered' },
        { tabId: 2, status: 'injection-failed' },
        { tabId: 3, status: 'not-loaded' },
        { status: 'unsupported' },
      ],
    });
    expect(query).toHaveBeenCalledWith({ url: SUPPORTED_WEBPAGE_MATCHES });
    expect(executeScript).toHaveBeenCalledTimes(2);
    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 1, allFrames: true },
      files: ['content-scripts/content.js'],
    });
    expect(JSON.stringify(executeScript.mock.calls)).not.toMatch(
      /customer|merchant|pageText|formValue/i,
    );
  });

  it('bounds concurrent tab recovery to four injections', async () => {
    let active = 0;
    let maximumActive = 0;
    const releases: Array<() => void> = [];
    const executeScript = vi.fn(async () => {
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise<void>((resolve) => releases.push(resolve));
      active -= 1;
      return [{ frameId: 0 }];
    });
    const coordinator = new ContentScriptLifecycleRecovery(
      {
        tabs: {
          query: vi.fn(async () =>
            Array.from({ length: 6 }, (_, index) => ({ id: index + 1 })),
          ),
        },
        scripting: { executeScript },
      },
      ['content-scripts/content.js'],
    );

    const recovery = coordinator.recover('update');
    await vi.waitFor(() => expect(executeScript).toHaveBeenCalledTimes(4));
    expect(maximumActive).toBe(4);
    for (const release of releases.splice(0)) release();
    await vi.waitFor(() => expect(executeScript).toHaveBeenCalledTimes(6));
    for (const release of releases.splice(0)) release();
    await expect(recovery).resolves.toMatchObject({ status: 'completed' });
    expect(maximumActive).toBe(4);
  });

  it('coalesces concurrent recovery signals and settles cleanly with no tabs', async () => {
    let releaseQuery: ((tabs: readonly []) => void) | undefined;
    const query = vi.fn(
      () =>
        new Promise<readonly []>((resolve) => {
          releaseQuery = resolve;
        }),
    );
    const executeScript = vi.fn(async () => []);
    const coordinator = new ContentScriptLifecycleRecovery(
      { tabs: { query }, scripting: { executeScript } },
      ['content-scripts/content.js'],
    );

    const first = coordinator.recover('startup');
    const duplicate = coordinator.recover('update');
    expect(duplicate).toBe(first);
    releaseQuery?.([]);
    await expect(first).resolves.toEqual({
      reason: 'startup',
      status: 'completed',
      tabs: [],
    });
    expect(query).toHaveBeenCalledOnce();
    expect(executeScript).not.toHaveBeenCalled();
  });

  it('contains a tab-query failure as one quiet recovery result', async () => {
    const coordinator = new ContentScriptLifecycleRecovery(
      {
        tabs: {
          query: vi.fn(async () => {
            throw new Error('unavailable');
          }),
        },
        scripting: { executeScript: vi.fn(async () => []) },
      },
      ['content-scripts/content.js'],
    );
    await expect(coordinator.recover('startup')).resolves.toEqual({
      reason: 'startup',
      status: 'query-failed',
      tabs: [],
    });
  });

  it('registers install/update/Chrome-update and startup recovery only', async () => {
    const runtime = lifecycleRuntime();
    const coordinator = {
      recover: vi.fn(async () => ({
        reason: 'install' as const,
        status: 'completed' as const,
        tabs: [],
      })),
    } as unknown as ContentScriptLifecycleRecovery;
    const unregister = registerContentScriptLifecycleRecovery(
      runtime,
      coordinator,
    );

    for (const listener of runtime.installed.listeners) {
      listener({ reason: 'install' });
      listener({ reason: 'update' });
      listener({ reason: 'chrome_update' });
      listener({ reason: 'shared_module_update' });
    }
    for (const listener of runtime.startup.listeners) listener();
    expect(coordinator.recover).toHaveBeenNthCalledWith(1, 'install');
    expect(coordinator.recover).toHaveBeenNthCalledWith(2, 'update');
    expect(coordinator.recover).toHaveBeenNthCalledWith(3, 'chrome-update');
    expect(coordinator.recover).toHaveBeenNthCalledWith(4, 'startup');

    unregister();
    expect(runtime.installed.listeners.size).toBe(0);
    expect(runtime.startup.listeners.size).toBe(0);
  });
});
