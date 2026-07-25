import Dexie, { type DexieOptions, type Table } from 'dexie';

import type { KnowledgeEntry } from '../../domain/knowledge-entry';
import type { SnippetEntry } from '../../domain/snippet-entry';

export const DATABASE_NAME = 'ai-support-workspace';
export const DATABASE_VERSION = 1;

export interface DatabaseConstructionOptions {
  databaseName?: string;
  indexedDB?: IDBFactory;
  IDBKeyRange?: typeof globalThis.IDBKeyRange;
}

function getDexieOptions(
  options: DatabaseConstructionOptions,
): DexieOptions | undefined {
  const { indexedDB, IDBKeyRange } = options;

  if ((indexedDB === undefined) !== (IDBKeyRange === undefined)) {
    throw new TypeError(
      'indexedDB and IDBKeyRange overrides must be supplied together.',
    );
  }

  if (indexedDB === undefined || IDBKeyRange === undefined) {
    return undefined;
  }

  return { indexedDB, IDBKeyRange };
}

export class AiSupportWorkspaceDatabase extends Dexie {
  readonly knowledgeEntries!: Table<KnowledgeEntry, string>;
  readonly snippetEntries!: Table<SnippetEntry, string>;

  constructor(options: DatabaseConstructionOptions = {}) {
    super(options.databaseName ?? DATABASE_NAME, getDexieOptions(options));

    this.version(DATABASE_VERSION).stores({
      knowledgeEntries: 'id, createdAt',
      snippetEntries: 'id, createdAt',
    });

    this.knowledgeEntries = this.table('knowledgeEntries');
    this.snippetEntries = this.table('snippetEntries');
  }
}

export function createDatabase(
  options: DatabaseConstructionOptions = {},
): AiSupportWorkspaceDatabase {
  return new AiSupportWorkspaceDatabase(options);
}
