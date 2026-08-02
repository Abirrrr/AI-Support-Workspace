import { describe, expect, it, vi } from 'vitest';

import {
  handleWorkspaceCaptureCommand,
  registerWorkspaceCaptureCommand,
  TransientCaptureDelivery,
  type WorkspaceCaptureChromeApi,
} from '../../src/extension/keyboard-shortcut/background-command';
import { CAPTURE_SELECTION_COMMAND } from '../../src/extension/keyboard-shortcut/messages';

type CommandListener = Parameters<
  WorkspaceCaptureChromeApi['commands']['onCommand']['addListener']
>[0];
type RuntimeListener = Parameters<
  WorkspaceCaptureChromeApi['runtime']['onMessage']['addListener']
>[0];

function createChromeApi(
  options: {
    captureResult?: unknown;
    executeScript?: WorkspaceCaptureChromeApi['scripting']['executeScript'];
    open?: WorkspaceCaptureChromeApi['sidePanel']['open'];
    openFailure?: unknown;
    sendMessage?: (message: unknown) => Promise<unknown>;
  } = {},
) {
  const commandListeners: CommandListener[] = [];
  const runtimeListeners: RuntimeListener[] = [];
  const events: string[] = [];
  const executeScript = vi.fn(
    async (
      ...args: Parameters<
        WorkspaceCaptureChromeApi['scripting']['executeScript']
      >
    ) => {
      events.push('capture');
      if (options.executeScript !== undefined) {
        return options.executeScript(...args);
      }
      return [
        {
          result: options.captureResult ?? {
            kind: 'success',
            text: 'Selected',
          },
        },
      ];
    },
  );
  const open = vi.fn(
    async (
      ...args: Parameters<WorkspaceCaptureChromeApi['sidePanel']['open']>
    ) => {
      events.push('open');
      if (options.open !== undefined) return options.open(...args);
      if (options.openFailure !== undefined) throw options.openFailure;
    },
  );
  const sendMessage = vi.fn(
    options.sendMessage ??
      (async (message: unknown) => {
        const delivery = message as { deliveryId?: number };
        return {
          type: 'workspace-capture-acknowledgement',
          deliveryId: delivery.deliveryId,
        };
      }),
  );
  const api = {
    commands: {
      onCommand: {
        addListener(listener: CommandListener) {
          commandListeners.push(listener);
        },
        removeListener(listener: CommandListener) {
          const index = commandListeners.indexOf(listener);
          if (index >= 0) commandListeners.splice(index, 1);
        },
      },
    },
    runtime: {
      onMessage: {
        addListener(listener: RuntimeListener) {
          runtimeListeners.push(listener);
        },
        removeListener(listener: RuntimeListener) {
          const index = runtimeListeners.indexOf(listener);
          if (index >= 0) runtimeListeners.splice(index, 1);
        },
      },
      sendMessage,
    },
    scripting: { executeScript },
    sidePanel: { open },
  } as WorkspaceCaptureChromeApi;

  return {
    api,
    commandListeners,
    events,
    executeScript,
    open,
    runtimeListeners,
    sendMessage,
  };
}

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (reason: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

describe('workspace capture background command', () => {
  it('registers and unregisters focused command and ready listeners', () => {
    const { api, commandListeners, runtimeListeners } = createChromeApi();

    const unregister = registerWorkspaceCaptureCommand(api);

    expect(commandListeners).toHaveLength(1);
    expect(runtimeListeners).toHaveLength(1);

    unregister();

    expect(commandListeners).toHaveLength(0);
    expect(runtimeListeners).toHaveLength(0);
  });

  it('starts panel opening before unresolved capture settles, then delivers the result', async () => {
    const capture = createDeferred<readonly { readonly result?: unknown }[]>();
    const panelOpen = createDeferred<undefined>();
    const { api, events, executeScript, open, sendMessage } = createChromeApi({
      executeScript: async () => capture.promise,
      open: async () => panelOpen.promise,
    });
    const delivery = new TransientCaptureDelivery(api.runtime);

    const command = handleWorkspaceCaptureCommand(
      api,
      delivery,
      CAPTURE_SELECTION_COMMAND,
      {
        id: 41,
        windowId: 7,
      },
    );

    expect(events).toEqual(['capture', 'open']);
    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 41 },
      func: expect.any(Function),
    });
    expect(open).toHaveBeenCalledWith({ windowId: 7 });
    expect(sendMessage).not.toHaveBeenCalled();

    panelOpen.resolve(undefined);
    await Promise.resolve();
    expect(sendMessage).not.toHaveBeenCalled();

    capture.resolve([{ result: { kind: 'success', text: 'Selected' } }]);
    await command;

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'workspace-capture-delivery',
      deliveryId: 1,
      result: { kind: 'success', text: 'Selected' },
    });
    expect(delivery.pendingCount).toBe(0);
  });

  it('opens rather than toggles the panel on repeated commands', async () => {
    const { api, open } = createChromeApi();
    const delivery = new TransientCaptureDelivery(api.runtime);

    await handleWorkspaceCaptureCommand(
      api,
      delivery,
      CAPTURE_SELECTION_COMMAND,
      { id: 41, windowId: 7 },
    );
    await handleWorkspaceCaptureCommand(
      api,
      delivery,
      CAPTURE_SELECTION_COMMAND,
      { id: 41, windowId: 7 },
    );

    expect(open).toHaveBeenCalledTimes(2);
    expect(open).toHaveBeenNthCalledWith(1, { windowId: 7 });
    expect(open).toHaveBeenNthCalledWith(2, { windowId: 7 });
  });

  it('ignores unknown commands safely', async () => {
    const { api, executeScript, open, sendMessage } = createChromeApi();
    const delivery = new TransientCaptureDelivery(api.runtime);

    await handleWorkspaceCaptureCommand(api, delivery, 'unknown-command', {
      id: 41,
      windowId: 7,
    });

    expect(executeScript).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('delivers typed empty selection without replacing it with page text', async () => {
    const { api, sendMessage } = createChromeApi({
      captureResult: { kind: 'empty' },
    });
    const delivery = new TransientCaptureDelivery(api.runtime);

    await handleWorkspaceCaptureCommand(
      api,
      delivery,
      CAPTURE_SELECTION_COMMAND,
      {
        id: 41,
        windowId: 7,
      },
    );

    expect(sendMessage).toHaveBeenCalledWith({
      type: 'workspace-capture-delivery',
      deliveryId: 1,
      result: { kind: 'empty' },
    });
  });

  it('maps scripting rejection to a typed failure and still opens the panel', async () => {
    const { api, executeScript, open, sendMessage } = createChromeApi();
    executeScript.mockRejectedValueOnce(new Error('raw restricted page'));
    const delivery = new TransientCaptureDelivery(api.runtime);

    await handleWorkspaceCaptureCommand(
      api,
      delivery,
      CAPTURE_SELECTION_COMMAND,
      {
        id: 41,
        windowId: 7,
      },
    );

    expect(open).toHaveBeenCalledWith({ windowId: 7 });
    expect(sendMessage).toHaveBeenCalledWith({
      type: 'workspace-capture-delivery',
      deliveryId: 1,
      result: { kind: 'failure' },
    });
  });

  it('opens with a typed failure when the tab id is unavailable', async () => {
    const { api, executeScript, open, sendMessage } = createChromeApi();
    const delivery = new TransientCaptureDelivery(api.runtime);

    await handleWorkspaceCaptureCommand(
      api,
      delivery,
      CAPTURE_SELECTION_COMMAND,
      {
        windowId: 7,
      },
    );

    expect(executeScript).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith({ windowId: 7 });
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ result: { kind: 'failure' } }),
    );
  });

  it('opens with a typed failure when the tab id is invalid', async () => {
    const { api, executeScript, open, sendMessage } = createChromeApi();
    const delivery = new TransientCaptureDelivery(api.runtime);

    await handleWorkspaceCaptureCommand(
      api,
      delivery,
      CAPTURE_SELECTION_COMMAND,
      { id: -1, windowId: 7 },
    );

    expect(executeScript).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith({ windowId: 7 });
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ result: { kind: 'failure' } }),
    );
  });

  it('fails safely without capture or panel opening when window context is absent', async () => {
    const { api, executeScript, open, sendMessage } = createChromeApi();
    const delivery = new TransientCaptureDelivery(api.runtime);

    await handleWorkspaceCaptureCommand(
      api,
      delivery,
      CAPTURE_SELECTION_COMMAND,
      {
        id: 41,
      },
    );

    expect(executeScript).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('fails safely without capture or panel opening for an invalid window id', async () => {
    const { api, executeScript, open, sendMessage } = createChromeApi();
    const delivery = new TransientCaptureDelivery(api.runtime);

    await handleWorkspaceCaptureCommand(
      api,
      delivery,
      CAPTURE_SELECTION_COMMAND,
      { id: 41, windowId: -1 },
    );

    expect(executeScript).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('consumes an outstanding successful capture without delivery when panel opening fails', async () => {
    const capture = createDeferred<readonly { readonly result?: unknown }[]>();
    const { api, open, sendMessage } = createChromeApi({
      executeScript: async () => capture.promise,
      openFailure: new Error('raw panel failure'),
    });
    const delivery = new TransientCaptureDelivery(api.runtime);

    const command = handleWorkspaceCaptureCommand(
      api,
      delivery,
      CAPTURE_SELECTION_COMMAND,
      {
        id: 41,
        windowId: 7,
      },
    );

    expect(open).toHaveBeenCalledWith({ windowId: 7 });
    expect(sendMessage).not.toHaveBeenCalled();

    capture.resolve([{ result: { kind: 'success', text: 'Selected' } }]);
    await command;

    expect(sendMessage).not.toHaveBeenCalled();
    expect(delivery.pendingCount).toBe(0);
  });

  it('handles capture and panel-open failures without delivery or rejection', async () => {
    const { api, executeScript, open, sendMessage } = createChromeApi({
      executeScript: async () => {
        throw new Error('raw capture failure');
      },
      open: async () => {
        throw new Error('raw panel failure');
      },
    });
    const delivery = new TransientCaptureDelivery(api.runtime);

    await expect(
      handleWorkspaceCaptureCommand(api, delivery, CAPTURE_SELECTION_COMMAND, {
        id: 41,
        windowId: 7,
      }),
    ).resolves.toBeUndefined();

    expect(executeScript).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledOnce();
    expect(sendMessage).not.toHaveBeenCalled();
    expect(delivery.pendingCount).toBe(0);
  });
});

describe('transient capture delivery', () => {
  it('retains delivery across a closed-panel race and acknowledges after ready', async () => {
    let panelReady = false;
    const { api, commandListeners, runtimeListeners, sendMessage } =
      createChromeApi({
        sendMessage: async (message) => {
          if (!panelReady) throw new Error('No receiving end');
          const delivery = message as { deliveryId: number };
          return {
            type: 'workspace-capture-acknowledgement',
            deliveryId: delivery.deliveryId,
          };
        },
      });
    registerWorkspaceCaptureCommand(api);

    commandListeners[0]?.(CAPTURE_SELECTION_COMMAND, {
      id: 41,
      windowId: 7,
    });
    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(1));

    panelReady = true;
    runtimeListeners[0]?.({ type: 'workspace-capture-ready' });

    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledTimes(2));
  });

  it('delivers multiple sequential captures in order without persistence', async () => {
    const delivered: unknown[] = [];
    const { api } = createChromeApi({
      sendMessage: async (message) => {
        delivered.push(message);
        const delivery = message as { deliveryId: number };
        return {
          type: 'workspace-capture-acknowledgement',
          deliveryId: delivery.deliveryId,
        };
      },
    });
    const delivery = new TransientCaptureDelivery(api.runtime);
    delivery.enqueue({ kind: 'success', text: 'First' });
    delivery.enqueue({ kind: 'success', text: 'Second' });

    await delivery.deliverPending();

    expect(delivered).toEqual([
      {
        type: 'workspace-capture-delivery',
        deliveryId: 1,
        result: { kind: 'success', text: 'First' },
      },
      {
        type: 'workspace-capture-delivery',
        deliveryId: 2,
        result: { kind: 'success', text: 'Second' },
      },
    ]);
    expect(delivery.pendingCount).toBe(0);
  });

  it('retains transient delivery safely when acknowledgement is invalid', async () => {
    const { api, sendMessage } = createChromeApi({
      sendMessage: async () => ({
        type: 'workspace-capture-acknowledgement',
        deliveryId: 999,
      }),
    });
    const delivery = new TransientCaptureDelivery(api.runtime);
    delivery.enqueue({ kind: 'success', text: 'Awaiting acknowledgement' });

    await delivery.deliverPending();

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(delivery.pendingCount).toBe(1);
  });
});
