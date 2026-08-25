import { describe, expect, it, vi } from 'vitest';

import {
  ChromeWorkspaceCaptureSource,
  type WorkspaceCaptureRuntimeApi,
} from '../../src/extension/keyboard-shortcut/sidepanel-capture-source';
import { loadWorkspaceSettings } from '../../src/extension/sidepanel/settings-bootstrap';

type RuntimeListener = Parameters<
  WorkspaceCaptureRuntimeApi['onMessage']['addListener']
>[0];

function createRuntime() {
  const listeners: RuntimeListener[] = [];
  const sendMessage = vi.fn(async () => undefined);
  const runtime: WorkspaceCaptureRuntimeApi = {
    onMessage: {
      addListener(listener) {
        listeners.push(listener);
      },
      removeListener(listener) {
        const index = listeners.indexOf(listener);
        if (index >= 0) listeners.splice(index, 1);
      },
    },
    sendMessage,
  };

  return { listeners, runtime, sendMessage };
}

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return { promise, resolve: resolvePromise };
}

describe('ChromeWorkspaceCaptureSource', () => {
  it('announces readiness only after delayed settings bootstrap permits Workspace subscription', async () => {
    const deferred = createDeferred<{
      defaultModel: string | null;
      snippetPasteMode: 'clipboard-only';
      automaticBackupCadence: 'weekly';
    }>();
    const settings = { load: vi.fn(async () => deferred.promise) };
    const { listeners, runtime, sendMessage } = createRuntime();

    const bootstrapPromise = loadWorkspaceSettings(settings);

    expect(listeners).toHaveLength(0);
    expect(sendMessage).not.toHaveBeenCalled();

    deferred.resolve({
      defaultModel: 'saved-model:latest',
      snippetPasteMode: 'clipboard-only',
      automaticBackupCadence: 'weekly',
    });
    const bootstrap = await bootstrapPromise;
    const source = new ChromeWorkspaceCaptureSource(runtime);
    const handler = vi.fn(async () => undefined);
    source.subscribe(handler);

    expect(bootstrap).toEqual({
      initialModel: 'saved-model:latest',
      loadFailureMessage: null,
    });
    expect(listeners).toHaveLength(1);
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'workspace-capture-ready',
    });

    const sendResponse = vi.fn();
    listeners[0]?.(
      {
        type: 'workspace-capture-delivery',
        deliveryId: 14,
        result: { kind: 'success', text: 'Pending selected text' },
      },
      {},
      sendResponse,
    );

    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({
        type: 'workspace-capture-acknowledgement',
        deliveryId: 14,
      }),
    );
    expect(handler).toHaveBeenCalledWith({
      kind: 'success',
      text: 'Pending selected text',
    });
  });

  it('announces readiness after installing its focused listener', async () => {
    const { listeners, runtime, sendMessage } = createRuntime();
    const source = new ChromeWorkspaceCaptureSource(runtime);

    source.subscribe(vi.fn());

    expect(listeners).toHaveLength(1);
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'workspace-capture-ready',
    });
  });

  it('acknowledges only after the capture handler applies delivery', async () => {
    const { listeners, runtime } = createRuntime();
    const source = new ChromeWorkspaceCaptureSource(runtime);
    let applyCapture!: () => void;
    const handler = vi.fn(
      async () =>
        new Promise<void>((resolve) => {
          applyCapture = resolve;
        }),
    );
    source.subscribe(handler);
    const sendResponse = vi.fn();

    const keepChannelOpen = listeners[0]?.(
      {
        type: 'workspace-capture-delivery',
        deliveryId: 12,
        result: { kind: 'success', text: 'Selected text' },
      },
      {},
      sendResponse,
    );

    expect(keepChannelOpen).toBe(true);
    expect(handler).toHaveBeenCalledWith({
      kind: 'success',
      text: 'Selected text',
    });
    expect(sendResponse).not.toHaveBeenCalled();

    applyCapture();

    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({
        type: 'workspace-capture-acknowledgement',
        deliveryId: 12,
      }),
    );
  });

  it('does not acknowledge failed application or expose its error', async () => {
    const { listeners, runtime } = createRuntime();
    const source = new ChromeWorkspaceCaptureSource(runtime);
    source.subscribe(async () => {
      throw new Error('raw application failure');
    });
    const sendResponse = vi.fn();

    listeners[0]?.(
      {
        type: 'workspace-capture-delivery',
        deliveryId: 9,
        result: { kind: 'failure' },
      },
      {},
      sendResponse,
    );

    await vi.waitFor(() => expect(sendResponse).toHaveBeenCalledWith());
  });

  it('removes its listener during cleanup', () => {
    const { listeners, runtime } = createRuntime();
    const source = new ChromeWorkspaceCaptureSource(runtime);

    const unsubscribe = source.subscribe(vi.fn());
    unsubscribe();

    expect(listeners).toHaveLength(0);
  });
});
