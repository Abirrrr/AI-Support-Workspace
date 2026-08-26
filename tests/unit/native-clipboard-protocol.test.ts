import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import nativeDevelopment from '../../config/native-clipboard-companion.development.json';
import {
  createGetCapabilitiesRequest,
  createGetCapabilitiesV2Request,
  createCapturePasteContextRequest,
  createPasteClipboardRequest,
  createNativeClipboardRequestId,
  createWriteImagePngRequest,
  NATIVE_CLIPBOARD_MAX_PNG_BYTES,
  parseGetCapabilitiesResponse,
  parseGetCapabilitiesV2Response,
  parseCapturePasteContextResponse,
  parsePasteClipboardResponse,
  parsePasteClipboardResponseWithDiagnostic,
  parseWriteImagePngResponse,
} from '../../src/infrastructure/clipboard/native-clipboard-protocol';

const fixtureDirectory = resolve(
  'native/windows-clipboard-companion/fixtures/protocol-v1',
);

async function fixture(name: string): Promise<Record<string, unknown>> {
  return JSON.parse(
    await readFile(resolve(fixtureDirectory, name), 'utf8'),
  ) as Record<string, unknown>;
}

describe('native clipboard protocol v1', () => {
  it('matches both approved request fixtures exactly', async () => {
    const capabilities = await fixture('get-capabilities.request.json');
    expect(
      createGetCapabilitiesRequest(capabilities.requestId as string),
    ).toEqual(capabilities);

    const write = await fixture('write-image-png.request.json');
    const image = write.image as { data: string };
    const bytes = Uint8Array.from(Buffer.from(image.data, 'base64'));
    expect(
      createWriteImagePngRequest(write.requestId as string, bytes),
    ).toEqual(write);
  });

  it('accepts both approved success fixtures and the safe error fixture', async () => {
    const capabilities = await fixture('get-capabilities.success.json');
    expect(
      parseGetCapabilitiesResponse(
        capabilities,
        capabilities.requestId as string,
      ),
    ).toEqual({ status: 'success', hostVersion: '1.0.0' });

    const write = await fixture('write-image-png.success.json');
    expect(
      parseWriteImagePngResponse(write, write.requestId as string),
    ).toEqual({ status: 'success', hostVersion: '1.0.0' });

    const failure = await fixture('invalid-png.error.json');
    expect(
      parseWriteImagePngResponse(failure, failure.requestId as string),
    ).toEqual({
      status: 'error',
      hostVersion: '1.0.0',
      safeErrorCode: 'invalid-png',
    });
  });

  it('generates exactly 32 lowercase hex characters from 16 random bytes', () => {
    const random = {
      getRandomValues<T extends ArrayBufferView | null>(array: T): T {
        if (array === null) return array;
        new Uint8Array(array.buffer, array.byteOffset, array.byteLength).fill(
          0xab,
        );
        return array;
      },
    };
    expect(createNativeClipboardRequestId(random)).toBe(
      'abababababababababababababababab',
    );
  });

  it('encodes the exact maximum payload without numeric-array JSON or stack overflow', () => {
    const bytes = new Uint8Array(NATIVE_CLIPBOARD_MAX_PNG_BYTES);
    bytes.set([0x89, 0x50, 0x4e, 0x47]);
    const request = createWriteImagePngRequest(
      '0123456789abcdef0123456789abcdef',
      bytes,
    );
    expect(request.image.byteLength).toBe(NATIVE_CLIPBOARD_MAX_PNG_BYTES);
    expect(request.image.data.length).toBe(6_990_508);
    expect(Object.keys(request.image).sort()).toEqual([
      'byteLength',
      'data',
      'encoding',
    ]);
  });

  it.each([24_575, 24_576, 24_577, 98_305])(
    'preserves canonical base64 across the bounded chunk boundary at %i bytes',
    (length) => {
      const bytes = Uint8Array.from(
        { length },
        (_value, index) => (index * 131 + 17) & 0xff,
      );
      Object.defineProperty(bytes, 'toBase64', { value: undefined });
      const request = createWriteImagePngRequest(
        '0123456789abcdef0123456789abcdef',
        bytes,
      );
      expect(request.image.data).toBe(Buffer.from(bytes).toString('base64'));
    },
  );

  it('uses the efficient equivalent byte-array encoder when available', () => {
    const bytes = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);
    let calls = 0;
    Object.defineProperty(bytes, 'toBase64', {
      value: () => {
        calls += 1;
        return 'iVBORw==';
      },
    });
    expect(
      createWriteImagePngRequest('0123456789abcdef0123456789abcdef', bytes)
        .image.data,
    ).toBe('iVBORw==');
    expect(calls).toBe(1);
  });

  it('rejects empty, oversized, and malformed-ID request construction', () => {
    expect(() =>
      createWriteImagePngRequest(
        '0123456789abcdef0123456789abcdef',
        new Uint8Array(),
      ),
    ).toThrow(RangeError);
    expect(() =>
      createWriteImagePngRequest(
        '0123456789abcdef0123456789abcdef',
        new Uint8Array(NATIVE_CLIPBOARD_MAX_PNG_BYTES + 1),
      ),
    ).toThrow(RangeError);
    expect(() => createGetCapabilitiesRequest('not-an-id')).toThrow(TypeError);
  });

  it.each([
    ['unknown top-level field', { unexpected: true }, 'invalid-host-response'],
    [
      'mismatched request ID',
      { requestId: 'a'.repeat(32) },
      'invalid-host-response',
    ],
    ['wrong protocol', { protocolVersion: 2 }, 'host-version-mismatch'],
    [
      'wrong result operation',
      { result: { operation: 'other' } },
      'host-version-mismatch',
    ],
    ['missing result', { result: undefined }, 'invalid-host-response'],
  ] as const)('rejects schema drift: %s', async (_label, mutation, code) => {
    const approved = await fixture('get-capabilities.success.json');
    const value = structuredClone(approved);
    if ('result' in mutation) {
      if (mutation.result === undefined) delete value.result;
      else value.result = { ...(value.result as object), ...mutation.result };
    } else {
      Object.assign(value, mutation);
    }
    expect(() =>
      parseGetCapabilitiesResponse(value, approved.requestId as string),
    ).toThrow(expect.objectContaining({ code }));
  });

  it('rejects malformed success and unrecognized host errors', async () => {
    const success = await fixture('write-image-png.success.json');
    expect(() =>
      parseWriteImagePngResponse(
        { ...success, unexpected: true },
        success.requestId as string,
      ),
    ).toThrow(expect.objectContaining({ code: 'invalid-host-response' }));

    const failure = await fixture('invalid-png.error.json');
    expect(() =>
      parseWriteImagePngResponse(
        { ...failure, safeErrorCode: 'raw-native-error' },
        failure.requestId as string,
      ),
    ).toThrow(expect.objectContaining({ code: 'invalid-host-response' }));
  });

  it('derives the committed development ID and origin from public key material', () => {
    const digest = createHash('sha256')
      .update(Buffer.from(nativeDevelopment.manifestKey, 'base64'))
      .digest();
    const alphabet = 'abcdefghijklmnop';
    let extensionId = '';
    for (const byte of digest.subarray(0, 16)) {
      extensionId += alphabet.charAt(byte >> 4) + alphabet.charAt(byte & 15);
    }
    expect(extensionId).toBe(nativeDevelopment.extensionId);
    expect(`chrome-extension://${extensionId}/`).toBe(
      nativeDevelopment.extensionOrigin,
    );
    expect(nativeDevelopment.hostName).toBe(
      'com.ai_support_workspace.clipboard.dev',
    );
    expect(nativeDevelopment.hostName).not.toBe(
      'com.ai_support_workspace.clipboard',
    );
  });
});

describe('native clipboard protocol v2', () => {
  const id = '0123456789abcdef0123456789abcdef';
  const context = {
    foregroundWindowHandle: '0000000000001234',
    rootWindowHandle: '0000000000001000',
    processId: 44,
    clipboardSequenceNumber: 77,
  };

  it('constructs only strict capability, capture, and paste requests', () => {
    expect(createGetCapabilitiesV2Request(id)).toEqual({
      protocolVersion: 2,
      requestId: id,
      operation: 'get-capabilities',
    });
    expect(createCapturePasteContextRequest(id, id)).toEqual({
      protocolVersion: 2,
      requestId: id,
      activationId: id,
      operation: 'capture-paste-context',
    });
    expect(createPasteClipboardRequest(id, id, context)).toEqual({
      protocolVersion: 2,
      requestId: id,
      activationId: id,
      operation: 'paste-clipboard',
      expectedForegroundHwnd: context.foregroundWindowHandle,
      expectedRootHwnd: context.rootWindowHandle,
      expectedProcessId: 44,
      expectedClipboardSequenceNumber: 77,
    });
  });

  it.each([
    '0x0000000000001234',
    '0000000000000000',
    '000000000000123',
    '000000000000123G',
    '8000000000000000',
    'ffffffffffffffff',
  ])('rejects noncanonical handle %s', (handle) => {
    expect(() =>
      createPasteClipboardRequest(id, id, {
        ...context,
        foregroundWindowHandle: handle,
      }),
    ).toThrow(TypeError);
  });

  it('strictly parses v2 capabilities and capture context', () => {
    expect(
      parseGetCapabilitiesV2Response(
        {
          protocolVersion: 2,
          requestId: id,
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
            maxPngBytes: NATIVE_CLIPBOARD_MAX_PNG_BYTES,
            clipboardFormats: ['png', 'cf-dibv5'],
          },
        },
        id,
      ),
    ).toEqual({ status: 'success', hostVersion: '1.0.0' });
    expect(
      parseCapturePasteContextResponse(
        {
          protocolVersion: 2,
          requestId: id,
          status: 'success',
          hostVersion: '1.0.0',
          result: {
            operation: 'capture-paste-context',
            activationId: id,
            foregroundHwnd: context.foregroundWindowHandle,
            rootHwnd: context.rootWindowHandle,
            processId: 44,
            clipboardSequenceNumber: 77,
          },
        },
        id,
        id,
      ),
    ).toEqual(context);
  });

  it('maps paste success and safe declines without accepting extra fields', () => {
    const success = {
      protocolVersion: 2,
      requestId: id,
      status: 'success',
      hostVersion: '1.0.0',
      result: { operation: 'paste-clipboard', outcome: 'paste-issued' },
    };
    expect(parsePasteClipboardResponse(success, id)).toBe('paste-issued');
    expect(
      parsePasteClipboardResponse(
        {
          protocolVersion: 2,
          requestId: id,
          status: 'error',
          hostVersion: '1.0.0',
          safeErrorCode: 'unsafe-keyboard-state',
        },
        id,
      ),
    ).toBe('unsafe-keyboard-state');
    expect(() =>
      parsePasteClipboardResponse({ ...success, keys: ['V'] }, id),
    ).toThrow(expect.objectContaining({ code: 'invalid-host-response' }));
  });

  it('accepts bounded native paste evidence only at the explicit diagnostic boundary', () => {
    const response = {
      protocolVersion: 2,
      requestId: id,
      status: 'error',
      hostVersion: '1.0.0',
      safeErrorCode: 'input-injection-failed',
      nativePasteDiagnostic: {
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
      },
    };
    expect(
      parsePasteClipboardResponseWithDiagnostic(response, id, true),
    ).toEqual({
      result: 'input-injection-failed',
      diagnostic: response.nativePasteDiagnostic,
    });
    expect(() => parsePasteClipboardResponse(response, id)).toThrow(
      expect.objectContaining({ code: 'invalid-host-response' }),
    );
    expect(() =>
      parsePasteClipboardResponseWithDiagnostic(
        {
          ...response,
          nativePasteDiagnostic: {
            ...response.nativePasteDiagnostic,
            windowTitle: 'forbidden',
          },
        },
        id,
        true,
      ),
    ).toThrow(expect.objectContaining({ code: 'invalid-host-response' }));
  });
});
