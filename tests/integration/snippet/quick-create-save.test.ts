import { afterEach, beforeEach, expect, it } from 'vitest';
import { SnippetLibraryService } from '../../../src/application/snippet/snippet-library';
import { BrowserQuickCreateClipboard } from '../../../src/infrastructure/clipboard/browser-quick-create-clipboard';
import { DexieSnippetEntryRepository } from '../../../src/infrastructure/persistence/dexie-snippet-entry-repository';
import type { AiSupportWorkspaceDatabase } from '../../../src/infrastructure/persistence/database';
import {
  createIsolatedDatabase,
  deleteIsolatedDatabase,
} from '../persistence/test-database';

let name: string, database: AiSupportWorkspaceDatabase;
beforeEach(() => {
  name = `quick-create-test-${crypto.randomUUID()}`;
  database = createIsolatedDatabase(name);
});
afterEach(async () => {
  database.close({ disableAutoOpen: true });
  await deleteIsolatedDatabase(name);
});

it('persists Text and the exactly-owned Image asset only through existing explicit create services', async () => {
  const service = new SnippetLibraryService(
    new DexieSnippetEntryRepository(database),
  );
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const data = new DataView(bytes.buffer);
  data.setUint32(8, 13);
  bytes.set([73, 72, 68, 82], 12);
  data.setUint32(16, 2);
  data.setUint32(20, 2);
  const permissions = { contains: async () => true, request: async () => true };
  for (const [type, blob] of [
    ['text/plain', new Blob(['Saved only by the user\nবাংলা'])],
    ['image/png', new Blob([bytes], { type: 'image/png' })],
  ] as const) {
    const before = await database.snippetEntries.count();
    const source = new BrowserQuickCreateClipboard(
      permissions,
      { read: async () => [{ types: [type], getType: async () => blob }] },
      async () => ({ width: 2, height: 2, close() {} }),
      () => true,
    );
    const draft = await source.readDraft();
    expect(await database.snippetEntries.count()).toBe(before);
    expect(await database.snippetAssets.count()).toBe(0);
    const saved = await service.create({
      title: 'Explicit Save',
      trigger: null,
      tags: [],
      content:
        draft.kind === 'text'
          ? draft.content
          : { kind: 'image', assetId: draft.asset.id },
      ...(draft.kind === 'image' ? { newAssets: [draft.asset] } : {}),
    });
    expect(await database.snippetEntries.count()).toBe(before + 1);
    if (draft.kind === 'image') {
      const asset = await database.snippetAssets.get(draft.asset.id);
      expect(asset?.snippetId).toBe(saved.id);
      expect(asset?.blob).toEqual(blob);
      await service.delete(saved.id);
      expect(await database.snippetAssets.count()).toBe(0);
    }
  }
});
