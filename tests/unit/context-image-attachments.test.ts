import { describe, expect, it, vi } from 'vitest';

import {
  CONTEXT_IMAGE_RGBA_BYTES_PER_PIXEL,
  ContextImageAttachmentValidator,
  ContextImageValidationError,
  MAX_CONTEXT_IMAGE_ATTACHMENTS,
  MAX_CONTEXT_IMAGE_BYTES,
  MAX_CONTEXT_IMAGE_HEIGHT,
  MAX_CONTEXT_IMAGE_PIXELS,
  MAX_CONTEXT_IMAGE_RGBA_BYTES,
  MAX_CONTEXT_IMAGE_TOTAL_BYTES,
  MAX_CONTEXT_IMAGE_WIDTH,
  type ContextImageCandidate,
  type ContextImageDecodeVerifier,
  type ContextImageMediaType,
  type DraftingImageAttachment,
} from '../../src/application/drafting/context-image-attachments';
import { inspectEncodedRasterDimensions } from '../../src/application/image/encoded-raster-safety';

function setUint32(
  bytes: Uint8Array,
  offset: number,
  value: number,
  little = false,
): void {
  new DataView(bytes.buffer).setUint32(offset, value, little);
}

function png(width: number, height: number, byteLength = 24): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  setUint32(bytes, 8, 13);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  setUint32(bytes, 16, width);
  setUint32(bytes, 20, height);
  return bytes;
}

function jpeg(width: number, height: number, byteLength = 13): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  bytes.set([
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
  return bytes;
}

function webp(
  width: number,
  height: number,
  animated = false,
  byteLength = 30,
): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  bytes.set([0x52, 0x49, 0x46, 0x46]);
  setUint32(bytes, 4, byteLength - 8, true);
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

function candidate(
  mediaType: ContextImageMediaType = 'image/png',
  bytes = png(1, 1),
): ContextImageCandidate {
  return { mediaType, bytes };
}

function decodeVerifier(): ContextImageDecodeVerifier & {
  verifyDecode: ReturnType<typeof vi.fn>;
} {
  return {
    verifyDecode: vi.fn(async ({ mediaType, bytes }) => {
      inspectEncodedRasterDimensions(mediaType, bytes);
    }),
  };
}

function idFactory(...ids: string[]) {
  let index = 0;
  return vi.fn(() => ids[index++] ?? `context-image-${index}`);
}

function validator(
  verifier: ContextImageDecodeVerifier = decodeVerifier(),
  ids = idFactory('context-image-1', 'context-image-2', 'context-image-3'),
): ContextImageAttachmentValidator {
  return new ContextImageAttachmentValidator(verifier, ids);
}

async function accepted(
  bytes = png(1, 1),
  id = 'existing-context-image',
): Promise<DraftingImageAttachment> {
  return (
    await validator(decodeVerifier(), idFactory(id)).validateAcquisition(
      [],
      [candidate('image/png', bytes)],
    )
  )[0] as DraftingImageAttachment;
}

describe('M15 Context Image attachments', () => {
  it('freezes the exact Decision 58 limits', () => {
    expect(MAX_CONTEXT_IMAGE_ATTACHMENTS).toBe(4);
    expect(MAX_CONTEXT_IMAGE_BYTES).toBe(5 * 1024 * 1024);
    expect(MAX_CONTEXT_IMAGE_TOTAL_BYTES).toBe(20 * 1024 * 1024);
    expect(MAX_CONTEXT_IMAGE_WIDTH).toBe(8_192);
    expect(MAX_CONTEXT_IMAGE_HEIGHT).toBe(8_192);
    expect(MAX_CONTEXT_IMAGE_PIXELS).toBe(16_777_216);
    expect(CONTEXT_IMAGE_RGBA_BYTES_PER_PIXEL).toBe(4);
    expect(MAX_CONTEXT_IMAGE_RGBA_BYTES).toBe(67_108_864);
  });

  it.each([
    ['image/png', png(640, 480)],
    ['image/jpeg', jpeg(1_920, 1_080)],
    ['image/webp', webp(2_560, 1_440)],
  ] as const)(
    'accepts inspected and decode-verified %s bytes',
    async (mediaType, bytes) => {
      const verifier = decodeVerifier();
      const result = await validator(verifier).validateAcquisition(
        [],
        [candidate(mediaType, bytes)],
      );

      expect(result[0]).toMatchObject({
        id: 'context-image-1',
        mediaType,
        width: inspectEncodedRasterDimensions(mediaType, bytes).width,
        height: inspectEncodedRasterDimensions(mediaType, bytes).height,
      });
      expect(verifier.verifyDecode).toHaveBeenCalledOnce();
    },
  );

  it('rejects unsupported MIME before decode', async () => {
    const verifier = decodeVerifier();

    await expect(
      validator(verifier).validateAcquisition(
        [],
        [{ mediaType: 'image/gif', bytes: png(1, 1) }],
      ),
    ).rejects.toMatchObject({ code: 'unsupported-media-type' });
    expect(verifier.verifyDecode).not.toHaveBeenCalled();
  });

  it.each([
    ['image/png', jpeg(1, 1)],
    ['image/jpeg', webp(1, 1)],
    ['image/webp', png(1, 1)],
  ] as const)(
    'rejects declared %s when the encoded signature disagrees',
    async (mediaType, bytes) => {
      await expect(
        validator().validateAcquisition([], [candidate(mediaType, bytes)]),
      ).rejects.toMatchObject({ code: 'mime-signature-mismatch' });
    },
  );

  it.each([
    ['PNG', 'image/png', png(1, 1).slice(0, 20)],
    ['JPEG', 'image/jpeg', Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])],
    [
      'WebP',
      'image/webp',
      Uint8Array.from([
        0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
      ]),
    ],
  ] as const)(
    'rejects malformed %s headers',
    async (_name, mediaType, bytes) => {
      await expect(
        validator().validateAcquisition([], [candidate(mediaType, bytes)]),
      ).rejects.toMatchObject({ code: 'malformed-image' });
    },
  );

  it('rejects animated WebP before decode', async () => {
    const verifier = decodeVerifier();

    await expect(
      validator(verifier).validateAcquisition(
        [],
        [candidate('image/webp', webp(100, 100, true))],
      ),
    ).rejects.toMatchObject({ code: 'animated-webp' });
    expect(verifier.verifyDecode).not.toHaveBeenCalled();
  });

  it.each([
    ['zero width', png(0, 1), 'malformed-image'],
    ['zero height', png(1, 0), 'malformed-image'],
    ['exact width', png(8_192, 1), undefined],
    ['width plus one', png(8_193, 1), 'image-too-large'],
    ['exact height', png(1, 8_192), undefined],
    ['height plus one', png(1, 8_193), 'image-too-large'],
    ['exact pixel and RGBA ceiling', png(8_192, 2_048), undefined],
    ['pixel and RGBA ceiling plus one', png(4_096, 4_097), 'image-too-large'],
    [
      'overflow-safe hostile dimensions',
      png(0xffffffff, 0xffffffff),
      'image-too-large',
    ],
  ] as const)('enforces the %s boundary', async (_name, bytes, errorCode) => {
    const operation = validator().validateAcquisition(
      [],
      [candidate('image/png', bytes)],
    );

    if (errorCode === undefined) {
      await expect(operation).resolves.toHaveLength(1);
    } else {
      await expect(operation).rejects.toMatchObject({ code: errorCode });
    }
  });

  it('requires decode verification and fails closed without re-encoding', async () => {
    const verifier: ContextImageDecodeVerifier = {
      verifyDecode: vi.fn(async () => {
        throw new Error('Decoder rejected image');
      }),
    };
    const bytes = png(1, 1);

    await expect(
      validator(verifier).validateAcquisition(
        [],
        [candidate('image/png', bytes)],
      ),
    ).rejects.toMatchObject({ code: 'decode-failed' });
    expect(verifier.verifyDecode).toHaveBeenCalledWith({
      mediaType: 'image/png',
      bytes: expect.any(Uint8Array),
    });
    expect(bytes).toEqual(png(1, 1));
  });

  it('accepts exactly 5 MiB and rejects 5 MiB plus one', async () => {
    await expect(
      validator().validateAcquisition(
        [],
        [candidate('image/png', png(1, 1, MAX_CONTEXT_IMAGE_BYTES))],
      ),
    ).resolves.toHaveLength(1);
    await expect(
      validator().validateAcquisition(
        [],
        [candidate('image/png', png(1, 1, MAX_CONTEXT_IMAGE_BYTES + 1))],
      ),
    ).rejects.toMatchObject({ code: 'image-too-large' });
  });

  it('accepts four attachments and rejects a fifth', async () => {
    const four = await validator(
      decodeVerifier(),
      idFactory('one', 'two', 'three', 'four'),
    ).validateAcquisition(
      [],
      Array.from({ length: 4 }, () => candidate()),
    );

    expect(four).toHaveLength(4);
    await expect(
      validator().validateAcquisition(four, [candidate()]),
    ).rejects.toMatchObject({ code: 'too-many-images' });
  });

  it('accepts exactly 20 MiB combined and rejects 20 MiB plus one', async () => {
    const exactCandidates = Array.from({ length: 4 }, () =>
      candidate('image/png', png(1, 1, MAX_CONTEXT_IMAGE_BYTES)),
    );

    await expect(
      validator(
        decodeVerifier(),
        idFactory('one', 'two', 'three', 'four'),
      ).validateAcquisition([], exactCandidates),
    ).resolves.toHaveLength(4);

    const overCandidates = [
      candidate('image/png', png(1, 1, MAX_CONTEXT_IMAGE_BYTES + 1)),
      ...Array.from({ length: 3 }, () =>
        candidate('image/png', png(1, 1, MAX_CONTEXT_IMAGE_BYTES)),
      ),
    ];
    await expect(
      validator().validateAcquisition([], overCandidates),
    ).rejects.toMatchObject({ code: 'combined-images-too-large' });
  });

  it('adds every candidate atomically in input order with deterministic injected IDs', async () => {
    const existing = await accepted();
    const ids = idFactory('candidate-a', 'candidate-b');
    const result = await validator(decodeVerifier(), ids).validateAcquisition(
      [existing],
      [
        candidate('image/jpeg', jpeg(2, 3)),
        candidate('image/webp', webp(4, 5)),
      ],
    );

    expect(result.map(({ id }) => id)).toEqual([
      existing.id,
      'candidate-a',
      'candidate-b',
    ]);
    expect(ids).toHaveBeenCalledTimes(2);
  });

  it('rejects empty or duplicate injected IDs without returning attachments', async () => {
    await expect(
      validator(decodeVerifier(), idFactory('')).validateAcquisition(
        [],
        [candidate()],
      ),
    ).rejects.toMatchObject({ code: 'invalid-id' });

    await expect(
      validator(
        decodeVerifier(),
        idFactory('duplicate', 'duplicate'),
      ).validateAcquisition([], [candidate(), candidate()]),
    ).rejects.toMatchObject({ code: 'invalid-id' });
  });

  it('returns no partial set and leaves existing attachments unchanged when any candidate fails', async () => {
    const existing = await accepted();
    const current = [existing];
    const before = structuredClone(current);
    const ids = idFactory('unused-a', 'unused-b');

    await expect(
      validator(decodeVerifier(), ids).validateAcquisition(current, [
        candidate('image/png', png(2, 2)),
        candidate('image/jpeg', png(3, 3)),
      ]),
    ).rejects.toBeInstanceOf(ContextImageValidationError);
    expect(current).toEqual(before);
    expect(ids).not.toHaveBeenCalled();
  });

  it('revalidates the complete resulting set without mutating invalid existing state', async () => {
    const existing = await accepted();
    const invalidCurrent = [{ ...existing, width: existing.width + 1 }];
    const before = structuredClone(invalidCurrent);

    await expect(
      validator().validateAcquisition(invalidCurrent, [candidate()]),
    ).rejects.toMatchObject({ code: 'dimensions-mismatch' });
    expect(invalidCurrent).toEqual(before);
  });

  it('does not mutate input arrays/objects and owns accepted bytes independently', async () => {
    const bytes = png(7, 9);
    const value = candidate('image/png', bytes);
    const candidates = [value];
    const before = structuredClone(candidates);
    const result = await validator().validateAcquisition([], candidates);

    expect(candidates).toEqual(before);
    expect(result).not.toBe(candidates);
    expect(result[0]?.bytes).not.toBe(bytes);
    bytes.fill(0);
    expect(result[0]?.bytes).toEqual(png(7, 9));
  });

  it('isolates accepted bytes from a mutating decode verifier', async () => {
    const verifier: ContextImageDecodeVerifier = {
      verifyDecode: vi.fn(async ({ bytes }) => {
        bytes.fill(0);
      }),
    };
    const original = png(11, 13);
    const result = await validator(verifier).validateAcquisition(
      [],
      [candidate('image/png', original)],
    );

    expect(original).toEqual(png(11, 13));
    expect(result[0]?.bytes).toEqual(png(11, 13));
  });

  it('uses cryptographically random opaque IDs by default', async () => {
    const result = await new ContextImageAttachmentValidator(
      decodeVerifier(),
    ).validateAcquisition([], [candidate()]);

    expect(result[0]?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('projects only the provider-independent attachment contract', async () => {
    const result = await validator().validateAcquisition([], [candidate()]);
    const attachment = result[0] as DraftingImageAttachment;

    expect(Object.keys(attachment)).toEqual([
      'id',
      'mediaType',
      'bytes',
      'width',
      'height',
    ]);
    const serializedKeys = Object.keys(attachment).join(' ');
    expect(serializedKeys).not.toMatch(
      /snippet|asset|path|url|filename|provider|ollama|blob|persist/i,
    );
  });

  it('rejects an acquisition with no candidates', async () => {
    await expect(validator().validateAcquisition([], [])).rejects.toMatchObject(
      { code: 'empty-acquisition' },
    );
  });
});
