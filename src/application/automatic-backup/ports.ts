import type { AutomaticBackupDirectoryHandle } from '../../domain/automatic-backup';

export type AutomaticBackupPermissionState =
  'granted' | 'prompt' | 'denied' | 'unavailable';

export type DirectoryIdentityResult = 'same' | 'different' | 'uncertain';

export class AutomaticBackupFileCollisionError extends Error {
  constructor() {
    super('The managed automatic-backup filename already exists.');
    this.name = 'AutomaticBackupFileCollisionError';
  }
}

export interface AutomaticBackupDirectoryPort {
  queryPermission(
    handle: AutomaticBackupDirectoryHandle,
  ): Promise<AutomaticBackupPermissionState>;
  compareIdentity(
    left: AutomaticBackupDirectoryHandle,
    right: AutomaticBackupDirectoryHandle,
  ): Promise<DirectoryIdentityResult>;
  writeNewFile(
    handle: AutomaticBackupDirectoryHandle,
    filename: string,
    contents: string,
  ): Promise<void>;
  readFile(
    handle: AutomaticBackupDirectoryHandle,
    filename: string,
  ): Promise<Uint8Array>;
  deleteFile(
    handle: AutomaticBackupDirectoryHandle,
    filename: string,
  ): Promise<void>;
}

export interface AutomaticBackupAlarm {
  readonly name: string;
  readonly scheduledTime: number;
  readonly periodInMinutes?: number;
}

export interface AutomaticBackupAlarmPort {
  get(name: string): Promise<AutomaticBackupAlarm | undefined>;
  create(name: string, when: number): Promise<void>;
  clear(name: string): Promise<void>;
}
