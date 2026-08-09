import type { SnippetAsset } from '../../domain/snippet-asset';

export interface SnippetAssetRecord {
  id: string;
  snippetId: string;
  mimeType: SnippetAsset['mimeType'];
  blob: Blob;
  byteSize: number;
  originalFilename: string | null;
  createdAt: string;
}

export function toSnippetAsset(record: SnippetAssetRecord): SnippetAsset {
  return {
    id: record.id,
    snippetId: record.snippetId,
    mimeType: record.mimeType,
    blob: record.blob,
    byteSize: record.byteSize,
    originalFilename: record.originalFilename,
    createdAt: record.createdAt,
  };
}

export function toSnippetAssetRecord(asset: SnippetAsset): SnippetAssetRecord {
  return {
    id: asset.id,
    snippetId: asset.snippetId,
    mimeType: asset.mimeType,
    blob: asset.blob,
    byteSize: asset.byteSize,
    originalFilename: asset.originalFilename,
    createdAt: asset.createdAt,
  };
}
