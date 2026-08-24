import { describe, expect, it, vi } from 'vitest';

import {
  registerAutomaticPasteResultDiagnostic,
  reportAutomaticPasteActivationTrace,
  reportAutomaticPastePostCleanupTrace,
  requestAutomaticPasteResultDiagnostic,
  requestAutomaticPasteTrace,
} from '../../src/extension/snippet-trigger/automatic-paste-result-diagnostic';

function sessionStorage() {
  const records: Record<string, unknown> = {};
  return {
    records,
    storage: {
      get: vi.fn(async (key: string) => ({ [key]: records[key] })),
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(records, items);
      }),
    },
  };
}

describe('native-development automatic paste result diagnostic', () => {
  it('returns only the latest existing typed result and safe correlation metadata', async () => {
    let listener: ((message: unknown) => unknown) | undefined;
    const session = sessionStorage();
    const registration = registerAutomaticPasteResultDiagnostic(
      {
        onMessage: {
          addListener: vi.fn((registered) => {
            listener = registered;
          }),
        },
      },
      session.storage,
      () => 'worker-1',
    );
    const runtime = {
      sendMessage: vi.fn(async (message: unknown) => listener?.(message)),
    };

    await expect(
      requestAutomaticPasteResultDiagnostic(runtime),
    ).resolves.toBeNull();

    registration.reportResult({
      kind: 'text',
      phase: 'native-paste-request',
      requestId: 'request-1',
      result: 'clipboard-changed',
    });

    const result = await requestAutomaticPasteResultDiagnostic(runtime);
    expect(result).toEqual({
      kind: 'text',
      phase: 'native-paste-request',
      requestId: 'request-1',
      result: 'clipboard-changed',
    });
    expect(Object.keys(result ?? {}).sort()).toEqual([
      'kind',
      'phase',
      'requestId',
      'result',
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /snippet|clipboard content|html|editor|url|customer|merchant|window title/i,
    );
  });

  it('returns one bounded activation trace across service-worker recreation', async () => {
    const session = sessionStorage();
    let firstListener: ((message: unknown) => unknown) | undefined;
    const first = registerAutomaticPasteResultDiagnostic(
      {
        onMessage: {
          addListener: (registered) => {
            firstListener = registered;
          },
        },
      },
      session.storage,
      () => 'worker-1',
    );
    const firstRuntime = {
      sendMessage: vi.fn(async (message: unknown) => firstListener?.(message)),
    };

    await reportAutomaticPasteActivationTrace(
      firstRuntime,
      'request-1',
      'text',
      'automatic',
    );
    first.reportTrace({
      kind: 'text',
      requestId: 'request-1',
      phase: 'paste-mode-resolved',
      persistedPasteMode: 'automatic',
      workerPasteMode: 'automatic',
      selectedBranch: 'automatic',
    });
    first.reportTrace({
      kind: 'text',
      requestId: 'request-1',
      phase: 'native-context-captured',
    });
    first.reportResult({
      kind: 'text',
      phase: 'native-paste-request',
      requestId: 'request-1',
      result: 'clipboard-changed',
    });
    const nativePasteDiagnostic = {
      sendInputRequestedCount: 0,
      sendInputInsertedCount: 0,
      sendInputStructSize: 40,
      sendInputLastError: 0,
      foregroundValidationPassed: true,
      rootWindowValidationPassed: true,
      pidValidationPassed: true,
      clipboardSequenceValidationPassed: false,
      modifierValidationPassed: false,
      hostSessionMatchesTarget: true,
      hostIntegrityRelation: 'same' as const,
    };
    first.reportTrace({
      kind: 'text',
      requestId: 'request-1',
      phase: 'native-paste-result',
      result: 'clipboard-changed',
      resultPhase: 'native-paste-request',
      nativePasteDiagnostic,
    });
    await requestAutomaticPasteTrace(firstRuntime);

    let recreatedListener: ((message: unknown) => unknown) | undefined;
    registerAutomaticPasteResultDiagnostic(
      {
        onMessage: {
          addListener: (registered) => {
            recreatedListener = registered;
          },
        },
      },
      session.storage,
      () => 'worker-2',
    );
    const recreatedRuntime = {
      sendMessage: vi.fn(async (message: unknown) =>
        recreatedListener?.(message),
      ),
    };

    await expect(requestAutomaticPasteTrace(recreatedRuntime)).resolves.toEqual(
      {
        persistedPasteMode: 'automatic',
        workerPasteMode: 'automatic',
        activationPasteMode: 'automatic',
        selectedBranch: 'automatic',
        firstAutomaticPhase: 'native-context-captured',
        lastPhase: 'native-paste-result',
        result: 'clipboard-changed',
        requestId: 'request-1',
        serviceWorkerLifecycle: 'worker-recreated-after-activation',
        postCleanupFailure: null,
        postCleanupChecks: null,
        firstInvalidationCause: null,
        focusTopology: null,
        noticePhase: 'not-observed',
        noticeExistedBeforePostCleanupCheck: null,
        noticeExistsAfterPostCleanupFailure: null,
        fallbackNoticeMountedAfterAutomaticResult: null,
        fallbackNoticeSuppressed: null,
        noticeCallsFocus: null,
        noticeHasAutofocus: null,
        activeElementChangedByNoticeMount: null,
        selectionchangeDuringNoticeMount: null,
        noticeMutationWithinAuthorizationObserverScope: null,
        noticeMountedInsideEditor: null,
        cleanupInputProvenance: null,
        firstInvalidatingInputPhase: null,
        activationBeforeInputPrevented: null,
        activationInputObserved: null,
        externalInputTrusted: null,
        externalInputType: null,
        externalInputSameEditor: null,
        externalInputSameRoot: null,
        externalInputComposed: null,
        externalInputSameActivationTask: null,
        externalInputRelativePhase: null,
        externalInputSequenceRelation: null,
        nativePasteDiagnostic,
      },
    );
    expect(Object.keys(session.records)).toHaveLength(1);
    expect(JSON.stringify(session.records)).not.toMatch(
      /plainText|html|clipboardContent|url|editorText|snippetText|inputData|eventData|customer|merchant|windowTitle/i,
    );
  });

  it('merges privacy-safe post-cleanup predicates and notice ordering', async () => {
    let listener: ((message: unknown) => unknown) | undefined;
    const session = sessionStorage();
    registerAutomaticPasteResultDiagnostic(
      {
        onMessage: {
          addListener: (registered) => {
            listener = registered;
          },
        },
      },
      session.storage,
      () => 'worker-1',
    );
    const runtime = {
      sendMessage: vi.fn(async (message: unknown) => listener?.(message)),
    };
    await reportAutomaticPasteActivationTrace(
      runtime,
      'request-2',
      'text',
      'automatic',
    );
    const editor = {
      postCleanupFailure: 'composed-focus-mismatch' as const,
      postCleanupChecks: {
        authorizationStillValid: false,
        editorConnected: true,
        sameDocument: true,
        composedFocusValid: false,
        selectionExists: true,
        selectionCollapsed: true,
        caretRootMatches: true,
        caretPathMatches: true,
        caretOffsetMatches: true,
        structureMatches: true,
        lifecycleValid: true,
        mutationValid: true,
        selectionValid: true,
        focusValid: true,
      },
      firstInvalidationCause: 'predicate-failed' as const,
      focusTopology: 'no-valid-composed-focus' as const,
      noticeMutationWithinAuthorizationObserverScope: true,
      noticeMountedInsideEditor: false as const,
      cleanupInputProvenance: 'external-input' as const,
      firstInvalidatingInputPhase:
        'outside-authorized-cleanup-dispatch' as const,
      activationBeforeInputPrevented: false,
      activationInputObserved: false,
      externalInputTrusted: true,
      externalInputType: 'insertText' as const,
      externalInputSameEditor: true,
      externalInputSameRoot: true,
      externalInputComposed: true,
      externalInputSameActivationTask: false,
      externalInputRelativePhase: 'pre-cleanup' as const,
      externalInputSequenceRelation: 'before-owned-cleanup-input' as const,
    };
    await reportAutomaticPastePostCleanupTrace(runtime, {
      requestId: 'request-2',
      phase: 'before-post-cleanup-check',
      editor,
      noticeExistedBeforePostCleanupCheck: false,
      noticeExistsAfterPostCleanupFailure: null,
      fallbackNoticeMountedAfterAutomaticResult: null,
      fallbackNoticeSuppressed: null,
      noticeCallsFocus: false,
      noticeHasAutofocus: null,
      activeElementChangedByNoticeMount: null,
      selectionchangeDuringNoticeMount: null,
    });
    await reportAutomaticPastePostCleanupTrace(runtime, {
      requestId: 'request-2',
      phase: 'after-automatic-result-notice',
      editor,
      noticeExistedBeforePostCleanupCheck: false,
      noticeExistsAfterPostCleanupFailure: true,
      fallbackNoticeMountedAfterAutomaticResult: true,
      fallbackNoticeSuppressed: false,
      noticeCallsFocus: false,
      noticeHasAutofocus: false,
      activeElementChangedByNoticeMount: false,
      selectionchangeDuringNoticeMount: false,
    });

    await expect(requestAutomaticPasteTrace(runtime)).resolves.toMatchObject({
      postCleanupFailure: 'composed-focus-mismatch',
      postCleanupChecks: { composedFocusValid: false },
      firstInvalidationCause: 'predicate-failed',
      focusTopology: 'no-valid-composed-focus',
      noticePhase: 'fallback-mounted-after-post-cleanup-failure',
      noticeExistedBeforePostCleanupCheck: false,
      noticeExistsAfterPostCleanupFailure: true,
      fallbackNoticeMountedAfterAutomaticResult: true,
      fallbackNoticeSuppressed: false,
      noticeCallsFocus: false,
      noticeHasAutofocus: false,
      activeElementChangedByNoticeMount: false,
      selectionchangeDuringNoticeMount: false,
      noticeMutationWithinAuthorizationObserverScope: true,
      noticeMountedInsideEditor: false,
      cleanupInputProvenance: 'external-input',
      firstInvalidatingInputPhase: 'outside-authorized-cleanup-dispatch',
      activationBeforeInputPrevented: false,
      activationInputObserved: false,
      externalInputTrusted: true,
      externalInputType: 'insertText',
      externalInputSameEditor: true,
      externalInputSameRoot: true,
      externalInputComposed: true,
      externalInputSameActivationTask: false,
      externalInputRelativePhase: 'pre-cleanup',
      externalInputSequenceRelation: 'before-owned-cleanup-input',
    });
    expect(JSON.stringify(session.records)).not.toMatch(
      /plainText|html|clipboardContent|url|editorText|snippetText|inputData|eventData|customer|merchant|windowTitle|selector/i,
    );
  });

  it('rejects an expanded or untyped response instead of exposing it', async () => {
    await expect(
      requestAutomaticPasteResultDiagnostic({
        sendMessage: vi.fn(async () => ({
          kind: 'text',
          phase: 'native-paste-request',
          requestId: 'request-1',
          result: 'input-injection-failed',
          snippetText: 'must not escape',
        })),
      }),
    ).rejects.toThrow('Automatic paste diagnostic response was invalid.');
  });

  it('rejects an expanded trace response instead of exposing it', async () => {
    await expect(
      requestAutomaticPasteTrace({
        sendMessage: vi.fn(async () => ({
          persistedPasteMode: 'automatic',
          workerPasteMode: 'automatic',
          activationPasteMode: 'automatic',
          selectedBranch: 'automatic',
          firstAutomaticPhase: 'automatic-precheck-started',
          lastPhase: 'native-paste-result',
          result: 'input-injection-failed',
          requestId: 'request-1',
          serviceWorkerLifecycle: 'same-worker',
          pageText: 'must not escape',
        })),
      }),
    ).rejects.toThrow('Automatic paste trace response was invalid.');
  });
});
