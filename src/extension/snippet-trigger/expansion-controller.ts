import { SNIPPET_TRIGGER_MAX_LENGTH } from '../../application/snippet/snippet-trigger';
import type {
  AutomaticPasteFinalizeMessage,
  AutomaticPasteFinalizeResponse,
  SnippetUsageReceiptAcknowledgementMessage,
  TriggerActivationRequestMessage,
  TriggerActivationResponseMessage,
} from '../../shared/snippet-delivery-messages';
import {
  isAutomaticPasteFinalizeResponse,
  isSnippetDeliveryFailureCode,
} from '../../shared/snippet-delivery-messages';
import type { FrameTriggerCatalogCache } from './frame-catalog-cache';
import type { SnippetPasteMode } from '../../domain/settings';
import {
  createEditorAdapter,
  type AutomaticPasteEditorDiagnostic,
  type EditorActivationEventLike,
  type TriggerActivationSnapshot,
} from './editor-adapters';

export const SNIPPET_DELIVERY_NOTICE_ID = 'ai-support-workspace-snippet-notice';

export interface BeforeInputEventLike extends EditorActivationEventLike {
  readonly inputType: string;
  readonly data: string | null;
  readonly isTrusted: boolean;
  readonly cancelable: boolean;
  readonly isComposing: boolean;
  readonly defaultPrevented?: boolean;
  preventDefault(): void;
}

export interface SnippetDeliveryRequester {
  requestDelivery(
    message:
      | TriggerActivationRequestMessage
      | AutomaticPasteFinalizeMessage
      | SnippetUsageReceiptAcknowledgementMessage,
  ): Promise<unknown>;
}

export interface SnippetDeliveryFeedback {
  show(message: string, kind: 'success' | 'error'): void;
}

export type BeforeInputHandlingResult =
  | { readonly status: 'ignored' }
  | {
      readonly status: 'accepted';
      startDelivery(): void;
    };

export type AutomaticPasteActivationTraceSink = (diagnostic: {
  readonly requestId: string;
  readonly kind: 'text' | 'image';
  readonly activationPasteMode: SnippetPasteMode;
}) => void;

export interface AutomaticPastePostCleanupTrace {
  readonly requestId: string;
  readonly phase: 'before-post-cleanup-check' | 'after-automatic-result-notice';
  readonly editor: AutomaticPasteEditorDiagnostic;
  readonly noticeExistedBeforePostCleanupCheck: boolean;
  readonly noticeExistsAfterPostCleanupFailure: boolean | null;
  readonly fallbackNoticeMountedAfterAutomaticResult: boolean | null;
  readonly fallbackNoticeSuppressed: boolean | null;
  readonly noticeCallsFocus: false;
  readonly noticeHasAutofocus: boolean | null;
  readonly activeElementChangedByNoticeMount: boolean | null;
  readonly selectionchangeDuringNoticeMount: boolean | null;
}

export type AutomaticPastePostCleanupTraceSink = (
  diagnostic: AutomaticPastePostCleanupTrace,
) => void;

export function toBeforeInputEventLike(
  event: unknown,
): BeforeInputEventLike | undefined {
  if (
    (typeof event !== 'object' && typeof event !== 'function') ||
    event === null
  )
    return undefined;

  try {
    const candidate = event as Partial<BeforeInputEventLike>;
    if (
      (candidate.target !== null &&
        typeof candidate.target !== 'object' &&
        typeof candidate.target !== 'function') ||
      typeof candidate.inputType !== 'string' ||
      (candidate.data !== null && typeof candidate.data !== 'string') ||
      typeof candidate.isTrusted !== 'boolean' ||
      typeof candidate.cancelable !== 'boolean' ||
      typeof candidate.isComposing !== 'boolean' ||
      (candidate.defaultPrevented !== undefined &&
        typeof candidate.defaultPrevented !== 'boolean') ||
      typeof candidate.preventDefault !== 'function' ||
      (candidate.composedPath !== undefined &&
        typeof candidate.composedPath !== 'function') ||
      (candidate.getTargetRanges !== undefined &&
        typeof candidate.getTargetRanges !== 'function')
    ) {
      return undefined;
    }
    return candidate as BeforeInputEventLike;
  } catch {
    return undefined;
  }
}

function isActivationResponse(
  value: unknown,
  requestId: string,
): value is TriggerActivationResponseMessage {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<TriggerActivationResponseMessage>;
  if (
    candidate.type !== 'snippet-trigger-activation-result' ||
    candidate.requestId !== requestId
  ) {
    return false;
  }
  if (candidate.outcome === 'copied') {
    const usageReceiptId = (candidate as { readonly usageReceiptId?: unknown })
      .usageReceiptId;
    return (
      (candidate.kind === 'text' || candidate.kind === 'image') &&
      (usageReceiptId === undefined ||
        (typeof usageReceiptId === 'string' && usageReceiptId.length > 0))
    );
  }
  if (candidate.outcome === 'automatic-ready') {
    const usageReceiptId = (candidate as { readonly usageReceiptId?: unknown })
      .usageReceiptId;
    return (
      (candidate.kind === 'text' || candidate.kind === 'image') &&
      typeof candidate.authorizationId === 'string' &&
      /^[0-9a-f]{32}$/.test(candidate.authorizationId) &&
      (usageReceiptId === undefined ||
        (typeof usageReceiptId === 'string' && usageReceiptId.length > 0))
    );
  }
  return (
    (candidate.outcome === 'permission-required' ||
      candidate.outcome === 'failed') &&
    isSnippetDeliveryFailureCode(candidate.code) &&
    typeof candidate.message === 'string'
  );
}

export class SnippetExpansionController {
  constructor(
    private readonly document: Document,
    private readonly cache: FrameTriggerCatalogCache,
    private readonly requester: SnippetDeliveryRequester,
    private readonly feedback: SnippetDeliveryFeedback,
    private readonly createId: () => string = () => crypto.randomUUID(),
    private readonly reportAutomaticPasteActivation: AutomaticPasteActivationTraceSink = () =>
      undefined,
    private readonly reportAutomaticPastePostCleanup: AutomaticPastePostCleanupTraceSink = () =>
      undefined,
  ) {}

  handleBeforeInput(event: BeforeInputEventLike): BeforeInputHandlingResult {
    if (
      !event.isTrusted ||
      !event.cancelable ||
      event.inputType !== 'insertText' ||
      event.data !== ' ' ||
      event.isComposing ||
      !this.cache.isEnabled
    ) {
      return { status: 'ignored' };
    }

    const adapter = createEditorAdapter(event, this.document);
    const candidate = adapter?.readTriggerCandidate(SNIPPET_TRIGGER_MAX_LENGTH);
    if (adapter === undefined || candidate === undefined)
      return { status: 'ignored' };
    const catalogEntry = this.cache.find(candidate.text.toLowerCase());
    const identity = this.cache.identity;
    if (catalogEntry === undefined || identity === undefined)
      return { status: 'ignored' };
    if (
      adapter.kind === 'textInput' &&
      catalogEntry.singleLineEligible === false
    ) {
      return { status: 'ignored' };
    }
    const snapshot = adapter.captureActivation(candidate);
    if (snapshot === undefined) return { status: 'ignored' };
    if (this.cache.snippetPasteMode === 'automatic') {
      snapshot.beginAutomaticPasteAuthorization();
    }

    const requestId = this.createId();
    let deliveryStarted = false;
    return {
      status: 'accepted',
      startDelivery: () => {
        if (deliveryStarted) return;
        deliveryStarted = true;
        if (
          (import.meta.env.MODE === 'native-dev' ||
            import.meta.env.MODE === 'test') &&
          snapshot.recordAutomaticPasteActivationBeforeInputOutcome !==
            undefined
        ) {
          snapshot.recordAutomaticPasteActivationBeforeInputOutcome(
            event.defaultPrevented === true,
          );
        }
        try {
          this.reportAutomaticPasteActivation({
            requestId,
            kind: catalogEntry.kind,
            activationPasteMode: this.cache.snippetPasteMode,
          });
        } catch {
          // Native-development diagnostics must never change activation behavior.
        }
        void this.deliver(
          {
            type: 'snippet-trigger-activation',
            requestId,
            snippetId: catalogEntry.snippetId,
            trigger: catalogEntry.trigger,
            kind: catalogEntry.kind,
            epoch: identity.epoch,
            revision: identity.revision,
          },
          snapshot,
        );
      },
    };
  }

  private async deliver(
    request: TriggerActivationRequestMessage,
    snapshot: TriggerActivationSnapshot,
  ): Promise<void> {
    let response: unknown;
    try {
      response = await this.requester.requestDelivery(request);
    } catch {
      snapshot.invalidateAutomaticPasteAuthorization();
      this.feedback.show('Could not prepare this Snippet. Try again.', 'error');
      return;
    }
    if (!isActivationResponse(response, request.requestId)) {
      snapshot.invalidateAutomaticPasteAuthorization();
      this.feedback.show('Could not prepare this Snippet. Try again.', 'error');
      return;
    }
    if (response.outcome !== 'copied') {
      if (response.outcome === 'automatic-ready') {
        await this.finishAutomaticPaste(request, response, snapshot);
        return;
      }
      snapshot.invalidateAutomaticPasteAuthorization();
      this.feedback.show(response.message, 'error');
      return;
    }
    snapshot.invalidateAutomaticPasteAuthorization();
    const currentIdentity = this.cache.identity;
    const cleaned =
      currentIdentity?.epoch === request.epoch &&
      currentIdentity.revision === request.revision &&
      snapshot.cleanupAfterClipboardSuccess();
    if (cleaned) {
      this.acknowledgeUsage(request, response.usageReceiptId);
    }
    const label = response.kind === 'image' ? 'Image' : 'Snippet';
    this.feedback.show(
      cleaned
        ? `${label} copied — press Ctrl+V`
        : `${label} copied — press Ctrl+V (trigger unchanged)`,
      'success',
    );
  }

  private async finishAutomaticPaste(
    request: TriggerActivationRequestMessage,
    response: Extract<
      TriggerActivationResponseMessage,
      { readonly outcome: 'automatic-ready' }
    >,
    snapshot: TriggerActivationSnapshot,
  ): Promise<void> {
    const diagnosticsEnabled =
      import.meta.env.MODE === 'native-dev' || import.meta.env.MODE === 'test';
    const noticeExistedBeforePostCleanupCheck = diagnosticsEnabled
      ? this.document.getElementById(SNIPPET_DELIVERY_NOTICE_ID) !== null
      : false;
    const safeBeforeCleanup = snapshot.isAutomaticPasteSafe();
    const currentIdentity = this.cache.identity;
    const cleaned =
      currentIdentity?.epoch === request.epoch &&
      currentIdentity.revision === request.revision &&
      snapshot.cleanupAfterClipboardSuccess();
    if (cleaned) {
      this.acknowledgeUsage(request, response.usageReceiptId);
    }
    const editorReady =
      safeBeforeCleanup &&
      cleaned &&
      snapshot.consumeAutomaticPasteAuthorization();
    if (!editorReady) snapshot.invalidateAutomaticPasteAuthorization();
    const editorDiagnostic = diagnosticsEnabled
      ? snapshot.readAutomaticPasteDiagnostic?.()
      : undefined;
    if (editorDiagnostic !== undefined) {
      this.recordPostCleanupTrace({
        requestId: request.requestId,
        phase: 'before-post-cleanup-check',
        editor: editorDiagnostic,
        noticeExistedBeforePostCleanupCheck,
        noticeExistsAfterPostCleanupFailure: null,
        fallbackNoticeMountedAfterAutomaticResult: null,
        fallbackNoticeSuppressed: null,
        noticeCallsFocus: false,
        noticeHasAutofocus: null,
        activeElementChangedByNoticeMount: null,
        selectionchangeDuringNoticeMount: null,
      });
    }

    let finalResponse: unknown;
    try {
      finalResponse = await this.requester.requestDelivery({
        type: 'snippet-automatic-paste-finalize',
        requestId: request.requestId,
        authorizationId: response.authorizationId,
        editorState: !cleaned
          ? 'cleanup-failed'
          : editorReady
            ? 'ready'
            : 'unsafe-focus',
      });
    } catch {
      finalResponse = undefined;
    }

    const result: AutomaticPasteFinalizeResponse['result'] =
      isAutomaticPasteFinalizeResponse(finalResponse) &&
      finalResponse.requestId === request.requestId &&
      finalResponse.kind === response.kind
        ? finalResponse.result
        : 'indeterminate';
    const label = response.kind === 'image' ? 'Image' : 'Snippet';
    const feedbackMessage =
      result === 'paste-issued'
        ? 'Paste sent'
        : cleaned
          ? `${label} copied \u2014 press Ctrl+V`
          : `${label} copied \u2014 press Ctrl+V (trigger unchanged)`;
    if (!diagnosticsEnabled) {
      this.feedback.show(feedbackMessage, 'success');
      return;
    }
    const activeElementBeforeNotice = this.document.activeElement;
    let selectionchangeDuringNoticeMount = false;
    const observeNoticeSelectionChange = () => {
      selectionchangeDuringNoticeMount = true;
    };
    this.document.addEventListener(
      'selectionchange',
      observeNoticeSelectionChange,
      true,
    );
    this.feedback.show(feedbackMessage, 'success');
    this.document.removeEventListener(
      'selectionchange',
      observeNoticeSelectionChange,
      true,
    );
    const notice = this.document.getElementById(SNIPPET_DELIVERY_NOTICE_ID);
    if (!editorReady && cleaned && editorDiagnostic !== undefined) {
      this.recordPostCleanupTrace({
        requestId: request.requestId,
        phase: 'after-automatic-result-notice',
        editor: editorDiagnostic,
        noticeExistedBeforePostCleanupCheck,
        noticeExistsAfterPostCleanupFailure: notice !== null,
        fallbackNoticeMountedAfterAutomaticResult: notice !== null,
        fallbackNoticeSuppressed: notice === null,
        noticeCallsFocus: false,
        noticeHasAutofocus: notice?.hasAttribute('autofocus') ?? null,
        activeElementChangedByNoticeMount:
          this.document.activeElement !== activeElementBeforeNotice,
        selectionchangeDuringNoticeMount,
      });
    }
  }

  private recordPostCleanupTrace(
    diagnostic: AutomaticPastePostCleanupTrace,
  ): void {
    try {
      this.reportAutomaticPastePostCleanup(diagnostic);
    } catch {
      // Native-development diagnostics must never change delivery behavior.
    }
  }

  private acknowledgeUsage(
    request: TriggerActivationRequestMessage,
    receiptId: string | undefined,
  ): void {
    if (receiptId === undefined) return;
    try {
      void this.requester
        .requestDelivery({
          type: 'snippet-usage-receipt-acknowledgement',
          receiptId,
          requestId: request.requestId,
          snippetId: request.snippetId,
          kind: request.kind,
          epoch: request.epoch,
          revision: request.revision,
        })
        .catch(() => undefined);
    } catch {
      // Usage acknowledgement is best effort and cannot change delivery.
    }
  }
}
