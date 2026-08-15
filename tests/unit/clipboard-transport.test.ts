import { describe, expect, it, vi } from 'vitest';

import {
  ClipboardPermissionRequiredError,
  OffscreenClipboardTransport,
  type ClipboardExtensionApi,
} from '../../src/extension/snippet-trigger/clipboard-transport';
import {
  handleOffscreenClipboardWrite,
  type OffscreenClipboardEnvironment,
} from '../../src/extension/offscreen/clipboard-runtime';
import { isOffscreenClipboardWriteMessage } from '../../src/shared/snippet-delivery-messages';

function environment(
  options: {
    readonly copyCommandResult?: boolean;
    readonly copyCommandError?: Error;
    readonly dispatchCopyEvent?: boolean;
    readonly clipboardDataAvailable?: boolean;
    readonly setDataError?: Error;
  } = {},
) {
  const setData = vi.fn((format: string, data: string) => {
    void format;
    void data;
    if (options.setDataError !== undefined) throw options.setDataError;
  });
  const preventDefault = vi.fn();
  let copyListener: EventListener | undefined;
  const addEventListener = vi.fn(
    (type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'copy' && typeof listener === 'function') {
        copyListener = listener;
      }
    },
  );
  const removeEventListener = vi.fn(
    (type: string, listener: EventListenerOrEventListenerObject) => {
      if (type === 'copy' && copyListener === listener) {
        copyListener = undefined;
      }
    },
  );
  const execCommand = vi.fn((command: string) => {
    if (options.copyCommandError !== undefined) throw options.copyCommandError;
    if (command === 'copy' && options.dispatchCopyEvent !== false) {
      copyListener?.({
        clipboardData:
          options.clipboardDataAvailable === false ? null : { setData },
        preventDefault,
      } as unknown as ClipboardEvent);
    }
    return options.copyCommandResult ?? true;
  });
  const value: OffscreenClipboardEnvironment = {
    document: {
      addEventListener,
      removeEventListener,
      execCommand,
    } as unknown as Document,
  };
  return {
    value,
    addEventListener,
    removeEventListener,
    execCommand,
    setData,
    preventDefault,
    getCopyListener: () => copyListener,
  };
}

describe('Text-only offscreen clipboard runtime', () => {
  it('writes exact text/plain and text/html through one temporary copy handler', async () => {
    const runtime = environment();
    const plainText = `Hello there

* One
* Two

1. First
2. Second`;
    const html =
      '<p>Hello <strong>there</strong> <em>friend</em> <a href="https://example.com">link</a></p><ul><li>One</li><li>Two</li></ul><ol><li>First</li><li>Second</li></ol>';

    await expect(
      handleOffscreenClipboardWrite(
        {
          type: 'offscreen-clipboard-write',
          requestId: 'request-1',
          kind: 'text',
          plainText,
          html,
        },
        runtime.value,
      ),
    ).resolves.toEqual({
      type: 'offscreen-clipboard-write-result',
      requestId: 'request-1',
      succeeded: true,
    });
    expect(runtime.addEventListener).toHaveBeenCalledWith(
      'copy',
      expect.any(Function),
    );
    expect(runtime.execCommand).toHaveBeenCalledWith('copy');
    expect(runtime.setData.mock.calls).toEqual([
      ['text/plain', plainText],
      ['text/html', html],
    ]);
    expect(runtime.preventDefault).toHaveBeenCalledOnce();
    expect(runtime.removeEventListener).toHaveBeenCalledOnce();
    expect(runtime.getCopyListener()).toBeUndefined();
  });

  it.each([
    [
      'command returned false',
      { copyCommandResult: false },
      'clipboard-copy-command-failed',
    ],
    [
      'command threw',
      { copyCommandError: new Error('copy rejected') },
      'clipboard-copy-command-failed',
    ],
    [
      'copy event never arrived',
      { dispatchCopyEvent: false },
      'clipboard-copy-event-unavailable',
    ],
    [
      'clipboardData was missing',
      { clipboardDataAvailable: false },
      'clipboard-copy-event-unavailable',
    ],
    [
      'setData failed',
      { setDataError: new Error('setData rejected') },
      'clipboard-copy-data-failed',
    ],
  ] as const)(
    'fails Text copy safely when %s and always removes the listener',
    async (_label, options, error) => {
      const runtime = environment(options);
      await expect(
        handleOffscreenClipboardWrite(
          {
            type: 'offscreen-clipboard-write',
            requestId: 'text-failure',
            kind: 'text',
            plainText: 'Plain remains unchanged',
            html: '<p>Safe HTML remains unchanged</p>',
          },
          runtime.value,
        ),
      ).resolves.toEqual({
        type: 'offscreen-clipboard-write-result',
        requestId: 'text-failure',
        succeeded: false,
        error,
      });
      expect(runtime.removeEventListener).toHaveBeenCalledOnce();
      expect(runtime.getCopyListener()).toBeUndefined();
    },
  );

  it('rejects the removed Image offscreen message contract', async () => {
    const imageMessage = {
      type: 'offscreen-clipboard-write',
      requestId: 'image-request',
      kind: 'image',
      mimeType: 'image/png',
      encodedBytesBase64: 'private-image-data',
    };
    const runtime = environment();
    expect(isOffscreenClipboardWriteMessage(imageMessage)).toBe(false);
    await expect(
      handleOffscreenClipboardWrite(imageMessage, runtime.value),
    ).resolves.toBeUndefined();
    expect(runtime.addEventListener).not.toHaveBeenCalled();
    expect(runtime.execCommand).not.toHaveBeenCalled();
  });
});

function transportApi(granted = true): ClipboardExtensionApi {
  return {
    permissions: { contains: vi.fn(async () => granted) },
    offscreen: {
      createDocument: vi.fn(async () => undefined),
      closeDocument: vi.fn(async () => undefined),
    },
    runtime: {
      getURL: vi.fn((path) => `chrome-extension://id/${path}`),
      getContexts: vi.fn(async () => []),
      sendMessage: vi.fn(async (message) => ({
        type: 'offscreen-clipboard-write-result',
        requestId: (message as { requestId: string }).requestId,
        succeeded: true,
      })),
    },
  };
}

describe('service-worker Text offscreen transport lifecycle', () => {
  const textPlan = {
    kind: 'text' as const,
    snippetId: 'snippet-1',
    plainText: 'plain',
    html: '<p>plain</p>',
  };

  it('fails before offscreen work when optional permissions are absent', async () => {
    const api = transportApi(false);
    await expect(
      new OffscreenClipboardTransport(api).write(textPlan, 'request-1'),
    ).rejects.toBeInstanceOf(ClipboardPermissionRequiredError);
    expect(api.offscreen.createDocument).not.toHaveBeenCalled();
    expect(api.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it('creates one CLIPBOARD document, correlates the Text write, and closes it', async () => {
    const api = transportApi();
    await new OffscreenClipboardTransport(api).write(textPlan, 'request-1');
    expect(api.permissions.contains).toHaveBeenCalledWith({
      permissions: ['clipboardWrite', 'offscreen'],
    });
    expect(api.offscreen.createDocument).toHaveBeenCalledWith({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: 'Prepare a user-requested Snippet for native paste.',
    });
    expect(api.runtime.sendMessage).toHaveBeenCalledWith({
      type: 'offscreen-clipboard-write',
      requestId: 'request-1',
      kind: 'text',
      plainText: 'plain',
      html: '<p>plain</p>',
    });
    expect(api.offscreen.closeDocument).toHaveBeenCalledOnce();
  });

  it('preserves offscreen creation and messaging failure identity', async () => {
    const createApi = transportApi();
    vi.mocked(createApi.offscreen.createDocument).mockRejectedValue(
      new Error('create failed'),
    );
    await expect(
      new OffscreenClipboardTransport(createApi).write(textPlan, 'request-1'),
    ).rejects.toMatchObject({ code: 'offscreen-create-failed' });
    expect(createApi.runtime.sendMessage).not.toHaveBeenCalled();

    const messageApi = transportApi();
    vi.mocked(messageApi.runtime.sendMessage).mockRejectedValue(
      new Error('message failed'),
    );
    await expect(
      new OffscreenClipboardTransport(messageApi).write(textPlan, 'request-1'),
    ).rejects.toMatchObject({ code: 'offscreen-message-failed' });
  });

  it.each([
    undefined,
    { unexpected: true },
    {
      type: 'offscreen-clipboard-write-result',
      requestId: 'another-request',
      succeeded: true,
    },
  ])('rejects malformed or uncorrelated response %#', async (response) => {
    const api = transportApi();
    vi.mocked(api.runtime.sendMessage).mockResolvedValue(response);
    await expect(
      new OffscreenClipboardTransport(api).write(textPlan, 'request-1'),
    ).rejects.toMatchObject({ code: 'invalid-offscreen-response' });
  });

  it.each([
    'clipboard-copy-event-unavailable',
    'clipboard-copy-command-failed',
    'clipboard-copy-data-failed',
  ] as const)('preserves Text runtime failure %s', async (code) => {
    const api = transportApi();
    vi.mocked(api.runtime.sendMessage).mockResolvedValue({
      type: 'offscreen-clipboard-write-result',
      requestId: 'request-1',
      succeeded: false,
      error: code,
    });
    await expect(
      new OffscreenClipboardTransport(api).write(textPlan, 'request-1'),
    ).rejects.toMatchObject({ code });
  });

  it('reuses a surviving offscreen context after service-worker restart', async () => {
    const api = transportApi();
    vi.mocked(api.runtime.getContexts)?.mockResolvedValue([{}]);
    await new OffscreenClipboardTransport(api).write(textPlan, 'request-1');
    expect(api.offscreen.createDocument).not.toHaveBeenCalled();
  });

  it('uses the pre-Chrome-116 clients fallback after worker restart', async () => {
    const api = transportApi();
    delete (api.runtime as { getContexts?: unknown }).getContexts;
    const clientsApi = {
      matchAll: vi.fn(async () => [
        { url: 'chrome-extension://id/offscreen.html' },
      ]),
    };
    await new OffscreenClipboardTransport(api, clientsApi).write(
      textPlan,
      'request-1',
    );
    expect(clientsApi.matchAll).toHaveBeenCalledOnce();
    expect(api.offscreen.createDocument).not.toHaveBeenCalled();
  });

  it('serializes concurrent Text writes with distinct request correlation', async () => {
    const api = transportApi();
    let releaseFirst: (() => void) | undefined;
    vi.mocked(api.runtime.sendMessage).mockImplementationOnce(
      (message) =>
        new Promise((resolve) => {
          releaseFirst = () =>
            resolve({
              type: 'offscreen-clipboard-write-result',
              requestId: (message as { requestId: string }).requestId,
              succeeded: true,
            });
        }),
    );
    const transport = new OffscreenClipboardTransport(api);
    const writes = [
      transport.write(textPlan, 'request-1'),
      transport.write(textPlan, 'request-2'),
    ];
    await vi.waitFor(() => expect(releaseFirst).toBeTypeOf('function'));
    expect(api.runtime.sendMessage).toHaveBeenCalledTimes(1);
    releaseFirst?.();
    await Promise.all(writes);
    expect(
      vi
        .mocked(api.runtime.sendMessage)
        .mock.calls.map(
          ([message]) => (message as { requestId: string }).requestId,
        ),
    ).toEqual(['request-1', 'request-2']);
  });
});
