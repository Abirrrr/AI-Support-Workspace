import {
  ENCODED_RASTER_RGBA_BYTES_PER_PIXEL,
  EncodedRasterSafetyError,
  inspectEncodedRaster,
  isEncodedRasterMediaType,
  MAX_ENCODED_RASTER_HEIGHT,
  MAX_ENCODED_RASTER_PIXELS,
  MAX_ENCODED_RASTER_RGBA_BYTES,
  MAX_ENCODED_RASTER_WIDTH,
  validateEncodedRasterDimensions,
  type EncodedRasterDimensions,
} from '../image/encoded-raster-safety';

export type ContextImageMediaType = 'image/png' | 'image/jpeg' | 'image/webp';

export interface DraftingImageAttachment {
  readonly id: string;
  readonly mediaType: ContextImageMediaType;
  readonly bytes: Uint8Array;
  readonly width: number;
  readonly height: number;
}

export interface ContextImageCandidate {
  readonly mediaType: string;
  readonly bytes: Uint8Array;
}

export interface ContextImageDecodeInput {
  readonly mediaType: ContextImageMediaType;
  readonly bytes: Uint8Array;
}

export interface ContextImageDecodeVerifier {
  verifyDecode(input: ContextImageDecodeInput): Promise<void>;
}

export type ContextImageIdFactory = () => string;

export const MAX_CONTEXT_IMAGE_ATTACHMENTS = 4;
export const MAX_CONTEXT_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_CONTEXT_IMAGE_TOTAL_BYTES = 20 * 1024 * 1024;
export const MAX_CONTEXT_IMAGE_WIDTH = MAX_ENCODED_RASTER_WIDTH;
export const MAX_CONTEXT_IMAGE_HEIGHT = MAX_ENCODED_RASTER_HEIGHT;
export const MAX_CONTEXT_IMAGE_PIXELS = MAX_ENCODED_RASTER_PIXELS;
export const CONTEXT_IMAGE_RGBA_BYTES_PER_PIXEL =
  ENCODED_RASTER_RGBA_BYTES_PER_PIXEL;
export const MAX_CONTEXT_IMAGE_RGBA_BYTES = MAX_ENCODED_RASTER_RGBA_BYTES;

export type ContextImageValidationErrorCode =
  | 'empty-acquisition'
  | 'unsupported-media-type'
  | 'invalid-bytes'
  | 'image-too-large'
  | 'combined-images-too-large'
  | 'too-many-images'
  | 'mime-signature-mismatch'
  | 'malformed-image'
  | 'animated-webp'
  | 'decode-failed'
  | 'dimensions-mismatch'
  | 'invalid-id';

export class ContextImageValidationError extends Error {
  constructor(readonly code: ContextImageValidationErrorCode) {
    super(`Context Image validation failed: ${code}.`);
    this.name = 'ContextImageValidationError';
  }
}

interface ValidatedCandidate extends EncodedRasterDimensions {
  readonly mediaType: ContextImageMediaType;
  readonly bytes: Uint8Array;
}

function defaultIdFactory(): string {
  return crypto.randomUUID();
}

function mapRasterError(error: unknown): never {
  if (error instanceof EncodedRasterSafetyError) {
    throw new ContextImageValidationError(
      error.code === 'signature-mismatch'
        ? 'mime-signature-mismatch'
        : error.code,
    );
  }
  throw error;
}

function inspectCandidate(
  mediaType: ContextImageMediaType,
  bytes: Uint8Array,
): EncodedRasterDimensions {
  try {
    return inspectEncodedRaster(mediaType, bytes);
  } catch (error) {
    return mapRasterError(error);
  }
}

function validateDimensions(
  width: number,
  height: number,
): EncodedRasterDimensions {
  try {
    return validateEncodedRasterDimensions(width, height);
  } catch (error) {
    return mapRasterError(error);
  }
}

function validateEncodedSize(byteLength: number): void {
  if (!Number.isSafeInteger(byteLength) || byteLength < 1) {
    throw new ContextImageValidationError('invalid-bytes');
  }
  if (byteLength > MAX_CONTEXT_IMAGE_BYTES) {
    throw new ContextImageValidationError('image-too-large');
  }
}

function validateCombinedSize(byteLengths: readonly number[]): void {
  let total = 0;
  for (const byteLength of byteLengths) {
    if (byteLength > MAX_CONTEXT_IMAGE_TOTAL_BYTES - total) {
      throw new ContextImageValidationError('combined-images-too-large');
    }
    total += byteLength;
  }
}

function validateExistingAttachment(attachment: DraftingImageAttachment): void {
  if (typeof attachment.id !== 'string' || attachment.id.length === 0) {
    throw new ContextImageValidationError('invalid-id');
  }
  if (!isEncodedRasterMediaType(attachment.mediaType)) {
    throw new ContextImageValidationError('unsupported-media-type');
  }
  if (!(attachment.bytes instanceof Uint8Array)) {
    throw new ContextImageValidationError('invalid-bytes');
  }
  validateEncodedSize(attachment.bytes.byteLength);
  const inspected = inspectCandidate(attachment.mediaType, attachment.bytes);
  const dimensions = validateDimensions(attachment.width, attachment.height);
  if (
    dimensions.width !== inspected.width ||
    dimensions.height !== inspected.height
  ) {
    throw new ContextImageValidationError('dimensions-mismatch');
  }
}

export class ContextImageAttachmentValidator {
  constructor(
    private readonly decodeVerifier: ContextImageDecodeVerifier,
    private readonly idFactory: ContextImageIdFactory = defaultIdFactory,
  ) {}

  async validateAcquisition(
    current: readonly DraftingImageAttachment[],
    candidates: readonly ContextImageCandidate[],
  ): Promise<readonly DraftingImageAttachment[]> {
    if (candidates.length === 0) {
      throw new ContextImageValidationError('empty-acquisition');
    }
    if (current.length + candidates.length > MAX_CONTEXT_IMAGE_ATTACHMENTS) {
      throw new ContextImageValidationError('too-many-images');
    }

    for (const attachment of current) validateExistingAttachment(attachment);
    if (new Set(current.map(({ id }) => id)).size !== current.length) {
      throw new ContextImageValidationError('invalid-id');
    }

    for (const candidate of candidates) {
      if (!isEncodedRasterMediaType(candidate.mediaType)) {
        throw new ContextImageValidationError('unsupported-media-type');
      }
      if (!(candidate.bytes instanceof Uint8Array)) {
        throw new ContextImageValidationError('invalid-bytes');
      }
    }

    validateCombinedSize([
      ...current.map(({ bytes }) => bytes.byteLength),
      ...candidates.map(({ bytes }) => bytes.byteLength),
    ]);

    const snapshots = candidates.map((candidate): ContextImageCandidate => {
      validateEncodedSize(candidate.bytes.byteLength);
      return {
        mediaType: candidate.mediaType,
        bytes: candidate.bytes.slice(),
      };
    });

    const validatedCandidates: ValidatedCandidate[] = [];
    for (const snapshot of snapshots) {
      const mediaType = snapshot.mediaType as ContextImageMediaType;
      const inspected = inspectCandidate(mediaType, snapshot.bytes);
      try {
        await this.decodeVerifier.verifyDecode({
          mediaType,
          bytes: snapshot.bytes.slice(),
        });
      } catch {
        throw new ContextImageValidationError('decode-failed');
      }
      validatedCandidates.push({
        mediaType,
        bytes: snapshot.bytes,
        width: inspected.width,
        height: inspected.height,
      });
    }

    const usedIds = new Set(current.map(({ id }) => id));
    const accepted = validatedCandidates.map(
      ({ mediaType, bytes, width, height }): DraftingImageAttachment => {
        const id = this.idFactory();
        if (typeof id !== 'string' || id.length === 0 || usedIds.has(id)) {
          throw new ContextImageValidationError('invalid-id');
        }
        usedIds.add(id);
        return { id, mediaType, bytes, width, height };
      },
    );

    return [...current, ...accepted];
  }
}
