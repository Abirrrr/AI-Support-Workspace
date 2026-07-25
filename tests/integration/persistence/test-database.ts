import { IDBKeyRange, indexedDB } from 'fake-indexeddb';

import {
  createDatabase,
  type AiSupportWorkspaceDatabase,
} from '../../../src/infrastructure/persistence/database';

export function createIsolatedDatabase(
  databaseName = `ai-support-workspace-test-${crypto.randomUUID()}`,
): AiSupportWorkspaceDatabase {
  return createDatabase({ databaseName, indexedDB, IDBKeyRange });
}

export async function deleteIsolatedDatabase(
  databaseName: string,
): Promise<void> {
  const database = createIsolatedDatabase(databaseName);
  await database.delete();
}
