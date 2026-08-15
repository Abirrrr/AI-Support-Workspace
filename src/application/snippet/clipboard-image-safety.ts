import type { SnippetAssetMimeType } from '../../domain/snippet-asset';

export const MAX_CLIPBOARD_IMAGE_WIDTH = 8_192;
export const MAX_CLIPBOARD_IMAGE_HEIGHT = 8_192;
export const MAX_CLIPBOARD_IMAGE_PIXELS = 16_777_216;
export const CLIPBOARD_DECODE_BYTES_PER_PIXEL = 4;
export const MAX_CLIPBOARD_DECODED_RGBA_BYTES = 67_108_864;
export const MAX_CLIPBOARD_RASTER_SURFACES = 2;
export const MAX_CLIPBOARD_RASTER_WORKING_SET_BYTES = 134_217_728;

export interface ClipboardImageDimensions {
  readonly width: number;
  readonly height: number;
}

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

export function validateClipboardImageDimensions(
  width: number,
  height: number,
): ClipboardImageDimensions {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new ClipboardImageSafetyError('malformed-image');
  }
  if (
    width > MAX_CLIPBOARD_IMAGE_WIDTH ||
    height > MAX_CLIPBOARD_IMAGE_HEIGHT ||
    width > Math.floor(MAX_CLIPBOARD_IMAGE_PIXELS / height)
  ) {
    throw new ClipboardImageSafetyError('image-too-large');
  }
  const pixels = width * height;
  if (
    pixels >
    Math.floor(
      MAX_CLIPBOARD_DECODED_RGBA_BYTES / CLIPBOARD_DECODE_BYTES_PER_PIXEL,
    )
  ) {
    throw new ClipboardImageSafetyError('image-too-large');
  }
  return { width, height };
}

function uint16BigEndian(bytes: Uint8Array, offset: number): number {
  const high = bytes[offset];
  const low = bytes[offset + 1];
  if (high === undefined || low === undefined) {
    throw new ClipboardImageSafetyError('malformed-image');
  }
  return high * 0x100 + low;
}

function uint32BigEndian(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (offset < 0 || offset + 4 > bytes.byteLength) {
    throw new ClipboardImageSafetyError('malformed-image');
  }
  return view.getUint32(offset, false);
}

function uint32LittleEndian(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (offset < 0 || offset + 4 > bytes.byteLength) {
    throw new ClipboardImageSafetyError('malformed-image');
  }
  return view.getUint32(offset, true);
}

function uint24LittleEndian(bytes: Uint8Array, offset: number): number {
  const first = bytes[offset];
  const second = bytes[offset + 1];
  const third = bytes[offset + 2];
  if (first === undefined || second === undefined || third === undefined) {
    throw new ClipboardImageSafetyError('malformed-image');
  }
  return first + second * 0x100 + third * 0x10000;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  if (offset < 0 || offset + length > bytes.byteLength) {
    throw new ClipboardImageSafetyError('malformed-image');
  }
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function inspectPng(bytes: Uint8Array): ClipboardImageDimensions {
  if (
    bytes.byteLength < 24 ||
    uint32BigEndian(bytes, 8) !== 13 ||
    ascii(bytes, 12, 4) !== 'IHDR'
  ) {
    throw new ClipboardImageSafetyError('malformed-image');
  }
  return validateClipboardImageDimensions(
    uint32BigEndian(bytes, 16),
    uint32BigEndian(bytes, 20),
  );
}

const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function inspectJpeg(bytes: Uint8Array): ClipboardImageDimensions {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new ClipboardImageSafetyError('malformed-image');
  }
  let offset = 2;
  while (offset < bytes.byteLength) {
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    if (marker === undefined || marker === 0x00) break;
    offset += 1;
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 2 > bytes.byteLength) break;
    const length = uint16BigEndian(bytes, offset);
    if (length < 2 || offset + length > bytes.byteLength) {
      throw new ClipboardImageSafetyError('malformed-image');
    }
    if (JPEG_SOF_MARKERS.has(marker)) {
      if (length < 7) throw new ClipboardImageSafetyError('malformed-image');
      return validateClipboardImageDimensions(
        uint16BigEndian(bytes, offset + 5),
        uint16BigEndian(bytes, offset + 3),
      );
    }
    offset += length;
  }
  throw new ClipboardImageSafetyError('malformed-image');
}

function inspectWebp(bytes: Uint8Array): ClipboardImageDimensions {
  if (
    bytes.byteLength < 20 ||
    ascii(bytes, 0, 4) !== 'RIFF' ||
    ascii(bytes, 8, 4) !== 'WEBP'
  ) {
    throw new ClipboardImageSafetyError('malformed-image');
  }
  const declaredEnd = uint32LittleEndian(bytes, 4) + 8;
  if (declaredEnd !== bytes.byteLength) {
    throw new ClipboardImageSafetyError('malformed-image');
  }
  let offset = 12;
  while (offset + 8 <= declaredEnd) {
    const type = ascii(bytes, offset, 4);
    const size = uint32LittleEndian(bytes, offset + 4);
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + size;
    if (!Number.isSafeInteger(dataEnd) || dataEnd > declaredEnd) {
      throw new ClipboardImageSafetyError('malformed-image');
    }
    if (type === 'VP8X') {
      if (size < 10) throw new ClipboardImageSafetyError('malformed-image');
      const flags = bytes[dataOffset];
      if (flags === undefined) {
        throw new ClipboardImageSafetyError('malformed-image');
      }
      if ((flags & 0x02) !== 0) {
        throw new ClipboardImageSafetyError('animated-webp');
      }
      return validateClipboardImageDimensions(
        uint24LittleEndian(bytes, dataOffset + 4) + 1,
        uint24LittleEndian(bytes, dataOffset + 7) + 1,
      );
    }
    if (type === 'VP8 ') {
      if (
        size < 10 ||
        bytes[dataOffset + 3] !== 0x9d ||
        bytes[dataOffset + 4] !== 0x01 ||
        bytes[dataOffset + 5] !== 0x2a
      ) {
        throw new ClipboardImageSafetyError('malformed-image');
      }
      const widthLow = bytes[dataOffset + 6];
      const widthHigh = bytes[dataOffset + 7];
      const heightLow = bytes[dataOffset + 8];
      const heightHigh = bytes[dataOffset + 9];
      if (
        widthLow === undefined ||
        widthHigh === undefined ||
        heightLow === undefined ||
        heightHigh === undefined
      ) {
        throw new ClipboardImageSafetyError('malformed-image');
      }
      return validateClipboardImageDimensions(
        (widthLow + widthHigh * 0x100) & 0x3fff,
        (heightLow + heightHigh * 0x100) & 0x3fff,
      );
    }
    if (type === 'VP8L') {
      if (size < 5 || bytes[dataOffset] !== 0x2f) {
        throw new ClipboardImageSafetyError('malformed-image');
      }
      const b1 = bytes[dataOffset + 1] ?? 0;
      const b2 = bytes[dataOffset + 2] ?? 0;
      const b3 = bytes[dataOffset + 3] ?? 0;
      const b4 = bytes[dataOffset + 4] ?? 0;
      return validateClipboardImageDimensions(
        1 + b1 + ((b2 & 0x3f) << 8),
        1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10),
      );
    }
    offset = dataEnd + (size % 2);
  }
  throw new ClipboardImageSafetyError('malformed-image');
}

export function inspectClipboardImageDimensions(
  mimeType: SnippetAssetMimeType,
  bytes: Uint8Array,
): ClipboardImageDimensions {
  if (mimeType === 'image/png') return inspectPng(bytes);
  if (mimeType === 'image/jpeg') return inspectJpeg(bytes);
  return inspectWebp(bytes);
}
