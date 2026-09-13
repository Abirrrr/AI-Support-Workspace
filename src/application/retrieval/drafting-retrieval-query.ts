export interface DraftingRetrievalQueryInput {
  readonly merchantContext?: string;
  readonly gist?: string;
}

export function buildDraftingRetrievalQuery(
  input: DraftingRetrievalQueryInput,
): string {
  const merchantContext = input.merchantContext?.trim() ?? '';
  const gist = input.gist?.trim() ?? '';

  if (merchantContext.length > 0 && gist.length > 0) {
    return `${merchantContext}\n\n${gist}`;
  }

  return merchantContext || gist;
}
