export const BACKUP_FORMAT = 'ai-support-workspace-backup' as const;
export const BACKUP_FORMAT_VERSION_1 = 1 as const;
export const BACKUP_FORMAT_VERSION_2 = 2 as const;
export const BACKUP_FORMAT_VERSION_3 = 3 as const;
export const BACKUP_FORMAT_VERSION = BACKUP_FORMAT_VERSION_3;
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
  readonly formatVersion: typeof BACKUP_FORMAT_VERSION_1;
  readonly exportedAt: string;
  readonly data: BackupDataV1;
}

export interface BackupKnowledgeRecordV2 {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly source: string;
}

export interface BackupSnippetRecordV2 {
  readonly id: string;
  readonly title: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly trigger: string | null;
}

export interface BackupSettingsV2 {
  readonly defaultModel: string | null;
}

export interface BackupDataV2 {
  readonly knowledge: readonly BackupKnowledgeRecordV2[];
  readonly snippets: readonly BackupSnippetRecordV2[];
  readonly settings: BackupSettingsV2;
}

export interface BackupFileV2 {
  readonly format: typeof BACKUP_FORMAT;
  readonly formatVersion: typeof BACKUP_FORMAT_VERSION_2;
  readonly exportedAt: string;
  readonly data: BackupDataV2;
}

export interface BackupKnowledgeRecordV3 {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly source: string;
}

export interface BackupPlainSnippetContentV3 {
  readonly kind: 'plain';
  readonly text: string;
}

export interface BackupRichSnippetTextV3 {
  readonly type: 'text';
  readonly text: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

export interface BackupRichSnippetLinkV3 {
  readonly type: 'link';
  readonly text: string;
  readonly url: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

export type BackupRichSnippetInlineV3 =
  BackupRichSnippetTextV3 | BackupRichSnippetLinkV3;

export interface BackupRichSnippetParagraphV3 {
  readonly type: 'paragraph';
  readonly children: readonly BackupRichSnippetInlineV3[];
}

export interface BackupRichSnippetImageReferenceV3 {
  readonly type: 'reference';
  readonly referenceType: 'image';
  readonly label: string;
  readonly url: string;
}

export type BackupRichSnippetBlockV3 =
  BackupRichSnippetParagraphV3 | BackupRichSnippetImageReferenceV3;

export interface BackupRichSnippetContentV3 {
  readonly kind: 'rich';
  readonly blocks: readonly BackupRichSnippetBlockV3[];
}

export type BackupSnippetContentV3 =
  BackupPlainSnippetContentV3 | BackupRichSnippetContentV3;

export interface BackupSnippetRecordV3 {
  readonly id: string;
  readonly title: string;
  readonly content: BackupSnippetContentV3;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly trigger: string | null;
}

export interface BackupSettingsV3 {
  readonly defaultModel: string | null;
}

export interface BackupDataV3 {
  readonly knowledge: readonly BackupKnowledgeRecordV3[];
  readonly snippets: readonly BackupSnippetRecordV3[];
  readonly settings: BackupSettingsV3;
}

export interface BackupFileV3 {
  readonly format: typeof BACKUP_FORMAT;
  readonly formatVersion: typeof BACKUP_FORMAT_VERSION_3;
  readonly exportedAt: string;
  readonly data: BackupDataV3;
}

export type BackupFile = BackupFileV1 | BackupFileV2 | BackupFileV3;

export interface BackupImportPreview {
  readonly filename: string;
  readonly exportedAt: string;
  readonly knowledgeCount: number;
  readonly snippetCount: number;
  readonly defaultModel: string | null;
  readonly triggerWarning: string | null;
}
