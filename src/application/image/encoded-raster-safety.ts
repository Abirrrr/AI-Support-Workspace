export const MAX_ENCODED_RASTER_WIDTH = 8_192;
export const MAX_ENCODED_RASTER_HEIGHT = 8_192;
export const MAX_ENCODED_RASTER_PIXELS = 16_777_216;
export const ENCODED_RASTER_RGBA_BYTES_PER_PIXEL = 4;
export const MAX_ENCODED_RASTER_RGBA_BYTES = 67_108_864;

export const ENCODED_RASTER_MEDIA_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type EncodedRasterMediaType =
  (typeof ENCODED_RASTER_MEDIA_TYPES)[number];

export interface EncodedRasterDimensions {
  readonly width: number;
  readonly height: number;
}

export interface EncodedRasterInspection extends EncodedRasterDimensions {
  readonly mediaType: EncodedRasterMediaType;
}

export type EncodedRasterSafetyErrorCode =
  | 'malformed-image'
  | 'signature-mismatch'
  | 'animated-webp'
  | 'image-too-large';

export class EncodedRasterSafetyError extends Error {
  constructor(readonly code: EncodedRasterSafetyErrorCode) {
    super(`Encoded raster validation failed: ${code}.`);
    this.name = 'EncodedRasterSafetyError';
  }
}

export function isEncodedRasterMediaType(
  value: unknown,
): value is EncodedRasterMediaType {
  return (
    typeof value === 'string' &&
    (ENCODED_RASTER_MEDIA_TYPES as readonly string[]).includes(value)
  );
}

export function hasEncodedRasterSignature(
  mediaType: EncodedRasterMediaType,
  bytes: Uint8Array,
): boolean {
  if (mediaType === 'image/png') {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((byte, index) => bytes[index] === byte);
  }
  if (mediaType === 'image/jpeg') {
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

export function validateEncodedRasterDimensions(
  width: number,
  height: number,
): EncodedRasterDimensions {
  if (
    !Number.isSafeInteger(width) ||
    !Number.isSafeInteger(height) ||
    width <= 0 ||
    height <= 0
  ) {
    throw new EncodedRasterSafetyError('malformed-image');
  }
  if (
    width > MAX_ENCODED_RASTER_WIDTH ||
    height > MAX_ENCODED_RASTER_HEIGHT ||
    width > Math.floor(MAX_ENCODED_RASTER_PIXELS / height)
  ) {
    throw new EncodedRasterSafetyError('image-too-large');
  }
  const pixels = width * height;
  if (
    pixels >
    Math.floor(
      MAX_ENCODED_RASTER_RGBA_BYTES / ENCODED_RASTER_RGBA_BYTES_PER_PIXEL,
    )
  ) {
    throw new EncodedRasterSafetyError('image-too-large');
  }
  return { width, height };
}

function uint16BigEndian(bytes: Uint8Array, offset: number): number {
  const high = bytes[offset];
  const low = bytes[offset + 1];
  if (high === undefined || low === undefined) {
    throw new EncodedRasterSafetyError('malformed-image');
  }
  return high * 0x100 + low;
}

function uint32BigEndian(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (offset < 0 || offset + 4 > bytes.byteLength) {
    throw new EncodedRasterSafetyError('malformed-image');
  }
  return view.getUint32(offset, false);
}

function uint32LittleEndian(bytes: Uint8Array, offset: number): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (offset < 0 || offset + 4 > bytes.byteLength) {
    throw new EncodedRasterSafetyError('malformed-image');
  }
  return view.getUint32(offset, true);
}

function uint24LittleEndian(bytes: Uint8Array, offset: number): number {
  const first = bytes[offset];
  const second = bytes[offset + 1];
  const third = bytes[offset + 2];
  if (first === undefined || second === undefined || third === undefined) {
    throw new EncodedRasterSafetyError('malformed-image');
  }
  return first + second * 0x100 + third * 0x10000;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  if (offset < 0 || offset + length > bytes.byteLength) {
    throw new EncodedRasterSafetyError('malformed-image');
  }
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function inspectPng(bytes: Uint8Array): EncodedRasterDimensions {
  if (
    bytes.byteLength < 24 ||
    uint32BigEndian(bytes, 8) !== 13 ||
    ascii(bytes, 12, 4) !== 'IHDR'
  ) {
    throw new EncodedRasterSafetyError('malformed-image');
  }
  return validateEncodedRasterDimensions(
    uint32BigEndian(bytes, 16),
    uint32BigEndian(bytes, 20),
  );
}

const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
]);

function inspectJpeg(bytes: Uint8Array): EncodedRasterDimensions {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) {
    throw new EncodedRasterSafetyError('malformed-image');
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
      throw new EncodedRasterSafetyError('malformed-image');
    }
    if (JPEG_SOF_MARKERS.has(marker)) {
      if (length < 7) throw new EncodedRasterSafetyError('malformed-image');
      return validateEncodedRasterDimensions(
        uint16BigEndian(bytes, offset + 5),
        uint16BigEndian(bytes, offset + 3),
      );
    }
    offset += length;
  }
  throw new EncodedRasterSafetyError('malformed-image');
}

function inspectWebp(bytes: Uint8Array): EncodedRasterDimensions {
  if (
    bytes.byteLength < 20 ||
    ascii(bytes, 0, 4) !== 'RIFF' ||
    ascii(bytes, 8, 4) !== 'WEBP'
  ) {
    throw new EncodedRasterSafetyError('malformed-image');
  }
  const declaredEnd = uint32LittleEndian(bytes, 4) + 8;
  if (declaredEnd !== bytes.byteLength) {
    throw new EncodedRasterSafetyError('malformed-image');
  }
  let offset = 12;
  while (offset + 8 <= declaredEnd) {
    const type = ascii(bytes, offset, 4);
    const size = uint32LittleEndian(bytes, offset + 4);
    const dataOffset = offset + 8;
    const dataEnd = dataOffset + size;
    if (!Number.isSafeInteger(dataEnd) || dataEnd > declaredEnd) {
      throw new EncodedRasterSafetyError('malformed-image');
    }
    if (type === 'VP8X') {
      if (size < 10) throw new EncodedRasterSafetyError('malformed-image');
      const flags = bytes[dataOffset];
      if (flags === undefined) {
        throw new EncodedRasterSafetyError('malformed-image');
      }
      if ((flags & 0x02) !== 0) {
        throw new EncodedRasterSafetyError('animated-webp');
      }
      return validateEncodedRasterDimensions(
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
        throw new EncodedRasterSafetyError('malformed-image');
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
        throw new EncodedRasterSafetyError('malformed-image');
      }
      return validateEncodedRasterDimensions(
        (widthLow + widthHigh * 0x100) & 0x3fff,
        (heightLow + heightHigh * 0x100) & 0x3fff,
      );
    }
    if (type === 'VP8L') {
      if (size < 5 || bytes[dataOffset] !== 0x2f) {
        throw new EncodedRasterSafetyError('malformed-image');
      }
      const b1 = bytes[dataOffset + 1] ?? 0;
      const b2 = bytes[dataOffset + 2] ?? 0;
      const b3 = bytes[dataOffset + 3] ?? 0;
      const b4 = bytes[dataOffset + 4] ?? 0;
      return validateEncodedRasterDimensions(
        1 + b1 + ((b2 & 0x3f) << 8),
        1 + (b2 >> 6) + (b3 << 2) + ((b4 & 0x0f) << 10),
      );
    }
    offset = dataEnd + (size % 2);
  }
  throw new EncodedRasterSafetyError('malformed-image');
}

export function inspectEncodedRasterDimensions(
  mediaType: EncodedRasterMediaType,
  bytes: Uint8Array,
): EncodedRasterDimensions {
  if (mediaType === 'image/png') return inspectPng(bytes);
  if (mediaType === 'image/jpeg') return inspectJpeg(bytes);
  return inspectWebp(bytes);
}

export function inspectEncodedRaster(
  mediaType: EncodedRasterMediaType,
  bytes: Uint8Array,
): EncodedRasterInspection {
  if (!hasEncodedRasterSignature(mediaType, bytes)) {
    throw new EncodedRasterSafetyError('signature-mismatch');
  }
  return {
    mediaType,
    ...inspectEncodedRasterDimensions(mediaType, bytes),
  };
}
