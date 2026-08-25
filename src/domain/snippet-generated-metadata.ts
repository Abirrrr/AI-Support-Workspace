import type { SnippetEntry } from './snippet-entry';
import { renderSnippetPlainText } from './snippet-content';

export const MAX_GENERATED_SNIPPET_TAGS = 8;
export const MAX_GENERATED_SNIPPET_TAG_CODE_POINTS = 40;
const SHA_256_HEX_PATTERN = /^[0-9a-f]{64}$/;

export interface SnippetGeneratedMetadata {
  readonly snippetId: string;
  readonly generatedTags: readonly string[];
  readonly sourceFingerprint: string;
  readonly generatedAt: string;
}

function isUtcIsoTimestamp(value: string): boolean {
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

function isNormalizedGeneratedTag(value: string): boolean {
  const normalized = value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('und');
  return (
    normalized === value &&
    [...value].length >= 1 &&
    [...value].length <= MAX_GENERATED_SNIPPET_TAG_CODE_POINTS &&
    !/[\p{Cc}\p{Cf}\r\n<>]/u.test(value)
  );
}

export function validateSnippetGeneratedMetadata(
  value: SnippetGeneratedMetadata,
): SnippetGeneratedMetadata {
  const folded = value.generatedTags.map((tag) => tag.toLocaleLowerCase('und'));
  if (
    value.generatedTags.length > MAX_GENERATED_SNIPPET_TAGS ||
    !value.generatedTags.every(isNormalizedGeneratedTag) ||
    new Set(folded).size !== folded.length ||
    !SHA_256_HEX_PATTERN.test(value.sourceFingerprint) ||
    !isUtcIsoTimestamp(value.generatedAt)
  ) {
    throw new TypeError('Generated Snippet metadata is invalid.');
  }
  return {
    snippetId: value.snippetId,
    generatedTags: [...value.generatedTags],
    sourceFingerprint: value.sourceFingerprint,
    generatedAt: value.generatedAt,
  };
}

export function hasSameGeneratedMetadataSource(
  left: Pick<SnippetEntry, 'title' | 'content' | 'tags'>,
  right: Pick<SnippetEntry, 'title' | 'content' | 'tags'>,
): boolean {
  return (
    left.title === right.title &&
    JSON.stringify(left.content) === JSON.stringify(right.content) &&
    JSON.stringify(left.tags) === JSON.stringify(right.tags)
  );
}

export async function createSnippetSourceFingerprint(
  snippet: Pick<SnippetEntry, 'title' | 'content' | 'tags'>,
): Promise<string> {
  if (snippet.content.kind === 'image') {
    throw new TypeError('Image Snippets cannot have generated metadata.');
  }
  const canonical = JSON.stringify({
    version: 1,
    title: snippet.title,
    renderedText: renderSnippetPlainText(snippet.content),
    authoredTags: [...snippet.tags],
  });
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonical),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
