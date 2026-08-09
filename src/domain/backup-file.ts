export const BACKUP_FORMAT = 'ai-support-workspace-backup' as const;
export const BACKUP_FORMAT_VERSION_1 = 1 as const;
export const BACKUP_FORMAT_VERSION_2 = 2 as const;
export const BACKUP_FORMAT_VERSION_3 = 3 as const;
export const BACKUP_FORMAT_VERSION_4 = 4 as const;
export const BACKUP_FORMAT_VERSION_5 = 5 as const;
export const BACKUP_FORMAT_VERSION = BACKUP_FORMAT_VERSION_5;
export const MAX_LEGACY_BACKUP_BYTES = 26_214_400;
export const MAX_BACKUP_V4_BYTES = 100_663_296;
export const MAX_BACKUP_V5_BYTES = 100_663_296;
export const MAX_BACKUP_BYTES = MAX_BACKUP_V5_BYTES;

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

export interface BackupKnowledgeRecordV4 {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly source: string;
}

export interface BackupPlainSnippetContentV4 {
  readonly kind: 'plain';
  readonly text: string;
}

export interface BackupRichSnippetTextV4 {
  readonly type: 'text';
  readonly text: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

export interface BackupRichSnippetLinkV4 {
  readonly type: 'link';
  readonly text: string;
  readonly url: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

export type BackupRichSnippetInlineV4 =
  BackupRichSnippetTextV4 | BackupRichSnippetLinkV4;

export interface BackupRichSnippetParagraphV4 {
  readonly type: 'paragraph';
  readonly children: readonly BackupRichSnippetInlineV4[];
}

export interface BackupRichSnippetImageReferenceV4 {
  readonly type: 'reference';
  readonly referenceType: 'image';
  readonly label: string;
  readonly url: string;
}

export interface BackupRichSnippetLocalImageV4 {
  readonly type: 'image';
  readonly assetId: string;
  readonly altText: string;
}

export type BackupRichSnippetBlockV4 =
  | BackupRichSnippetParagraphV4
  | BackupRichSnippetImageReferenceV4
  | BackupRichSnippetLocalImageV4;

export interface BackupRichSnippetContentV4 {
  readonly kind: 'rich';
  readonly blocks: readonly BackupRichSnippetBlockV4[];
}

export type BackupSnippetContentV4 =
  BackupPlainSnippetContentV4 | BackupRichSnippetContentV4;

export interface BackupSnippetRecordV4 {
  readonly id: string;
  readonly title: string;
  readonly content: BackupSnippetContentV4;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly trigger: string | null;
}

export interface BackupSnippetAssetRecordV4 {
  readonly id: string;
  readonly snippetId: string;
  readonly mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  readonly byteSize: number;
  readonly originalFilename: string | null;
  readonly createdAt: string;
  readonly encoding: 'base64';
  readonly data: string;
}

export interface BackupSettingsV4 {
  readonly defaultModel: string | null;
}

export interface BackupDataV4 {
  readonly knowledge: readonly BackupKnowledgeRecordV4[];
  readonly snippets: readonly BackupSnippetRecordV4[];
  readonly snippetAssets: readonly BackupSnippetAssetRecordV4[];
  readonly settings: BackupSettingsV4;
}

export interface BackupFileV4 {
  readonly format: typeof BACKUP_FORMAT;
  readonly formatVersion: typeof BACKUP_FORMAT_VERSION_4;
  readonly exportedAt: string;
  readonly data: BackupDataV4;
}

export interface BackupKnowledgeRecordV5 {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly source: string;
}

export interface BackupPlainSnippetContentV5 {
  readonly kind: 'plain';
  readonly text: string;
}

export interface BackupRichSnippetTextV5 {
  readonly type: 'text';
  readonly text: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

export interface BackupRichSnippetLinkV5 {
  readonly type: 'link';
  readonly text: string;
  readonly url: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

export type BackupRichSnippetInlineV5 =
  BackupRichSnippetTextV5 | BackupRichSnippetLinkV5;

export interface BackupRichSnippetParagraphV5 {
  readonly type: 'paragraph';
  readonly children: readonly BackupRichSnippetInlineV5[];
}

export interface BackupRichSnippetImageReferenceV5 {
  readonly type: 'reference';
  readonly referenceType: 'image';
  readonly label: string;
  readonly url: string;
}

export interface BackupRichSnippetLocalImageV5 {
  readonly type: 'image';
  readonly assetId: string;
  readonly altText: string;
}

export interface BackupRichSnippetListItemV5 {
  readonly children: readonly BackupRichSnippetInlineV5[];
}

export interface BackupRichSnippetListV5 {
  readonly type: 'list';
  readonly listType: 'unordered' | 'ordered';
  readonly items: readonly BackupRichSnippetListItemV5[];
}

export type BackupRichSnippetBlockV5 =
  | BackupRichSnippetParagraphV5
  | BackupRichSnippetImageReferenceV5
  | BackupRichSnippetLocalImageV5
  | BackupRichSnippetListV5;

export interface BackupRichSnippetContentV5 {
  readonly kind: 'rich';
  readonly blocks: readonly BackupRichSnippetBlockV5[];
}

export interface BackupImageSnippetContentV5 {
  readonly kind: 'image';
  readonly assetId: string;
}

export type BackupSnippetContentV5 =
  | BackupPlainSnippetContentV5
  | BackupRichSnippetContentV5
  | BackupImageSnippetContentV5;

export interface BackupSnippetRecordV5 {
  readonly id: string;
  readonly title: string;
  readonly content: BackupSnippetContentV5;
  readonly tags: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly trigger: string | null;
}

export interface BackupSnippetAssetRecordV5 {
  readonly id: string;
  readonly snippetId: string;
  readonly mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  readonly byteSize: number;
  readonly originalFilename: string | null;
  readonly createdAt: string;
  readonly encoding: 'base64';
  readonly data: string;
}

export interface BackupSettingsV5 {
  readonly defaultModel: string | null;
}

export interface BackupDataV5 {
  readonly knowledge: readonly BackupKnowledgeRecordV5[];
  readonly snippets: readonly BackupSnippetRecordV5[];
  readonly snippetAssets: readonly BackupSnippetAssetRecordV5[];
  readonly settings: BackupSettingsV5;
}

export interface BackupFileV5 {
  readonly format: typeof BACKUP_FORMAT;
  readonly formatVersion: typeof BACKUP_FORMAT_VERSION_5;
  readonly exportedAt: string;
  readonly data: BackupDataV5;
}

export type BackupFile =
  BackupFileV1 | BackupFileV2 | BackupFileV3 | BackupFileV4 | BackupFileV5;

export interface BackupImportPreview {
  readonly filename: string;
  readonly formatVersion: 1 | 2 | 3 | 4 | 5;
  readonly exportedAt: string;
  readonly knowledgeCount: number;
  readonly snippetCount: number;
  readonly assetCount: number;
  readonly defaultModel: string | null;
  readonly triggerWarning: string | null;
}
