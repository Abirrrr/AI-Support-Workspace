import { describe, expect, it, vi } from 'vitest';

import type { SettingsRepository } from '../../src/application/persistence/settings-repository';
import type {
  AutomaticPasteTransport,
  NativePasteAttemptDiagnostic,
} from '../../src/application/snippet/automatic-paste-transport';
import type { SnippetDeliveryPlanner } from '../../src/application/snippet/snippet-delivery-planner';
import type { ClipboardTransport } from '../../src/extension/snippet-trigger/clipboard-transport';
import {
  SnippetDeliveryCoordinator,
  type AutomaticPasteResultDiagnostic,
  type AutomaticPasteTraceDiagnostic,
  type SnippetDeliveryBrowserSafetyApi,
  type SnippetDeliveryMessageSender,
  type SnippetDeliveryTimingDiagnostic,
} from '../../src/extension/snippet-trigger/delivery-coordinator';

const request = {
  type: 'snippet-trigger-activation' as const,
  requestId: 'request-1',
  snippetId: 'snippet-1',
  trigger: ';hello',
  kind: 'text' as const,
  epoch: 'epoch-1',
  revision: 2,
};
const authorizationId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const sender: SnippetDeliveryMessageSender = {
  documentId: 'document-1',
  frameId: 3,
  tab: { id: 7, windowId: 9 },
};
const context = {
  foregroundWindowHandle: '0000000000001234',
  rootWindowHandle: '0000000000001000',
  processId: 44,
  clipboardSequenceNumber: 77,
};

function createSubject(
  options: {
    mode?: 'clipboard-only' | 'automatic';
    browser?: Partial<{
      active: boolean;
      focused: boolean;
      tabWindowId: number;
      tabClosed: boolean;
    }>;
    captureError?: Error;
    clipboardError?: Error;
    pasteError?: Error;
    pasteResult?: Awaited<ReturnType<AutomaticPasteTransport['requestPaste']>>;
    pasteDiagnostic?: NativePasteAttemptDiagnostic;
  } = {},
) {
  const planner = {
    plan: vi.fn(async (message: typeof request) => ({
      kind: message.kind,
      snippetId: message.snippetId,
      plainText: 'plain',
      html: '<p>plain</p>',
    })),
  } as unknown as SnippetDeliveryPlanner;
  const clipboard: ClipboardTransport = {
    write: vi.fn(async () => {
      if (options.clipboardError !== undefined) throw options.clipboardError;
    }),
  };
  const automaticPaste: AutomaticPasteTransport = {
    capturePasteContext: vi.fn(async () => {
      if (options.captureError !== undefined) throw options.captureError;
      return context;
    }),
    requestPaste: vi.fn(async () => {
      if (options.pasteError !== undefined) throw options.pasteError;
      return options.pasteResult ?? 'paste-issued';
    }),
    takeLastPasteAttemptDiagnostic: vi.fn(() => options.pasteDiagnostic),
  };
  const settings: SettingsRepository = {
    load: vi.fn(async () => ({
      defaultModel: null,
      snippetPasteMode: options.mode ?? 'automatic',
    })),
    save: vi.fn(async (value) => value),
  };
  const browser: SnippetDeliveryBrowserSafetyApi = {
    tabs: {
      get: vi.fn(async () => {
        if (options.browser?.tabClosed === true) throw new Error('tab closed');
        return {
          id: 7,
          windowId: options.browser?.tabWindowId ?? 9,
          active: options.browser?.active ?? true,
        };
      }),
    },
    windows: {
      get: vi.fn(async () => ({
        id: 9,
        focused: options.browser?.focused ?? true,
      })),
    },
  };
  const timings: SnippetDeliveryTimingDiagnostic[] = [];
  const automaticPasteDiagnostics: AutomaticPasteResultDiagnostic[] = [];
  const automaticPasteTrace: AutomaticPasteTraceDiagnostic[] = [];
  let clock = 0;
  const coordinator = new SnippetDeliveryCoordinator(
    planner,
    clipboard,
    { isCurrentSnapshot: () => true },
    vi.fn(),
    automaticPaste,
    settings,
    browser,
    (diagnostic) => automaticPasteDiagnostics.push(diagnostic),
    (diagnostic) => automaticPasteTrace.push(diagnostic),
    () => authorizationId,
    (diagnostic) => timings.push(diagnostic),
    () => ++clock,
  );
  return {
    coordinator,
    planner,
    clipboard,
    automaticPaste,
    browser,
    timings,
    automaticPasteDiagnostics,
    automaticPasteTrace,
  };
}

describe('automatic/manual delivery orchestration', () => {
  it('manual Text mode copies and stops without automatic transport or browser checks', async () => {
    const subject = createSubject({ mode: 'clipboard-only' });
    await expect(
      subject.coordinator.handleMessage(request, sender),
    ).resolves.toMatchObject({ outcome: 'copied', kind: 'text' });
    expect(subject.clipboard.write).toHaveBeenCalledOnce();
    expect(subject.automaticPaste.capturePasteContext).not.toHaveBeenCalled();
    expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
    expect(subject.browser.tabs.get).not.toHaveBeenCalled();
    expect(subject.automaticPasteTrace).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requestId: request.requestId,
          persistedPasteMode: 'clipboard-only',
          workerPasteMode: 'clipboard-only',
          selectedBranch: 'clipboard-only',
        }),
        expect.objectContaining({ phase: 'manual-fallback' }),
      ]),
    );
  });

  it.each(['text', 'image'] as const)(
    'requires clipboard success then captures, consumes once, and pastes %s through the shared transport',
    async (kind) => {
      const subject = createSubject();
      const activation = await subject.coordinator.handleMessage(
        { ...request, kind },
        sender,
      );
      expect(activation).toEqual({
        type: 'snippet-trigger-activation-result',
        requestId: request.requestId,
        outcome: 'automatic-ready',
        kind,
        authorizationId,
      });
      expect(
        vi.mocked(subject.clipboard.write).mock.invocationCallOrder[0],
      ).toBeLessThan(
        vi.mocked(subject.automaticPaste.capturePasteContext).mock
          .invocationCallOrder[0] as number,
      );

      await expect(
        subject.coordinator.handleMessage(
          {
            type: 'snippet-automatic-paste-finalize',
            requestId: request.requestId,
            authorizationId,
            editorState: 'ready',
          },
          sender,
        ),
      ).resolves.toEqual({
        type: 'snippet-automatic-paste-result',
        requestId: request.requestId,
        kind,
        result: 'paste-issued',
      });
      expect(subject.automaticPaste.requestPaste).toHaveBeenCalledOnce();
      expect(subject.automaticPaste.requestPaste).toHaveBeenCalledWith({
        activationId: authorizationId,
        ...context,
      });
      expect(subject.timings).toEqual([
        {
          kind,
          phase: 'clipboard-preparation',
          durationMs: 1,
          outcome: 'success',
        },
        {
          kind,
          phase: 'clipboard-write',
          durationMs: 1,
          outcome: 'success',
        },
        {
          kind,
          phase: 'automatic-safety',
          durationMs: 1,
          outcome: 'success',
        },
        {
          kind,
          phase: 'native-paste-request',
          durationMs: 1,
          outcome: 'success',
        },
      ]);
      expect(subject.automaticPasteDiagnostics).toEqual([
        {
          kind,
          phase: 'native-paste-request',
          requestId: request.requestId,
          result: 'paste-issued',
        },
      ]);
      expect(subject.automaticPasteTrace).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            phase: 'paste-mode-resolved',
            persistedPasteMode: 'automatic',
            workerPasteMode: 'automatic',
            selectedBranch: 'automatic',
          }),
          expect.objectContaining({ phase: 'automatic-precheck-started' }),
          expect.objectContaining({ phase: 'native-context-captured' }),
          expect.objectContaining({ phase: 'authorization-consumed' }),
          expect.objectContaining({ phase: 'native-paste-requested' }),
          expect.objectContaining({
            phase: 'native-paste-result',
            result: 'paste-issued',
          }),
        ]),
      );
      await expect(
        subject.coordinator.handleMessage(
          {
            type: 'snippet-automatic-paste-finalize',
            requestId: request.requestId,
            authorizationId,
            editorState: 'ready',
          },
          sender,
        ),
      ).resolves.toBeUndefined();
      expect(subject.automaticPaste.requestPaste).toHaveBeenCalledOnce();
    },
  );

  it('attaches native attempt evidence to the native-result trace without changing the result', async () => {
    const nativePasteDiagnostic: NativePasteAttemptDiagnostic = {
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
    };
    const subject = createSubject({
      pasteResult: 'input-injection-failed',
      pasteDiagnostic: nativePasteDiagnostic,
    });
    await subject.coordinator.handleMessage(request, sender);

    await expect(
      subject.coordinator.handleMessage(
        {
          type: 'snippet-automatic-paste-finalize',
          requestId: request.requestId,
          authorizationId,
          editorState: 'ready',
        },
        sender,
      ),
    ).resolves.toMatchObject({ result: 'input-injection-failed' });
    expect(subject.automaticPasteTrace).toContainEqual(
      expect.objectContaining({
        phase: 'native-paste-result',
        result: 'input-injection-failed',
        nativePasteDiagnostic,
      }),
    );
    expect(subject.automaticPaste.requestPaste).toHaveBeenCalledOnce();
  });

  it.each([
    ['tab switched', { active: false }],
    ['window unfocused', { focused: false }],
    ['window changed', { tabWindowId: 10 }],
  ] as const)(
    'falls back after clipboard success when %s',
    async (_name, browser) => {
      const subject = createSubject({ browser });
      await expect(
        subject.coordinator.handleMessage(request, sender),
      ).resolves.toMatchObject({ outcome: 'copied' });
      expect(subject.clipboard.write).toHaveBeenCalledOnce();
      expect(subject.automaticPaste.capturePasteContext).not.toHaveBeenCalled();
      expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
      expect(subject.automaticPasteDiagnostics).toEqual([
        {
          kind: 'text',
          phase: 'browser-precheck',
          requestId: request.requestId,
          result: 'not-foreground',
        },
      ]);
    },
  );

  it('falls back safely for an older/missing automatic-paste companion after clipboard success', async () => {
    const subject = createSubject({ captureError: new Error('v1 host') });
    await expect(
      subject.coordinator.handleMessage(request, sender),
    ).resolves.toMatchObject({ outcome: 'copied' });
    expect(subject.clipboard.write).toHaveBeenCalledOnce();
    expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
    expect(subject.automaticPasteDiagnostics).toEqual([
      {
        kind: 'text',
        phase: 'native-context-capture',
        requestId: request.requestId,
        result: 'native-unavailable',
      },
    ]);
  });

  it('never captures or pastes when clipboard preparation fails', async () => {
    const subject = createSubject({
      clipboardError: new Error('write failed'),
    });
    await expect(
      subject.coordinator.handleMessage(request, sender),
    ).resolves.toMatchObject({ outcome: 'failed' });
    expect(subject.automaticPaste.capturePasteContext).not.toHaveBeenCalled();
    expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
  });

  it.each(['unsafe-focus', 'cleanup-failed'] as const)(
    'never calls native paste when editor finalization reports %s',
    async (editorState) => {
      const subject = createSubject();
      await subject.coordinator.handleMessage(request, sender);
      await expect(
        subject.coordinator.handleMessage(
          {
            type: 'snippet-automatic-paste-finalize',
            requestId: request.requestId,
            authorizationId,
            editorState,
          },
          sender,
        ),
      ).resolves.toMatchObject({ result: 'unsafe-focus' });
      expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
      expect(subject.automaticPasteDiagnostics).toEqual([
        {
          kind: 'text',
          phase: 'editor-finalize',
          requestId: request.requestId,
          result: 'unsafe-focus',
        },
      ]);
    },
  );

  it('binds finalization to sender document/frame/tab/window identity', async () => {
    const subject = createSubject();
    await subject.coordinator.handleMessage(request, sender);
    await expect(
      subject.coordinator.handleMessage(
        {
          type: 'snippet-automatic-paste-finalize',
          requestId: request.requestId,
          authorizationId,
          editorState: 'ready',
        },
        { ...sender, documentId: 'different-document' },
      ),
    ).resolves.toBeUndefined();
    expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
  });

  it.each([
    ['document', { ...sender, documentId: 'different-document' }],
    ['frame', { ...sender, frameId: 4 }],
    ['tab', { ...sender, tab: { id: 8, windowId: 9 } }],
    ['sender window', { ...sender, tab: { id: 7, windowId: 10 } }],
  ] as const)(
    'rejects a %s identity mismatch',
    async (_name, changedSender) => {
      const subject = createSubject();
      await subject.coordinator.handleMessage(request, sender);
      await expect(
        subject.coordinator.handleMessage(
          {
            type: 'snippet-automatic-paste-finalize',
            requestId: request.requestId,
            authorizationId,
            editorState: 'ready',
          },
          changedSender,
        ),
      ).resolves.toBeUndefined();
      expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['tab switched', 'active', false],
    ['window unfocused', 'focused', false],
    ['window changed', 'tabWindowId', 10],
    ['tab closed', 'tabClosed', true],
  ] as const)(
    'declines when the %s after native context capture',
    async (_name, key, value) => {
      const browser = {
        active: true,
        focused: true,
        tabWindowId: 9,
        tabClosed: false,
      };
      const subject = createSubject({ browser });
      await subject.coordinator.handleMessage(request, sender);
      Object.assign(browser, { [key]: value });
      await expect(
        subject.coordinator.handleMessage(
          {
            type: 'snippet-automatic-paste-finalize',
            requestId: request.requestId,
            authorizationId,
            editorState: 'ready',
          },
          sender,
        ),
      ).resolves.toMatchObject({ result: 'not-foreground' });
      expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
    },
  );

  it('declines a competing automatic activation before clipboard preparation without queueing', async () => {
    const subject = createSubject();
    await subject.coordinator.handleMessage(request, sender);
    await expect(
      subject.coordinator.handleMessage(
        { ...request, requestId: 'request-2' },
        sender,
      ),
    ).resolves.toMatchObject({
      outcome: 'failed',
      code: 'automatic-delivery-busy',
    });
    expect(subject.clipboard.write).toHaveBeenCalledOnce();
    expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
  });

  it('returns native indeterminate exactly once without replay', async () => {
    const subject = createSubject({ pasteResult: 'indeterminate' });
    await subject.coordinator.handleMessage(request, sender);
    await expect(
      subject.coordinator.handleMessage(
        {
          type: 'snippet-automatic-paste-finalize',
          requestId: request.requestId,
          authorizationId,
          editorState: 'ready',
        },
        sender,
      ),
    ).resolves.toMatchObject({ result: 'indeterminate' });
    expect(subject.automaticPaste.requestPaste).toHaveBeenCalledOnce();
    expect(subject.automaticPasteDiagnostics.at(-1)).toMatchObject({
      phase: 'native-paste-request',
      result: 'indeterminate',
    });
  });

  it('maps a lost native response to indeterminate without retry', async () => {
    const subject = createSubject({ pasteError: new Error('disconnected') });
    await subject.coordinator.handleMessage(request, sender);
    await expect(
      subject.coordinator.handleMessage(
        {
          type: 'snippet-automatic-paste-finalize',
          requestId: request.requestId,
          authorizationId,
          editorState: 'ready',
        },
        sender,
      ),
    ).resolves.toMatchObject({ result: 'indeterminate' });
    expect(subject.automaticPaste.requestPaste).toHaveBeenCalledOnce();
  });

  it('does not replay an old authorization in a recreated worker coordinator', async () => {
    const first = createSubject();
    await first.coordinator.handleMessage(request, sender);
    const recreated = createSubject();
    await expect(
      recreated.coordinator.handleMessage(
        {
          type: 'snippet-automatic-paste-finalize',
          requestId: request.requestId,
          authorizationId,
          editorState: 'ready',
        },
        sender,
      ),
    ).resolves.toBeUndefined();
    expect(recreated.automaticPaste.requestPaste).not.toHaveBeenCalled();
  });
});
