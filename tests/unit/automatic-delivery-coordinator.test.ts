import { describe, expect, it, vi } from 'vitest';

import type { SettingsRepository } from '../../src/application/persistence/settings-repository';
import type { AutomaticPasteDiagnosticsRepository } from '../../src/application/persistence/automatic-paste-diagnostics-repository';
import { AutomaticPasteDiagnosticsService } from '../../src/application/snippet/automatic-paste-diagnostics';
import type {
  AutomaticPasteTransport,
  NativePasteAttemptDiagnostic,
} from '../../src/application/snippet/automatic-paste-transport';
import type { SnippetDeliveryPlanner } from '../../src/application/snippet/snippet-delivery-planner';
import type { ClipboardTransport } from '../../src/extension/snippet-trigger/clipboard-transport';
import {
  SnippetDeliveryCoordinator,
  type AutomaticPasteResultDiagnostic,
  type AutomaticPasteDiagnosticsRecorder,
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
    diagnosticsEnabled?: boolean;
    diagnosticsThrow?: boolean;
    diagnosticsRecorder?: AutomaticPasteDiagnosticsRecorder;
    now?: () => number;
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
      automaticBackupCadence: 'weekly' as const,
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
  const terminalRecords: unknown[] = [];
  const diagnosticsRecorder = {
    isRecordingEnabled: vi.fn(() => options.diagnosticsEnabled === true),
    recordEligibleTerminal: vi.fn((record: unknown) => {
      terminalRecords.push(record);
      if (options.diagnosticsThrow === true) {
        throw new Error('diagnostics persistence unavailable');
      }
    }),
  };
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
    options.now ?? (() => ++clock),
    undefined,
    undefined,
    undefined,
    options.diagnosticsRecorder ?? diagnosticsRecorder,
  );
  return {
    coordinator,
    planner,
    clipboard,
    automaticPaste,
    browser,
    settings,
    timings,
    automaticPasteDiagnostics,
    automaticPasteTrace,
    diagnosticsRecorder,
    terminalRecords,
  };
}

describe('automatic/manual delivery orchestration', () => {
  it.each([
    [1, 'totalObservedDelivery'],
    [3, 'clipboardPreparation'],
    [6, 'clipboardWrite'],
    [9, 'browserSafetyPreparation'],
    [11, 'nativeContextCaptureRoundtrip'],
    [14, 'nativePasteRequestRoundtrip'],
    [16, 'totalObservedDelivery'],
  ] as const)(
    'isolates diagnostics-only clock read %s for %s',
    async (failingRead, timing) => {
      let reads = 0;
      const subject = createSubject({
        diagnosticsEnabled: true,
        now: () => {
          if (++reads === failingRead)
            throw new Error('optional clock unavailable');
          return reads;
        },
      });
      await expect(
        subject.coordinator.handleMessage(request, sender),
      ).resolves.toMatchObject({ outcome: 'automatic-ready' });
      const finalize = {
        type: 'snippet-automatic-paste-finalize' as const,
        requestId: request.requestId,
        authorizationId,
        editorState: 'ready' as const,
        triggerCleanupAndRevalidationMs: 4,
      };
      await expect(
        subject.coordinator.handleMessage(finalize, sender),
      ).resolves.toMatchObject({ result: 'paste-issued' });
      await subject.coordinator.handleMessage(finalize, sender);
      expect(subject.terminalRecords).toEqual([
        expect.objectContaining({
          result: 'paste-issued',
          timingsMs: expect.objectContaining({ [timing]: null }),
        }),
      ]);
      expect(subject.clipboard.write).toHaveBeenCalledOnce();
      expect(subject.automaticPaste.capturePasteContext).toHaveBeenCalledOnce();
      expect(subject.automaticPaste.requestPaste).toHaveBeenCalledOnce();
    },
  );

  it.each([
    [true, false, 'automatic', 1],
    [false, true, 'automatic', 0],
    [false, false, 'automatic', 0],
    [true, false, 'clipboard-only', 0],
  ] as const)(
    'freezes receipt eligibility %s -> %s in %s mode (%s terminal attempts)',
    async (enabledAtReceipt, enabledBeforeFinalize, mode, expectedRecords) => {
      const repository: AutomaticPasteDiagnosticsRepository = {
        isEnabled: async () => false,
        setEnabled: async () => undefined,
        appendAndPrune: vi.fn(async () => undefined),
        pruneAndList: async () => [],
        clearRecords: async () => undefined,
      };
      const service = new AutomaticPasteDiagnosticsService(
        repository,
        () => new Date('2026-10-03T00:00:00.000Z'),
      );
      await service.setEnabled(enabledAtReceipt);
      const recordEligibleTerminal = vi.spyOn(
        service,
        'recordEligibleTerminal',
      );
      const subject = createSubject({ mode, diagnosticsRecorder: service });
      // Change enablement while authoritative mode resolution is still pending.
      const settings = await subject.settings.load();
      let resolveSettings!: (value: typeof settings) => void;
      vi.mocked(subject.settings.load).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSettings = resolve;
          }),
      );
      const activation = subject.coordinator.handleMessage(request, sender);
      await service.setEnabled(enabledBeforeFinalize);
      resolveSettings(settings);
      await expect(activation).resolves.toMatchObject({
        outcome: mode === 'automatic' ? 'automatic-ready' : 'copied',
      });
      if (mode === 'automatic') {
        const finalize = {
          type: 'snippet-automatic-paste-finalize' as const,
          requestId: request.requestId,
          authorizationId,
          editorState: 'ready' as const,
          triggerCleanupAndRevalidationMs: null,
        };
        await expect(
          subject.coordinator.handleMessage(finalize, sender),
        ).resolves.toMatchObject({ result: 'paste-issued' });
        await subject.coordinator.handleMessage(finalize, sender);
        expect(
          subject.automaticPaste.capturePasteContext,
        ).toHaveBeenCalledOnce();
        expect(subject.automaticPaste.requestPaste).toHaveBeenCalledOnce();
      }
      expect(recordEligibleTerminal).toHaveBeenCalledTimes(expectedRecords);
      expect(repository.appendAndPrune).toHaveBeenCalledTimes(expectedRecords);
      expect(subject.clipboard.write).toHaveBeenCalledOnce();
    },
  );

  it.each([
    [true, false, 1],
    [false, true, 0],
  ] as const)(
    'preserves eligibility %s -> %s after native capture (%s records)',
    async (enabledAtReceipt, enabledBeforeFinalize, expectedRecords) => {
      const options = { diagnosticsEnabled: enabledAtReceipt };
      const subject = createSubject(options);
      await expect(
        subject.coordinator.handleMessage(request, sender),
      ).resolves.toMatchObject({ outcome: 'automatic-ready' });
      options.diagnosticsEnabled = enabledBeforeFinalize;
      const finalize = {
        type: 'snippet-automatic-paste-finalize' as const,
        requestId: request.requestId,
        authorizationId,
        editorState: 'ready' as const,
        triggerCleanupAndRevalidationMs: null,
      };
      await expect(
        subject.coordinator.handleMessage(finalize, sender),
      ).resolves.toMatchObject({ result: 'paste-issued' });
      await subject.coordinator.handleMessage(finalize, sender);
      expect(subject.terminalRecords).toHaveLength(expectedRecords);
      expect(subject.automaticPaste.requestPaste).toHaveBeenCalledOnce();
    },
  );

  it.each(['throw', 'nan', 'infinite', 'negative'] as const)(
    'isolates an unusable native-capture diagnostic start clock (%s)',
    async (failure) => {
      let clock = 0;
      let failed = false;
      const subject = createSubject({
        diagnosticsEnabled: true,
        now: () => {
          if (
            !failed &&
            subject.automaticPasteTrace.at(-1)?.phase ===
              'native-context-capture-started'
          ) {
            failed = true;
            if (failure === 'throw')
              throw new Error('optional clock unavailable');
            return failure === 'nan'
              ? Number.NaN
              : failure === 'infinite'
                ? Number.POSITIVE_INFINITY
                : -1;
          }
          return ++clock;
        },
      });
      await expect(
        subject.coordinator.handleMessage(request, sender),
      ).resolves.toMatchObject({ outcome: 'automatic-ready' });
      const finalize = {
        type: 'snippet-automatic-paste-finalize' as const,
        requestId: request.requestId,
        authorizationId,
        editorState: 'ready' as const,
        triggerCleanupAndRevalidationMs: null,
      };
      await expect(
        subject.coordinator.handleMessage(finalize, sender),
      ).resolves.toMatchObject({ result: 'paste-issued' });
      await subject.coordinator.handleMessage(finalize, sender);
      expect(failed).toBe(true);
      expect(subject.clipboard.write).toHaveBeenCalledOnce();
      expect(
        subject.automaticPaste.capturePasteContext,
      ).toHaveBeenCalledExactlyOnceWith(authorizationId);
      expect(
        subject.automaticPaste.requestPaste,
      ).toHaveBeenCalledExactlyOnceWith({
        activationId: authorizationId,
        ...context,
      });
      expect(subject.terminalRecords).toEqual([
        expect.objectContaining({
          result: 'paste-issued',
          terminalStage: 'complete',
          timingsMs: expect.objectContaining({
            nativeContextCaptureRoundtrip: null,
          }),
        }),
      ]);
    },
  );
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
        usageReceiptId: expect.any(String),
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
            triggerCleanupAndRevalidationMs: null,
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
            triggerCleanupAndRevalidationMs: null,
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
          triggerCleanupAndRevalidationMs: null,
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
            triggerCleanupAndRevalidationMs: null,
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
          triggerCleanupAndRevalidationMs: null,
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
            triggerCleanupAndRevalidationMs: null,
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
            triggerCleanupAndRevalidationMs: null,
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
          triggerCleanupAndRevalidationMs: null,
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
          triggerCleanupAndRevalidationMs: null,
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
          triggerCleanupAndRevalidationMs: null,
        },
        sender,
      ),
    ).resolves.toBeUndefined();
    expect(recreated.automaticPaste.requestPaste).not.toHaveBeenCalled();
  });

  it.each([
    ['paste-issued', 'paste-issued', 'complete', null],
    [
      'clipboard-only',
      'native-unavailable',
      'native-response',
      'native-capability',
    ],
    [
      'not-foreground',
      'not-foreground',
      'native-foreground-validation',
      'native-foreground-context',
    ],
    [
      'unsafe-focus',
      'unsafe-focus',
      'native-foreground-validation',
      'native-foreground-context',
    ],
    [
      'clipboard-changed',
      'clipboard-changed',
      'native-clipboard-validation',
      'clipboard-sequence',
    ],
    [
      'unsafe-keyboard-state',
      'unsafe-keyboard-state',
      'native-keyboard-validation',
      'keyboard-modifiers',
    ],
    ['busy', 'busy', 'service-worker-coordination', 'delivery-concurrency'],
    [
      'native-unavailable',
      'native-unavailable',
      'native-response',
      'native-capability',
    ],
    [
      'input-injection-failed',
      'input-injection-failed',
      'input-injection',
      'input-injection',
    ],
    [
      'indeterminate',
      'indeterminate',
      'native-response',
      'response-correlation',
    ],
  ] as const)(
    'records exactly one bounded terminal observation for native result %s',
    async (pasteResult, result, terminalStage, safetyCategory) => {
      const subject = createSubject({
        diagnosticsEnabled: true,
        pasteResult,
      });
      await subject.coordinator.handleMessage(request, sender);
      await subject.coordinator.handleMessage(
        {
          type: 'snippet-automatic-paste-finalize',
          requestId: request.requestId,
          authorizationId,
          editorState: 'ready',
          triggerCleanupAndRevalidationMs: 4,
        },
        sender,
      );

      expect(
        subject.diagnosticsRecorder.recordEligibleTerminal,
      ).toHaveBeenCalledOnce();
      expect(subject.terminalRecords[0]).toMatchObject({
        kind: 'text',
        result,
        terminalStage,
        safetyCategory,
        failureCode: null,
        timingsMs: {
          triggerCleanupAndRevalidation: 4,
        },
      });
    },
  );

  it('records a pre-result automatic clipboard failure without changing its delivery response', async () => {
    const subject = createSubject({
      diagnosticsEnabled: true,
      clipboardError: new Error('write unavailable'),
    });

    await expect(
      subject.coordinator.handleMessage(request, sender),
    ).resolves.toMatchObject({
      outcome: 'failed',
      code: 'unexpected-delivery-failure',
    });
    expect(subject.terminalRecords).toEqual([
      expect.objectContaining({
        result: 'delivery-failed',
        terminalStage: 'clipboard-write',
        failureCode: 'unexpected-delivery-failure',
      }),
    ]);
  });

  it.each([
    ['unsafe-focus', 'editor-revalidation', 'editor-focus-selection'],
    ['cleanup-failed', 'trigger-cleanup', 'editor-cleanup-state'],
  ] as const)(
    'records the content-owned %s terminal classification once',
    async (editorState, terminalStage, safetyCategory) => {
      const subject = createSubject({ diagnosticsEnabled: true });
      await subject.coordinator.handleMessage(request, sender);
      await subject.coordinator.handleMessage(
        {
          type: 'snippet-automatic-paste-finalize',
          requestId: request.requestId,
          authorizationId,
          editorState,
          triggerCleanupAndRevalidationMs: 8,
        },
        sender,
      );
      expect(subject.terminalRecords).toEqual([
        expect.objectContaining({
          result: 'unsafe-focus',
          terminalStage,
          safetyCategory,
          timingsMs: expect.objectContaining({
            triggerCleanupAndRevalidation: 8,
          }),
        }),
      ]);
      expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
    },
  );

  it('records browser precheck and native capture fallbacks once each', async () => {
    const browserFallback = createSubject({
      diagnosticsEnabled: true,
      browser: { active: false },
    });
    await browserFallback.coordinator.handleMessage(request, sender);
    expect(browserFallback.terminalRecords).toEqual([
      expect.objectContaining({
        result: 'not-foreground',
        terminalStage: 'browser-safety-validation',
        safetyCategory: 'browser-tab-window',
      }),
    ]);

    const nativeFallback = createSubject({
      diagnosticsEnabled: true,
      captureError: new Error('host unavailable'),
    });
    await nativeFallback.coordinator.handleMessage(request, sender);
    expect(nativeFallback.terminalRecords).toEqual([
      expect.objectContaining({
        result: 'native-unavailable',
        terminalStage: 'native-context-capture',
        safetyCategory: 'native-capability',
      }),
    ]);
  });

  it('records a competing automatic activation as busy without queueing or disturbing the first attempt', async () => {
    const subject = createSubject({ diagnosticsEnabled: true });
    await subject.coordinator.handleMessage(request, sender);
    await subject.coordinator.handleMessage(
      { ...request, requestId: 'request-2' },
      sender,
    );
    expect(subject.terminalRecords).toEqual([
      expect.objectContaining({
        result: 'busy',
        terminalStage: 'service-worker-coordination',
        safetyCategory: 'delivery-concurrency',
      }),
    ]);
    expect(subject.clipboard.write).toHaveBeenCalledOnce();
  });

  it('records final browser revalidation failure without calling native paste', async () => {
    const browser = { active: true };
    const subject = createSubject({ diagnosticsEnabled: true, browser });
    await subject.coordinator.handleMessage(request, sender);
    browser.active = false;
    await subject.coordinator.handleMessage(
      {
        type: 'snippet-automatic-paste-finalize',
        requestId: request.requestId,
        authorizationId,
        editorState: 'ready',
        triggerCleanupAndRevalidationMs: 3,
      },
      sender,
    );
    expect(subject.terminalRecords).toEqual([
      expect.objectContaining({
        result: 'not-foreground',
        terminalStage: 'browser-safety-validation',
        safetyCategory: 'browser-tab-window',
      }),
    ]);
    expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
  });

  it('records an unanswered accepted finalize as one indeterminate timeout without replay', async () => {
    vi.useFakeTimers();
    try {
      const subject = createSubject({ diagnosticsEnabled: true });
      await subject.coordinator.handleMessage(request, sender);
      await vi.advanceTimersByTimeAsync(15_000);
      expect(subject.terminalRecords).toEqual([
        expect.objectContaining({
          result: 'indeterminate',
          terminalStage: 'service-worker-coordination',
          safetyCategory: 'response-correlation',
        }),
      ]);
      expect(subject.automaticPaste.requestPaste).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('records nothing for clipboard-only mode or disabled diagnostics', async () => {
    const clipboardOnly = createSubject({
      mode: 'clipboard-only',
      diagnosticsEnabled: true,
    });
    await clipboardOnly.coordinator.handleMessage(request, sender);
    expect(
      clipboardOnly.diagnosticsRecorder.recordEligibleTerminal,
    ).not.toHaveBeenCalled();

    const disabled = createSubject({ diagnosticsEnabled: false });
    await disabled.coordinator.handleMessage(request, sender);
    await disabled.coordinator.handleMessage(
      {
        type: 'snippet-automatic-paste-finalize',
        requestId: request.requestId,
        authorizationId,
        editorState: 'ready',
        triggerCleanupAndRevalidationMs: 1,
      },
      sender,
    );
    expect(
      disabled.diagnosticsRecorder.recordEligibleTerminal,
    ).not.toHaveBeenCalled();
  });

  it('keeps the authoritative result and never retries when terminal recording throws', async () => {
    const subject = createSubject({
      diagnosticsEnabled: true,
      diagnosticsThrow: true,
    });
    await subject.coordinator.handleMessage(request, sender);
    await expect(
      subject.coordinator.handleMessage(
        {
          type: 'snippet-automatic-paste-finalize',
          requestId: request.requestId,
          authorizationId,
          editorState: 'ready',
          triggerCleanupAndRevalidationMs: 2,
        },
        sender,
      ),
    ).resolves.toMatchObject({ result: 'paste-issued' });
    expect(
      subject.diagnosticsRecorder.recordEligibleTerminal,
    ).toHaveBeenCalledOnce();
    expect(subject.automaticPaste.requestPaste).toHaveBeenCalledOnce();
  });
});
