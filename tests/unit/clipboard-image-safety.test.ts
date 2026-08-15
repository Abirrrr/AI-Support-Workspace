import { describe, expect, it } from 'vitest';

import {
  CLIPBOARD_DECODE_BYTES_PER_PIXEL,
  ClipboardImageSafetyError,
  inspectClipboardImageDimensions,
  MAX_CLIPBOARD_DECODED_RGBA_BYTES,
  MAX_CLIPBOARD_IMAGE_HEIGHT,
  MAX_CLIPBOARD_IMAGE_PIXELS,
  MAX_CLIPBOARD_IMAGE_WIDTH,
  MAX_CLIPBOARD_RASTER_SURFACES,
  MAX_CLIPBOARD_RASTER_WORKING_SET_BYTES,
  validateClipboardImageDimensions,
} from '../../src/application/snippet/clipboard-image-safety';

function setUint32(
  bytes: Uint8Array,
  offset: number,
  value: number,
  little = false,
) {
  new DataView(bytes.buffer).setUint32(offset, value, little);
}

function png(width: number, height: number) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  setUint32(bytes, 8, 13);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  setUint32(bytes, 16, width);
  setUint32(bytes, 20, height);
  return bytes;
}

function jpeg(width: number, height: number) {
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0x00,
    0x07,
    0x08,
    height >> 8,
    height & 0xff,
    width >> 8,
    width & 0xff,
    0xff,
    0xd9,
  ]);
}

function webpVp8x(width: number, height: number, animated = false) {
  const bytes = new Uint8Array(30);
  bytes.set([0x52, 0x49, 0x46, 0x46]);
  setUint32(bytes, 4, 22, true);
  bytes.set([0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x58], 8);
  setUint32(bytes, 16, 10, true);
  bytes[20] = animated ? 0x02 : 0;
  const widthMinusOne = width - 1;
  const heightMinusOne = height - 1;
  bytes.set(
    [
      widthMinusOne & 0xff,
      (widthMinusOne >> 8) & 0xff,
      (widthMinusOne >> 16) & 0xff,
    ],
    24,
  );
  bytes.set(
    [
      heightMinusOne & 0xff,
      (heightMinusOne >> 8) & 0xff,
      (heightMinusOne >> 16) & 0xff,
    ],
    27,
  );
  return bytes;
}

function webpVp8(width: number, height: number) {
  const bytes = new Uint8Array(30);
  bytes.set([0x52, 0x49, 0x46, 0x46]);
  setUint32(bytes, 4, 22, true);
  bytes.set([0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20], 8);
  setUint32(bytes, 16, 10, true);
  bytes.set([0, 0, 0, 0x9d, 0x01, 0x2a], 20);
  bytes[26] = width & 0xff;
  bytes[27] = (width >> 8) & 0x3f;
  bytes[28] = height & 0xff;
  bytes[29] = (height >> 8) & 0x3f;
  return bytes;
}

function webpVp8l(width: number, height: number) {
  const bytes = new Uint8Array(26);
  bytes.set([0x52, 0x49, 0x46, 0x46]);
  setUint32(bytes, 4, 18, true);
  bytes.set([0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x4c], 8);
  setUint32(bytes, 16, 5, true);
  const widthMinusOne = width - 1;
  const heightMinusOne = height - 1;
  bytes[20] = 0x2f;
  bytes[21] = widthMinusOne & 0xff;
  bytes[22] = ((widthMinusOne >> 8) & 0x3f) | ((heightMinusOne & 0x03) << 6);
  bytes[23] = (heightMinusOne >> 2) & 0xff;
  bytes[24] = (heightMinusOne >> 10) & 0x0f;
  return bytes;
}

describe('Decision 42 clipboard image safety', () => {
  it('freezes the approved constants and two-surface working-set policy', () => {
    expect(MAX_CLIPBOARD_IMAGE_WIDTH).toBe(8_192);
    expect(MAX_CLIPBOARD_IMAGE_HEIGHT).toBe(8_192);
    expect(MAX_CLIPBOARD_IMAGE_PIXELS).toBe(16_777_216);
    expect(CLIPBOARD_DECODE_BYTES_PER_PIXEL).toBe(4);
    expect(MAX_CLIPBOARD_DECODED_RGBA_BYTES).toBe(67_108_864);
    expect(MAX_CLIPBOARD_RASTER_SURFACES).toBe(2);
    expect(MAX_CLIPBOARD_RASTER_WORKING_SET_BYTES).toBe(134_217_728);
  });

  it.each([
    [1, 1],
    [8_192, 1],
    [8_192, 2_048],
    [2_048, 8_192],
    [4_096, 4_096],
  ])('accepts %i x %i at or within every limit', (width, height) => {
    expect(validateClipboardImageDimensions(width, height)).toEqual({
      width,
      height,
    });
  });

  it.each([
    [8_193, 1],
    [1, 8_193],
    [8_192, 2_049],
    [0, 1],
    [1, 0],
    [Number.MAX_SAFE_INTEGER, 2],
    [Number.POSITIVE_INFINITY, 1],
  ])('rejects hostile or oversized %s x %s safely', (width, height) => {
    expect(() => validateClipboardImageDimensions(width, height)).toThrow(
      ClipboardImageSafetyError,
    );
  });

  it('extracts PNG IHDR, JPEG SOF, and WebP VP8X dimensions before decode', () => {
    expect(
      inspectClipboardImageDimensions('image/png', png(8192, 2048)),
    ).toEqual({
      width: 8192,
      height: 2048,
    });
    expect(
      inspectClipboardImageDimensions('image/jpeg', jpeg(1920, 1080)),
    ).toEqual({
      width: 1920,
      height: 1080,
    });
    expect(
      inspectClipboardImageDimensions('image/webp', webpVp8x(2560, 1440)),
    ).toEqual({
      width: 2560,
      height: 1440,
    });
  });

  it('extracts still WebP VP8 and VP8L dimensions without raster decoding', () => {
    expect(
      inspectClipboardImageDimensions('image/webp', webpVp8(640, 480)),
    ).toEqual({ width: 640, height: 480 });
    expect(
      inspectClipboardImageDimensions('image/webp', webpVp8l(1024, 768)),
    ).toEqual({ width: 1024, height: 768 });
  });

  it('fails closed for truncated/malformed formats and JPEG without SOF', () => {
    expect(() =>
      inspectClipboardImageDimensions('image/png', png(1, 1).slice(0, 20)),
    ).toThrow();
    expect(() =>
      inspectClipboardImageDimensions(
        'image/jpeg',
        Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xff]),
      ),
    ).toThrow();
    expect(() =>
      inspectClipboardImageDimensions(
        'image/jpeg',
        Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]),
      ),
    ).toThrow();
    const malformedWebp = webpVp8x(10, 10);
    malformedWebp[4] = 0;
    expect(() =>
      inspectClipboardImageDimensions('image/webp', malformedWebp),
    ).toThrow();
  });

  it('rejects animated WebP before any raster decoder can run', () => {
    expect(() =>
      inspectClipboardImageDimensions('image/webp', webpVp8x(100, 100, true)),
    ).toThrow(expect.objectContaining({ code: 'animated-webp' }));
  });
});

export { jpeg, png, webpVp8x };
