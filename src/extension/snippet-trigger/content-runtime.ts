import {
  FrameTriggerCatalogClient,
  type FrameCatalogRuntime,
} from './frame-catalog-client';
import {
  SnippetExpansionController,
  toBeforeInputEventLike,
} from './expansion-controller';

export const SNIPPET_CONTENT_RUNTIME_REGISTRY_KEY =
  '__aiSupportWorkspaceSnippetContentRuntimeV1';

export interface SnippetContentRuntimeApi extends FrameCatalogRuntime {
  sendMessage(message: unknown): Promise<unknown>;
}

interface RuntimeGlobalScope {
  addEventListener(
    type: 'pagehide',
    listener: () => void,
    options: { readonly once: true },
  ): void;
  removeEventListener(type: 'pagehide', listener: () => void): void;
  setTimeout(handler: () => void, timeout: number): unknown;
}

export interface RecoverableSnippetContentRuntime {
  readonly owner: SnippetContentRuntimeApi;
  start(): void;
  recover(): boolean;
  dispose(): void;
}

interface RegisteredSnippetContentRuntime {
  readonly version: 1;
  readonly owner: SnippetContentRuntimeApi;
  recover(): boolean;
  dispose(): void;
}

export type SnippetContentBootstrapResult =
  'started' | 'recovered' | 'restarted';

function isRegisteredSnippetContentRuntime(
  value: unknown,
): value is RegisteredSnippetContentRuntime {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<RegisteredSnippetContentRuntime>;
  return (
    candidate.version === 1 &&
    typeof candidate.owner === 'object' &&
    candidate.owner !== null &&
    typeof candidate.recover === 'function' &&
    typeof candidate.dispose === 'function'
  );
}

function safeDispose(runtime: RegisteredSnippetContentRuntime): void {
  try {
    runtime.dispose();
  } catch {
    // A previous extension context can already be invalid during replacement.
  }
}

export function bootstrapSnippetContentRuntime(
  scope: Record<string, unknown>,
  owner: SnippetContentRuntimeApi,
  createRuntime: () => RecoverableSnippetContentRuntime,
): SnippetContentBootstrapResult {
  const existing = scope[SNIPPET_CONTENT_RUNTIME_REGISTRY_KEY];
  if (isRegisteredSnippetContentRuntime(existing)) {
    if (existing.owner === owner && existing.recover()) return 'recovered';
    safeDispose(existing);
  }
  Reflect.deleteProperty(scope, SNIPPET_CONTENT_RUNTIME_REGISTRY_KEY);

  const runtime = createRuntime();
  runtime.start();
  scope[SNIPPET_CONTENT_RUNTIME_REGISTRY_KEY] = {
    version: 1,
    owner: runtime.owner,
    recover: () => runtime.recover(),
    dispose: () => runtime.dispose(),
  } satisfies RegisteredSnippetContentRuntime;
  return existing === undefined ? 'started' : 'restarted';
}

export class SnippetContentRuntime implements RecoverableSnippetContentRuntime {
  private readonly client: FrameTriggerCatalogClient;
  private readonly controller: SnippetExpansionController;
  private started = false;

  private readonly beforeInputListener = (event: Event) => {
    if (!this.client.isConnected) this.client.connect();
    const beforeInputEvent = toBeforeInputEventLike(event);
    if (beforeInputEvent !== undefined) {
      this.controller.handleBeforeInput(beforeInputEvent);
    }
  };

  private readonly focusListener = () => {
    if (!this.client.isConnected) this.client.connect();
  };

  private readonly pageHideListener = () => {
    this.client.disconnect();
  };

  constructor(
    readonly owner: SnippetContentRuntimeApi,
    private readonly document: Document,
    private readonly scope: RuntimeGlobalScope,
  ) {
    this.client = new FrameTriggerCatalogClient(owner);
    this.controller = new SnippetExpansionController(
      document,
      this.client.cache,
      { requestDelivery: (message) => owner.sendMessage(message) },
      {
        show: (message, kind) => this.showNotice(message, kind),
      },
    );
  }

  start(): void {
    if (this.started) {
      this.recover();
      return;
    }
    this.started = true;
    this.client.connect();
    this.document.addEventListener(
      'beforeinput',
      this.beforeInputListener,
      true,
    );
    this.document.addEventListener('focusin', this.focusListener, true);
    this.scope.addEventListener('pagehide', this.pageHideListener, {
      once: true,
    });
  }

  recover(): boolean {
    return this.started && this.client.connect();
  }

  dispose(): void {
    if (!this.started) return;
    this.started = false;
    this.document.removeEventListener(
      'beforeinput',
      this.beforeInputListener,
      true,
    );
    this.document.removeEventListener('focusin', this.focusListener, true);
    this.scope.removeEventListener('pagehide', this.pageHideListener);
    this.client.disconnect();
  }

  private showNotice(message: string, kind: 'success' | 'error'): void {
    const previous = this.document.getElementById(
      'ai-support-workspace-snippet-notice',
    );
    previous?.remove();
    const notice = this.document.createElement('div');
    notice.id = 'ai-support-workspace-snippet-notice';
    notice.setAttribute('role', kind === 'error' ? 'alert' : 'status');
    notice.textContent = message;
    Object.assign(notice.style, {
      position: 'fixed',
      right: '16px',
      bottom: '16px',
      zIndex: '2147483647',
      maxWidth: '320px',
      padding: '10px 12px',
      borderRadius: '8px',
      color: '#fff',
      background: kind === 'error' ? '#b91c1c' : '#166534',
      font: '13px/1.4 system-ui, sans-serif',
      boxShadow: '0 4px 16px rgb(0 0 0 / 25%)',
    });
    this.document.documentElement.append(notice);
    this.scope.setTimeout(() => notice.remove(), 3_500);
  }
}
