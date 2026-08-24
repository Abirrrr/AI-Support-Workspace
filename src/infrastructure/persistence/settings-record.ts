export const GLOBAL_SETTINGS_ID = 'global' as const;

export interface SettingsRecord {
  readonly id: typeof GLOBAL_SETTINGS_ID;
  readonly defaultModel: string | null;
  readonly snippetPasteMode?: unknown;
}
