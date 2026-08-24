import type { SelectedFolderScratchRecord } from './contracts';

export const SELECTED_FOLDER_SCRATCH_DATABASE =
  'ai-support-workspace-selected-folder-feasibility-v1';
const STORE = 'feasibility-state';
const RECORD_KEY = 'selected-directory';

export class SelectedFolderScratchRepository {
  public constructor(private readonly factory: IDBFactory = indexedDB) {}

  public async read(): Promise<SelectedFolderScratchRecord | undefined> {
    const database = await this.open();
    try {
      return await new Promise((resolve, reject) => {
        const request = database
          .transaction(STORE, 'readonly')
          .objectStore(STORE)
          .get(RECORD_KEY);
        request.addEventListener('success', () =>
          resolve(request.result as SelectedFolderScratchRecord | undefined),
        );
        request.addEventListener('error', () => reject(request.error));
      });
    } finally {
      database.close();
    }
  }

  public async write(record: SelectedFolderScratchRecord): Promise<void> {
    const database = await this.open();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).put(record, RECORD_KEY);
        transaction.addEventListener('complete', () => resolve());
        transaction.addEventListener('abort', () => reject(transaction.error));
        transaction.addEventListener('error', () => reject(transaction.error));
      });
    } finally {
      database.close();
    }
  }

  public async clear(): Promise<void> {
    const database = await this.open();
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE, 'readwrite');
        transaction.objectStore(STORE).clear();
        transaction.addEventListener('complete', () => resolve());
        transaction.addEventListener('abort', () => reject(transaction.error));
        transaction.addEventListener('error', () => reject(transaction.error));
      });
    } finally {
      database.close();
    }
  }

  private async open(): Promise<IDBDatabase> {
    return await new Promise((resolve, reject) => {
      const request = this.factory.open(SELECTED_FOLDER_SCRATCH_DATABASE, 1);
      request.addEventListener('upgradeneeded', () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE);
        }
      });
      request.addEventListener('success', () => resolve(request.result));
      request.addEventListener('error', () => reject(request.error));
      request.addEventListener('blocked', () =>
        reject(new Error('scratch-database-blocked')),
      );
    });
  }
}
