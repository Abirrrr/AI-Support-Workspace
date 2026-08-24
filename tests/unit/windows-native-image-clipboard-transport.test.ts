import { describe, expect, it, vi } from 'vitest';

import nativeDevelopment from '../../config/native-clipboard-companion.development.json';
import {
  WindowsNativeImageClipboardTransport,
  type NativeClipboardExtensionApi,
} from '../../src/infrastructure/clipboard/windows-native-image-clipboard-transport';

const firstId = '0123456789abcdef0123456789abcdef';
const secondId = 'fedcba9876543210fedcba9876543210';
const png = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4,
]);

function capabilitiesSuccess(requestId: string) {
  return {
    protocolVersion: 1,
    requestId,
    status: 'success',
    hostVersion: '1.0.0',
    result: {
      operation: 'get-capabilities',
      supportedProtocolVersions: [1],
      supportedOperations: ['write-image-png'],
      maxPngBytes: 5_242_880,
      clipboardFormats: ['png', 'cf-dibv5'],
    },
  };
}

function writeSuccess(requestId: string) {
  return {
    protocolVersion: 1,
    requestId,
    status: 'success',
    hostVersion: '1.0.0',
    result: {
      operation: 'write-image-png',
      clipboardFormats: ['png', 'cf-dibv5'],
    },
  };
}

function capabilitiesV2Success(requestId: string) {
  return {
    protocolVersion: 2,
    requestId,
    status: 'success',
    hostVersion: '1.0.0',
    result: {
      operation: 'get-capabilities',
      supportedProtocolVersions: [1, 2],
      supportedOperations: [
        'write-image-png',
        'capture-paste-context',
        'paste-clipboard',
      ],
      maxPngBytes: 5_242_880,
      clipboardFormats: ['png', 'cf-dibv5'],
    },
  };
}

function api(options: { os?: string; granted?: boolean } = {}) {
  const value: NativeClipboardExtensionApi = {
    permissions: {
      contains: vi.fn(async () => options.granted ?? true),
    },
    runtime: {
      getPlatformInfo: vi.fn(async () => ({ os: options.os ?? 'win' })),
      sendNativeMessage: vi.fn((_hostName, message, callback) => {
        const request = message as { requestId: string; operation: string };
        callback(
          request.operation === 'get-capabilities'
            ? capabilitiesSuccess(request.requestId)
            : writeSuccess(request.requestId),
        );
      }),
    },
  };
  return value;
}

function ids() {
  const values = [firstId, secondId];
  return () => values.shift() ?? secondId;
}

describe('Windows native Image clipboard transport', () => {
  it('checks Windows, permission, and exact capabilities without image payload', async () => {
    const chromeApi = api();
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await expect(transport.getStatus()).resolves.toBe('ready');
    expect(chromeApi.permissions.contains).toHaveBeenCalledWith({
      permissions: ['nativeMessaging'],
    });
    expect(chromeApi.runtime.sendNativeMessage).toHaveBeenCalledWith(
      'com.ai_support_workspace.clipboard.dev',
      {
        protocolVersion: 1,
        requestId: firstId,
        operation: 'get-capabilities',
      },
      expect.any(Function),
    );
    expect(
      (
        vi.mocked(chromeApi.runtime.sendNativeMessage).mock
          .calls[0]?.[1] as Record<string, unknown>
      ).image,
    ).toBeUndefined();
  });

  it.each([
    ['mac', 'unsupported-platform'],
    ['linux', 'unsupported-platform'],
  ])('does not contact a native host on %s', async (os, status) => {
    const chromeApi = api({ os });
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await expect(transport.getStatus()).resolves.toBe(status);
    expect(chromeApi.permissions.contains).not.toHaveBeenCalled();
    expect(chromeApi.runtime.sendNativeMessage).not.toHaveBeenCalled();
  });

  it('distinguishes missing permission without launching the host', async () => {
    const chromeApi = api({ granted: false });
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await expect(transport.getStatus()).resolves.toBe('permission-not-granted');
    expect(chromeApi.runtime.sendNativeMessage).not.toHaveBeenCalled();
    await expect(transport.writePng(png)).rejects.toMatchObject({
      code: 'native-permission-required',
    });
    expect(chromeApi.runtime.sendNativeMessage).not.toHaveBeenCalled();
  });

  it('treats an unconfigured production-oriented build as unavailable without invoking .dev', async () => {
    const chromeApi = api();
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      undefined,
      ids(),
    );
    await expect(transport.getStatus()).resolves.toBe('host-unavailable');
    expect(chromeApi.runtime.sendNativeMessage).not.toHaveBeenCalled();
  });

  it('maps a genuine callback transport failure to host-unavailable', async () => {
    const chromeApi = api();
    Object.defineProperty(chromeApi.runtime, 'lastError', {
      configurable: true,
      get: () => ({ message: 'raw host discovery failure' }),
    });
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockImplementation(
      (_hostName, _message, callback) => callback(undefined),
    );
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await expect(transport.getStatus()).resolves.toBe('host-unavailable');
  });

  it('keeps a responding but incompatible host distinct from host absence', async () => {
    const chromeApi = api();
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockImplementation(
      (_hostName, message, callback) => {
        const request = message as { requestId: string };
        callback({
          ...capabilitiesSuccess(request.requestId),
          result: {
            ...capabilitiesSuccess(request.requestId).result,
            supportedOperations: [],
          },
        });
      },
    );
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await expect(transport.getStatus()).resolves.toBe('host-version-mismatch');
  });

  it('keeps malformed host output distinct from host absence', async () => {
    const chromeApi = api();
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockImplementation(
      (_hostName, message, callback) => {
        const request = message as { requestId: string };
        callback({
          protocolVersion: 1,
          requestId: request.requestId,
          status: 'success',
          hostVersion: '1.0.0',
        });
      },
    );
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await expect(transport.getStatus()).resolves.toBe('invalid-host-response');
  });

  it('sends one exact PNG-only write after a validated capability check', async () => {
    const chromeApi = api();
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await expect(transport.getStatus()).resolves.toBe('ready');
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockClear();

    await expect(transport.writePng(png)).resolves.toBeUndefined();

    expect(chromeApi.runtime.sendNativeMessage).toHaveBeenCalledOnce();
    const call = vi.mocked(chromeApi.runtime.sendNativeMessage).mock.calls[0];
    expect(call).toBeDefined();
    if (call === undefined) throw new Error('Expected native host call.');
    const [hostName, message] = call;
    expect(hostName).toBe('com.ai_support_workspace.clipboard.dev');
    expect(message).toEqual({
      protocolVersion: 1,
      requestId: secondId,
      operation: 'write-image-png',
      image: {
        encoding: 'base64',
        byteLength: png.byteLength,
        data: Buffer.from(png).toString('base64'),
      },
    });
    expect(JSON.stringify(message)).not.toMatch(
      /filename|assetId|snippetId|title|trigger|page|html|jpeg|webp/i,
    );
  });

  it('fails closed without retry after an ambiguous transport rejection', async () => {
    const chromeApi = api();
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await transport.getStatus();
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockClear();
    Object.defineProperty(chromeApi.runtime, 'lastError', {
      configurable: true,
      get: () => ({ message: 'raw native failure' }),
    });
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockImplementation(
      (_hostName, _message, callback) => callback(undefined),
    );

    await expect(transport.writePng(png)).rejects.toMatchObject({
      code: 'host-unavailable',
      message: 'Windows Image Snippet delivery is unavailable.',
    });
    expect(chromeApi.runtime.sendNativeMessage).toHaveBeenCalledOnce();
  });

  it('rejects a malformed correlated success without retry', async () => {
    const chromeApi = api();
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await transport.getStatus();
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockClear();
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockImplementation(
      (_hostName, _message, callback) =>
        callback({
          ...writeSuccess(secondId),
          requestId: firstId,
        }),
    );

    await expect(transport.writePng(png)).rejects.toMatchObject({
      code: 'invalid-host-response',
    });
    expect(chromeApi.runtime.sendNativeMessage).toHaveBeenCalledOnce();
  });

  it.each([
    ['clipboard-busy', 'native-delivery-busy'],
    ['invalid-png', 'image-invalid'],
    ['image-too-large', 'image-too-large'],
    ['image-decode-failed', 'image-decode-failed'],
    ['clipboard-close-failed', 'clipboard-write-failed'],
    ['protocol-version-unsupported', 'host-version-mismatch'],
  ] as const)('maps safe host failure %s to %s', async (hostCode, code) => {
    const chromeApi = api();
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await transport.getStatus();
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockImplementation(
      (_hostName, _message, callback) =>
        callback({
          protocolVersion: 1,
          requestId: secondId,
          status: 'error',
          hostVersion: '1.0.0',
          safeErrorCode: hostCode,
        }),
    );
    await expect(transport.writePng(png)).rejects.toMatchObject({ code });
  });

  it('rejects overlapping Image writes instead of queuing or cancelling', async () => {
    const chromeApi = api();
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await transport.getStatus();
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockClear();
    let finish: ((value: unknown) => void) | undefined;
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockImplementation(
      (_hostName, _message, callback) => {
        finish = callback;
      },
    );

    const first = transport.writePng(png);
    await expect(transport.writePng(png)).rejects.toMatchObject({
      code: 'native-delivery-busy',
    });
    expect(finish).toBeDefined();
    finish?.(writeSuccess(secondId));
    await expect(first).resolves.toBeUndefined();
    expect(chromeApi.runtime.sendNativeMessage).toHaveBeenCalledOnce();
  });
});

describe('Windows native automatic paste transport', () => {
  const activationId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const context = {
    foregroundWindowHandle: '0000000000001234',
    rootWindowHandle: '0000000000001000',
    processId: 44,
    clipboardSequenceNumber: 77,
  };

  it('captures narrow context then requests one clipboard paste without content', async () => {
    const chromeApi = api();
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockImplementation(
      (_hostName, message, callback) => {
        const request = message as {
          protocolVersion: number;
          requestId: string;
          operation: string;
          activationId?: string;
        };
        if (request.operation === 'get-capabilities') {
          callback(capabilitiesV2Success(request.requestId));
        } else if (request.operation === 'capture-paste-context') {
          callback({
            protocolVersion: 2,
            requestId: request.requestId,
            status: 'success',
            hostVersion: '1.0.0',
            result: {
              operation: 'capture-paste-context',
              activationId,
              foregroundHwnd: context.foregroundWindowHandle,
              rootHwnd: context.rootWindowHandle,
              processId: context.processId,
              clipboardSequenceNumber: context.clipboardSequenceNumber,
            },
          });
        } else {
          callback({
            protocolVersion: 2,
            requestId: request.requestId,
            status: 'success',
            hostVersion: '1.0.0',
            result: {
              operation: 'paste-clipboard',
              outcome: 'paste-issued',
            },
          });
        }
      },
    );
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await expect(transport.capturePasteContext(activationId)).resolves.toEqual(
      context,
    );
    await expect(
      transport.requestPaste({ activationId, ...context }),
    ).resolves.toBe('paste-issued');
    expect(chromeApi.runtime.sendNativeMessage).toHaveBeenCalledTimes(3);
    const pasteMessage = vi.mocked(chromeApi.runtime.sendNativeMessage).mock
      .calls[2]?.[1] as Record<string, unknown>;
    expect(Object.keys(pasteMessage).sort()).toEqual(
      [
        'protocolVersion',
        'requestId',
        'activationId',
        'operation',
        'expectedForegroundHwnd',
        'expectedRootHwnd',
        'expectedProcessId',
        'expectedClipboardSequenceNumber',
      ].sort(),
    );
    expect(JSON.stringify(pasteMessage)).not.toMatch(
      /text|html|image|data|url|path|filename|keys|virtual/i,
    );
  });

  it('keeps a v1 Image host usable while automatic capture falls back', async () => {
    const chromeApi = api();
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await expect(transport.getStatus()).resolves.toBe('ready');
    await expect(transport.writePng(png)).resolves.toBeUndefined();
    await expect(
      transport.capturePasteContext(activationId),
    ).rejects.toMatchObject({ name: 'AutomaticPasteUnavailableError' });
  });

  it('exposes one privacy-safe native-dev attempt diagnostic and consumes it once', async () => {
    const chromeApi = api();
    const nativePasteDiagnostic = {
      sendInputRequestedCount: 4,
      sendInputInsertedCount: 0,
      sendInputStructSize: 40,
      sendInputLastError: 87,
      foregroundValidationPassed: true,
      rootWindowValidationPassed: true,
      pidValidationPassed: true,
      clipboardSequenceValidationPassed: true,
      modifierValidationPassed: true,
      hostSessionMatchesTarget: true,
      hostIntegrityRelation: 'same',
    } as const;
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockImplementation(
      (_hostName, message, callback) => {
        const request = message as {
          requestId: string;
          operation: string;
        };
        if (request.operation === 'get-capabilities') {
          callback(capabilitiesV2Success(request.requestId));
        } else if (request.operation === 'capture-paste-context') {
          callback({
            protocolVersion: 2,
            requestId: request.requestId,
            status: 'success',
            hostVersion: '1.0.0',
            result: {
              operation: 'capture-paste-context',
              activationId,
              foregroundHwnd: context.foregroundWindowHandle,
              rootHwnd: context.rootWindowHandle,
              processId: context.processId,
              clipboardSequenceNumber: context.clipboardSequenceNumber,
            },
          });
        } else {
          callback({
            protocolVersion: 2,
            requestId: request.requestId,
            status: 'error',
            hostVersion: '1.0.0',
            safeErrorCode: 'input-injection-failed',
            nativePasteDiagnostic,
          });
        }
      },
    );
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await transport.capturePasteContext(activationId);

    await expect(
      transport.requestPaste({ activationId, ...context }),
    ).resolves.toBe('input-injection-failed');
    expect(transport.takeLastPasteAttemptDiagnostic()).toEqual(
      nativePasteDiagnostic,
    );
    expect(transport.takeLastPasteAttemptDiagnostic()).toBeUndefined();
  });

  it('treats a lost paste response as indeterminate and never retries', async () => {
    const chromeApi = api();
    vi.mocked(chromeApi.runtime.sendNativeMessage).mockImplementation(
      (_hostName, message, callback) => {
        const request = message as {
          protocolVersion: number;
          requestId: string;
          operation: string;
        };
        if (request.operation === 'get-capabilities') {
          callback(capabilitiesV2Success(request.requestId));
        } else if (request.operation === 'capture-paste-context') {
          callback({
            protocolVersion: 2,
            requestId: request.requestId,
            status: 'success',
            hostVersion: '1.0.0',
            result: {
              operation: 'capture-paste-context',
              activationId,
              foregroundHwnd: context.foregroundWindowHandle,
              rootHwnd: context.rootWindowHandle,
              processId: 44,
              clipboardSequenceNumber: 77,
            },
          });
        } else {
          Object.defineProperty(chromeApi.runtime, 'lastError', {
            configurable: true,
            value: { message: 'lost response' },
          });
          callback(undefined);
        }
      },
    );
    const transport = new WindowsNativeImageClipboardTransport(
      chromeApi,
      nativeDevelopment.hostName,
      ids(),
    );
    await transport.capturePasteContext(activationId);
    await expect(
      transport.requestPaste({ activationId, ...context }),
    ).resolves.toBe('indeterminate');
    expect(chromeApi.runtime.sendNativeMessage).toHaveBeenCalledTimes(3);
  });
});
