import type { KnowledgeEntry } from '../../domain/knowledge-entry';
import type { SnippetEntry } from '../../domain/snippet-entry';
import { renderSnippetPlainText } from '../../domain/snippet-content';
import type { KnowledgeEntryRepository } from '../persistence/knowledge-entry-repository';
import type { SnippetEntryRepository } from '../persistence/snippet-entry-repository';

const TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;

export interface RetrievalResults {
  knowledge: readonly KnowledgeRetrievalResult[];
  snippets: readonly SnippetRetrievalResult[];
}

export interface KnowledgeRetrievalResult {
  kind: 'knowledge';
  id: string;
  record: KnowledgeEntry;
  score: number;
}

export interface SnippetRetrievalResult {
  kind: 'snippet';
  id: string;
  record: SnippetEntry;
  score: number;
}

interface ScoredRecord {
  record: {
    id: string;
    createdAt: string;
  };
  score: number;
}

function tokenize(value: string): Set<string> {
  const normalized = value.normalize('NFKC').toLowerCase();
  return new Set(normalized.match(TOKEN_PATTERN) ?? []);
}

function tokenizeTags(tags: readonly string[]): Set<string> {
  const tokens = new Set<string>();

  for (const tag of tags) {
    for (const token of tokenize(tag)) {
      tokens.add(token);
    }
  }

  return tokens;
}

function scoreRecord(
  queryTokens: ReadonlySet<string>,
  title: string,
  tags: readonly string[],
  content: string,
): number {
  const titleTokens = tokenize(title);
  const tagTokens = tokenizeTags(tags);
  const contentTokens = tokenize(content);
  let score = 0;

  for (const token of queryTokens) {
    if (titleTokens.has(token)) score += 5;
    if (tagTokens.has(token)) score += 3;
    if (contentTokens.has(token)) score += 1;
  }

  return score;
}

function compareScoredRecords(left: ScoredRecord, right: ScoredRecord): number {
  if (left.score !== right.score) return right.score - left.score;
  if (left.record.createdAt < right.record.createdAt) return -1;
  if (left.record.createdAt > right.record.createdAt) return 1;
  if (left.record.id < right.record.id) return -1;
  if (left.record.id > right.record.id) return 1;
  return 0;
}

function retrieveKnowledge(
  records: readonly KnowledgeEntry[],
  queryTokens: ReadonlySet<string>,
): KnowledgeRetrievalResult[] {
  return records
    .map((record): KnowledgeRetrievalResult => ({
      kind: 'knowledge',
      id: record.id,
      record,
      score: scoreRecord(queryTokens, record.title, record.tags, record.body),
    }))
    .filter((result) => result.score > 0)
    .sort(compareScoredRecords);
}

function retrieveSnippets(
  records: readonly SnippetEntry[],
  queryTokens: ReadonlySet<string>,
): SnippetRetrievalResult[] {
  return records
    .filter((record) => record.content.kind !== 'image')
    .map((record): SnippetRetrievalResult => ({
      kind: 'snippet',
      id: record.id,
      record,
      score: scoreRecord(
        queryTokens,
        record.title,
        record.tags,
        renderSnippetPlainText(record.content),
      ),
    }))
    .filter((result) => result.score > 0)
    .sort(compareScoredRecords);
}

export class RetrievalEngine {
  constructor(
    private readonly knowledgeRepository: KnowledgeEntryRepository,
    private readonly snippetRepository: SnippetEntryRepository,
  ) {}

  async retrieve(query: string): Promise<RetrievalResults> {
    const queryTokens = tokenize(query);

    if (queryTokens.size === 0) {
      return { knowledge: [], snippets: [] };
    }

    const [knowledgeRecords, snippetRecords] = await Promise.all([
      this.knowledgeRepository.list(),
      this.snippetRepository.list(),
    ]);

    return {
      knowledge: retrieveKnowledge(knowledgeRecords, queryTokens),
      snippets: retrieveSnippets(snippetRecords, queryTokens),
    };
  }
}
