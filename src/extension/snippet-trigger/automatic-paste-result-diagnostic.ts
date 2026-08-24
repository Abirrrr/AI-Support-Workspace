import type { SnippetPasteMode } from '../../domain/settings';
import type { AutomaticPasteFinalizeResponse } from '../../shared/snippet-delivery-messages';
import type { NativePasteAttemptDiagnostic } from '../../application/snippet/automatic-paste-transport';
import type {
  AutomaticPasteEditorDiagnostic,
  AutomaticPasteInvalidationCause,
  AutomaticPasteFocusTopology,
  PostCleanupChecks,
  PostCleanupFailure,
} from './editor-adapters';
import type { AutomaticPastePostCleanupTrace } from './expansion-controller';
import type {
  AutomaticPasteResultDiagnostic,
  AutomaticPasteResultDiagnosticSink,
  AutomaticPasteTraceDiagnostic,
  AutomaticPasteTraceDiagnosticSink,
  AutomaticPasteTracePhase,
} from './delivery-coordinator';

const AUTOMATIC_PASTE_DIAGNOSTIC_QUERY =
  'native-dev-automatic-paste-result-diagnostic';
const AUTOMATIC_PASTE_TRACE_QUERY = 'native-dev-automatic-paste-trace';
const AUTOMATIC_PASTE_ACTIVATION_TRACE =
  'native-dev-automatic-paste-activation-trace';
const AUTOMATIC_PASTE_POST_CLEANUP_TRACE =
  'native-dev-automatic-paste-post-cleanup-trace';
const AUTOMATIC_PASTE_TRACE_STORAGE_KEY =
  'native-dev-automatic-paste-trace-latest';

type AutomaticPasteResult = AutomaticPasteFinalizeResponse['result'];
type AutomaticPasteResultPhase = AutomaticPasteResultDiagnostic['phase'];

interface DiagnosticRuntime {
  readonly onMessage: {
    addListener(listener: (message: unknown) => unknown): void;
  };
}

export interface DiagnosticQueryRuntime {
  sendMessage(message: unknown): Promise<unknown>;
}

export interface DiagnosticSessionStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<void>;
}

export interface AutomaticPasteTrace {
  readonly persistedPasteMode: SnippetPasteMode | null;
  readonly workerPasteMode: SnippetPasteMode | null;
  readonly activationPasteMode: SnippetPasteMode | null;
  readonly selectedBranch: SnippetPasteMode | null;
  readonly firstAutomaticPhase: AutomaticPasteTracePhase | null;
  readonly lastPhase: AutomaticPasteTracePhase;
  readonly result: AutomaticPasteResult | null;
  readonly requestId: string;
  readonly serviceWorkerLifecycle:
    'same-worker' | 'worker-recreated-after-activation';
  readonly postCleanupFailure: PostCleanupFailure;
  readonly postCleanupChecks: PostCleanupChecks | null;
  readonly firstInvalidationCause: AutomaticPasteInvalidationCause;
  readonly focusTopology: AutomaticPasteFocusTopology | null;
  readonly noticePhase:
    | 'not-observed'
    | 'absent-before-post-cleanup-check'
    | 'present-before-post-cleanup-check'
    | 'fallback-mounted-after-post-cleanup-failure'
    | 'fallback-suppressed-after-post-cleanup-failure';
  readonly noticeExistedBeforePostCleanupCheck: boolean | null;
  readonly noticeExistsAfterPostCleanupFailure: boolean | null;
  readonly fallbackNoticeMountedAfterAutomaticResult: boolean | null;
  readonly fallbackNoticeSuppressed: boolean | null;
  readonly noticeCallsFocus: boolean | null;
  readonly noticeHasAutofocus: boolean | null;
  readonly activeElementChangedByNoticeMount: boolean | null;
  readonly selectionchangeDuringNoticeMount: boolean | null;
  readonly noticeMutationWithinAuthorizationObserverScope: boolean | null;
  readonly noticeMountedInsideEditor: boolean | null;
  readonly cleanupInputProvenance:
    AutomaticPasteEditorDiagnostic['cleanupInputProvenance'] | null;
  readonly firstInvalidatingInputPhase:
    AutomaticPasteEditorDiagnostic['firstInvalidatingInputPhase'] | null;
  readonly activationBeforeInputPrevented: boolean | null;
  readonly activationInputObserved: boolean | null;
  readonly externalInputTrusted: boolean | null;
  readonly externalInputType:
    AutomaticPasteEditorDiagnostic['externalInputType'] | null;
  readonly externalInputSameEditor: boolean | null;
  readonly externalInputSameRoot: boolean | null;
  readonly externalInputComposed: boolean | null;
  readonly externalInputSameActivationTask: boolean | null;
  readonly externalInputRelativePhase:
    AutomaticPasteEditorDiagnostic['externalInputRelativePhase'] | null;
  readonly externalInputSequenceRelation:
    AutomaticPasteEditorDiagnostic['externalInputSequenceRelation'] | null;
  readonly nativePasteDiagnostic: NativePasteAttemptDiagnostic | null;
}

interface StoredAutomaticPasteTrace {
  readonly persistedPasteMode: SnippetPasteMode | null;
  readonly workerPasteMode: SnippetPasteMode | null;
  readonly activationPasteMode: SnippetPasteMode | null;
  readonly selectedBranch: SnippetPasteMode | null;
  readonly firstAutomaticPhase: AutomaticPasteTracePhase | null;
  readonly lastPhase: AutomaticPasteTracePhase;
  readonly result: AutomaticPasteResult | null;
  readonly resultPhase: AutomaticPasteResultPhase | null;
  readonly requestId: string;
  readonly kind: 'text' | 'image' | null;
  readonly originWorkerInstanceId: string;
  readonly postCleanupFailure: PostCleanupFailure;
  readonly postCleanupChecks: PostCleanupChecks | null;
  readonly firstInvalidationCause: AutomaticPasteInvalidationCause;
  readonly focusTopology: AutomaticPasteFocusTopology | null;
  readonly noticePhase: AutomaticPasteTrace['noticePhase'];
  readonly noticeExistedBeforePostCleanupCheck: boolean | null;
  readonly noticeExistsAfterPostCleanupFailure: boolean | null;
  readonly fallbackNoticeMountedAfterAutomaticResult: boolean | null;
  readonly fallbackNoticeSuppressed: boolean | null;
  readonly noticeCallsFocus: boolean | null;
  readonly noticeHasAutofocus: boolean | null;
  readonly activeElementChangedByNoticeMount: boolean | null;
  readonly selectionchangeDuringNoticeMount: boolean | null;
  readonly noticeMutationWithinAuthorizationObserverScope: boolean | null;
  readonly noticeMountedInsideEditor: boolean | null;
  readonly cleanupInputProvenance:
    AutomaticPasteEditorDiagnostic['cleanupInputProvenance'] | null;
  readonly firstInvalidatingInputPhase:
    AutomaticPasteEditorDiagnostic['firstInvalidatingInputPhase'] | null;
  readonly activationBeforeInputPrevented: boolean | null;
  readonly activationInputObserved: boolean | null;
  readonly externalInputTrusted: boolean | null;
  readonly externalInputType:
    AutomaticPasteEditorDiagnostic['externalInputType'] | null;
  readonly externalInputSameEditor: boolean | null;
  readonly externalInputSameRoot: boolean | null;
  readonly externalInputComposed: boolean | null;
  readonly externalInputSameActivationTask: boolean | null;
  readonly externalInputRelativePhase:
    AutomaticPasteEditorDiagnostic['externalInputRelativePhase'] | null;
  readonly externalInputSequenceRelation:
    AutomaticPasteEditorDiagnostic['externalInputSequenceRelation'] | null;
  readonly nativePasteDiagnostic: NativePasteAttemptDiagnostic | null;
}

export interface AutomaticPasteDiagnosticRegistration {
  readonly reportResult: AutomaticPasteResultDiagnosticSink;
  readonly reportTrace: AutomaticPasteTraceDiagnosticSink;
}

const TRACE_PHASES = [
  'activation-received',
  'paste-mode-resolved',
  'clipboard-started',
  'clipboard-succeeded',
  'automatic-precheck-started',
  'native-context-capture-started',
  'native-context-captured',
  'cleanup-started',
  'cleanup-succeeded',
  'post-cleanup-check',
  'authorization-consumed',
  'final-browser-check',
  'native-paste-requested',
  'native-paste-result',
  'finalize-timeout',
  'manual-fallback',
] as const satisfies readonly AutomaticPasteTracePhase[];

const AUTOMATIC_PHASES = new Set<AutomaticPasteTracePhase>([
  'automatic-precheck-started',
  'native-context-capture-started',
  'native-context-captured',
  'cleanup-started',
  'cleanup-succeeded',
  'post-cleanup-check',
  'authorization-consumed',
  'final-browser-check',
  'native-paste-requested',
  'native-paste-result',
  'finalize-timeout',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function isPasteMode(value: unknown): value is SnippetPasteMode {
  return value === 'clipboard-only' || value === 'automatic';
}

function isTracePhase(value: unknown): value is AutomaticPasteTracePhase {
  return (TRACE_PHASES as readonly unknown[]).includes(value);
}

function isResult(value: unknown): value is AutomaticPasteResult {
  return (
    value === 'paste-issued' ||
    value === 'unsafe-focus' ||
    value === 'not-foreground' ||
    value === 'clipboard-changed' ||
    value === 'unsafe-keyboard-state' ||
    value === 'busy' ||
    value === 'native-unavailable' ||
    value === 'input-injection-failed' ||
    value === 'indeterminate'
  );
}

function isResultPhase(value: unknown): value is AutomaticPasteResultPhase {
  return (
    value === 'preflight' ||
    value === 'browser-precheck' ||
    value === 'native-context-capture' ||
    value === 'editor-finalize' ||
    value === 'browser-finalize' ||
    value === 'native-paste-request' ||
    value === 'finalize-timeout'
  );
}

const POST_CLEANUP_CHECK_KEYS = [
  'authorizationStillValid',
  'editorConnected',
  'sameDocument',
  'composedFocusValid',
  'selectionExists',
  'selectionCollapsed',
  'caretRootMatches',
  'caretPathMatches',
  'caretOffsetMatches',
  'structureMatches',
  'lifecycleValid',
  'mutationValid',
  'selectionValid',
  'focusValid',
] as const;

function isPostCleanupChecks(value: unknown): value is PostCleanupChecks {
  return (
    isRecord(value) &&
    hasExactKeys(value, POST_CLEANUP_CHECK_KEYS) &&
    POST_CLEANUP_CHECK_KEYS.every((key) => typeof value[key] === 'boolean')
  );
}

function isPostCleanupFailure(value: unknown): value is PostCleanupFailure {
  return (
    value === null ||
    value === 'authorization-invalidated' ||
    value === 'editor-disconnected' ||
    value === 'document-changed' ||
    value === 'composed-focus-mismatch' ||
    value === 'selection-missing' ||
    value === 'selection-not-collapsed' ||
    value === 'caret-root-mismatch' ||
    value === 'caret-path-mismatch' ||
    value === 'caret-offset-mismatch' ||
    value === 'structure-mismatch' ||
    value === 'lifecycle-invalidated' ||
    value === 'mutation-invalidated' ||
    value === 'selection-invalidated' ||
    value === 'focus-invalidated' ||
    value === 'other'
  );
}

function isInvalidationCause(
  value: unknown,
): value is AutomaticPasteInvalidationCause {
  return (
    value === null ||
    value === 'mutation' ||
    value === 'selectionchange' ||
    value === 'focusout' ||
    value === 'focusin' ||
    value === 'window-blur' ||
    value === 'editor-disconnected' ||
    value === 'pagehide' ||
    value === 'visibility-hidden' ||
    value === 'unrelated-input' ||
    value === 'lifecycle' ||
    value === 'explicit-cancellation' ||
    value === 'predicate-failed'
  );
}

function isFocusTopology(value: unknown): value is AutomaticPasteFocusTopology {
  return (
    value === 'direct-editor' ||
    value === 'shadow-host-retargeted' ||
    value === 'no-valid-composed-focus'
  );
}

function isCleanupInputProvenance(
  value: unknown,
): value is AutomaticPasteEditorDiagnostic['cleanupInputProvenance'] {
  return (
    value === 'extension-owned' ||
    value === 'nested-destination-input' ||
    value === 'external-input' ||
    value === 'none' ||
    value === 'unknown'
  );
}

function isFirstInvalidatingInputPhase(
  value: unknown,
): value is AutomaticPasteEditorDiagnostic['firstInvalidatingInputPhase'] {
  return (
    value === null ||
    value === 'during-authorized-cleanup-dispatch' ||
    value === 'outside-authorized-cleanup-dispatch'
  );
}

function isExternalInputType(
  value: unknown,
): value is AutomaticPasteEditorDiagnostic['externalInputType'] {
  return (
    value === null ||
    value === 'insertText' ||
    value === 'insertLineBreak' ||
    value === 'insertParagraph' ||
    value === 'insertFromPaste' ||
    value === 'insertFromDrop' ||
    value === 'insertCompositionText' ||
    value === 'deleteContentBackward' ||
    value === 'deleteContentForward' ||
    value === 'deleteByCut' ||
    value === 'historyUndo' ||
    value === 'historyRedo' ||
    value === 'other'
  );
}

function isExternalInputRelativePhase(
  value: unknown,
): value is AutomaticPasteEditorDiagnostic['externalInputRelativePhase'] {
  return (
    value === null ||
    value === 'activation' ||
    value === 'pre-cleanup' ||
    value === 'cleanup-before-owned-input' ||
    value === 'during-owned-cleanup-input' ||
    value === 'cleanup-after-owned-input' ||
    value === 'post-cleanup' ||
    value === 'unknown'
  );
}

function isExternalInputSequenceRelation(
  value: unknown,
): value is AutomaticPasteEditorDiagnostic['externalInputSequenceRelation'] {
  return (
    value === null ||
    value === 'before-owned-cleanup-input' ||
    value === 'during-owned-cleanup-input' ||
    value === 'immediately-after-owned-cleanup-input' ||
    value === 'later' ||
    value === 'unknown'
  );
}

function isNullableBoolean(value: unknown): value is boolean | null {
  return value === null || typeof value === 'boolean';
}

const NATIVE_PASTE_DIAGNOSTIC_KEYS = [
  'sendInputRequestedCount',
  'sendInputInsertedCount',
  'sendInputStructSize',
  'sendInputLastError',
  'foregroundValidationPassed',
  'rootWindowValidationPassed',
  'pidValidationPassed',
  'clipboardSequenceValidationPassed',
  'modifierValidationPassed',
  'hostSessionMatchesTarget',
  'hostIntegrityRelation',
] as const;

function isNativePasteDiagnostic(
  value: unknown,
): value is NativePasteAttemptDiagnostic {
  return (
    isRecord(value) &&
    hasExactKeys(value, NATIVE_PASTE_DIAGNOSTIC_KEYS) &&
    Number.isInteger(value.sendInputRequestedCount) &&
    (value.sendInputRequestedCount as number) >= 0 &&
    (value.sendInputRequestedCount as number) <= 4 &&
    Number.isInteger(value.sendInputInsertedCount) &&
    (value.sendInputInsertedCount as number) >= 0 &&
    (value.sendInputInsertedCount as number) <= 4 &&
    Number.isInteger(value.sendInputStructSize) &&
    (value.sendInputStructSize as number) > 0 &&
    (value.sendInputStructSize as number) <= 1024 &&
    Number.isInteger(value.sendInputLastError) &&
    (value.sendInputLastError as number) >= 0 &&
    (value.sendInputLastError as number) <= 0xffff_ffff &&
    typeof value.foregroundValidationPassed === 'boolean' &&
    typeof value.rootWindowValidationPassed === 'boolean' &&
    typeof value.pidValidationPassed === 'boolean' &&
    typeof value.clipboardSequenceValidationPassed === 'boolean' &&
    typeof value.modifierValidationPassed === 'boolean' &&
    isNullableBoolean(value.hostSessionMatchesTarget) &&
    (value.hostIntegrityRelation === 'same' ||
      value.hostIntegrityRelation === 'host-lower' ||
      value.hostIntegrityRelation === 'host-higher' ||
      value.hostIntegrityRelation === 'unknown')
  );
}

function isNoticePhase(
  value: unknown,
): value is AutomaticPasteTrace['noticePhase'] {
  return (
    value === 'not-observed' ||
    value === 'absent-before-post-cleanup-check' ||
    value === 'present-before-post-cleanup-check' ||
    value === 'fallback-mounted-after-post-cleanup-failure' ||
    value === 'fallback-suppressed-after-post-cleanup-failure'
  );
}

function isQuery(message: unknown, type: string): boolean {
  return (
    isRecord(message) &&
    hasExactKeys(message, ['type']) &&
    message.type === type
  );
}

interface ActivationTraceMessage {
  readonly type: typeof AUTOMATIC_PASTE_ACTIVATION_TRACE;
  readonly requestId: string;
  readonly kind: 'text' | 'image';
  readonly activationPasteMode: SnippetPasteMode;
}

interface PostCleanupTraceMessage extends AutomaticPastePostCleanupTrace {
  readonly type: typeof AUTOMATIC_PASTE_POST_CLEANUP_TRACE;
}

function isPostCleanupTraceMessage(
  message: unknown,
): message is PostCleanupTraceMessage {
  if (
    !isRecord(message) ||
    !hasExactKeys(message, [
      'type',
      'requestId',
      'phase',
      'editor',
      'noticeExistedBeforePostCleanupCheck',
      'noticeExistsAfterPostCleanupFailure',
      'fallbackNoticeMountedAfterAutomaticResult',
      'fallbackNoticeSuppressed',
      'noticeCallsFocus',
      'noticeHasAutofocus',
      'activeElementChangedByNoticeMount',
      'selectionchangeDuringNoticeMount',
    ]) ||
    message.type !== AUTOMATIC_PASTE_POST_CLEANUP_TRACE ||
    typeof message.requestId !== 'string' ||
    message.requestId.length === 0 ||
    (message.phase !== 'before-post-cleanup-check' &&
      message.phase !== 'after-automatic-result-notice') ||
    typeof message.noticeExistedBeforePostCleanupCheck !== 'boolean' ||
    !isNullableBoolean(message.noticeExistsAfterPostCleanupFailure) ||
    !isNullableBoolean(message.fallbackNoticeMountedAfterAutomaticResult) ||
    !isNullableBoolean(message.fallbackNoticeSuppressed) ||
    message.noticeCallsFocus !== false ||
    !isNullableBoolean(message.noticeHasAutofocus) ||
    !isNullableBoolean(message.activeElementChangedByNoticeMount) ||
    !isNullableBoolean(message.selectionchangeDuringNoticeMount) ||
    !isRecord(message.editor) ||
    !hasExactKeys(message.editor, [
      'postCleanupFailure',
      'postCleanupChecks',
      'firstInvalidationCause',
      'focusTopology',
      'noticeMutationWithinAuthorizationObserverScope',
      'noticeMountedInsideEditor',
      'cleanupInputProvenance',
      'firstInvalidatingInputPhase',
      'activationBeforeInputPrevented',
      'activationInputObserved',
      'externalInputTrusted',
      'externalInputType',
      'externalInputSameEditor',
      'externalInputSameRoot',
      'externalInputComposed',
      'externalInputSameActivationTask',
      'externalInputRelativePhase',
      'externalInputSequenceRelation',
    ])
  ) {
    return false;
  }
  return (
    isPostCleanupFailure(message.editor.postCleanupFailure) &&
    isPostCleanupChecks(message.editor.postCleanupChecks) &&
    isInvalidationCause(message.editor.firstInvalidationCause) &&
    isFocusTopology(message.editor.focusTopology) &&
    typeof message.editor.noticeMutationWithinAuthorizationObserverScope ===
      'boolean' &&
    message.editor.noticeMountedInsideEditor === false &&
    isCleanupInputProvenance(message.editor.cleanupInputProvenance) &&
    isFirstInvalidatingInputPhase(message.editor.firstInvalidatingInputPhase) &&
    typeof message.editor.activationBeforeInputPrevented === 'boolean' &&
    typeof message.editor.activationInputObserved === 'boolean' &&
    isNullableBoolean(message.editor.externalInputTrusted) &&
    isExternalInputType(message.editor.externalInputType) &&
    isNullableBoolean(message.editor.externalInputSameEditor) &&
    isNullableBoolean(message.editor.externalInputSameRoot) &&
    isNullableBoolean(message.editor.externalInputComposed) &&
    isNullableBoolean(message.editor.externalInputSameActivationTask) &&
    isExternalInputRelativePhase(message.editor.externalInputRelativePhase) &&
    isExternalInputSequenceRelation(
      message.editor.externalInputSequenceRelation,
    )
  );
}

function isActivationTraceMessage(
  message: unknown,
): message is ActivationTraceMessage {
  return (
    isRecord(message) &&
    hasExactKeys(message, [
      'type',
      'requestId',
      'kind',
      'activationPasteMode',
    ]) &&
    message.type === AUTOMATIC_PASTE_ACTIVATION_TRACE &&
    typeof message.requestId === 'string' &&
    message.requestId.length > 0 &&
    (message.kind === 'text' || message.kind === 'image') &&
    isPasteMode(message.activationPasteMode)
  );
}

function isDiagnostic(value: unknown): value is AutomaticPasteResultDiagnostic {
  if (!isRecord(value)) return false;
  return (
    hasExactKeys(value, ['kind', 'phase', 'requestId', 'result']) &&
    (value.kind === 'text' || value.kind === 'image') &&
    isResultPhase(value.phase) &&
    typeof value.requestId === 'string' &&
    value.requestId.length > 0 &&
    isResult(value.result)
  );
}

function isStoredTrace(value: unknown): value is StoredAutomaticPasteTrace {
  if (!isRecord(value)) return false;
  return (
    hasExactKeys(value, [
      'persistedPasteMode',
      'workerPasteMode',
      'activationPasteMode',
      'selectedBranch',
      'firstAutomaticPhase',
      'lastPhase',
      'result',
      'resultPhase',
      'requestId',
      'kind',
      'originWorkerInstanceId',
      'postCleanupFailure',
      'postCleanupChecks',
      'firstInvalidationCause',
      'focusTopology',
      'noticePhase',
      'noticeExistedBeforePostCleanupCheck',
      'noticeExistsAfterPostCleanupFailure',
      'fallbackNoticeMountedAfterAutomaticResult',
      'fallbackNoticeSuppressed',
      'noticeCallsFocus',
      'noticeHasAutofocus',
      'activeElementChangedByNoticeMount',
      'selectionchangeDuringNoticeMount',
      'noticeMutationWithinAuthorizationObserverScope',
      'noticeMountedInsideEditor',
      'cleanupInputProvenance',
      'firstInvalidatingInputPhase',
      'activationBeforeInputPrevented',
      'activationInputObserved',
      'externalInputTrusted',
      'externalInputType',
      'externalInputSameEditor',
      'externalInputSameRoot',
      'externalInputComposed',
      'externalInputSameActivationTask',
      'externalInputRelativePhase',
      'externalInputSequenceRelation',
      'nativePasteDiagnostic',
    ]) &&
    (value.persistedPasteMode === null ||
      isPasteMode(value.persistedPasteMode)) &&
    (value.workerPasteMode === null || isPasteMode(value.workerPasteMode)) &&
    (value.activationPasteMode === null ||
      isPasteMode(value.activationPasteMode)) &&
    (value.selectedBranch === null || isPasteMode(value.selectedBranch)) &&
    (value.firstAutomaticPhase === null ||
      isTracePhase(value.firstAutomaticPhase)) &&
    isTracePhase(value.lastPhase) &&
    (value.result === null || isResult(value.result)) &&
    (value.resultPhase === null || isResultPhase(value.resultPhase)) &&
    typeof value.requestId === 'string' &&
    value.requestId.length > 0 &&
    (value.kind === null || value.kind === 'text' || value.kind === 'image') &&
    typeof value.originWorkerInstanceId === 'string' &&
    value.originWorkerInstanceId.length > 0 &&
    isPostCleanupFailure(value.postCleanupFailure) &&
    (value.postCleanupChecks === null ||
      isPostCleanupChecks(value.postCleanupChecks)) &&
    isInvalidationCause(value.firstInvalidationCause) &&
    (value.focusTopology === null || isFocusTopology(value.focusTopology)) &&
    isNoticePhase(value.noticePhase) &&
    isNullableBoolean(value.noticeExistedBeforePostCleanupCheck) &&
    isNullableBoolean(value.noticeExistsAfterPostCleanupFailure) &&
    isNullableBoolean(value.fallbackNoticeMountedAfterAutomaticResult) &&
    isNullableBoolean(value.fallbackNoticeSuppressed) &&
    isNullableBoolean(value.noticeCallsFocus) &&
    isNullableBoolean(value.noticeHasAutofocus) &&
    isNullableBoolean(value.activeElementChangedByNoticeMount) &&
    isNullableBoolean(value.selectionchangeDuringNoticeMount) &&
    isNullableBoolean(value.noticeMutationWithinAuthorizationObserverScope) &&
    isNullableBoolean(value.noticeMountedInsideEditor) &&
    (value.cleanupInputProvenance === null ||
      isCleanupInputProvenance(value.cleanupInputProvenance)) &&
    isFirstInvalidatingInputPhase(value.firstInvalidatingInputPhase) &&
    isNullableBoolean(value.activationBeforeInputPrevented) &&
    isNullableBoolean(value.activationInputObserved) &&
    isNullableBoolean(value.externalInputTrusted) &&
    isExternalInputType(value.externalInputType) &&
    isNullableBoolean(value.externalInputSameEditor) &&
    isNullableBoolean(value.externalInputSameRoot) &&
    isNullableBoolean(value.externalInputComposed) &&
    isNullableBoolean(value.externalInputSameActivationTask) &&
    isExternalInputRelativePhase(value.externalInputRelativePhase) &&
    isExternalInputSequenceRelation(value.externalInputSequenceRelation) &&
    (value.nativePasteDiagnostic === null ||
      isNativePasteDiagnostic(value.nativePasteDiagnostic))
  );
}

function isTrace(value: unknown): value is AutomaticPasteTrace {
  if (!isRecord(value)) return false;
  return (
    hasExactKeys(value, [
      'persistedPasteMode',
      'workerPasteMode',
      'activationPasteMode',
      'selectedBranch',
      'firstAutomaticPhase',
      'lastPhase',
      'result',
      'requestId',
      'serviceWorkerLifecycle',
      'postCleanupFailure',
      'postCleanupChecks',
      'firstInvalidationCause',
      'focusTopology',
      'noticePhase',
      'noticeExistedBeforePostCleanupCheck',
      'noticeExistsAfterPostCleanupFailure',
      'fallbackNoticeMountedAfterAutomaticResult',
      'fallbackNoticeSuppressed',
      'noticeCallsFocus',
      'noticeHasAutofocus',
      'activeElementChangedByNoticeMount',
      'selectionchangeDuringNoticeMount',
      'noticeMutationWithinAuthorizationObserverScope',
      'noticeMountedInsideEditor',
      'cleanupInputProvenance',
      'firstInvalidatingInputPhase',
      'activationBeforeInputPrevented',
      'activationInputObserved',
      'externalInputTrusted',
      'externalInputType',
      'externalInputSameEditor',
      'externalInputSameRoot',
      'externalInputComposed',
      'externalInputSameActivationTask',
      'externalInputRelativePhase',
      'externalInputSequenceRelation',
      'nativePasteDiagnostic',
    ]) &&
    (value.persistedPasteMode === null ||
      isPasteMode(value.persistedPasteMode)) &&
    (value.workerPasteMode === null || isPasteMode(value.workerPasteMode)) &&
    (value.activationPasteMode === null ||
      isPasteMode(value.activationPasteMode)) &&
    (value.selectedBranch === null || isPasteMode(value.selectedBranch)) &&
    (value.firstAutomaticPhase === null ||
      isTracePhase(value.firstAutomaticPhase)) &&
    isTracePhase(value.lastPhase) &&
    (value.result === null || isResult(value.result)) &&
    typeof value.requestId === 'string' &&
    value.requestId.length > 0 &&
    (value.serviceWorkerLifecycle === 'same-worker' ||
      value.serviceWorkerLifecycle === 'worker-recreated-after-activation') &&
    isPostCleanupFailure(value.postCleanupFailure) &&
    (value.postCleanupChecks === null ||
      isPostCleanupChecks(value.postCleanupChecks)) &&
    isInvalidationCause(value.firstInvalidationCause) &&
    (value.focusTopology === null || isFocusTopology(value.focusTopology)) &&
    isNoticePhase(value.noticePhase) &&
    isNullableBoolean(value.noticeExistedBeforePostCleanupCheck) &&
    isNullableBoolean(value.noticeExistsAfterPostCleanupFailure) &&
    isNullableBoolean(value.fallbackNoticeMountedAfterAutomaticResult) &&
    isNullableBoolean(value.fallbackNoticeSuppressed) &&
    isNullableBoolean(value.noticeCallsFocus) &&
    isNullableBoolean(value.noticeHasAutofocus) &&
    isNullableBoolean(value.activeElementChangedByNoticeMount) &&
    isNullableBoolean(value.selectionchangeDuringNoticeMount) &&
    isNullableBoolean(value.noticeMutationWithinAuthorizationObserverScope) &&
    isNullableBoolean(value.noticeMountedInsideEditor) &&
    (value.cleanupInputProvenance === null ||
      isCleanupInputProvenance(value.cleanupInputProvenance)) &&
    isFirstInvalidatingInputPhase(value.firstInvalidatingInputPhase) &&
    isNullableBoolean(value.activationBeforeInputPrevented) &&
    isNullableBoolean(value.activationInputObserved) &&
    isNullableBoolean(value.externalInputTrusted) &&
    isExternalInputType(value.externalInputType) &&
    isNullableBoolean(value.externalInputSameEditor) &&
    isNullableBoolean(value.externalInputSameRoot) &&
    isNullableBoolean(value.externalInputComposed) &&
    isNullableBoolean(value.externalInputSameActivationTask) &&
    isExternalInputRelativePhase(value.externalInputRelativePhase) &&
    isExternalInputSequenceRelation(value.externalInputSequenceRelation) &&
    (value.nativePasteDiagnostic === null ||
      isNativePasteDiagnostic(value.nativePasteDiagnostic))
  );
}

function resultTracePhase(
  phase: AutomaticPasteResultPhase,
): AutomaticPasteTracePhase {
  if (phase === 'browser-precheck') return 'automatic-precheck-started';
  if (phase === 'native-context-capture') {
    return 'native-context-capture-started';
  }
  if (phase === 'editor-finalize') return 'post-cleanup-check';
  if (phase === 'browser-finalize') return 'final-browser-check';
  if (phase === 'finalize-timeout') return 'finalize-timeout';
  if (phase === 'preflight') return 'automatic-precheck-started';
  return 'native-paste-result';
}

function createStoredTrace(
  event: AutomaticPasteTraceDiagnostic,
  workerInstanceId: string,
): StoredAutomaticPasteTrace {
  return {
    persistedPasteMode: event.persistedPasteMode ?? null,
    workerPasteMode: event.workerPasteMode ?? null,
    activationPasteMode: null,
    selectedBranch: event.selectedBranch ?? null,
    firstAutomaticPhase: AUTOMATIC_PHASES.has(event.phase) ? event.phase : null,
    lastPhase: event.phase,
    result: event.result ?? null,
    resultPhase: event.resultPhase ?? null,
    requestId: event.requestId,
    kind: event.kind ?? null,
    originWorkerInstanceId: workerInstanceId,
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
    nativePasteDiagnostic: event.nativePasteDiagnostic ?? null,
  };
}

export function registerAutomaticPasteResultDiagnostic(
  runtime: DiagnosticRuntime,
  storage: DiagnosticSessionStorage,
  createWorkerInstanceId: () => string = () => crypto.randomUUID(),
): AutomaticPasteDiagnosticRegistration {
  const workerInstanceId = createWorkerInstanceId();
  let latestInMemory: StoredAutomaticPasteTrace | null = null;
  let queue = Promise.resolve();

  const readStored = async (): Promise<StoredAutomaticPasteTrace | null> => {
    try {
      const stored = (await storage.get(AUTOMATIC_PASTE_TRACE_STORAGE_KEY))[
        AUTOMATIC_PASTE_TRACE_STORAGE_KEY
      ];
      if (isStoredTrace(stored)) latestInMemory = stored;
    } catch {
      // The native-development diagnostic must not affect delivery.
    }
    return latestInMemory;
  };

  const writeStored = async (trace: StoredAutomaticPasteTrace) => {
    latestInMemory = Object.freeze({ ...trace });
    try {
      await storage.set({
        [AUTOMATIC_PASTE_TRACE_STORAGE_KEY]: latestInMemory,
      });
    } catch {
      // The native-development diagnostic must not affect delivery.
    }
  };

  const mergeTrace = async (event: AutomaticPasteTraceDiagnostic) => {
    const previous = await readStored();
    const base =
      previous?.requestId === event.requestId
        ? previous
        : createStoredTrace(event, workerInstanceId);
    const currentPhaseIndex = TRACE_PHASES.indexOf(base.lastPhase);
    const eventPhaseIndex = TRACE_PHASES.indexOf(event.phase);
    await writeStored({
      ...base,
      persistedPasteMode:
        event.persistedPasteMode === undefined
          ? base.persistedPasteMode
          : event.persistedPasteMode,
      workerPasteMode: event.workerPasteMode ?? base.workerPasteMode,
      selectedBranch: event.selectedBranch ?? base.selectedBranch,
      firstAutomaticPhase:
        base.firstAutomaticPhase ??
        (AUTOMATIC_PHASES.has(event.phase) ? event.phase : null),
      lastPhase:
        eventPhaseIndex >= currentPhaseIndex ? event.phase : base.lastPhase,
      result: event.result ?? base.result,
      resultPhase: event.resultPhase ?? base.resultPhase,
      kind: event.kind ?? base.kind,
      nativePasteDiagnostic:
        event.nativePasteDiagnostic ?? base.nativePasteDiagnostic,
    });
  };

  const mergeActivation = async (message: ActivationTraceMessage) => {
    const previous = await readStored();
    const base =
      previous?.requestId === message.requestId
        ? previous
        : createStoredTrace(
            {
              requestId: message.requestId,
              kind: message.kind,
              phase: 'activation-received',
            },
            workerInstanceId,
          );
    await writeStored({
      ...base,
      activationPasteMode: message.activationPasteMode,
      kind: message.kind,
    });
  };

  const mergePostCleanup = async (message: PostCleanupTraceMessage) => {
    const previous = await readStored();
    if (previous?.requestId !== message.requestId) return;
    const afterFailure = message.phase === 'after-automatic-result-notice';
    await writeStored({
      ...previous,
      postCleanupFailure: message.editor.postCleanupFailure,
      postCleanupChecks: message.editor.postCleanupChecks,
      firstInvalidationCause: message.editor.firstInvalidationCause,
      focusTopology: message.editor.focusTopology,
      noticePhase: afterFailure
        ? message.fallbackNoticeSuppressed
          ? 'fallback-suppressed-after-post-cleanup-failure'
          : 'fallback-mounted-after-post-cleanup-failure'
        : message.noticeExistedBeforePostCleanupCheck
          ? 'present-before-post-cleanup-check'
          : 'absent-before-post-cleanup-check',
      noticeExistedBeforePostCleanupCheck:
        message.noticeExistedBeforePostCleanupCheck,
      noticeExistsAfterPostCleanupFailure:
        message.noticeExistsAfterPostCleanupFailure ??
        previous.noticeExistsAfterPostCleanupFailure,
      fallbackNoticeMountedAfterAutomaticResult:
        message.fallbackNoticeMountedAfterAutomaticResult ??
        previous.fallbackNoticeMountedAfterAutomaticResult,
      fallbackNoticeSuppressed:
        message.fallbackNoticeSuppressed ?? previous.fallbackNoticeSuppressed,
      noticeCallsFocus: message.noticeCallsFocus,
      noticeHasAutofocus:
        message.noticeHasAutofocus ?? previous.noticeHasAutofocus,
      activeElementChangedByNoticeMount:
        message.activeElementChangedByNoticeMount ??
        previous.activeElementChangedByNoticeMount,
      selectionchangeDuringNoticeMount:
        message.selectionchangeDuringNoticeMount ??
        previous.selectionchangeDuringNoticeMount,
      noticeMutationWithinAuthorizationObserverScope:
        message.editor.noticeMutationWithinAuthorizationObserverScope,
      noticeMountedInsideEditor: message.editor.noticeMountedInsideEditor,
      cleanupInputProvenance: message.editor.cleanupInputProvenance,
      firstInvalidatingInputPhase: message.editor.firstInvalidatingInputPhase,
      activationBeforeInputPrevented:
        message.editor.activationBeforeInputPrevented,
      activationInputObserved: message.editor.activationInputObserved,
      externalInputTrusted: message.editor.externalInputTrusted,
      externalInputType: message.editor.externalInputType,
      externalInputSameEditor: message.editor.externalInputSameEditor,
      externalInputSameRoot: message.editor.externalInputSameRoot,
      externalInputComposed: message.editor.externalInputComposed,
      externalInputSameActivationTask:
        message.editor.externalInputSameActivationTask,
      externalInputRelativePhase: message.editor.externalInputRelativePhase,
      externalInputSequenceRelation:
        message.editor.externalInputSequenceRelation,
    });
  };

  const enqueue = (operation: () => Promise<void>): Promise<void> => {
    queue = queue.then(operation, operation);
    return queue;
  };

  const readTrace = async (): Promise<AutomaticPasteTrace | null> => {
    await queue;
    const stored = await readStored();
    if (stored === null) return null;
    return {
      persistedPasteMode: stored.persistedPasteMode,
      workerPasteMode: stored.workerPasteMode,
      activationPasteMode: stored.activationPasteMode,
      selectedBranch: stored.selectedBranch,
      firstAutomaticPhase: stored.firstAutomaticPhase,
      lastPhase: stored.lastPhase,
      result: stored.result,
      requestId: stored.requestId,
      serviceWorkerLifecycle:
        stored.originWorkerInstanceId === workerInstanceId
          ? 'same-worker'
          : 'worker-recreated-after-activation',
      postCleanupFailure: stored.postCleanupFailure,
      postCleanupChecks: stored.postCleanupChecks,
      firstInvalidationCause: stored.firstInvalidationCause,
      focusTopology: stored.focusTopology,
      noticePhase: stored.noticePhase,
      noticeExistedBeforePostCleanupCheck:
        stored.noticeExistedBeforePostCleanupCheck,
      noticeExistsAfterPostCleanupFailure:
        stored.noticeExistsAfterPostCleanupFailure,
      fallbackNoticeMountedAfterAutomaticResult:
        stored.fallbackNoticeMountedAfterAutomaticResult,
      fallbackNoticeSuppressed: stored.fallbackNoticeSuppressed,
      noticeCallsFocus: stored.noticeCallsFocus,
      noticeHasAutofocus: stored.noticeHasAutofocus,
      activeElementChangedByNoticeMount:
        stored.activeElementChangedByNoticeMount,
      selectionchangeDuringNoticeMount: stored.selectionchangeDuringNoticeMount,
      noticeMutationWithinAuthorizationObserverScope:
        stored.noticeMutationWithinAuthorizationObserverScope,
      noticeMountedInsideEditor: stored.noticeMountedInsideEditor,
      cleanupInputProvenance: stored.cleanupInputProvenance,
      firstInvalidatingInputPhase: stored.firstInvalidatingInputPhase,
      activationBeforeInputPrevented: stored.activationBeforeInputPrevented,
      activationInputObserved: stored.activationInputObserved,
      externalInputTrusted: stored.externalInputTrusted,
      externalInputType: stored.externalInputType,
      externalInputSameEditor: stored.externalInputSameEditor,
      externalInputSameRoot: stored.externalInputSameRoot,
      externalInputComposed: stored.externalInputComposed,
      externalInputSameActivationTask: stored.externalInputSameActivationTask,
      externalInputRelativePhase: stored.externalInputRelativePhase,
      externalInputSequenceRelation: stored.externalInputSequenceRelation,
      nativePasteDiagnostic: stored.nativePasteDiagnostic,
    };
  };

  const readResult =
    async (): Promise<AutomaticPasteResultDiagnostic | null> => {
      await queue;
      const stored = await readStored();
      return stored !== null &&
        stored.kind !== null &&
        stored.result !== null &&
        stored.resultPhase !== null
        ? {
            kind: stored.kind,
            phase: stored.resultPhase,
            requestId: stored.requestId,
            result: stored.result,
          }
        : null;
    };

  runtime.onMessage.addListener((message) => {
    if (isQuery(message, AUTOMATIC_PASTE_TRACE_QUERY)) return readTrace();
    if (isQuery(message, AUTOMATIC_PASTE_DIAGNOSTIC_QUERY)) {
      return readResult();
    }
    if (isActivationTraceMessage(message)) {
      return enqueue(() => mergeActivation(message));
    }
    if (isPostCleanupTraceMessage(message)) {
      return enqueue(() => mergePostCleanup(message));
    }
    return undefined;
  });

  return {
    reportResult(diagnostic) {
      void enqueue(() =>
        mergeTrace({
          kind: diagnostic.kind,
          requestId: diagnostic.requestId,
          phase: resultTracePhase(diagnostic.phase),
          result: diagnostic.result,
          resultPhase: diagnostic.phase,
        }),
      );
    },
    reportTrace(diagnostic) {
      void enqueue(() => mergeTrace(diagnostic));
    },
  };
}

export function reportAutomaticPasteActivationTrace(
  runtime: DiagnosticQueryRuntime,
  requestId: string,
  kind: 'text' | 'image',
  activationPasteMode: SnippetPasteMode,
): Promise<unknown> {
  return runtime.sendMessage({
    type: AUTOMATIC_PASTE_ACTIVATION_TRACE,
    requestId,
    kind,
    activationPasteMode,
  } satisfies ActivationTraceMessage);
}

export function reportAutomaticPastePostCleanupTrace(
  runtime: DiagnosticQueryRuntime,
  diagnostic: AutomaticPastePostCleanupTrace,
): Promise<unknown> {
  return runtime.sendMessage({
    type: AUTOMATIC_PASTE_POST_CLEANUP_TRACE,
    ...diagnostic,
  } satisfies PostCleanupTraceMessage);
}

export async function requestAutomaticPasteResultDiagnostic(
  runtime: DiagnosticQueryRuntime,
): Promise<AutomaticPasteResultDiagnostic | null> {
  const response = await runtime.sendMessage({
    type: AUTOMATIC_PASTE_DIAGNOSTIC_QUERY,
  });
  if (response === null || response === undefined) return null;
  if (!isDiagnostic(response)) {
    throw new Error('Automatic paste diagnostic response was invalid.');
  }
  return response;
}

export async function requestAutomaticPasteTrace(
  runtime: DiagnosticQueryRuntime,
): Promise<AutomaticPasteTrace | null> {
  const response = await runtime.sendMessage({
    type: AUTOMATIC_PASTE_TRACE_QUERY,
  });
  if (response === null || response === undefined) return null;
  if (!isTrace(response)) {
    throw new Error('Automatic paste trace response was invalid.');
  }
  return response;
}
