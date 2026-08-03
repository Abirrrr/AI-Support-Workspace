export const TRIGGER_CATALOG_PORT_NAME = 'snippet-trigger-catalog-v1';
const CANONICAL_TRIGGER_PATTERN = /^;[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface TriggerCatalogEntry {
  readonly trigger: string;
  readonly snippetId: string;
  readonly content: string;
}

export interface TriggerCatalogSnapshotMessage {
  readonly type: 'trigger-catalog-snapshot';
  readonly epoch: string;
  readonly revision: number;
  readonly entries: readonly TriggerCatalogEntry[];
}

export interface TriggerCatalogInvalidateMessage {
  readonly type: 'trigger-catalog-invalidate';
  readonly epoch: string;
  readonly revision: number;
}

export type TriggerCatalogPortMessage =
  TriggerCatalogSnapshotMessage | TriggerCatalogInvalidateMessage;

export interface TriggerCatalogSnapshotRequest {
  readonly type: 'trigger-catalog-request-snapshot';
}

export interface TriggerCatalogMutationBeginMessage {
  readonly type: 'trigger-catalog-mutation-begin';
}

export interface TriggerCatalogMutationFinishMessage {
  readonly type: 'trigger-catalog-mutation-finish';
  readonly mutationId: string;
  readonly outcome: 'succeeded' | 'failed';
}

export interface TriggerCatalogMutationBeginResponse {
  readonly type: 'trigger-catalog-mutation-begun';
  readonly mutationId: string;
}

export interface TriggerCatalogMutationFinishResponse {
  readonly type: 'trigger-catalog-mutation-finished';
  readonly published: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function isRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isCanonicalSnippetTrigger(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 2 &&
    value.length <= 32 &&
    CANONICAL_TRIGGER_PATTERN.test(value)
  );
}

function isCatalogEntry(value: unknown): value is TriggerCatalogEntry {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['trigger', 'snippetId', 'content']) &&
    isCanonicalSnippetTrigger(value.trigger) &&
    typeof value.snippetId === 'string' &&
    value.snippetId.length > 0 &&
    typeof value.content === 'string'
  );
}

export function isTriggerCatalogSnapshotMessage(
  value: unknown,
): value is TriggerCatalogSnapshotMessage {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['type', 'epoch', 'revision', 'entries']) ||
    value.type !== 'trigger-catalog-snapshot' ||
    typeof value.epoch !== 'string' ||
    value.epoch.length === 0 ||
    !isRevision(value.revision) ||
    !Array.isArray(value.entries) ||
    !value.entries.every(isCatalogEntry)
  ) {
    return false;
  }
  const triggers = value.entries.map(({ trigger }) => trigger);
  return new Set(triggers).size === triggers.length;
}

export function isTriggerCatalogInvalidateMessage(
  value: unknown,
): value is TriggerCatalogInvalidateMessage {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['type', 'epoch', 'revision']) &&
    value.type === 'trigger-catalog-invalidate' &&
    typeof value.epoch === 'string' &&
    value.epoch.length > 0 &&
    isRevision(value.revision)
  );
}

export function isTriggerCatalogSnapshotRequest(
  value: unknown,
): value is TriggerCatalogSnapshotRequest {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['type']) &&
    value.type === 'trigger-catalog-request-snapshot'
  );
}

export function isTriggerCatalogMutationBeginMessage(
  value: unknown,
): value is TriggerCatalogMutationBeginMessage {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['type']) &&
    value.type === 'trigger-catalog-mutation-begin'
  );
}

export function isTriggerCatalogMutationFinishMessage(
  value: unknown,
): value is TriggerCatalogMutationFinishMessage {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['type', 'mutationId', 'outcome']) &&
    value.type === 'trigger-catalog-mutation-finish' &&
    typeof value.mutationId === 'string' &&
    value.mutationId.length > 0 &&
    (value.outcome === 'succeeded' || value.outcome === 'failed')
  );
}

export function isTriggerCatalogMutationBeginResponse(
  value: unknown,
): value is TriggerCatalogMutationBeginResponse {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['type', 'mutationId']) &&
    value.type === 'trigger-catalog-mutation-begun' &&
    typeof value.mutationId === 'string' &&
    value.mutationId.length > 0
  );
}

export function isTriggerCatalogMutationFinishResponse(
  value: unknown,
): value is TriggerCatalogMutationFinishResponse {
  return (
    isRecord(value) &&
    hasExactKeys(value, ['type', 'published']) &&
    value.type === 'trigger-catalog-mutation-finished' &&
    typeof value.published === 'boolean'
  );
}
