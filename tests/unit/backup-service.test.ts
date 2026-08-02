import { describe, expect, it, vi } from 'vitest';

import { BackupRestoreError } from '../../src/application/backup/backup-errors';
import type {
  BackupDownloadPort,
  BackupFileSource,
  BackupSnapshot,
  BackupSnapshotReader,
  TransactionalBackupRestorePort,
} from '../../src/application/backup/backup-ports';
import {
  BackupExportService,
  BackupImportService,
  BackupRestoreService,
  createBackupFilename,
  measureUtf8Bytes,
} from '../../src/application/backup/backup-service';
import { parseBackupFileV1 } from '../../src/application/backup/backup-validator';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  MAX_BACKUP_BYTES,
  type BackupFileV1,
} from '../../src/domain/backup-file';

const KNOWLEDGE_ID = '123e4567-e89b-42d3-a456-426614174000';
const SNIPPET_ID = '223e4567-e89b-42d3-a456-426614174000';
const EXPORTED_AT = '2026-08-02T08:15:30.000Z';

function createData(): BackupSnapshot {
  return {
    knowledge: [
      {
        id: KNOWLEDGE_ID,
        title: 'Unicode café 🧭',
        body: '<script>alert("data only")</script>\n  exact whitespace  ',
        tags: ['second', 'first'],
        createdAt: '2026-08-02T07:00:00.000Z',
        updatedAt: '2026-08-02T07:01:00.000Z',
        source: 'Internal & local',
      },
    ],
    snippets: [
      {
        id: SNIPPET_ID,
        title: 'Snippet',
        content: 'Line one\nLine two',
        tags: ['z', 'a'],
        createdAt: '2026-08-02T07:02:00.000Z',
        updatedAt: '2026-08-02T07:03:00.000Z',
      },
    ],
    settings: { defaultModel: 'qwen2.5:7b' },
  };
}

function createBackup(overrides: Partial<BackupFileV1> = {}): BackupFileV1 {
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: EXPORTED_AT,
    data: createData(),
    ...overrides,
  };
}

function sourceFor(
  serialized: string,
  overrides: Partial<BackupFileSource> = {},
): BackupFileSource {
  return {
    name: 'backup.json',
    size: measureUtf8Bytes(serialized),
    readText: vi.fn(async () => serialized),
    ...overrides,
  };
}

function requireValue<T>(value: T | undefined, description: string): T {
  if (value === undefined) throw new Error(`Missing ${description} fixture.`);
  return value;
}

describe('BackupFileV1 parser and validator', () => {
  it('accepts the exact envelope and preserves text, tags, and separate IDs', () => {
    const backup = createBackup();
    const parsed = parseBackupFileV1(JSON.stringify(backup));

    expect(parsed).toEqual(backup);
    expect(parsed.data.knowledge[0]?.body).toContain('<script>');
    expect(parsed.data.knowledge[0]?.tags).toEqual(['second', 'first']);
  });

  it('accepts empty arrays, null Settings, and the same ID across domains', () => {
    const sameIdData = createData();
    const snippet = sameIdData.snippets[0];
    expect(snippet).toBeDefined();
    const parsed = parseBackupFileV1(
      JSON.stringify({
        ...createBackup(),
        data: {
          knowledge: sameIdData.knowledge,
          snippets: [{ ...snippet, id: KNOWLEDGE_ID }],
          settings: { defaultModel: null },
        },
      }),
    );

    expect(parsed.data.settings).toEqual({ defaultModel: null });
    expect(
      parseBackupFileV1(
        JSON.stringify({
          ...createBackup(),
          data: {
            knowledge: [],
            snippets: [],
            settings: { defaultModel: null },
          },
        }),
      ).data,
    ).toEqual({
      knowledge: [],
      snippets: [],
      settings: { defaultModel: null },
    });
  });

  it.each([
    ['malformed JSON', '{'],
    [
      'wrong identifier',
      JSON.stringify({ ...createBackup(), format: 'other' }),
    ],
    [
      'missing key',
      JSON.stringify({
        format: BACKUP_FORMAT,
        formatVersion: 1,
        exportedAt: EXPORTED_AT,
      }),
    ],
    [
      'extra top-level key',
      JSON.stringify({ ...createBackup(), applicationVersion: '1.0.0' }),
    ],
    [
      'extra nested key',
      JSON.stringify({
        ...createBackup(),
        data: { ...createData(), history: [] },
      }),
    ],
    [
      'invalid UUID',
      JSON.stringify({
        ...createBackup(),
        data: {
          ...createData(),
          knowledge: [{ ...createData().knowledge[0], id: 'not-a-uuid' }],
        },
      }),
    ],
    [
      'noncanonical timestamp',
      JSON.stringify({ ...createBackup(), exportedAt: '2026-08-02 08:15:30Z' }),
    ],
    [
      'invalid tag',
      JSON.stringify({
        ...createBackup(),
        data: {
          ...createData(),
          snippets: [{ ...createData().snippets[0], tags: ['ok', 1] }],
        },
      }),
    ],
    [
      'invalid Settings',
      JSON.stringify({
        ...createBackup(),
        data: { ...createData(), settings: { defaultModel: 1 } },
      }),
    ],
    [
      'duplicate Knowledge ID',
      JSON.stringify({
        ...createBackup(),
        data: {
          ...createData(),
          knowledge: [createData().knowledge[0], createData().knowledge[0]],
        },
      }),
    ],
    [
      'duplicate Snippet ID',
      JSON.stringify({
        ...createBackup(),
        data: {
          ...createData(),
          snippets: [createData().snippets[0], createData().snippets[0]],
        },
      }),
    ],
    [
      'dangerous key',
      `{"format":"${BACKUP_FORMAT}","formatVersion":1,"exportedAt":"${EXPORTED_AT}","data":{"knowledge":[],"snippets":[],"settings":{"defaultModel":null,"constructor":"bad"}}}`,
    ],
  ])('rejects %s as an invalid backup', (_label, serialized) => {
    expect(() => parseBackupFileV1(serialized)).toThrowError(
      expect.objectContaining({ code: 'invalid' }),
    );
  });

  it('distinguishes an unsupported integer version', () => {
    expect(() =>
      parseBackupFileV1(
        JSON.stringify({ ...createBackup(), formatVersion: 2 }),
      ),
    ).toThrowError(expect.objectContaining({ code: 'unsupported-version' }));
  });
});

describe('backup application services', () => {
  it('exports deterministic arrays, exact metadata, filename, and logical fields', async () => {
    const data = createData();
    const knowledgeFixture = requireValue(data.knowledge[0], 'Knowledge entry');
    const snippetFixture = requireValue(data.snippets[0], 'Snippet entry');
    const laterKnowledge = {
      ...knowledgeFixture,
      id: '323e4567-e89b-42d3-a456-426614174000',
      title: 'Later ID',
    };
    const earlierKnowledge = {
      ...knowledgeFixture,
      id: '023e4567-e89b-42d3-a456-426614174000',
      title: 'Earlier ID',
    };
    const laterSnippet = {
      ...snippetFixture,
      id: '623e4567-e89b-42d3-a456-426614174000',
      title: 'Later snippet ID',
    };
    const earlierSnippet = {
      ...snippetFixture,
      id: '523e4567-e89b-42d3-a456-426614174000',
      title: 'Earlier snippet ID',
    };
    const oldestSnippet = {
      ...snippetFixture,
      id: '723e4567-e89b-42d3-a456-426614174000',
      title: 'Oldest snippet',
      createdAt: '2026-08-01T07:02:00.000Z',
    };
    const snapshotReader: BackupSnapshotReader = {
      readSnapshot: vi.fn(async () => ({
        ...data,
        knowledge: [laterKnowledge, earlierKnowledge],
        snippets: [laterSnippet, earlierSnippet, oldestSnippet],
      })),
    };
    const download: BackupDownloadPort['download'] = vi.fn(
      async () => undefined,
    );
    const service = new BackupExportService(
      snapshotReader,
      { download },
      () => new Date(EXPORTED_AT),
    );

    await service.exportBackup();

    expect(download).toHaveBeenCalledOnce();
    const [serialized, filename] = requireValue(
      vi.mocked(download).mock.calls[0],
      'download call',
    );
    expect(filename).toBe(
      'ai-support-workspace-backup-2026-08-02T08-15-30Z.json',
    );
    const parsed = JSON.parse(serialized) as BackupFileV1;
    expect(parsed.format).toBe(BACKUP_FORMAT);
    expect(parsed.formatVersion).toBe(1);
    expect(parsed.exportedAt).toBe(EXPORTED_AT);
    expect(parsed.data.knowledge.map(({ id }) => id)).toEqual([
      earlierKnowledge.id,
      laterKnowledge.id,
    ]);
    expect(parsed.data.knowledge[0]?.tags).toEqual(['second', 'first']);
    expect(parsed.data.snippets.map(({ id }) => id)).toEqual([
      oldestSnippet.id,
      earlierSnippet.id,
      laterSnippet.id,
    ]);
    expect(serialized).not.toContain('global');
    expect(serialized).not.toContain('schemaVersion');
  });

  it('exports an empty snapshot and preserves missing Settings as supplied null', async () => {
    const download = vi.fn<BackupDownloadPort['download']>(
      async () => undefined,
    );
    await new BackupExportService(
      {
        readSnapshot: async () => ({
          knowledge: [],
          snippets: [],
          settings: { defaultModel: null },
        }),
      },
      { download },
      () => new Date(EXPORTED_AT),
    ).exportBackup();

    const downloadCall = requireValue(download.mock.calls[0], 'download call');
    const parsed = JSON.parse(downloadCall[0]) as BackupFileV1;
    expect(parsed.data).toEqual({
      knowledge: [],
      snippets: [],
      settings: { defaultModel: null },
    });
  });

  it('excludes simulated future live-domain fields from serialized format v1', async () => {
    const data = createData();
    const knowledge = Object.assign(
      requireValue(data.knowledge[0], 'Knowledge entry'),
      { futureKnowledgeField: 'not-version-1', usageCount: 12 },
    );
    const snippet = Object.assign(
      requireValue(data.snippets[0], 'Snippet entry'),
      { trigger: '/future', richContent: { blocks: [] } },
    );
    const settings = Object.assign(
      { defaultModel: data.settings.defaultModel },
      { futureSettingsField: true },
    );
    const download = vi.fn<BackupDownloadPort['download']>(
      async () => undefined,
    );

    await new BackupExportService(
      {
        readSnapshot: async () => ({
          knowledge: [knowledge],
          snippets: [snippet],
          settings,
        }),
      },
      { download },
      () => new Date(EXPORTED_AT),
    ).exportBackup();

    const [serialized] = requireValue(
      download.mock.calls[0],
      'future-field download call',
    );
    const parsed = JSON.parse(serialized) as BackupFileV1;
    expect(Object.keys(parsed.data.knowledge[0] ?? {}).sort()).toEqual(
      [
        'id',
        'title',
        'body',
        'tags',
        'createdAt',
        'updatedAt',
        'source',
      ].sort(),
    );
    expect(Object.keys(parsed.data.snippets[0] ?? {}).sort()).toEqual(
      ['id', 'title', 'content', 'tags', 'createdAt', 'updatedAt'].sort(),
    );
    expect(Object.keys(parsed.data.settings)).toEqual(['defaultModel']);
    expect(serialized).not.toContain('futureKnowledgeField');
    expect(serialized).not.toContain('usageCount');
    expect(serialized).not.toContain('trigger');
    expect(serialized).not.toContain('richContent');
    expect(serialized).not.toContain('futureSettingsField');
  });

  it('uses UTF-8 byte measurement and accepts exactly the size limit', async () => {
    expect(measureUtf8Bytes('é')).toBe(2);
    const data = createData();
    const knowledgeFixture = requireValue(data.knowledge[0], 'Knowledge entry');
    const baseBackup = createBackup({
      data: {
        ...data,
        knowledge: [{ ...knowledgeFixture, body: '' }],
      },
    });
    const baseSize = measureUtf8Bytes(JSON.stringify(baseBackup));
    const exactBody = 'a'.repeat(MAX_BACKUP_BYTES - baseSize);
    const download = vi.fn<BackupDownloadPort['download']>(
      async () => undefined,
    );
    await new BackupExportService(
      {
        readSnapshot: async () => ({
          ...data,
          knowledge: [{ ...knowledgeFixture, body: exactBody }],
        }),
      },
      { download },
      () => new Date(EXPORTED_AT),
    ).exportBackup();

    const downloadCall = requireValue(download.mock.calls[0], 'download call');
    expect(measureUtf8Bytes(downloadCall[0])).toBe(MAX_BACKUP_BYTES);
  });

  it('maps above-limit and general export failures safely', async () => {
    const data = createData();
    const knowledgeFixture = requireValue(data.knowledge[0], 'Knowledge entry');
    const baseBackup = createBackup({
      data: {
        ...data,
        knowledge: [{ ...knowledgeFixture, body: '' }],
      },
    });
    const baseSize = measureUtf8Bytes(JSON.stringify(baseBackup));
    const oversizedBody = 'a'.repeat(MAX_BACKUP_BYTES - baseSize + 1);
    const oversized = new BackupExportService(
      {
        readSnapshot: async () => ({
          ...data,
          knowledge: [{ ...knowledgeFixture, body: oversizedBody }],
        }),
      },
      { download: vi.fn(async () => undefined) },
      () => new Date(EXPORTED_AT),
    );
    await expect(oversized.exportBackup()).rejects.toMatchObject({
      code: 'too-large',
    });

    const failed = new BackupExportService(
      { readSnapshot: async () => createData() },
      {
        download: async () => {
          throw new Error('raw browser failure');
        },
      },
      () => new Date(EXPORTED_AT),
    );
    await expect(failed.exportBackup()).rejects.toEqual(
      expect.objectContaining({
        code: 'failure',
        message: "Couldn't export your data. Try again.",
      }),
    );
  });

  it('rejects file size before reading and maps file-read failures', async () => {
    const importService = new BackupImportService();
    const readText = vi.fn(async () => JSON.stringify(createBackup()));
    await expect(
      importService.prepareImport(
        sourceFor('', { size: MAX_BACKUP_BYTES + 1, readText }),
      ),
    ).rejects.toMatchObject({ code: 'too-large' });
    expect(readText).not.toHaveBeenCalled();

    await expect(
      importService.prepareImport(
        sourceFor('', {
          readText: vi.fn(async () => {
            throw new Error('raw read failure');
          }),
        }),
      ),
    ).rejects.toMatchObject({
      code: 'read-failure',
      message: "Couldn't read this backup file. Choose another file.",
    });
  });

  it('builds metadata-only preview and exposes no record content', async () => {
    const prepared = await new BackupImportService().prepareImport(
      sourceFor(JSON.stringify(createBackup())),
    );

    expect(prepared.preview).toEqual({
      filename: 'backup.json',
      exportedAt: EXPORTED_AT,
      knowledgeCount: 1,
      snippetCount: 1,
      defaultModel: 'qwen2.5:7b',
    });
    expect(JSON.stringify(prepared.preview)).not.toContain('data only');
    expect(JSON.stringify(prepared.preview)).not.toContain('Line one');
  });

  it('passes only trusted data to replace-only restore and maps failure', async () => {
    const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
      async () => undefined,
    );
    const service = new BackupRestoreService({ replaceAll });
    const backup = createBackup();
    await service.restoreBackup(backup);
    expect(replaceAll).toHaveBeenCalledWith(backup.data);

    const failed = new BackupRestoreService({
      replaceAll: async () => {
        throw new Error('raw Dexie failure');
      },
    });
    await expect(failed.restoreBackup(backup)).rejects.toBeInstanceOf(
      BackupRestoreError,
    );
  });

  it('formats the approved filename independently', () => {
    expect(createBackupFilename(EXPORTED_AT)).toBe(
      'ai-support-workspace-backup-2026-08-02T08-15-30Z.json',
    );
    expect(createBackupFilename(EXPORTED_AT)).not.toContain(':');
  });
});
