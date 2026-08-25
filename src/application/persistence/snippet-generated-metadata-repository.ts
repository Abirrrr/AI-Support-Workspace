import type { SnippetGeneratedMetadata } from '../../domain/snippet-generated-metadata';

export interface SnippetGeneratedMetadataRepository {
  get(snippetId: string): Promise<SnippetGeneratedMetadata | undefined>;
  list(): Promise<readonly SnippetGeneratedMetadata[]>;
  save(metadata: SnippetGeneratedMetadata): Promise<SnippetGeneratedMetadata>;
  delete(snippetId: string): Promise<boolean>;
}
