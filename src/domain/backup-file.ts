export const BACKUP_FORMAT = 'ai-support-workspace-backup' as const;
export const BACKUP_FORMAT_VERSION = 1 as const;
export const MAX_BACKUP_BYTES = 26_214_400;

export interface BackupKnowledgeRecordV1 {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly source: string;
}

export interface BackupSnippetRecordV1 {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface BackupSettingsV1 {
  readonly defaultModel: string | null;
}

export interface BackupDataV1 {
  readonly knowledge: readonly BackupKnowledgeRecordV1[];
  readonly snippets: readonly BackupSnippetRecordV1[];
  readonly settings: BackupSettingsV1;
}

export interface BackupFileV1 {
  readonly format: typeof BACKUP_FORMAT;
  readonly formatVersion: typeof BACKUP_FORMAT_VERSION;
  readonly exportedAt: string;
  readonly data: BackupDataV1;
}

export interface BackupImportPreview {
  readonly filename: string;
  readonly exportedAt: string;
  readonly knowledgeCount: number;
  readonly snippetCount: number;
  readonly defaultModel: string | null;
}
