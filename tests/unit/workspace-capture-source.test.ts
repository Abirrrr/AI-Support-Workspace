import { describe, expect, it, vi } from 'vitest';

import {
  ChromeWorkspaceCaptureSource,
  type WorkspaceCaptureRuntimeApi,
} from '../../src/extension/keyboard-shortcut/sidepanel-capture-source';

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

describe('ChromeWorkspaceCaptureSource', () => {
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
