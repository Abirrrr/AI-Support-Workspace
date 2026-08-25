import { describe, expect, it, vi } from 'vitest';

import {
  AutomaticBackupOptionsService,
  type AutomaticBackupFolderAccess,
} from '../../src/application/automatic-backup/automatic-backup-options';
import type { AutomaticBackupStateRepository } from '../../src/application/persistence/automatic-backup-state-repository';
import type { SettingsApplication } from '../../src/application/settings/settings-service';
import type {
  AutomaticBackupDirectoryHandle,
  AutomaticBackupState,
} from '../../src/domain/automatic-backup';
import type { AutomaticBackupDirectoryPort } from '../../src/application/automatic-backup/ports';
import { BrowserAutomaticBackupFolderAccess } from '../../src/infrastructure/backup/browser-automatic-backup-folder-access';

const DIRECTORY = { kind: 'directory' as const, name: 'Private backups' };
const SET_ID = '10000000-0000-4000-8000-000000000001';

function storedState(
  directoryHandle: AutomaticBackupDirectoryHandle = DIRECTORY,
): AutomaticBackupState {
  return {
    directoryHandle,
    backupSetId: SET_ID,
    managedBackups: [],
  };
}

function fixture(
  cadence: 'off' | 'daily' | 'weekly' = 'weekly',
  state: AutomaticBackupState | undefined = undefined,
) {
  let currentCadence = cadence;
  let currentState = state;
  let permission: 'granted' | 'prompt' | 'denied' | 'unavailable' = 'granted';
  const settings: SettingsApplication = {
    load: vi.fn(async () => ({
      defaultModel: 'qwen',
      snippetPasteMode: 'automatic' as const,
      automaticBackupCadence: currentCadence,
    })),
    save: vi.fn(async (defaultModelInput, snippetPasteMode, nextCadence) => {
      currentCadence = nextCadence ?? currentCadence;
      return {
        defaultModel: defaultModelInput,
        snippetPasteMode,
        automaticBackupCadence: currentCadence,
      };
    }),
  };
  const stateRepository: AutomaticBackupStateRepository = {
    load: vi.fn(async () => currentState),
    save: vi.fn(async (next) => {
      currentState = next;
      return next;
    }),
    updateAtomically: vi.fn(async (update) => {
      currentState = update(currentState);
      return currentState;
    }),
    clear: vi.fn(async () => {
      currentState = undefined;
    }),
  };
  const directoryPort = {
    queryPermission: vi.fn(async () => permission),
  } as unknown as AutomaticBackupDirectoryPort;
  const folderAccess: AutomaticBackupFolderAccess = {
    pickDirectory: vi.fn(async () => DIRECTORY),
    requestPermission: vi.fn(async () => permission),
  };
  const runtime = {
    reconcileCadenceChange: vi.fn(async () => undefined),
    reconcileStartup: vi.fn(async () => undefined),
    adoptDirectory: vi.fn(async (selected: AutomaticBackupDirectoryHandle) => {
      currentState = storedState(selected);
      return 'first' as const;
    }),
  };
  const service = new AutomaticBackupOptionsService(
    settings,
    stateRepository,
    directoryPort,
    folderAccess,
    runtime,
  );
  return {
    service,
    settings,
    folderAccess,
    runtime,
    setPermission(next: typeof permission) {
      permission = next;
    },
  };
}

describe('AutomaticBackupOptionsService', () => {
  it.each([
    ['off', storedState(), 'off', true, false],
    ['weekly', undefined, 'no-location', false, false],
    ['daily', storedState(), 'ready', true, false],
  ] as const)(
    'maps %s and local location state to a safe UI snapshot',
    async (cadence, state, status, hasLocation, canReauthorize) => {
      const subject = fixture(cadence, state);
      await expect(subject.service.load()).resolves.toEqual({
        cadence,
        status,
        hasLocation,
        canReauthorize,
      });
    },
  );

  it.each(['prompt', 'denied', 'unavailable'] as const)(
    'maps stored %s permission to attention without requesting it',
    async (permission) => {
      const subject = fixture('weekly', storedState());
      subject.setPermission(permission);
      await expect(subject.service.load()).resolves.toMatchObject({
        status: 'attention',
        canReauthorize: true,
      });
      expect(subject.folderAccess.requestPermission).not.toHaveBeenCalled();
    },
  );

  it.each(['off', 'daily', 'weekly'] as const)(
    'saves %s through Settings and delegates scheduling reconciliation',
    async (cadence) => {
      const subject = fixture('weekly', storedState());
      await subject.service.updateCadence(cadence);
      expect(subject.settings.save).toHaveBeenCalledWith(
        'qwen',
        'automatic',
        cadence,
      );
      expect(subject.runtime.reconcileCadenceChange).toHaveBeenCalledOnce();
    },
  );

  it('opens and adopts a selected folder only when the command is invoked', async () => {
    const subject = fixture('weekly');
    expect(subject.folderAccess.pickDirectory).not.toHaveBeenCalled();
    expect(subject.runtime.adoptDirectory).not.toHaveBeenCalled();
    await subject.service.chooseFolder();
    expect(subject.folderAccess.pickDirectory).toHaveBeenCalledOnce();
    expect(subject.runtime.adoptDirectory).toHaveBeenCalledWith(DIRECTORY);
  });

  it('requests prompt permission within the explicit folder command before adoption', async () => {
    const subject = fixture('weekly');
    subject.setPermission('prompt');
    await subject.service.chooseFolder();
    expect(subject.folderAccess.requestPermission).toHaveBeenCalledWith(
      DIRECTORY,
    );
    expect(subject.runtime.adoptDirectory).toHaveBeenCalledOnce();
  });

  it('treats picker cancellation as a no-op and preserves existing state', async () => {
    const subject = fixture('off', storedState());
    vi.mocked(subject.folderAccess.pickDirectory).mockResolvedValue(undefined);
    await expect(subject.service.chooseFolder()).resolves.toMatchObject({
      cadence: 'off',
      hasLocation: true,
    });
    expect(subject.runtime.adoptDirectory).not.toHaveBeenCalled();
    expect(subject.folderAccess.requestPermission).not.toHaveBeenCalled();
  });

  it('requests permission and reconciles only from the explicit reauthorize command', async () => {
    const subject = fixture('daily', storedState());
    subject.setPermission('denied');
    await subject.service.load();
    expect(subject.folderAccess.requestPermission).not.toHaveBeenCalled();
    await expect(subject.service.reauthorize()).resolves.toMatchObject({
      status: 'attention',
    });
    expect(subject.folderAccess.requestPermission).toHaveBeenCalledOnce();
    expect(subject.runtime.reconcileStartup).toHaveBeenCalledOnce();
  });
});

describe('BrowserAutomaticBackupFolderAccess', () => {
  it('uses the exact readwrite picker option and contains cancellation', async () => {
    const showDirectoryPicker = vi
      .fn()
      .mockResolvedValueOnce(DIRECTORY)
      .mockRejectedValueOnce(new DOMException('cancelled', 'AbortError'));
    const access = new BrowserAutomaticBackupFolderAccess({
      showDirectoryPicker,
    });
    await expect(access.pickDirectory()).resolves.toBe(DIRECTORY);
    await expect(access.pickDirectory()).resolves.toBeUndefined();
    expect(showDirectoryPicker).toHaveBeenNthCalledWith(1, {
      mode: 'readwrite',
    });
  });

  it('uses the exact readwrite permission option and contains denial failures', async () => {
    const requestPermission = vi
      .fn()
      .mockResolvedValueOnce('denied')
      .mockRejectedValueOnce(new Error('raw'));
    const handle = { ...DIRECTORY, requestPermission };
    const access = new BrowserAutomaticBackupFolderAccess({});
    await expect(access.requestPermission(handle)).resolves.toBe('denied');
    await expect(access.requestPermission(handle)).resolves.toBe('unavailable');
    expect(requestPermission).toHaveBeenNthCalledWith(1, {
      mode: 'readwrite',
    });
  });
});
