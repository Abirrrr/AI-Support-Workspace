import type { SnippetEntry } from '../../domain/snippet-entry';
import { renderSnippetPlainText } from '../../domain/snippet-content';
import {
  isSnippetGeneratedMetadataCurrent,
  type SnippetGeneratedMetadata,
} from '../../domain/snippet-generated-metadata';

const TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;

export interface ScoredRecordIdentity {
  readonly id: string;
  readonly createdAt: string;
}

export interface RankedTextSnippet {
  readonly record: SnippetEntry;
  readonly content: string;
  readonly score: number;
}

export function tokenizeRetrievalText(value: string): ReadonlySet<string> {
  const normalized = value.normalize('NFKC').toLowerCase();
  return new Set(normalized.match(TOKEN_PATTERN) ?? []);
}

function tokenizeTags(tags: readonly string[]): ReadonlySet<string> {
  const tokens = new Set<string>();

  for (const tag of tags) {
    for (const token of tokenizeRetrievalText(tag)) {
      tokens.add(token);
    }
  }

  return tokens;
}

export function scoreRetrievalFields(
  queryTokens: ReadonlySet<string>,
  title: string,
  tags: readonly string[],
  content: string,
  generatedTags: readonly string[] = [],
): number {
  const titleTokens = tokenizeRetrievalText(title);
  const tagTokens = tokenizeTags(tags);
  const contentTokens = tokenizeRetrievalText(content);
  const generatedTagTokens = tokenizeTags(generatedTags);
  let score = 0;

  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 5;
    if (tagTokens.has(token)) score += 3;
    if (contentTokens.has(token)) score += 1;
    if (generatedTagTokens.has(token)) score += 1;
  }

  return score;
}

export function compareScoredRecords(
  left: { readonly record: ScoredRecordIdentity; readonly score: number },
  right: { readonly record: ScoredRecordIdentity; readonly score: number },
): number {
  if (left.score !== right.score) return right.score - left.score;
  if (left.record.createdAt < right.record.createdAt) return -1;
  if (left.record.createdAt > right.record.createdAt) return 1;
  if (left.record.id < right.record.id) return -1;
  if (left.record.id > right.record.id) return 1;
  return 0;
}

export async function rankTextSnippets(
  records: readonly SnippetEntry[],
  queryTokens: ReadonlySet<string>,
  metadataRecords: readonly unknown[],
): Promise<RankedTextSnippet[]> {
  const metadataBySnippet = new Map<
    string,
    SnippetGeneratedMetadata | undefined
  >();
  for (const metadata of metadataRecords) {
    if (
      metadata === null ||
      typeof metadata !== 'object' ||
      typeof (metadata as { readonly snippetId?: unknown }).snippetId !==
        'string'
    ) {
      continue;
    }
    const candidate = metadata as SnippetGeneratedMetadata;
    metadataBySnippet.set(
      candidate.snippetId,
      metadataBySnippet.has(candidate.snippetId) ? undefined : candidate,
    );
  }

  const textRecords = records.filter(
    (record) => record.content.kind !== 'image',
  );
  const scored = await Promise.all(
    textRecords.map(async (record): Promise<RankedTextSnippet> => {
      const metadata = metadataBySnippet.get(record.id);
      const generatedTags = (await isSnippetGeneratedMetadataCurrent(
        metadata,
        record,
      ))
        ? (metadata?.generatedTags ?? [])
        : [];
      const content = renderSnippetPlainText(record.content);

      return {
        record,
        content,
        score: scoreRetrievalFields(
          queryTokens,
          record.title,
          record.tags,
          content,
          generatedTags,
        ),
      };
    }),
  );

  return scored.filter((result) => result.score > 0).sort(compareScoredRecords);
}
