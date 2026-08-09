import type { SnippetAssetRepository } from '../../application/persistence/snippet-asset-repository';
import type { SnippetAsset } from '../../domain/snippet-asset';
import type { AiSupportWorkspaceDatabase } from './database';
import {
  compareByCreatedAtAndId,
  runPersistenceOperation,
} from './repository-helpers';
import { toSnippetAsset } from './snippet-asset-record';

export class DexieSnippetAssetRepository implements SnippetAssetRepository {
  constructor(private readonly database: AiSupportWorkspaceDatabase) {}

  get(id: string): Promise<SnippetAsset | undefined> {
    return runPersistenceOperation('get snippet asset', async () => {
      const record = await this.database.snippetAssets.get(id);
      return record === undefined ? undefined : toSnippetAsset(record);
    });
  }

  listBySnippet(snippetId: string): Promise<readonly SnippetAsset[]> {
    return runPersistenceOperation('list snippet assets', async () => {
      const records = await this.database.snippetAssets
        .where('snippetId')
        .equals(snippetId)
        .toArray();
      return records.sort(compareByCreatedAtAndId).map(toSnippetAsset);
    });
  }
}
