export const SNIPPET_ASSET_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type SnippetAssetMimeType = (typeof SNIPPET_ASSET_MIME_TYPES)[number];

export const MAX_SNIPPET_ASSET_BYTES = 5_242_880;
export const MAX_SNIPPET_ASSET_BYTES_PER_SNIPPET = 20_971_520;
export const MAX_SNIPPET_ASSET_BYTES_PER_PROJECT = 41_943_040;

export interface SnippetAsset {
  readonly id: string;
  readonly snippetId: string;
  readonly mimeType: SnippetAssetMimeType;
  readonly blob: Blob;
  readonly byteSize: number;
  readonly originalFilename: string | null;
  readonly createdAt: string;
}

export type SnippetAssetDraft = Omit<SnippetAsset, 'snippetId'>;

export type SnippetAssetValidationErrorCode =
  | 'invalid-id'
  | 'invalid-owner'
  | 'unsupported-mime-type'
  | 'invalid-blob'
  | 'byte-size-mismatch'
  | 'asset-too-large'
  | 'invalid-filename'
  | 'invalid-created-at'
  | 'signature-mismatch';

export class SnippetAssetValidationError extends Error {
  constructor(readonly code: SnippetAssetValidationErrorCode) {
    super(`Snippet asset validation failed: ${code}.`);
    this.name = 'SnippetAssetValidationError';
  }
}

const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isCanonicalUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4_PATTERN.test(value);
}

export function isUtcIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    return new Date(value).toISOString() === value;
  } catch {
    return false;
  }
}

export function isSnippetAssetMimeType(
  value: unknown,
): value is SnippetAssetMimeType {
  return (
    typeof value === 'string' &&
    (SNIPPET_ASSET_MIME_TYPES as readonly string[]).includes(value)
  );
}

export function hasSnippetAssetSignature(
  mimeType: SnippetAssetMimeType,
  bytes: Uint8Array,
): boolean {
  if (mimeType === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }
  if (mimeType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

export async function validateSnippetAsset(
  value: SnippetAsset,
): Promise<SnippetAsset> {
  if (!isCanonicalUuid(value.id)) {
    throw new SnippetAssetValidationError('invalid-id');
  }
  if (!isCanonicalUuid(value.snippetId)) {
    throw new SnippetAssetValidationError('invalid-owner');
  }
  if (!isSnippetAssetMimeType(value.mimeType)) {
    throw new SnippetAssetValidationError('unsupported-mime-type');
  }
  if (!(value.blob instanceof Blob) || value.blob.type !== value.mimeType) {
    throw new SnippetAssetValidationError('invalid-blob');
  }
  if (
    !Number.isSafeInteger(value.byteSize) ||
    value.byteSize < 0 ||
    value.blob.size !== value.byteSize
  ) {
    throw new SnippetAssetValidationError('byte-size-mismatch');
  }
  if (value.byteSize > MAX_SNIPPET_ASSET_BYTES) {
    throw new SnippetAssetValidationError('asset-too-large');
  }
  if (
    value.originalFilename !== null &&
    typeof value.originalFilename !== 'string'
  ) {
    throw new SnippetAssetValidationError('invalid-filename');
  }
  if (!isUtcIsoTimestamp(value.createdAt)) {
    throw new SnippetAssetValidationError('invalid-created-at');
  }
  const bytes = new Uint8Array(await value.blob.arrayBuffer());
  if (!hasSnippetAssetSignature(value.mimeType, bytes)) {
    throw new SnippetAssetValidationError('signature-mismatch');
  }
  return {
    id: value.id,
    snippetId: value.snippetId,
    mimeType: value.mimeType,
    blob: value.blob,
    byteSize: value.byteSize,
    originalFilename: value.originalFilename,
    createdAt: value.createdAt,
  };
}

const DRAFT_VALIDATION_OWNER_ID = '00000000-0000-4000-8000-000000000000';

export async function validateSnippetAssetDraft(
  draft: SnippetAssetDraft,
): Promise<SnippetAssetDraft> {
  const validated = await validateSnippetAsset({
    ...draft,
    snippetId: DRAFT_VALIDATION_OWNER_ID,
  });
  return {
    id: validated.id,
    mimeType: validated.mimeType,
    blob: validated.blob,
    byteSize: validated.byteSize,
    originalFilename: validated.originalFilename,
    createdAt: validated.createdAt,
  };
}
