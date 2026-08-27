import type { GenerateSnippetTags } from '../generation/generate-snippet-tags';
import type { SnippetEntryRepository } from '../persistence/snippet-entry-repository';
import type { SnippetGeneratedMetadataRepository } from '../persistence/snippet-generated-metadata-repository';
import type { SnippetEntry } from '../../domain/snippet-entry';
import { renderSnippetPlainText } from '../../domain/snippet-content';
import {
  MAX_GENERATED_SNIPPET_TAGS,
  createSnippetGeneratedMetadataSource,
  createSnippetSourceFingerprint,
  isSnippetGeneratedMetadataCurrent,
  normalizeGeneratedSnippetTag,
  validateSnippetGeneratedMetadata,
  type SnippetGeneratedMetadata,
  type SnippetGeneratedMetadataSource,
} from '../../domain/snippet-generated-metadata';

export const MAX_SNIPPET_TAG_GENERATION_INPUT_BYTES = 64 * 1024;
export const MAX_SNIPPET_TAG_RAW_RESPONSE_BYTES = 4 * 1024;
export const MAX_SNIPPET_TAG_BACKFILL_RECORDS = 20;

export type SnippetTagGenerationFailureCode =
  | 'load-failed'
  | 'fingerprint-failed'
  | 'generation-failed'
  | 'invalid-response'
  | 'persistence-failed';

export type SnippetTagGenerationSkipReason =
  | 'not-found'
  | 'image-snippet'
  | 'input-too-large'
  | 'stale-source'
  | 'superseded';

export interface SnippetTagGenerationFailure {
  readonly code: SnippetTagGenerationFailureCode;
  readonly cause: unknown;
}

export type SnippetTagGenerationResult =
  | {
      readonly status: 'persisted';
      readonly metadata: SnippetGeneratedMetadata;
    }
  | {
      readonly status: 'skipped';
      readonly reason: SnippetTagGenerationSkipReason;
    }
  | {
      readonly status: 'failed';
      readonly error: SnippetTagGenerationFailure;
    };

export class GeneratedSnippetTagsParseError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = 'GeneratedSnippetTagsParseError';
  }
}

function encodedByteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function createSnippetTagGenerationInput(
  source: SnippetGeneratedMetadataSource,
): string {
  if (source.content.kind === 'image') {
    throw new TypeError('Image Snippets cannot be used for tag generation.');
  }
  return (
    '{"title":' +
    JSON.stringify(source.title) +
    ',"content":' +
    JSON.stringify(renderSnippetPlainText(source.content)) +
    ',"authoredTags":' +
    JSON.stringify([...source.tags]) +
    '}'
  );
}

export function parseGeneratedSnippetTags(rawResponse: string): string[] {
  if (
    rawResponse.length === 0 ||
    encodedByteLength(rawResponse) > MAX_SNIPPET_TAG_RAW_RESPONSE_BYTES
  ) {
    throw new GeneratedSnippetTagsParseError(
      'Generated Snippet tag response size is invalid.',
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponse);
  } catch (error) {
    throw new GeneratedSnippetTagsParseError(
      'Generated Snippet tags must be one complete JSON array.',
      error,
    );
  }

  if (
    !Array.isArray(parsed) ||
    parsed.length > MAX_GENERATED_SNIPPET_TAGS ||
    !parsed.every((tag) => typeof tag === 'string')
  ) {
    throw new GeneratedSnippetTagsParseError(
      'Generated Snippet tags have an invalid structure.',
    );
  }

  try {
    const normalized: string[] = [];
    const seen = new Set<string>();
    for (const rawTag of parsed) {
      const tag = normalizeGeneratedSnippetTag(rawTag as string);
      if (!seen.has(tag)) {
        seen.add(tag);
        normalized.push(tag);
      }
    }
    return normalized;
  } catch (error) {
    throw new GeneratedSnippetTagsParseError(
      'Generated Snippet tags contain an invalid value.',
      error,
    );
  }
}

function compareSnippets(left: SnippetEntry, right: SnippetEntry): number {
  if (left.createdAt < right.createdAt) return -1;
  if (left.createdAt > right.createdAt) return 1;
  if (left.id < right.id) return -1;
  if (left.id > right.id) return 1;
  return 0;
}

export class SnippetTagGenerationService {
  private readonly latestAttemptBySnippet = new Map<string, number>();
  private readonly persistenceTailBySnippet = new Map<string, Promise<void>>();

  constructor(
    private readonly snippetRepository: SnippetEntryRepository,
    private readonly metadataRepository: SnippetGeneratedMetadataRepository,
    private readonly generator: GenerateSnippetTags,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async generateForSnippet(
    snippetId: string,
    signal?: AbortSignal,
  ): Promise<SnippetTagGenerationResult> {
    const attempt = (this.latestAttemptBySnippet.get(snippetId) ?? 0) + 1;
    this.latestAttemptBySnippet.set(snippetId, attempt);

    let snippet: SnippetEntry | undefined;
    try {
      snippet = await this.snippetRepository.get(snippetId);
    } catch (cause) {
      return { status: 'failed', error: { code: 'load-failed', cause } };
    }
    if (snippet === undefined) {
      return { status: 'skipped', reason: 'not-found' };
    }
    if (snippet.content.kind === 'image') {
      return { status: 'skipped', reason: 'image-snippet' };
    }

    let source: SnippetGeneratedMetadataSource;
    let sourceFingerprint: string;
    let input: string;
    try {
      source = createSnippetGeneratedMetadataSource(snippet);
      sourceFingerprint = await createSnippetSourceFingerprint(source);
      input = createSnippetTagGenerationInput(source);
    } catch (cause) {
      return {
        status: 'failed',
        error: { code: 'fingerprint-failed', cause },
      };
    }
    if (encodedByteLength(input) > MAX_SNIPPET_TAG_GENERATION_INPUT_BYTES) {
      return { status: 'skipped', reason: 'input-too-large' };
    }

    let rawResponse: string;
    try {
      rawResponse = await this.generator.generate({ input }, signal);
    } catch (cause) {
      return {
        status: 'failed',
        error: { code: 'generation-failed', cause },
      };
    }

    let generatedTags: string[];
    try {
      generatedTags = parseGeneratedSnippetTags(rawResponse);
    } catch (cause) {
      return {
        status: 'failed',
        error: { code: 'invalid-response', cause },
      };
    }

    return this.withPersistenceLock(snippetId, async () => {
      if (this.latestAttemptBySnippet.get(snippetId) !== attempt) {
        return { status: 'skipped', reason: 'superseded' };
      }

      let current: SnippetEntry | undefined;
      try {
        current = await this.snippetRepository.get(snippetId);
      } catch (cause) {
        return { status: 'failed', error: { code: 'load-failed', cause } };
      }
      if (current === undefined || current.content.kind === 'image') {
        return { status: 'skipped', reason: 'stale-source' };
      }
      try {
        if (
          (await createSnippetSourceFingerprint(current)) !== sourceFingerprint
        ) {
          return { status: 'skipped', reason: 'stale-source' };
        }
      } catch (cause) {
        return {
          status: 'failed',
          error: { code: 'fingerprint-failed', cause },
        };
      }
      if (this.latestAttemptBySnippet.get(snippetId) !== attempt) {
        return { status: 'skipped', reason: 'superseded' };
      }

      let metadata: SnippetGeneratedMetadata;
      try {
        metadata = validateSnippetGeneratedMetadata({
          snippetId,
          generatedTags,
          sourceFingerprint,
          generatedAt: this.now().toISOString(),
        });
        const saved = await this.metadataRepository.saveIfSourceMatches(
          metadata,
          source,
        );
        return saved
          ? { status: 'persisted', metadata }
          : { status: 'skipped', reason: 'stale-source' };
      } catch (cause) {
        return {
          status: 'failed',
          error: { code: 'persistence-failed', cause },
        };
      }
    });
  }

  private async withPersistenceLock(
    snippetId: string,
    operation: () => Promise<SnippetTagGenerationResult>,
  ): Promise<SnippetTagGenerationResult> {
    const prior = this.persistenceTailBySnippet.get(snippetId);
    let release = (): void => undefined;
    const tail = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.persistenceTailBySnippet.set(snippetId, tail);
    if (prior !== undefined) await prior;
    try {
      return await operation();
    } finally {
      release();
      if (this.persistenceTailBySnippet.get(snippetId) === tail) {
        this.persistenceTailBySnippet.delete(snippetId);
      }
    }
  }
}

export interface SnippetTagBackfillItemResult {
  readonly snippetId: string;
  readonly result: SnippetTagGenerationResult;
}

export interface SnippetTagBackfillResult {
  readonly items: readonly SnippetTagBackfillItemResult[];
}

export class SnippetTagBackfillService {
  constructor(
    private readonly snippetRepository: SnippetEntryRepository,
    private readonly metadataRepository: SnippetGeneratedMetadataRepository,
    private readonly generationService: Pick<
      SnippetTagGenerationService,
      'generateForSnippet'
    >,
  ) {}

  async backfill(signal?: AbortSignal): Promise<SnippetTagBackfillResult> {
    const snippets = [...(await this.snippetRepository.list())].sort(
      compareSnippets,
    );
    const eligible: SnippetEntry[] = [];

    for (const snippet of snippets) {
      if (
        signal?.aborted ||
        eligible.length >= MAX_SNIPPET_TAG_BACKFILL_RECORDS
      ) {
        break;
      }
      if (snippet.content.kind === 'image') continue;

      let current = false;
      try {
        current = await isSnippetGeneratedMetadataCurrent(
          await this.metadataRepository.get(snippet.id),
          snippet,
        );
      } catch {
        // Unreadable metadata is eligible for best-effort regeneration.
      }
      if (!current) eligible.push(snippet);
    }

    const items: SnippetTagBackfillItemResult[] = [];
    for (const snippet of eligible) {
      if (signal?.aborted) break;
      items.push({
        snippetId: snippet.id,
        result: await this.generationService.generateForSnippet(
          snippet.id,
          signal,
        ),
      });
    }
    return { items };
  }
}
