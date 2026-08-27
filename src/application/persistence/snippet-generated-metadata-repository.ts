import type {
  SnippetGeneratedMetadata,
  SnippetGeneratedMetadataSource,
} from '../../domain/snippet-generated-metadata';

export interface SnippetGeneratedMetadataRepository {
  get(snippetId: string): Promise<SnippetGeneratedMetadata | undefined>;
  list(): Promise<readonly SnippetGeneratedMetadata[]>;
  save(metadata: SnippetGeneratedMetadata): Promise<SnippetGeneratedMetadata>;
  saveIfSourceMatches(
    metadata: SnippetGeneratedMetadata,
    source: SnippetGeneratedMetadataSource,
  ): Promise<boolean>;
  delete(snippetId: string): Promise<boolean>;
}
