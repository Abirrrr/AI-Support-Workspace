import type { SnippetEntryRepository } from '../persistence/snippet-entry-repository';
import type { SnippetGeneratedMetadataRepository } from '../persistence/snippet-generated-metadata-repository';
import {
  rankTextSnippets,
  tokenizeRetrievalText,
} from './text-snippet-ranking';

export interface DraftingSnippetReference {
  readonly kind: 'text-snippet';
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly score: number;
}

export class DraftingReferenceRetriever {
  constructor(
    private readonly snippetRepository: SnippetEntryRepository,
    private readonly metadataRepository?: SnippetGeneratedMetadataRepository,
  ) {}

  async retrieve(query: string): Promise<readonly DraftingSnippetReference[]> {
    const queryTokens = tokenizeRetrievalText(query);

    if (queryTokens.size === 0) return [];

    const [snippetRecords, metadataRecords] = await Promise.all([
      this.snippetRepository.list(),
      this.loadGeneratedMetadataFailSoft(),
    ]);

    return (
      await rankTextSnippets(snippetRecords, queryTokens, metadataRecords)
    ).map(({ record, content, score }) => ({
      kind: 'text-snippet',
      id: record.id,
      title: record.title,
      content,
      score,
    }));
  }

  private async loadGeneratedMetadataFailSoft() {
    if (this.metadataRepository === undefined) return [];

    try {
      return await this.metadataRepository.list();
    } catch {
      return [];
    }
  }
}
