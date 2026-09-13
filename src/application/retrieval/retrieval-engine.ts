import type { KnowledgeEntry } from '../../domain/knowledge-entry';
import type { SnippetEntry } from '../../domain/snippet-entry';
import type { SnippetGeneratedMetadata } from '../../domain/snippet-generated-metadata';
import type { KnowledgeEntryRepository } from '../persistence/knowledge-entry-repository';
import type { SnippetEntryRepository } from '../persistence/snippet-entry-repository';
import type { SnippetGeneratedMetadataRepository } from '../persistence/snippet-generated-metadata-repository';
import {
  compareScoredRecords,
  rankTextSnippets,
  scoreRetrievalFields,
  tokenizeRetrievalText,
} from './text-snippet-ranking';

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

function retrieveKnowledge(
  records: readonly KnowledgeEntry[],
  queryTokens: ReadonlySet<string>,
): KnowledgeRetrievalResult[] {
  return records
    .map((record): KnowledgeRetrievalResult => ({
      kind: 'knowledge',
      id: record.id,
      record,
      score: scoreRetrievalFields(
        queryTokens,
        record.title,
        record.tags,
        record.body,
      ),
    }))
    .filter((result) => result.score > 0)
    .sort(compareScoredRecords);
}

async function retrieveSnippets(
  records: readonly SnippetEntry[],
  queryTokens: ReadonlySet<string>,
  metadataRecords: readonly SnippetGeneratedMetadata[],
): Promise<SnippetRetrievalResult[]> {
  return (await rankTextSnippets(records, queryTokens, metadataRecords)).map(
    ({ record, score }): SnippetRetrievalResult => ({
      kind: 'snippet',
      id: record.id,
      record,
      score,
    }),
  );
}

export class RetrievalEngine {
  constructor(
    private readonly knowledgeRepository: KnowledgeEntryRepository,
    private readonly snippetRepository: SnippetEntryRepository,
    private readonly metadataRepository?: SnippetGeneratedMetadataRepository,
  ) {}

  async retrieve(query: string): Promise<RetrievalResults> {
    const queryTokens = tokenizeRetrievalText(query);

    if (queryTokens.size === 0) {
      return { knowledge: [], snippets: [] };
    }

    const [knowledgeRecords, snippetRecords, metadataRecords] =
      await Promise.all([
        this.knowledgeRepository.list(),
        this.snippetRepository.list(),
        this.loadGeneratedMetadataFailSoft(),
      ]);

    return {
      knowledge: retrieveKnowledge(knowledgeRecords, queryTokens),
      snippets: await retrieveSnippets(
        snippetRecords,
        queryTokens,
        metadataRecords,
      ),
    };
  }

  private async loadGeneratedMetadataFailSoft(): Promise<
    readonly SnippetGeneratedMetadata[]
  > {
    if (this.metadataRepository === undefined) return [];
    try {
      return await this.metadataRepository.list();
    } catch {
      return [];
    }
  }
}
