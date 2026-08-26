import { SnippetDeliveryPlanner } from '../../src/application/snippet/snippet-delivery-planner';
import { serializeSnippetClipboardText } from '../../src/application/snippet/snippet-clipboard-serializer';
import { BrowserImagePngPreparer } from '../../src/infrastructure/clipboard/browser-image-png-preparer';
import {
  createCapturePasteContextRequest,
  createPasteClipboardRequest,
  createWriteImagePngRequest,
} from '../../src/infrastructure/clipboard/native-clipboard-protocol';
import type { SnippetAssetRepository } from '../../src/application/persistence/snippet-asset-repository';
import type { SnippetEntryRepository } from '../../src/application/persistence/snippet-entry-repository';
import type {
  SnippetAsset,
  SnippetAssetMimeType,
} from '../../src/domain/snippet-asset';
import type { SnippetEntry } from '../../src/domain/snippet-entry';

declare global {
  var snippetDeliveryBenchmarkResult: BenchmarkReport | undefined;
  var snippetDeliveryBenchmarkError: string | undefined;
}

interface Distribution {
  readonly coldMs: number;
  readonly iterations: number;
  readonly minMs: number;
  readonly medianMs: number;
  readonly meanMs: number;
  readonly p95Ms: number;
  readonly maxMs: number;
}

interface FixtureReport {
  readonly size: string;
  readonly width: number;
  readonly height: number;
  readonly encodedBytes: number;
  readonly planner: Distribution;
  readonly preparation: Distribution;
  readonly plannerAndPreparation: Distribution;
}

interface BenchmarkReport {
  readonly generatedAt: string;
  readonly userAgent: string;
  readonly methodology: {
    readonly sizes: readonly string[];
    readonly fixturePattern: string;
    readonly note: string;
  };
  readonly text: {
    readonly plainSerialization: Distribution;
    readonly richSerialization: Distribution;
    readonly planner: Distribution;
  };
  readonly images: Record<SnippetAssetMimeType, readonly FixtureReport[]>;
  readonly nativeRequestPreparation: {
    readonly legacySmallPng: Distribution;
    readonly legacyMediumPng: Distribution;
    readonly legacyLargePng: Distribution;
    readonly smallPng: Distribution;
    readonly mediumPng: Distribution;
    readonly largePng: Distribution;
    readonly automaticPasteMessages: Distribution;
  };
}

const snippetId = '123e4567-e89b-42d3-a456-426614174001';
const assetId = '123e4567-e89b-42d3-a456-426614174002';
const requestId = '0123456789abcdef0123456789abcdef';
const activationId = 'fedcba9876543210fedcba9876543210';
const sizes = [
  { name: 'small', width: 64, height: 64, iterations: 12 },
  { name: 'medium', width: 640, height: 480, iterations: 6 },
  { name: 'large', width: 1440, height: 900, iterations: 6 },
] as const;
const mimeTypes = ['image/png', 'image/jpeg', 'image/webp'] as const;

function round(value: number): number {
  return Number(value.toFixed(3));
}

function summarize(coldMs: number, samples: readonly number[]): Distribution {
  const sorted = [...samples].sort((left, right) => left - right);
  const percentile = (fraction: number) =>
    sorted[
      Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)
    ] ?? 0;
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    coldMs: round(coldMs),
    iterations: sorted.length,
    minMs: round(sorted[0] ?? 0),
    medianMs: round(percentile(0.5)),
    meanMs: round(sum / sorted.length),
    p95Ms: round(percentile(0.95)),
    maxMs: round(sorted.at(-1) ?? 0),
  };
}

function requiredDistribution(
  distributions: readonly Distribution[],
  index: number,
): Distribution {
  const distribution = distributions[index];
  if (distribution === undefined) throw new Error('Benchmark result missing.');
  return distribution;
}

async function measure(
  iterations: number,
  operation: () => void | Promise<void>,
): Promise<Distribution> {
  const run = async () => {
    const startedAt = performance.now();
    await operation();
    return performance.now() - startedAt;
  };
  const coldMs = await run();
  const samples: number[] = [];
  for (let index = 0; index < iterations; index += 1) samples.push(await run());
  return summarize(coldMs, samples);
}

function createPixels(width: number, height: number): ImageData {
  const image = new ImageData(width, height);
  let state = 0x9e37_79b9 ^ width ^ (height << 16);
  for (let offset = 0; offset < image.data.length; offset += 4) {
    state = Math.imul(state ^ (state >>> 15), 0x85eb_ca6b);
    state = Math.imul(state ^ (state >>> 13), 0xc2b2_ae35);
    state ^= state >>> 16;
    image.data[offset] = state & 0xff;
    image.data[offset + 1] = (state >>> 8) & 0xff;
    image.data[offset + 2] = (state >>> 16) & 0xff;
    image.data[offset + 3] = 0xff;
  }
  return image;
}

async function createFixture(
  mimeType: SnippetAssetMimeType,
  width: number,
  height: number,
): Promise<Blob> {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('2D canvas unavailable.');
  context.putImageData(createPixels(width, height), 0, 0);
  const blob = await canvas.convertToBlob(
    mimeType === 'image/png'
      ? { type: mimeType }
      : { type: mimeType, quality: 0.88 },
  );
  canvas.width = 0;
  canvas.height = 0;
  if (blob.type !== mimeType)
    throw new Error(`Browser did not encode ${mimeType}.`);
  return blob;
}

function createImagePlanner(asset: SnippetAsset): SnippetDeliveryPlanner {
  const snippet: SnippetEntry = {
    id: snippetId,
    title: 'Benchmark image',
    content: { kind: 'image', assetId },
    tags: [],
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T00:00:00.000Z',
    trigger: ';benchmark',
  };
  const snippetRepository = {
    get: async () => snippet,
  } as unknown as SnippetEntryRepository;
  const assetRepository: SnippetAssetRepository = {
    get: async () => asset,
    listBySnippet: async () => [asset],
  };
  return new SnippetDeliveryPlanner(snippetRepository, assetRepository);
}

async function benchmarkImage(
  mimeType: SnippetAssetMimeType,
  size: (typeof sizes)[number],
  blob: Blob,
): Promise<FixtureReport> {
  const asset: SnippetAsset = {
    id: assetId,
    snippetId,
    mimeType,
    blob,
    byteSize: blob.size,
    originalFilename: `benchmark.${mimeType.split('/')[1]}`,
    createdAt: '2026-08-26T00:00:00.000Z',
  };
  const planner = createImagePlanner(asset);
  const request = { snippetId, trigger: ';benchmark', kind: 'image' as const };
  const preparer = new BrowserImagePngPreparer();
  const plan = await planner.plan(request);
  if (plan.kind !== 'image') throw new Error('Expected an Image plan.');
  const plannerTiming = await measure(size.iterations * 2, async () => {
    await planner.plan(request);
  });
  const preparationTiming = await measure(size.iterations, async () => {
    await preparer.prepare(plan);
  });
  const combinedTiming = await measure(size.iterations, async () => {
    const combinedPlan = await planner.plan(request);
    if (combinedPlan.kind !== 'image')
      throw new Error('Expected an Image plan.');
    await preparer.prepare(combinedPlan);
  });
  return {
    size: size.name,
    width: size.width,
    height: size.height,
    encodedBytes: blob.size,
    planner: plannerTiming,
    preparation: preparationTiming,
    plannerAndPreparation: combinedTiming,
  };
}

async function run(): Promise<BenchmarkReport> {
  const fixtures = new Map<string, Blob>();
  for (const size of sizes) {
    for (const mimeType of mimeTypes) {
      fixtures.set(
        `${size.name}:${mimeType}`,
        await createFixture(mimeType, size.width, size.height),
      );
    }
  }

  const plain = {
    kind: 'plain' as const,
    text: 'Hello\n\nA stable benchmark baseline.',
  };
  const rich = {
    kind: 'rich' as const,
    blocks: [
      {
        type: 'paragraph' as const,
        children: [
          {
            type: 'text' as const,
            text: 'Measured ',
            bold: false,
            italic: false,
          },
          { type: 'text' as const, text: 'Snippet', bold: true, italic: false },
        ],
      },
      {
        type: 'list' as const,
        listType: 'unordered' as const,
        items: [
          {
            children: [
              {
                type: 'text' as const,
                text: 'One',
                bold: false,
                italic: false,
              },
            ],
          },
          {
            children: [
              { type: 'text' as const, text: 'Two', bold: false, italic: true },
            ],
          },
          {
            children: [
              {
                type: 'text' as const,
                text: 'Three',
                bold: false,
                italic: false,
              },
            ],
          },
        ],
      },
    ],
  };
  const textSnippet: SnippetEntry = {
    id: snippetId,
    title: 'Benchmark text',
    content: rich,
    tags: [],
    createdAt: '2026-08-26T00:00:00.000Z',
    updatedAt: '2026-08-26T00:00:00.000Z',
    trigger: ';benchmark',
  };
  const textPlanner = new SnippetDeliveryPlanner(
    { get: async () => textSnippet } as unknown as SnippetEntryRepository,
    { get: async () => undefined, listBySnippet: async () => [] },
  );
  const images = {} as Record<SnippetAssetMimeType, FixtureReport[]>;
  for (const mimeType of mimeTypes) {
    images[mimeType] = [];
    for (const size of sizes) {
      const blob = fixtures.get(`${size.name}:${mimeType}`);
      if (blob === undefined) throw new Error('Fixture missing.');
      images[mimeType].push(await benchmarkImage(mimeType, size, blob));
    }
  }

  const pngBlobs = sizes.map((size) => {
    const blob = fixtures.get(`${size.name}:image/png`);
    if (blob === undefined) throw new Error('PNG fixture missing.');
    return blob;
  });
  const pngBytes = await Promise.all(
    pngBlobs.map(async (blob) => new Uint8Array(await blob.arrayBuffer())),
  );
  const legacyRequestDistributions: Distribution[] = [];
  const requestDistributions: Distribution[] = [];
  for (const [index, bytes] of pngBytes.entries()) {
    const iterations = [15, 8, 6][index] ?? 6;
    legacyRequestDistributions.push(
      await measure(iterations, () => {
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 0x8000) {
          binary += String.fromCharCode(
            ...bytes.subarray(offset, offset + 0x8000),
          );
        }
        btoa(binary);
      }),
    );
    requestDistributions.push(
      await measure(iterations, () => {
        createWriteImagePngRequest(requestId, bytes);
      }),
    );
  }
  const pasteContext = {
    foregroundWindowHandle: '0000000000001234',
    rootWindowHandle: '0000000000001000',
    processId: 44,
    clipboardSequenceNumber: 77,
  };

  return {
    generatedAt: new Date().toISOString(),
    userAgent: navigator.userAgent,
    methodology: {
      sizes: sizes.map(
        ({ name, width, height }) => `${name} ${width}x${height}`,
      ),
      fixturePattern: 'deterministic opaque pseudorandom RGB pixels',
      note: 'Cold is the first measured call; distributions are warm sequential calls. Timings are diagnostic and have no pass/fail threshold.',
    },
    text: {
      plainSerialization: await measure(500, () => {
        serializeSnippetClipboardText(plain);
      }),
      richSerialization: await measure(500, () => {
        serializeSnippetClipboardText(rich);
      }),
      planner: await measure(500, async () => {
        await textPlanner.plan({
          snippetId,
          trigger: ';benchmark',
          kind: 'text',
        });
      }),
    },
    images,
    nativeRequestPreparation: {
      legacySmallPng: requiredDistribution(legacyRequestDistributions, 0),
      legacyMediumPng: requiredDistribution(legacyRequestDistributions, 1),
      legacyLargePng: requiredDistribution(legacyRequestDistributions, 2),
      smallPng: requiredDistribution(requestDistributions, 0),
      mediumPng: requiredDistribution(requestDistributions, 1),
      largePng: requiredDistribution(requestDistributions, 2),
      automaticPasteMessages: await measure(500, () => {
        createCapturePasteContextRequest(requestId, activationId);
        createPasteClipboardRequest(requestId, activationId, pasteContext);
      }),
    },
  };
}

try {
  globalThis.snippetDeliveryBenchmarkResult = await run();
} catch (error) {
  globalThis.snippetDeliveryBenchmarkError =
    error instanceof Error
      ? `${error.name}: ${error.message}\n${error.stack ?? ''}`
      : String(error);
}
