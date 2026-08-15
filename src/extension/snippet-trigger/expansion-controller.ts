import { SNIPPET_TRIGGER_MAX_LENGTH } from '../../application/snippet/snippet-trigger';
import type {
  TriggerActivationRequestMessage,
  TriggerActivationResponseMessage,
} from '../../shared/snippet-delivery-messages';
import { isSnippetDeliveryFailureCode } from '../../shared/snippet-delivery-messages';
import type { FrameTriggerCatalogCache } from './frame-catalog-cache';
import {
  createEditorAdapter,
  type EditorActivationEventLike,
  type TriggerActivationSnapshot,
} from './editor-adapters';

export interface BeforeInputEventLike extends EditorActivationEventLike {
  readonly inputType: string;
  readonly data: string | null;
  readonly isTrusted: boolean;
  readonly cancelable: boolean;
  readonly isComposing: boolean;
  preventDefault(): void;
}

export interface SnippetDeliveryRequester {
  requestDelivery(message: TriggerActivationRequestMessage): Promise<unknown>;
}

export interface SnippetDeliveryFeedback {
  show(message: string, kind: 'success' | 'error'): void;
}

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
    return candidate.kind === 'text' || candidate.kind === 'image';
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
  ) {}

  handleBeforeInput(event: BeforeInputEventLike): boolean {
    if (
      !event.isTrusted ||
      !event.cancelable ||
      event.inputType !== 'insertText' ||
      event.data !== ' ' ||
      event.isComposing ||
      !this.cache.isEnabled
    ) {
      return false;
    }

    const adapter = createEditorAdapter(event, this.document);
    const candidate = adapter?.readTriggerCandidate(SNIPPET_TRIGGER_MAX_LENGTH);
    if (adapter === undefined || candidate === undefined) return false;
    const catalogEntry = this.cache.find(candidate.text.toLowerCase());
    const identity = this.cache.identity;
    if (catalogEntry === undefined || identity === undefined) return false;
    const snapshot = adapter.captureActivation(candidate);
    if (snapshot === undefined) return false;

    const requestId = this.createId();
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
    return true;
  }

  private async deliver(
    request: TriggerActivationRequestMessage,
    snapshot: TriggerActivationSnapshot,
  ): Promise<void> {
    let response: unknown;
    try {
      response = await this.requester.requestDelivery(request);
    } catch {
      this.feedback.show('Could not prepare this Snippet. Try again.', 'error');
      return;
    }
    if (!isActivationResponse(response, request.requestId)) {
      this.feedback.show('Could not prepare this Snippet. Try again.', 'error');
      return;
    }
    if (response.outcome !== 'copied') {
      this.feedback.show(response.message, 'error');
      return;
    }
    const currentIdentity = this.cache.identity;
    const cleaned =
      currentIdentity?.epoch === request.epoch &&
      currentIdentity.revision === request.revision &&
      snapshot.cleanupAfterClipboardSuccess();
    const label = response.kind === 'image' ? 'Image' : 'Snippet';
    this.feedback.show(
      cleaned
        ? `${label} copied — press Ctrl+V`
        : `${label} copied — press Ctrl+V (trigger unchanged)`,
      'success',
    );
  }
}
