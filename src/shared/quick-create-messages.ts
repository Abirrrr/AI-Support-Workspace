export const QUICK_CREATE_COMMAND = 'quick-create-snippet-from-clipboard';
export const QUICK_CREATE_AVAILABLE = {
  type: 'quick-create-available',
} as const;
export const QUICK_CREATE_CLAIM = { type: 'quick-create-claim' } as const;
export interface QuickCreateIntent {
  readonly type: 'quick-create-intent';
  readonly id: string;
  readonly expiresAt: number;
}

export function isQuickCreateSignal(
  value: unknown,
  type: 'quick-create-available' | 'quick-create-claim',
): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 1 &&
    'type' in value &&
    value.type === type
  );
}

export function isQuickCreateIntent(
  value: unknown,
): value is QuickCreateIntent {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.keys(value).length === 3 &&
    'expiresAt' in value &&
    typeof value.expiresAt === 'number' &&
    Number.isSafeInteger(value.expiresAt) &&
    value.expiresAt > 0 &&
    'type' in value &&
    value.type === 'quick-create-intent' &&
    'id' in value &&
    typeof value.id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      value.id,
    )
  );
}
