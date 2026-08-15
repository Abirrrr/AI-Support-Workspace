import { describe, expect, it, vi } from 'vitest';

import {
  ChromeWindowsImageClipboardCapability,
  NATIVE_CLIPBOARD_PERMISSION,
  registerNativeClipboardCapability,
} from '../../src/extension/snippet-trigger/native-clipboard-capability';
import nativeDevelopment from '../../config/native-clipboard-companion.development.json';
import { WindowsNativeImageClipboardTransport } from '../../src/infrastructure/clipboard/windows-native-image-clipboard-transport';
import type { NativeClipboardStatusResponse } from '../../src/shared/native-clipboard-messages';

describe('Windows Image clipboard capability boundary', () => {
  it('checks status without requesting permission', async () => {
    const chromeApi = {
      permissions: { request: vi.fn(async () => true) },
      runtime: {
        sendMessage: vi.fn(async () => ({
          type: 'native-clipboard-status-response',
          status: 'permission-not-granted',
        })),
      },
    };
    const capability = new ChromeWindowsImageClipboardCapability(chromeApi);
    await expect(capability.getStatus()).resolves.toBe(
      'permission-not-granted',
    );
    expect(chromeApi.permissions.request).not.toHaveBeenCalled();
    expect(chromeApi.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'native-clipboard-status-request',
    });
  });

  it('requests only nativeMessaging from the explicit enable method and then checks readiness', async () => {
    const chromeApi = {
      permissions: { request: vi.fn(async () => true) },
      runtime: {
        sendMessage: vi.fn(async () => ({
          type: 'native-clipboard-status-response',
          status: 'ready',
        })),
      },
    };
    const capability = new ChromeWindowsImageClipboardCapability(chromeApi);
    await expect(capability.requestEnable()).resolves.toBe('ready');
    expect(chromeApi.permissions.request).toHaveBeenCalledOnce();
    expect(chromeApi.permissions.request).toHaveBeenCalledWith({
      permissions: ['nativeMessaging'],
    });
    expect(NATIVE_CLIPBOARD_PERMISSION).toEqual(['nativeMessaging']);
    expect(NATIVE_CLIPBOARD_PERMISSION).not.toContain('clipboardRead');
    expect(chromeApi.runtime.sendMessage).toHaveBeenCalledOnce();
  });

  it('does not check or launch the host after permission denial', async () => {
    const chromeApi = {
      permissions: { request: vi.fn(async () => false) },
      runtime: { sendMessage: vi.fn() },
    };
    const capability = new ChromeWindowsImageClipboardCapability(chromeApi);
    await expect(capability.requestEnable()).resolves.toBe(
      'permission-not-granted',
    );
    expect(chromeApi.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('rejects malformed service-worker status responses', async () => {
    const capability = new ChromeWindowsImageClipboardCapability({
      permissions: { request: vi.fn(async () => true) },
      runtime: {
        sendMessage: vi.fn(async () => ({
          type: 'native-clipboard-status-response',
          status: 'ready',
          rawError: 'leak',
        })),
      },
    });
    await expect(capability.getStatus()).rejects.toThrow(
      'Native clipboard status response was invalid.',
    );
  });

  it('preserves a runtime message rejection instead of reporting a false status', async () => {
    const capability = new ChromeWindowsImageClipboardCapability({
      permissions: { request: vi.fn(async () => true) },
      runtime: {
        sendMessage: vi.fn(async () => {
          throw new Error('private runtime failure');
        }),
      },
    });
    await expect(capability.getStatus()).rejects.toThrow(
      'private runtime failure',
    );
  });

  it('registers one exact background status handler without exposing host details', async () => {
    let listener:
      | ((
          message: unknown,
          sender: unknown,
          sendResponse: (response: NativeClipboardStatusResponse) => void,
        ) => boolean | undefined)
      | undefined;
    const runtime = {
      onMessage: {
        addListener: vi.fn((value: typeof listener) => {
          listener = value;
        }),
        removeListener: vi.fn(),
      },
    };
    const nativeCapability = { getStatus: vi.fn(async () => 'ready' as const) };
    const unregister = registerNativeClipboardCapability(
      runtime,
      nativeCapability,
    );
    let response: NativeClipboardStatusResponse | undefined;
    expect(
      listener?.({ type: 'native-clipboard-status-request' }, {}, (value) => {
        response = value;
      }),
    ).toBe(true);
    await vi.waitFor(() =>
      expect(response).toEqual({
        type: 'native-clipboard-status-response',
        status: 'ready',
      }),
    );
    expect(listener?.({ type: 'other' }, {}, vi.fn())).toBeUndefined();
    unregister();
    expect(runtime.onMessage.removeListener).toHaveBeenCalledWith(listener);
  });

  it('maps the proven callback-based native-dev capability success to Settings Ready', async () => {
    let listener:
      | ((
          message: unknown,
          sender: unknown,
          sendResponse: (response: NativeClipboardStatusResponse) => void,
        ) => boolean | undefined)
      | undefined;
    const nativeRuntime = {
      getPlatformInfo: vi.fn(async () => ({ os: 'win' })),
      sendNativeMessage: vi.fn(
        (
          _hostName: string,
          message: unknown,
          callback: (response: unknown) => void,
        ) => {
          const request = message as { requestId: string };
          callback({
            protocolVersion: 1,
            requestId: request.requestId,
            status: 'success',
            hostVersion: '1.0.0',
            result: {
              operation: 'get-capabilities',
              supportedProtocolVersions: [1],
              supportedOperations: ['write-image-png'],
              maxPngBytes: 5_242_880,
              clipboardFormats: ['png', 'cf-dibv5'],
            },
          });
        },
      ),
    };
    const transport = new WindowsNativeImageClipboardTransport(
      {
        permissions: { contains: vi.fn(async () => true) },
        runtime: nativeRuntime,
      },
      nativeDevelopment.hostName,
      () => '0123456789abcdef0123456789abcdef',
    );
    const backgroundRuntime = {
      onMessage: {
        addListener: vi.fn((value: typeof listener) => {
          listener = value;
        }),
        removeListener: vi.fn(),
      },
    };
    registerNativeClipboardCapability(backgroundRuntime, transport);
    const settings = new ChromeWindowsImageClipboardCapability({
      permissions: { request: vi.fn(async () => true) },
      runtime: {
        sendMessage: vi.fn(
          (message: unknown) =>
            new Promise((resolve, reject) => {
              const keptOpen = listener?.(message, {}, resolve);
              if (keptOpen !== true) {
                reject(
                  new Error('Capability response channel was not kept open.'),
                );
              }
            }),
        ),
      },
    });

    await expect(settings.getStatus()).resolves.toBe('ready');
    expect(nativeRuntime.sendNativeMessage).toHaveBeenCalledWith(
      'com.ai_support_workspace.clipboard.dev',
      {
        protocolVersion: 1,
        requestId: '0123456789abcdef0123456789abcdef',
        operation: 'get-capabilities',
      },
      expect.any(Function),
    );
    expect(await settings.getStatus()).not.toBe('host-unavailable');
  });

  it('returns invalid-host-response when the capability service unexpectedly rejects', async () => {
    let listener:
      | ((
          message: unknown,
          sender: unknown,
          sendResponse: (response: NativeClipboardStatusResponse) => void,
        ) => boolean | undefined)
      | undefined;
    const runtime = {
      onMessage: {
        addListener: vi.fn((value: typeof listener) => {
          listener = value;
        }),
        removeListener: vi.fn(),
      },
    };
    registerNativeClipboardCapability(runtime, {
      getStatus: vi.fn(async () => {
        throw new Error('private capability error');
      }),
    });
    let response: NativeClipboardStatusResponse | undefined;
    expect(
      listener?.({ type: 'native-clipboard-status-request' }, {}, (value) => {
        response = value;
      }),
    ).toBe(true);
    await vi.waitFor(() =>
      expect(response).toEqual({
        type: 'native-clipboard-status-response',
        status: 'invalid-host-response',
      }),
    );
  });
});
