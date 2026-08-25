import {
  validateSnippetGeneratedMetadata,
  type SnippetGeneratedMetadata,
} from '../../domain/snippet-generated-metadata';

export interface SnippetGeneratedMetadataRecord {
  readonly snippetId: string;
  readonly generatedTags: readonly string[];
  readonly sourceFingerprint: string;
  readonly generatedAt: string;
}

export function toSnippetGeneratedMetadata(
  record: SnippetGeneratedMetadataRecord,
): SnippetGeneratedMetadata {
  return validateSnippetGeneratedMetadata(record);
}

export function toSnippetGeneratedMetadataRecord(
  metadata: SnippetGeneratedMetadata,
): SnippetGeneratedMetadataRecord {
  return validateSnippetGeneratedMetadata(metadata);
}
