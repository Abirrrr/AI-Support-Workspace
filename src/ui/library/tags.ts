export function formatTags(tags: readonly string[]): string {
  return tags.join(', ');
}

export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}
