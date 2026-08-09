import { getLocalImageAssetIds, type SnippetContent } from './snippet-content';
import {
  MAX_SNIPPET_ASSET_BYTES_PER_PROJECT,
  MAX_SNIPPET_ASSET_BYTES_PER_SNIPPET,
} from './snippet-asset';

export interface SnippetAssetGraphSnippet {
  readonly id: string;
  readonly content: SnippetContent;
}

export interface SnippetAssetGraphAsset {
  readonly id: string;
  readonly snippetId: string;
  readonly byteSize: number;
}

export type SnippetAssetGraphErrorCode =
  | 'duplicate-asset-id'
  | 'missing-owner'
  | 'missing-asset'
  | 'foreign-asset-reference'
  | 'orphan-asset'
  | 'snippet-limit-exceeded'
  | 'project-limit-exceeded';

export class SnippetAssetGraphError extends Error {
  constructor(readonly code: SnippetAssetGraphErrorCode) {
    super(`Snippet asset graph validation failed: ${code}.`);
    this.name = 'SnippetAssetGraphError';
  }
}

export function validateSnippetAssetGraph(
  snippets: readonly SnippetAssetGraphSnippet[],
  assets: readonly SnippetAssetGraphAsset[],
): void {
  const snippetsById = new Map(
    snippets.map((snippet) => [snippet.id, snippet]),
  );
  const assetsById = new Map<string, SnippetAssetGraphAsset>();
  const referencedAssetIds = new Set<string>();
  const bytesBySnippet = new Map<string, number>();
  let projectBytes = 0;

  for (const asset of assets) {
    if (assetsById.has(asset.id)) {
      throw new SnippetAssetGraphError('duplicate-asset-id');
    }
    if (!snippetsById.has(asset.snippetId)) {
      throw new SnippetAssetGraphError('missing-owner');
    }
    assetsById.set(asset.id, asset);
    const snippetBytes =
      (bytesBySnippet.get(asset.snippetId) ?? 0) + asset.byteSize;
    if (snippetBytes > MAX_SNIPPET_ASSET_BYTES_PER_SNIPPET) {
      throw new SnippetAssetGraphError('snippet-limit-exceeded');
    }
    bytesBySnippet.set(asset.snippetId, snippetBytes);
    projectBytes += asset.byteSize;
  }

  if (projectBytes > MAX_SNIPPET_ASSET_BYTES_PER_PROJECT) {
    throw new SnippetAssetGraphError('project-limit-exceeded');
  }

  for (const snippet of snippets) {
    for (const assetId of getLocalImageAssetIds(snippet.content)) {
      const asset = assetsById.get(assetId);
      if (asset === undefined) {
        throw new SnippetAssetGraphError('missing-asset');
      }
      if (asset.snippetId !== snippet.id) {
        throw new SnippetAssetGraphError('foreign-asset-reference');
      }
      referencedAssetIds.add(assetId);
    }
  }

  if (assets.some((asset) => !referencedAssetIds.has(asset.id))) {
    throw new SnippetAssetGraphError('orphan-asset');
  }
}
