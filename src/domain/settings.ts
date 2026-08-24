export type SnippetPasteMode = 'clipboard-only' | 'automatic';

export interface Settings {
  readonly defaultModel: string | null;
  readonly snippetPasteMode: SnippetPasteMode;
}
