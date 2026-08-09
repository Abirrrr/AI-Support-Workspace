import type { SnippetAsset } from '../../domain/snippet-asset';

export interface SnippetAssetRepository {
  get(id: string): Promise<SnippetAsset | undefined>;
  listBySnippet(snippetId: string): Promise<readonly SnippetAsset[]>;
}
