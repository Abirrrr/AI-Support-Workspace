import { describe, expect, it, vi } from 'vitest';

import { AutomaticBackupFileCollisionError } from '../../src/application/automatic-backup/ports';
import type { AutomaticBackupRuntimeCore } from '../../src/application/automatic-backup/automatic-backup-runtime';
import { ChromeAutomaticBackupAlarmPort } from '../../src/extension/automatic-backup/chrome-alarm-port';
import { registerAutomaticBackupRuntime } from '../../src/extension/automatic-backup/runtime-registration';
import { BrowserAutomaticBackupDirectoryPort } from '../../src/infrastructure/backup/browser-automatic-backup-directory';
import type { AutomaticBackupDirectoryHandle } from '../../src/domain/automatic-backup';

function notFound(): Error {
  return Object.assign(new Error('missing'), { name: 'NotFoundError' });
}

function createDirectory() {
  const files = new Map<string, string>();
  const requestPermission = vi.fn();
  const queryPermission = vi.fn(async () => 'granted' as PermissionState);
  const isSameEntry = vi.fn(async (other: unknown) => other === directory);
  const removeEntry = vi.fn(async (name: string) => {
    if (!files.delete(name)) throw notFound();
  });
  const getFileHandle = vi.fn(
    async (name: string, options?: { readonly create?: boolean }) => {
      if (!files.has(name) && options?.create !== true) throw notFound();
      if (!files.has(name)) files.set(name, '');
      return {
        getFile: async () => new Blob([files.get(name) ?? '']),
        createWritable: async () => ({
          write: async (contents: string) => {
            files.set(name, contents);
          },
          close: async () => undefined,
        }),
      };
    },
  );
  const directory = {
    kind: 'directory' as const,
    name: 'Backups',
    requestPermission,
    queryPermission,
    isSameEntry,
    getFileHandle,
    removeEntry,
  };
  return {
    directory,
    files,
    requestPermission,
    queryPermission,
    isSameEntry,
    getFileHandle,
    removeEntry,
  };
}

describe('automatic-backup browser directory adapter', () => {
  it('queries read/write permission without ever requesting permission', async () => {
    const fixture = createDirectory();
    const port = new BrowserAutomaticBackupDirectoryPort();
    await expect(
      port.queryPermission(
        fixture.directory as unknown as AutomaticBackupDirectoryHandle,
      ),
    ).resolves.toBe('granted');
    expect(fixture.queryPermission).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(fixture.requestPermission).not.toHaveBeenCalled();
  });

  it('distinguishes same/different identity and fails uncertain on errors', async () => {
    const left = createDirectory();
    const right = createDirectory();
    const port = new BrowserAutomaticBackupDirectoryPort();
    await expect(
      port.compareIdentity(
        left.directory as unknown as AutomaticBackupDirectoryHandle,
        left.directory as unknown as AutomaticBackupDirectoryHandle,
      ),
    ).resolves.toBe('same');
    await expect(
      port.compareIdentity(
        left.directory as unknown as AutomaticBackupDirectoryHandle,
        right.directory as unknown as AutomaticBackupDirectoryHandle,
      ),
    ).resolves.toBe('different');
    left.isSameEntry.mockRejectedValueOnce(new Error('unavailable'));
    await expect(
      port.compareIdentity(
        left.directory as unknown as AutomaticBackupDirectoryHandle,
        right.directory as unknown as AutomaticBackupDirectoryHandle,
      ),
    ).resolves.toBe('uncertain');
  });

  it('creates, closes, reopens, and deletes only an exact file', async () => {
    const fixture = createDirectory();
    const handle =
      fixture.directory as unknown as AutomaticBackupDirectoryHandle;
    const port = new BrowserAutomaticBackupDirectoryPort();
    await port.writeNewFile(handle, 'managed.json', 'verified bytes');
    await expect(port.readFile(handle, 'managed.json')).resolves.toEqual(
      new TextEncoder().encode('verified bytes'),
    );
    await port.deleteFile(handle, 'managed.json');
    expect(fixture.removeEntry).toHaveBeenCalledWith('managed.json');
    expect(fixture.files.size).toBe(0);
  });

  it('refuses a collision without creating or overwriting the file', async () => {
    const fixture = createDirectory();
    fixture.files.set('managed.json', 'existing user bytes');
    const port = new BrowserAutomaticBackupDirectoryPort();
    await expect(
      port.writeNewFile(
        fixture.directory as unknown as AutomaticBackupDirectoryHandle,
        'managed.json',
        'replacement',
      ),
    ).rejects.toBeInstanceOf(AutomaticBackupFileCollisionError);
    expect(fixture.files.get('managed.json')).toBe('existing user bytes');
    expect(fixture.getFileHandle).toHaveBeenCalledTimes(1);
  });
});

describe('automatic-backup alarm adapter and registration', () => {
  it('creates only an absolute one-shot alarm and adapts callbacks', async () => {
    const create = vi.fn();
    const clear = vi.fn((_name: string, callback: (cleared: boolean) => void) =>
      callback(true),
    );
    const get = vi.fn(
      (
        _name: string,
        callback: (alarm?: { name: string; scheduledTime: number }) => void,
      ) => callback({ name: 'automatic', scheduledTime: 123 }),
    );
    const port = new ChromeAutomaticBackupAlarmPort({
      get,
      create,
      clear,
      onAlarm: { addListener: vi.fn() },
    });
    await expect(port.get('automatic')).resolves.toEqual({
      name: 'automatic',
      scheduledTime: 123,
    });
    await port.create('automatic', 456);
    await port.clear('automatic');
    expect(create).toHaveBeenCalledWith('automatic', { when: 456 });
    expect(clear).toHaveBeenCalledWith('automatic', expect.any(Function));
  });

  it('reconciles at startup and routes alarm names without leaking failures', async () => {
    let listener:
      ((alarm: { name: string; scheduledTime: number }) => void) | undefined;
    const runtime = {
      reconcileStartup: vi.fn(async () => undefined),
      handleAlarm: vi.fn(async () => undefined),
    };
    registerAutomaticBackupRuntime(
      {
        get: vi.fn(),
        create: vi.fn(),
        clear: vi.fn(),
        onAlarm: {
          addListener: vi.fn((next) => {
            listener = next;
          }),
        },
      },
      runtime as unknown as AutomaticBackupRuntimeCore,
    );
    await vi.waitFor(() =>
      expect(runtime.reconcileStartup).toHaveBeenCalledOnce(),
    );
    listener?.({ name: 'automatic', scheduledTime: 123 });
    await vi.waitFor(() =>
      expect(runtime.handleAlarm).toHaveBeenCalledWith('automatic'),
    );
  });
});
