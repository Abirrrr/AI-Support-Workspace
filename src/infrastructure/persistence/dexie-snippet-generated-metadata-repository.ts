import type { SnippetGeneratedMetadataRepository } from '../../application/persistence/snippet-generated-metadata-repository';
import type { SnippetGeneratedMetadata } from '../../domain/snippet-generated-metadata';
import type { AiSupportWorkspaceDatabase } from './database';
import { runPersistenceOperation } from './repository-helpers';
import {
  toSnippetGeneratedMetadata,
  toSnippetGeneratedMetadataRecord,
} from './snippet-generated-metadata-record';

export class DexieSnippetGeneratedMetadataRepository implements SnippetGeneratedMetadataRepository {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  get(snippetId: string): Promise<SnippetGeneratedMetadata | undefined> {
    return runPersistenceOperation(
      'get generated Snippet metadata',
      async () => {
        const record =
          await this.database.snippetGeneratedMetadata.get(snippetId);
        return record === undefined
          ? undefined
          : toSnippetGeneratedMetadata(record);
      },
    );
  }

  list(): Promise<readonly SnippetGeneratedMetadata[]> {
    return runPersistenceOperation(
      'list generated Snippet metadata',
      async () =>
        (await this.database.snippetGeneratedMetadata.toArray())
          .sort((left, right) => left.snippetId.localeCompare(right.snippetId))
          .map(toSnippetGeneratedMetadata),
    );
  }

  save(metadata: SnippetGeneratedMetadata): Promise<SnippetGeneratedMetadata> {
    return runPersistenceOperation(
      'save generated Snippet metadata',
      async () => {
        const record = toSnippetGeneratedMetadataRecord(metadata);
        await this.database.transaction(
          'rw',
          this.database.snippetEntries,
          this.database.snippetGeneratedMetadata,
          async () => {
            const owner = await this.database.snippetEntries.get(
              metadata.snippetId,
            );
            if (owner === undefined || owner.content.kind === 'image') {
              throw new TypeError(
                'Generated Snippet metadata requires a Text Snippet owner.',
              );
            }
            await this.database.snippetGeneratedMetadata.put(record);
          },
        );
        return toSnippetGeneratedMetadata(record);
      },
    );
  }

  delete(snippetId: string): Promise<boolean> {
    return runPersistenceOperation(
      'delete generated Snippet metadata',
      async () => {
        const existing =
          await this.database.snippetGeneratedMetadata.get(snippetId);
        if (existing === undefined) return false;
        await this.database.snippetGeneratedMetadata.delete(snippetId);
        return true;
      },
    );
  }
}
