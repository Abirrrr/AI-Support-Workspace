import type { TriggerCatalogEntryKind } from './trigger-catalog-messages';

export const OFFSCREEN_CLIPBOARD_DOCUMENT_PATH = 'offscreen.html';

export type SnippetDeliveryFailureCode =
  | 'snippet-unavailable'
  | 'stale-trigger'
  | 'unsupported-content'
  | 'asset-unavailable'
  | 'asset-ownership-invalid'
  | 'asset-invalid'
  | 'permission-required'
  | 'offscreen-create-failed'
  | 'offscreen-message-failed'
  | 'invalid-offscreen-response'
  | 'clipboard-write-failed'
  | 'clipboard-copy-event-unavailable'
  | 'clipboard-copy-command-failed'
  | 'clipboard-copy-data-failed'
  | 'image-invalid'
  | 'image-decode-failed'
  | 'image-too-large'
  | 'animated-webp'
  | 'native-permission-required'
  | 'host-unavailable'
  | 'host-version-mismatch'
  | 'invalid-host-response'
  | 'native-delivery-busy'
  | 'automatic-delivery-busy'
  | 'stale-catalog'
  | 'unexpected-delivery-failure';

export type OffscreenClipboardFailureCode =
  | 'clipboard-copy-event-unavailable'
  | 'clipboard-copy-command-failed'
  | 'clipboard-copy-data-failed';

export interface TriggerActivationRequestMessage {
  readonly type: 'snippet-trigger-activation';
  readonly requestId: string;
  readonly snippetId: string;
  readonly trigger: string;
  readonly kind: TriggerCatalogEntryKind;
  readonly epoch: string;
  readonly revision: number;
}

export type TriggerActivationResponseMessage =
  | {
      readonly type: 'snippet-trigger-activation-result';
      readonly requestId: string;
      readonly outcome: 'copied';
      readonly kind: TriggerCatalogEntryKind;
      readonly usageReceiptId?: string;
    }
  | {
      readonly type: 'snippet-trigger-activation-result';
      readonly requestId: string;
      readonly outcome: 'automatic-ready';
      readonly kind: TriggerCatalogEntryKind;
      readonly authorizationId: string;
      readonly usageReceiptId?: string;
    }
  | {
      readonly type: 'snippet-trigger-activation-result';
      readonly requestId: string;
      readonly outcome: 'permission-required' | 'failed';
      readonly code: SnippetDeliveryFailureCode;
      readonly message: string;
    };

export interface SnippetUsageReceiptAcknowledgementMessage {
  readonly type: 'snippet-usage-receipt-acknowledgement';
  readonly receiptId: string;
  readonly requestId: string;
  readonly snippetId: string;
  readonly kind: TriggerCatalogEntryKind;
  readonly epoch: string;
  readonly revision: number;
}

export interface SnippetUsageReceiptAcknowledgementResponse {
  readonly type: 'snippet-usage-receipt-acknowledgement-result';
  readonly requestId: string;
  readonly accepted: boolean;
}

export interface AutomaticPasteFinalizeMessage {
  readonly type: 'snippet-automatic-paste-finalize';
  readonly requestId: string;
  readonly authorizationId: string;
  readonly editorState: 'ready' | 'unsafe-focus' | 'cleanup-failed';
}

export interface AutomaticPasteFinalizeResponse {
  readonly type: 'snippet-automatic-paste-result';
  readonly requestId: string;
  readonly kind: TriggerCatalogEntryKind;
  readonly result:
    | 'paste-issued'
    | 'unsafe-focus'
    | 'not-foreground'
    | 'clipboard-changed'
    | 'unsafe-keyboard-state'
    | 'busy'
    | 'native-unavailable'
    | 'input-injection-failed'
    | 'indeterminate';
}

export interface OffscreenClipboardWriteMessage {
  readonly type: 'offscreen-clipboard-write';
  readonly requestId: string;
  readonly kind: 'text';
  readonly plainText: string;
  readonly html: string;
}

export type OffscreenClipboardWriteResponse =
  | {
      readonly type: 'offscreen-clipboard-write-result';
      readonly requestId: string;
      readonly succeeded: true;
    }
  | {
      readonly type: 'offscreen-clipboard-write-result';
      readonly requestId: string;
      readonly succeeded: false;
      readonly error: OffscreenClipboardFailureCode;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

export function isTriggerActivationRequestMessage(
  value: unknown,
): value is TriggerActivationRequestMessage {
  return (
    isRecord(value) &&
    exactKeys(value, [
      'type',
      'requestId',
      'snippetId',
      'trigger',
      'kind',
      'epoch',
      'revision',
    ]) &&
    value.type === 'snippet-trigger-activation' &&
    typeof value.requestId === 'string' &&
    value.requestId.length > 0 &&
    typeof value.snippetId === 'string' &&
    value.snippetId.length > 0 &&
    typeof value.trigger === 'string' &&
    (value.kind === 'text' || value.kind === 'image') &&
    typeof value.epoch === 'string' &&
    value.epoch.length > 0 &&
    Number.isInteger(value.revision) &&
    (value.revision as number) >= 0
  );
}

export function isOffscreenClipboardWriteMessage(
  value: unknown,
): value is OffscreenClipboardWriteMessage {
  if (!isRecord(value) || value.type !== 'offscreen-clipboard-write') {
    return false;
  }
  return (
    value.kind === 'text' &&
    exactKeys(value, ['type', 'requestId', 'kind', 'plainText', 'html']) &&
    typeof value.requestId === 'string' &&
    value.requestId.length > 0 &&
    typeof value.plainText === 'string' &&
    typeof value.html === 'string'
  );
}

export function isOffscreenClipboardWriteResponse(
  value: unknown,
): value is OffscreenClipboardWriteResponse {
  if (
    !isRecord(value) ||
    value.type !== 'offscreen-clipboard-write-result' ||
    typeof value.requestId !== 'string' ||
    typeof value.succeeded !== 'boolean'
  ) {
    return false;
  }
  return value.succeeded
    ? exactKeys(value, ['type', 'requestId', 'succeeded'])
    : exactKeys(value, ['type', 'requestId', 'succeeded', 'error']) &&
        (value.error === 'clipboard-copy-event-unavailable' ||
          value.error === 'clipboard-copy-command-failed' ||
          value.error === 'clipboard-copy-data-failed');
}

export function isSnippetDeliveryFailureCode(
  value: unknown,
): value is SnippetDeliveryFailureCode {
  return (
    value === 'snippet-unavailable' ||
    value === 'stale-trigger' ||
    value === 'unsupported-content' ||
    value === 'asset-unavailable' ||
    value === 'asset-ownership-invalid' ||
    value === 'asset-invalid' ||
    value === 'permission-required' ||
    value === 'offscreen-create-failed' ||
    value === 'offscreen-message-failed' ||
    value === 'invalid-offscreen-response' ||
    value === 'clipboard-write-failed' ||
    value === 'clipboard-copy-event-unavailable' ||
    value === 'clipboard-copy-command-failed' ||
    value === 'clipboard-copy-data-failed' ||
    value === 'image-invalid' ||
    value === 'image-decode-failed' ||
    value === 'image-too-large' ||
    value === 'animated-webp' ||
    value === 'native-permission-required' ||
    value === 'host-unavailable' ||
    value === 'host-version-mismatch' ||
    value === 'invalid-host-response' ||
    value === 'native-delivery-busy' ||
    value === 'automatic-delivery-busy' ||
    value === 'stale-catalog' ||
    value === 'unexpected-delivery-failure'
  );
}

export function isAutomaticPasteFinalizeMessage(
  value: unknown,
): value is AutomaticPasteFinalizeMessage {
  return (
    isRecord(value) &&
    exactKeys(value, ['type', 'requestId', 'authorizationId', 'editorState']) &&
    value.type === 'snippet-automatic-paste-finalize' &&
    typeof value.requestId === 'string' &&
    value.requestId.length > 0 &&
    typeof value.authorizationId === 'string' &&
    /^[0-9a-f]{32}$/.test(value.authorizationId) &&
    (value.editorState === 'ready' ||
      value.editorState === 'unsafe-focus' ||
      value.editorState === 'cleanup-failed')
  );
}

export function isSnippetUsageReceiptAcknowledgementMessage(
  value: unknown,
): value is SnippetUsageReceiptAcknowledgementMessage {
  return (
    isRecord(value) &&
    exactKeys(value, [
      'type',
      'receiptId',
      'requestId',
      'snippetId',
      'kind',
      'epoch',
      'revision',
    ]) &&
    value.type === 'snippet-usage-receipt-acknowledgement' &&
    typeof value.receiptId === 'string' &&
    value.receiptId.length > 0 &&
    typeof value.requestId === 'string' &&
    value.requestId.length > 0 &&
    typeof value.snippetId === 'string' &&
    value.snippetId.length > 0 &&
    (value.kind === 'text' || value.kind === 'image') &&
    typeof value.epoch === 'string' &&
    value.epoch.length > 0 &&
    Number.isInteger(value.revision) &&
    (value.revision as number) >= 0
  );
}

export function isAutomaticPasteFinalizeResponse(
  value: unknown,
): value is AutomaticPasteFinalizeResponse {
  return (
    isRecord(value) &&
    exactKeys(value, ['type', 'requestId', 'kind', 'result']) &&
    value.type === 'snippet-automatic-paste-result' &&
    typeof value.requestId === 'string' &&
    (value.kind === 'text' || value.kind === 'image') &&
    (value.result === 'paste-issued' ||
      value.result === 'unsafe-focus' ||
      value.result === 'not-foreground' ||
      value.result === 'clipboard-changed' ||
      value.result === 'unsafe-keyboard-state' ||
      value.result === 'busy' ||
      value.result === 'native-unavailable' ||
      value.result === 'input-injection-failed' ||
      value.result === 'indeterminate')
  );
}
