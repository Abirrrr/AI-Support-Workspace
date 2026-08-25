export interface SnippetUsageStats {
  readonly snippetId: string;
  readonly usageCount: number;
  readonly lastUsedAt: string;
}

function isUtcIsoTimestamp(value: string): boolean {
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

export function validateSnippetUsageStats(
  value: SnippetUsageStats,
): SnippetUsageStats {
  if (
    !Number.isSafeInteger(value.usageCount) ||
    value.usageCount < 1 ||
    !isUtcIsoTimestamp(value.lastUsedAt)
  ) {
    throw new TypeError('Snippet usage statistics are invalid.');
  }
  return {
    snippetId: value.snippetId,
    usageCount: value.usageCount,
    lastUsedAt: value.lastUsedAt,
  };
}
