import type { SnippetEntryRepository } from '../persistence/snippet-entry-repository';
import type { TriggerCatalogEntry } from '../../shared/trigger-catalog-messages';
import { containsLocalImageBlock } from '../../domain/snippet-content';

export interface TriggerCatalogReader {
  readCatalog(): Promise<readonly TriggerCatalogEntry[]>;
}

export class TriggerCatalogService implements TriggerCatalogReader {
  constructor(private readonly repository: SnippetEntryRepository) {}

  async readCatalog(): Promise<readonly TriggerCatalogEntry[]> {
    const snippets = await this.repository.list();
    return snippets.flatMap((snippet) =>
      snippet.trigger === null || containsLocalImageBlock(snippet.content)
        ? []
        : [
            {
              kind: snippet.content.kind === 'image' ? 'image' : 'text',
              trigger: snippet.trigger,
              snippetId: snippet.id,
            },
          ],
    );
  }
}
