import type { SnippetEntry } from './snippet-entry';
import {
  cloneSnippetContent,
  renderSnippetPlainText,
  type SnippetContent,
} from './snippet-content';

export const MAX_GENERATED_SNIPPET_TAGS = 8;
export const MAX_GENERATED_SNIPPET_TAG_CODE_POINTS = 40;
export const SNIPPET_SOURCE_FINGERPRINT_VERSION = 1;
const SHA_256_HEX_PATTERN = /^[0-9a-f]{64}$/;
const GENERATED_METADATA_KEYS = [
  'generatedAt',
  'generatedTags',
  'snippetId',
  'sourceFingerprint',
] as const;

export interface SnippetGeneratedMetadataSource {
  readonly title: string;
  readonly content: SnippetContent;
  readonly tags: readonly string[];
}

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

export function normalizeGeneratedSnippetTag(value: string): string {
  const normalized = value.normalize('NFKC');
  if (/[\p{Cc}\p{Cf}\r\n<>]/u.test(normalized)) {
    throw new TypeError('Generated Snippet tag contains prohibited content.');
  }
  const result = normalized.trim().replace(/\s+/gu, ' ').toLowerCase();
  const codePointLength = [...result].length;
  if (
    codePointLength < 1 ||
    codePointLength > MAX_GENERATED_SNIPPET_TAG_CODE_POINTS
  ) {
    throw new TypeError('Generated Snippet tag length is invalid.');
  }
  return result;
}

function isNormalizedGeneratedTag(value: string): boolean {
  let normalized: string;
  try {
    normalized = normalizeGeneratedSnippetTag(value);
  } catch {
    return false;
  }
  return (
    normalized === value &&
    [...value].length >= 1 &&
    [...value].length <= MAX_GENERATED_SNIPPET_TAG_CODE_POINTS
  );
}

export function validateSnippetGeneratedMetadata(
  value: SnippetGeneratedMetadata,
): SnippetGeneratedMetadata {
  const keys = Object.keys(value).sort();
  const hasExactKeys =
    keys.length === GENERATED_METADATA_KEYS.length &&
    keys.every((key, index) => key === GENERATED_METADATA_KEYS[index]);
  const folded = Array.isArray(value.generatedTags)
    ? value.generatedTags.map((tag) =>
        typeof tag === 'string' ? tag.toLowerCase() : '',
      )
    : [];
  if (
    !hasExactKeys ||
    typeof value.snippetId !== 'string' ||
    value.snippetId.length === 0 ||
    !Array.isArray(value.generatedTags) ||
    value.generatedTags.length > MAX_GENERATED_SNIPPET_TAGS ||
    !value.generatedTags.every(
      (tag) => typeof tag === 'string' && isNormalizedGeneratedTag(tag),
    ) ||
    new Set(folded).size !== folded.length ||
    typeof value.sourceFingerprint !== 'string' ||
    !SHA_256_HEX_PATTERN.test(value.sourceFingerprint) ||
    typeof value.generatedAt !== 'string' ||
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
  left: SnippetGeneratedMetadataSource,
  right: SnippetGeneratedMetadataSource,
): boolean {
  return (
    left.title === right.title &&
    JSON.stringify(left.content) === JSON.stringify(right.content) &&
    JSON.stringify(left.tags) === JSON.stringify(right.tags)
  );
}

export function createSnippetGeneratedMetadataSource(
  snippet: SnippetGeneratedMetadataSource,
): SnippetGeneratedMetadataSource {
  return {
    title: snippet.title,
    content: cloneSnippetContent(snippet.content),
    tags: [...snippet.tags],
  };
}

export function serializeSnippetSourceMaterial(
  snippet: SnippetGeneratedMetadataSource,
): string {
  if (snippet.content.kind === 'image') {
    throw new TypeError('Image Snippets cannot have generated metadata.');
  }

  // Keep the committed v1 byte contract explicit instead of relying on object
  // property enumeration order. Each dynamic value is independently encoded.
  return (
    '{"version":' +
    String(SNIPPET_SOURCE_FINGERPRINT_VERSION) +
    ',"title":' +
    JSON.stringify(snippet.title) +
    ',"renderedText":' +
    JSON.stringify(renderSnippetPlainText(snippet.content)) +
    ',"authoredTags":' +
    JSON.stringify([...snippet.tags]) +
    '}'
  );
}

export async function createSnippetSourceFingerprint(
  snippet: SnippetGeneratedMetadataSource,
): Promise<string> {
  const canonical = serializeSnippetSourceMaterial(snippet);
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(canonical),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function isSnippetGeneratedMetadataCurrent(
  metadata: unknown,
  snippet: Pick<SnippetEntry, 'id' | 'title' | 'content' | 'tags'>,
): Promise<boolean> {
  if (snippet.content.kind === 'image') return false;

  try {
    const validated = validateSnippetGeneratedMetadata(
      metadata as SnippetGeneratedMetadata,
    );
    return (
      validated.snippetId === snippet.id &&
      validated.sourceFingerprint ===
        (await createSnippetSourceFingerprint(snippet))
    );
  } catch {
    return false;
  }
}
