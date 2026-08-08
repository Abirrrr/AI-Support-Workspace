import { describe, expect, it, vi } from 'vitest';

import { BackupRestoreError } from '../../src/application/backup/backup-errors';
import type { CatalogMutationPort } from '../../src/application/snippet/catalog-mutation';
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
import {
  parseBackupFile,
  parseBackupFileV1,
} from '../../src/application/backup/backup-validator';
import {
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  BACKUP_FORMAT_VERSION_1,
  BACKUP_FORMAT_VERSION_2,
  MAX_BACKUP_BYTES,
  type BackupFileV1,
  type BackupFileV2,
  type BackupFileV3,
} from '../../src/domain/backup-file';
import {
  createPlainSnippetContent,
  renderSnippetPlainText,
} from '../../src/domain/snippet-content';

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
        content: createPlainSnippetContent('Line one\nLine two'),
        tags: ['z', 'a'],
        createdAt: '2026-08-02T07:02:00.000Z',
        updatedAt: '2026-08-02T07:03:00.000Z',
        trigger: ';snippet',
      },
    ],
    settings: { defaultModel: 'qwen2.5:7b' },
  };
}

function createBackup(overrides: Partial<BackupFileV1> = {}): BackupFileV1 {
  const data = createData();
  const snippet = requireValue(data.snippets[0], 'Snippet entry');
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_1,
    exportedAt: EXPORTED_AT,
    data: {
      knowledge: data.knowledge.map((entry) => ({
        id: entry.id,
        title: entry.title,
        body: entry.body,
        tags: [...entry.tags],
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        source: entry.source,
      })),
      snippets: [
        {
          id: snippet.id,
          title: snippet.title,
          content: renderSnippetPlainText(snippet.content),
          tags: [...snippet.tags],
          createdAt: snippet.createdAt,
          updatedAt: snippet.updatedAt,
        },
      ],
      settings: { defaultModel: data.settings.defaultModel },
    },
    ...overrides,
  };
}

function createCurrentBackup(data = createData()): BackupFileV3 {
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: EXPORTED_AT,
    data: {
      knowledge: data.knowledge.map((entry) => ({
        id: entry.id,
        title: entry.title,
        body: entry.body,
        tags: [...entry.tags],
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        source: entry.source,
      })),
      snippets: data.snippets.map((entry) => ({
        id: entry.id,
        title: entry.title,
        content:
          entry.content.kind === 'plain'
            ? { kind: 'plain', text: entry.content.text }
            : {
                kind: 'rich',
                blocks: entry.content.blocks.map((block) =>
                  block.type === 'paragraph'
                    ? {
                        type: 'paragraph',
                        children: block.children.map((inline) => ({
                          ...inline,
                        })),
                      }
                    : { ...block },
                ),
              },
        tags: [...entry.tags],
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        trigger: entry.trigger,
      })),
      settings: { defaultModel: data.settings.defaultModel },
    },
  };
}

function createVersion2Backup(data = createData()): BackupFileV2 {
  const current = createCurrentBackup(data);
  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION_2,
    exportedAt: EXPORTED_AT,
    data: {
      knowledge: current.data.knowledge,
      snippets: data.snippets.map((entry) => ({
        id: entry.id,
        title: entry.title,
        content: renderSnippetPlainText(entry.content),
        tags: [...entry.tags],
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        trigger: entry.trigger,
      })),
      settings: current.data.settings,
    },
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
    const snippet = requireValue(
      sameIdData.snippets[0],
      'same-ID Snippet entry',
    );
    const parsed = parseBackupFileV1(
      JSON.stringify({
        ...createBackup(),
        data: {
          knowledge: sameIdData.knowledge,
          snippets: [
            {
              id: KNOWLEDGE_ID,
              title: snippet.title,
              content: renderSnippetPlainText(snippet.content),
              tags: snippet.tags,
              createdAt: snippet.createdAt,
              updatedAt: snippet.updatedAt,
            },
          ],
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
      parseBackupFileV1(JSON.stringify(createCurrentBackup())),
    ).toThrowError(expect.objectContaining({ code: 'unsupported-version' }));
    expect(() =>
      parseBackupFileV1(
        JSON.stringify({ format: BACKUP_FORMAT, formatVersion: 2 }),
      ),
    ).toThrowError(expect.objectContaining({ code: 'unsupported-version' }));
  });

  it('keeps version 1 exact by rejecting simulated future DTO fields', () => {
    const backup = createBackup();
    const snippet = requireValue(backup.data.snippets[0], 'Snippet entry');
    expect(() =>
      parseBackupFileV1(
        JSON.stringify({
          ...backup,
          data: {
            ...backup.data,
            snippets: [{ ...snippet, futureSnippetField: 'not-v1' }],
          },
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: 'invalid' }));
  });
});

describe('Backup Format v2 and v3 parser and validator', () => {
  it('keeps exact v2 DTOs importable with canonical unique triggers', () => {
    const backup = createVersion2Backup();
    expect(parseBackupFile(JSON.stringify(backup))).toEqual(backup);
  });

  it('accepts exact v3 DTOs and preserves structured content', () => {
    const backup = createCurrentBackup();
    expect(parseBackupFile(JSON.stringify(backup))).toEqual(backup);
  });

  it.each([
    [
      'unknown block',
      { kind: 'rich', blocks: [{ type: 'heading', children: [] }] },
    ],
    [
      'unknown inline',
      {
        kind: 'rich',
        blocks: [
          { type: 'paragraph', children: [{ type: 'code', text: 'x' }] },
        ],
      },
    ],
    [
      'missing mark',
      {
        kind: 'rich',
        blocks: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'x', bold: false }],
          },
        ],
      },
    ],
    [
      'unsafe link',
      {
        kind: 'rich',
        blocks: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'link',
                text: 'x',
                url: 'javascript:alert(1)',
                bold: false,
                italic: false,
              },
            ],
          },
        ],
      },
    ],
    [
      'unsafe image',
      {
        kind: 'rich',
        blocks: [
          {
            type: 'reference',
            referenceType: 'image',
            label: 'x',
            url: 'data:image/png;base64,AA==',
          },
        ],
      },
    ],
    ['extra content key', { kind: 'plain', text: 'x', html: '<b>x</b>' }],
  ])('rejects v3 %s', (_label, content) => {
    const backup = createCurrentBackup();
    expect(() =>
      parseBackupFile(
        JSON.stringify({
          ...backup,
          data: {
            ...backup.data,
            snippets: [{ ...backup.data.snippets[0], content }],
          },
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: 'invalid' }));
  });

  it.each([
    [
      'missing trigger',
      (backup: BackupFileV3) => {
        const snippet = requireValue(backup.data.snippets[0], 'Snippet entry');
        const withoutTrigger = {
          id: snippet.id,
          title: snippet.title,
          content: snippet.content,
          tags: snippet.tags,
          createdAt: snippet.createdAt,
          updatedAt: snippet.updatedAt,
        };
        return {
          ...backup,
          data: { ...backup.data, snippets: [withoutTrigger] },
        };
      },
    ],
    [
      'uppercase trigger',
      (backup: BackupFileV3) => ({
        ...backup,
        data: {
          ...backup.data,
          snippets: [{ ...backup.data.snippets[0], trigger: ';HELLO' }],
        },
      }),
    ],
    [
      'unexpected Snippet field',
      (backup: BackupFileV3) => ({
        ...backup,
        data: {
          ...backup.data,
          snippets: [
            { ...backup.data.snippets[0], futureField: 'not-approved' },
          ],
        },
      }),
    ],
  ])('rejects %s', (_label, mutate) => {
    expect(() =>
      parseBackupFile(JSON.stringify(mutate(createCurrentBackup()))),
    ).toThrowError(expect.objectContaining({ code: 'invalid' }));
  });

  it('rejects duplicate non-null triggers while allowing repeated null', () => {
    const backup = createCurrentBackup();
    const snippet = requireValue(backup.data.snippets[0], 'Snippet entry');
    const duplicate = {
      ...snippet,
      id: '323e4567-e89b-42d3-a456-426614174000',
    };
    expect(() =>
      parseBackupFile(
        JSON.stringify({
          ...backup,
          data: { ...backup.data, snippets: [snippet, duplicate] },
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: 'invalid' }));

    expect(() =>
      parseBackupFile(
        JSON.stringify({
          ...backup,
          data: {
            ...backup.data,
            snippets: [
              { ...snippet, trigger: null },
              { ...duplicate, trigger: null },
            ],
          },
        }),
      ),
    ).not.toThrow();
  });

  it('rejects unsupported future versions explicitly', () => {
    expect(() =>
      parseBackupFile(
        JSON.stringify({ ...createCurrentBackup(), formatVersion: 4 }),
      ),
    ).toThrowError(expect.objectContaining({ code: 'unsupported-version' }));
  });
});

describe('backup application services', () => {
  it('exports, parses, and restores rich v3 content without live-object aliasing', async () => {
    const data = createData();
    const snippet = requireValue(data.snippets[0], 'Snippet entry');
    const richContent = {
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Bold', bold: true, italic: false },
            {
              type: 'link',
              text: 'Guide',
              url: 'https://example.com/guide',
              bold: false,
              italic: true,
            },
          ],
        },
        {
          type: 'reference',
          referenceType: 'image',
          label: 'Receipt',
          url: 'https://example.com/receipt.png',
        },
      ],
    } as const;
    const snapshot = {
      ...data,
      snippets: [{ ...snippet, content: richContent }],
    };
    const download = vi.fn<BackupDownloadPort['download']>(
      async () => undefined,
    );
    await new BackupExportService(
      { readSnapshot: async () => snapshot },
      { download },
      () => new Date(EXPORTED_AT),
    ).exportBackup();
    const serialized = requireValue(download.mock.calls[0], 'download call')[0];
    const parsed = parseBackupFile(serialized);
    const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
      async () => undefined,
    );

    await new BackupRestoreService({ replaceAll }).restoreBackup(parsed);

    expect(parsed.formatVersion).toBe(3);
    expect(replaceAll).toHaveBeenCalledWith({
      knowledge: data.knowledge,
      snippets: [{ ...snippet, content: richContent }],
      settings: data.settings,
    });
    expect(
      requireValue(replaceAll.mock.calls[0], 'restore call')[0].snippets[0]
        ?.content,
    ).not.toBe(richContent);
  });

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
    const parsed = JSON.parse(serialized) as BackupFileV3;
    expect(parsed.format).toBe(BACKUP_FORMAT);
    expect(parsed.formatVersion).toBe(3);
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
    expect(parsed.data.snippets[0]?.trigger).toBe(';snippet');
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
    const parsed = JSON.parse(downloadCall[0]) as BackupFileV3;
    expect(parsed.data).toEqual({
      knowledge: [],
      snippets: [],
      settings: { defaultModel: null },
    });
  });

  it('round-trips a version 2 export through validation and restore mappings', async () => {
    const original = createData();
    const download = vi.fn<BackupDownloadPort['download']>(
      async () => undefined,
    );
    await new BackupExportService(
      { readSnapshot: async () => original },
      { download },
      () => new Date(EXPORTED_AT),
    ).exportBackup();
    const [serialized] = requireValue(
      download.mock.calls[0],
      'round-trip download call',
    );
    const prepared = await new BackupImportService().prepareImport(
      sourceFor(serialized),
    );
    const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
      async () => undefined,
    );

    await new BackupRestoreService({ replaceAll }).restoreBackup(
      prepared.backup,
    );

    expect(replaceAll).toHaveBeenCalledWith(original);
    expect(prepared.backup.formatVersion).toBe(3);
  });

  it('excludes simulated future live-domain fields from serialized format v2', async () => {
    const data = createData();
    const knowledge = Object.assign(
      requireValue(data.knowledge[0], 'Knowledge entry'),
      { futureKnowledgeField: 'not-version-1', usageCount: 12 },
    );
    const snippet = Object.assign(
      requireValue(data.snippets[0], 'Snippet entry'),
      { futureSnippetField: '/future', richContent: { blocks: [] } },
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
    const parsed = JSON.parse(serialized) as BackupFileV3;
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
      [
        'id',
        'title',
        'content',
        'tags',
        'createdAt',
        'updatedAt',
        'trigger',
      ].sort(),
    );
    expect(Object.keys(parsed.data.settings)).toEqual(['defaultModel']);
    expect(serialized).not.toContain('futureKnowledgeField');
    expect(serialized).not.toContain('usageCount');
    expect(serialized).not.toContain('futureSnippetField');
    expect(serialized).not.toContain('richContent');
    expect(serialized).not.toContain('futureSettingsField');
  });

  it('uses UTF-8 byte measurement and accepts exactly the size limit', async () => {
    expect(measureUtf8Bytes('é')).toBe(2);
    const data = createData();
    const knowledgeFixture = requireValue(data.knowledge[0], 'Knowledge entry');
    const baseBackup = createCurrentBackup({
      ...data,
      knowledge: [{ ...knowledgeFixture, body: '' }],
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
    const baseBackup = createCurrentBackup({
      ...data,
      knowledge: [{ ...knowledgeFixture, body: '' }],
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
      triggerWarning:
        'This version 1 backup does not contain Snippet triggers. Restored Snippets will have no triggers.',
    });
    expect(JSON.stringify(prepared.preview)).not.toContain('data only');
    expect(JSON.stringify(prepared.preview)).not.toContain('Line one');
  });

  it('previews v2 without the legacy warning and restores its trigger exactly', async () => {
    const backup = createCurrentBackup();
    const prepared = await new BackupImportService().prepareImport(
      sourceFor(JSON.stringify(backup)),
    );
    expect(prepared.preview.triggerWarning).toBeNull();
    const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
      async () => undefined,
    );
    await new BackupRestoreService({ replaceAll }).restoreBackup(
      prepared.backup,
    );
    expect(replaceAll).toHaveBeenCalledWith({
      knowledge: backup.data.knowledge,
      snippets: backup.data.snippets,
      settings: backup.data.settings,
    });
  });

  it('passes only trusted data to replace-only restore and maps failure', async () => {
    const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
      async () => undefined,
    );
    const service = new BackupRestoreService({ replaceAll });
    const backup = createBackup();
    await service.restoreBackup(backup);
    expect(replaceAll).toHaveBeenCalledWith({
      knowledge: backup.data.knowledge,
      snippets: backup.data.snippets.map((entry) => ({
        ...entry,
        content: createPlainSnippetContent(entry.content),
        trigger: null,
      })),
      settings: backup.data.settings,
    });

    const failed = new BackupRestoreService({
      replaceAll: async () => {
        throw new Error('raw Dexie failure');
      },
    });
    await expect(failed.restoreBackup(backup)).rejects.toBeInstanceOf(
      BackupRestoreError,
    );
  });

  it('isolates simulated future version 1 DTO fields during restore mapping', async () => {
    const backup = createBackup();
    const futureBackup = {
      ...backup,
      data: {
        knowledge: backup.data.knowledge.map((entry) => ({
          ...entry,
          futureKnowledgeField: 'not-restored',
        })),
        snippets: backup.data.snippets.map((entry) => ({
          ...entry,
          futureSnippetField: 'not-restored',
        })),
        settings: {
          ...backup.data.settings,
          futureSettingsField: 'not-restored',
        },
      },
    } as BackupFileV1;
    const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
      async () => undefined,
    );

    await new BackupRestoreService({ replaceAll }).restoreBackup(futureBackup);

    const restoreCall = requireValue(replaceAll.mock.calls[0], 'restore call');
    expect(JSON.stringify(restoreCall[0])).not.toContain('future');
    expect(restoreCall[0].snippets[0]).toMatchObject({ trigger: null });
  });

  it('coordinates restore invalidation and publication around atomic persistence', async () => {
    const order: string[] = [];
    const replaceAll = vi.fn<TransactionalBackupRestorePort['replaceAll']>(
      async () => {
        order.push('restore');
      },
    );
    const catalogPort: CatalogMutationPort = {
      invalidateBeforeMutation: async () => {
        order.push('invalidate');
        return 'restore-1';
      },
      publishAfterMutation: async (id, outcome) => {
        order.push(`publish-${id}-${outcome}`);
        return true;
      },
    };

    await new BackupRestoreService({ replaceAll }, catalogPort).restoreBackup(
      createCurrentBackup(),
    );

    expect(order).toEqual([
      'invalidate',
      'restore',
      'publish-restore-1-succeeded',
    ]);
  });

  it('formats the approved filename independently', () => {
    expect(createBackupFilename(EXPORTED_AT)).toBe(
      'ai-support-workspace-backup-2026-08-02T08-15-30Z.json',
    );
    expect(createBackupFilename(EXPORTED_AT)).not.toContain(':');
  });
});
