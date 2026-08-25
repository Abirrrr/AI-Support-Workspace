import type { AutomaticBackupDirectoryHandle } from '../../domain/automatic-backup';
import {
  AutomaticBackupFileCollisionError,
  type AutomaticBackupDirectoryPort,
  type AutomaticBackupPermissionState,
  type DirectoryIdentityResult,
} from '../../application/automatic-backup/ports';

interface BrowserFileHandle {
  getFile(): Promise<Blob>;
  createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }>;
}

interface BrowserDirectoryHandle extends AutomaticBackupDirectoryHandle {
  queryPermission(options: {
    readonly mode: 'readwrite';
  }): Promise<PermissionState>;
  isSameEntry(other: BrowserDirectoryHandle): Promise<boolean>;
  getFileHandle(
    name: string,
    options?: { readonly create?: boolean },
  ): Promise<BrowserFileHandle>;
  removeEntry(name: string): Promise<void>;
}

function asBrowserDirectory(
  handle: AutomaticBackupDirectoryHandle,
): BrowserDirectoryHandle | undefined {
  const candidate = handle as Partial<BrowserDirectoryHandle>;
  return typeof candidate.queryPermission === 'function' &&
    typeof candidate.isSameEntry === 'function' &&
    typeof candidate.getFileHandle === 'function' &&
    typeof candidate.removeEntry === 'function'
    ? (candidate as BrowserDirectoryHandle)
    : undefined;
}

function isNotFound(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'NotFoundError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'NotFoundError')
  );
}

export class BrowserAutomaticBackupDirectoryPort implements AutomaticBackupDirectoryPort {
  async queryPermission(
    handle: AutomaticBackupDirectoryHandle,
  ): Promise<AutomaticBackupPermissionState> {
    const directory = asBrowserDirectory(handle);
    if (directory === undefined) return 'unavailable';
    try {
      const permission = await directory.queryPermission({ mode: 'readwrite' });
      return permission === 'granted' ||
        permission === 'prompt' ||
        permission === 'denied'
        ? permission
        : 'unavailable';
    } catch {
      return 'unavailable';
    }
  }

  async compareIdentity(
    left: AutomaticBackupDirectoryHandle,
    right: AutomaticBackupDirectoryHandle,
  ): Promise<DirectoryIdentityResult> {
    const leftDirectory = asBrowserDirectory(left);
    const rightDirectory = asBrowserDirectory(right);
    if (leftDirectory === undefined || rightDirectory === undefined) {
      return 'uncertain';
    }
    try {
      return (await leftDirectory.isSameEntry(rightDirectory))
        ? 'same'
        : 'different';
    } catch {
      return 'uncertain';
    }
  }

  async writeNewFile(
    handle: AutomaticBackupDirectoryHandle,
    filename: string,
    contents: string,
  ): Promise<void> {
    const directory = asBrowserDirectory(handle);
    if (directory === undefined) throw new Error('directory-unavailable');
    try {
      await directory.getFileHandle(filename);
      throw new AutomaticBackupFileCollisionError();
    } catch (error) {
      if (error instanceof AutomaticBackupFileCollisionError) throw error;
      if (!isNotFound(error)) throw error;
    }
    const fileHandle = await directory.getFileHandle(filename, {
      create: true,
    });
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
  }

  async readFile(
    handle: AutomaticBackupDirectoryHandle,
    filename: string,
  ): Promise<Uint8Array> {
    const directory = asBrowserDirectory(handle);
    if (directory === undefined) throw new Error('directory-unavailable');
    const file = await (await directory.getFileHandle(filename)).getFile();
    return new Uint8Array(await file.arrayBuffer());
  }

  async deleteFile(
    handle: AutomaticBackupDirectoryHandle,
    filename: string,
  ): Promise<void> {
    const directory = asBrowserDirectory(handle);
    if (directory === undefined) throw new Error('directory-unavailable');
    await directory.removeEntry(filename);
  }
}
