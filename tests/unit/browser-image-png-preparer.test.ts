import { describe, expect, it, vi } from 'vitest';

import { MAX_SNIPPET_ASSET_BYTES } from '../../src/domain/snippet-asset';
import {
  BrowserImagePngPreparer,
  type BrowserImagePngEnvironment,
} from '../../src/infrastructure/clipboard/browser-image-png-preparer';

function png(width = 1, height = 1): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  new DataView(bytes.buffer).setUint32(8, 13);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  new DataView(bytes.buffer).setUint32(16, width);
  new DataView(bytes.buffer).setUint32(20, height);
  return bytes;
}

function jpeg(width = 1, height = 1): Uint8Array {
  return Uint8Array.from([
    0xff,
    0xd8,
    0xff,
    0xc0,
    0x00,
    0x07,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0xff,
    0xd9,
  ]);
}

function webp(): Uint8Array {
  return Uint8Array.from([
    0x52, 0x49, 0x46, 0x46, 0x16, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x58, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
}

function ownedBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function plan(
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png',
  bytes = mimeType === 'image/png'
    ? png()
    : mimeType === 'image/jpeg'
      ? jpeg()
      : webp(),
) {
  return {
    kind: 'image' as const,
    snippetId: 'private-snippet-id',
    mimeType,
    blob: new Blob([ownedBuffer(bytes)], { type: mimeType }),
    dimensions: { width: 1, height: 1 },
  };
}

function environment(output = png()) {
  const close = vi.fn();
  const drawImage = vi.fn();
  const canvas = {
    width: 1,
    height: 1,
    getContext: vi.fn(() => ({ drawImage })),
    convertToBlob: vi.fn(
      async () => new Blob([ownedBuffer(output)], { type: 'image/png' }),
    ),
  };
  const value: BrowserImagePngEnvironment = {
    createImageBitmap: vi.fn(async () => ({ width: 1, height: 1, close })),
    createCanvas: vi.fn(() => canvas),
  };
  return { value, close, drawImage, canvas };
}

describe('service-worker Image PNG preparation', () => {
  it('returns a validated PNG byte-for-byte without decoding or canvas work', async () => {
    const runtime = environment();
    const source = png();
    await expect(
      new BrowserImagePngPreparer(runtime.value).prepare(
        plan('image/png', source),
      ),
    ).resolves.toEqual(source);
    expect(runtime.value.createImageBitmap).not.toHaveBeenCalled();
    expect(runtime.value.createCanvas).not.toHaveBeenCalled();
  });

  it('genuinely decodes JPEG and emits a validated PNG before native transfer', async () => {
    const runtime = environment(png());
    const result = await new BrowserImagePngPreparer(runtime.value).prepare(
      plan('image/jpeg', jpeg()),
    );
    expect(result).toEqual(png());
    expect(runtime.value.createImageBitmap).toHaveBeenCalledWith(
      expect.any(Blob),
      { imageOrientation: 'from-image' },
    );
    expect(runtime.drawImage).toHaveBeenCalledOnce();
    expect(runtime.close).toHaveBeenCalledOnce();
    expect(runtime.canvas.width).toBe(0);
    expect(runtime.canvas.height).toBe(0);
  });

  it('genuinely decodes WebP and emits a validated PNG before native transfer', async () => {
    const runtime = environment(png());
    const result = await new BrowserImagePngPreparer(runtime.value).prepare(
      plan('image/webp', webp()),
    );
    expect(result).toEqual(png());
    expect(runtime.value.createImageBitmap).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'image/webp' }),
      { imageOrientation: 'from-image' },
    );
    expect(runtime.drawImage).toHaveBeenCalledOnce();
    expect(runtime.close).toHaveBeenCalledOnce();
  });

  it('rejects metadata drift before decode', async () => {
    const runtime = environment();
    await expect(
      new BrowserImagePngPreparer(runtime.value).prepare({
        ...plan('image/jpeg', jpeg()),
        dimensions: { width: 2, height: 1 },
      }),
    ).rejects.toMatchObject({ code: 'image-invalid' });
    expect(runtime.value.createImageBitmap).not.toHaveBeenCalled();
  });

  it('rejects an oversized converted PNG and still releases raster resources', async () => {
    const runtime = environment(new Uint8Array(MAX_SNIPPET_ASSET_BYTES + 1));
    await expect(
      new BrowserImagePngPreparer(runtime.value).prepare(
        plan('image/jpeg', jpeg()),
      ),
    ).rejects.toMatchObject({ code: 'image-too-large' });
    expect(runtime.close).toHaveBeenCalledOnce();
    expect(runtime.canvas.width).toBe(0);
    expect(runtime.canvas.height).toBe(0);
  });

  it('maps decode/canvas failure without exposing the thrown error', async () => {
    const runtime = environment();
    vi.mocked(runtime.value.createImageBitmap).mockRejectedValue(
      new Error('private decoder text'),
    );
    await expect(
      new BrowserImagePngPreparer(runtime.value).prepare(
        plan('image/jpeg', jpeg()),
      ),
    ).rejects.toMatchObject({
      code: 'image-decode-failed',
      message: 'Windows Image Snippet delivery is unavailable.',
    });
  });
});
