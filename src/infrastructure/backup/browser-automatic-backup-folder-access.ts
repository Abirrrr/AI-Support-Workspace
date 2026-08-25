import type { AutomaticBackupFolderAccess } from '../../application/automatic-backup/automatic-backup-options';
import type { AutomaticBackupPermissionState } from '../../application/automatic-backup/ports';
import type { AutomaticBackupDirectoryHandle } from '../../domain/automatic-backup';

interface AuthorizableDirectoryHandle extends AutomaticBackupDirectoryHandle {
  requestPermission(options: {
    readonly mode: 'readwrite';
  }): Promise<PermissionState>;
}

export interface DirectoryPickerEnvironment {
  showDirectoryPicker?(options: {
    readonly mode: 'readwrite';
  }): Promise<AutomaticBackupDirectoryHandle>;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'AbortError')
  );
}

function asAuthorizable(
  handle: AutomaticBackupDirectoryHandle,
): AuthorizableDirectoryHandle | undefined {
  const candidate = handle as Partial<AuthorizableDirectoryHandle>;
  return typeof candidate.requestPermission === 'function'
    ? (candidate as AuthorizableDirectoryHandle)
    : undefined;
}

export class BrowserAutomaticBackupFolderAccess implements AutomaticBackupFolderAccess {
  constructor(private readonly environment: DirectoryPickerEnvironment) {}

  async pickDirectory(): Promise<AutomaticBackupDirectoryHandle | undefined> {
    if (this.environment.showDirectoryPicker === undefined) {
      throw new Error('directory-picker-unavailable');
    }
    try {
      return await this.environment.showDirectoryPicker({ mode: 'readwrite' });
    } catch (error) {
      if (isAbortError(error)) return undefined;
      throw error;
    }
  }

  async requestPermission(
    handle: AutomaticBackupDirectoryHandle,
  ): Promise<AutomaticBackupPermissionState> {
    const directory = asAuthorizable(handle);
    if (directory === undefined) return 'unavailable';
    try {
      const permission = await directory.requestPermission({
        mode: 'readwrite',
      });
      return permission === 'granted' ||
        permission === 'prompt' ||
        permission === 'denied'
        ? permission
        : 'unavailable';
    } catch {
      return 'unavailable';
    }
  }
}
