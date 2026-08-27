export interface GenerateSnippetTagsRequest {
  readonly input: string;
}

/** Provider-neutral M14-O port. Production provider wiring is deferred. */
export interface GenerateSnippetTags {
  generate(
    request: GenerateSnippetTagsRequest,
    signal?: AbortSignal,
  ): Promise<string>;
}
