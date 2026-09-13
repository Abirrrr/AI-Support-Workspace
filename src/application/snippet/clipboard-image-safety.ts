import type { SnippetAssetMimeType } from '../../domain/snippet-asset';
import {
  ENCODED_RASTER_RGBA_BYTES_PER_PIXEL,
  EncodedRasterSafetyError,
  inspectEncodedRasterDimensions,
  MAX_ENCODED_RASTER_HEIGHT,
  MAX_ENCODED_RASTER_PIXELS,
  MAX_ENCODED_RASTER_RGBA_BYTES,
  MAX_ENCODED_RASTER_WIDTH,
  validateEncodedRasterDimensions,
  type EncodedRasterDimensions,
} from '../image/encoded-raster-safety';

export const MAX_CLIPBOARD_IMAGE_WIDTH = MAX_ENCODED_RASTER_WIDTH;
export const MAX_CLIPBOARD_IMAGE_HEIGHT = MAX_ENCODED_RASTER_HEIGHT;
export const MAX_CLIPBOARD_IMAGE_PIXELS = MAX_ENCODED_RASTER_PIXELS;
export const CLIPBOARD_DECODE_BYTES_PER_PIXEL =
  ENCODED_RASTER_RGBA_BYTES_PER_PIXEL;
export const MAX_CLIPBOARD_DECODED_RGBA_BYTES = MAX_ENCODED_RASTER_RGBA_BYTES;
export const MAX_CLIPBOARD_RASTER_SURFACES = 2;
export const MAX_CLIPBOARD_RASTER_WORKING_SET_BYTES = 134_217_728;

export type ClipboardImageDimensions = EncodedRasterDimensions;

export type ClipboardImageSafetyErrorCode =
  'malformed-image' | 'animated-webp' | 'image-too-large';

export class ClipboardImageSafetyError extends Error {
  constructor(readonly code: ClipboardImageSafetyErrorCode) {
    super(
      code === 'image-too-large'
        ? 'Image is too large for clipboard delivery.'
        : code === 'animated-webp'
          ? 'Animated WebP is not supported for clipboard delivery.'
          : 'Image cannot be prepared for clipboard delivery.',
    );
    this.name = 'ClipboardImageSafetyError';
  }
}

function mapEncodedRasterError(error: unknown): never {
  if (error instanceof EncodedRasterSafetyError) {
    throw new ClipboardImageSafetyError(
      error.code === 'animated-webp'
        ? 'animated-webp'
        : error.code === 'image-too-large'
          ? 'image-too-large'
          : 'malformed-image',
    );
  }
  throw error;
}

export function validateClipboardImageDimensions(
  width: number,
  height: number,
): ClipboardImageDimensions {
  try {
    return validateEncodedRasterDimensions(width, height);
  } catch (error) {
    return mapEncodedRasterError(error);
  }
}

export function inspectClipboardImageDimensions(
  mimeType: SnippetAssetMimeType,
  bytes: Uint8Array,
): ClipboardImageDimensions {
  try {
    return inspectEncodedRasterDimensions(mimeType, bytes);
  } catch (error) {
    return mapEncodedRasterError(error);
  }
}
