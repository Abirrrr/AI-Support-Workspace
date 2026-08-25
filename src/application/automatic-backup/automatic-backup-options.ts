import type { SettingsApplication } from '../settings/settings-service';
import type { AutomaticBackupStateRepository } from '../persistence/automatic-backup-state-repository';
import type {
  AutomaticBackupCadence,
  AutomaticBackupDirectoryHandle,
} from '../../domain/automatic-backup';
import type { AutomaticBackupRuntimeCore } from './automatic-backup-runtime';
import type {
  AutomaticBackupDirectoryPort,
  AutomaticBackupPermissionState,
} from './ports';

export type AutomaticBackupOptionsStatus =
  'off' | 'ready' | 'attention' | 'no-location';

export interface AutomaticBackupOptionsSnapshot {
  readonly cadence: AutomaticBackupCadence;
  readonly status: AutomaticBackupOptionsStatus;
  readonly hasLocation: boolean;
  readonly canReauthorize: boolean;
}

export interface AutomaticBackupFolderAccess {
  pickDirectory(): Promise<AutomaticBackupDirectoryHandle | undefined>;
  requestPermission(
    handle: AutomaticBackupDirectoryHandle,
  ): Promise<AutomaticBackupPermissionState>;
}

export interface AutomaticBackupOptionsApplication {
  load(): Promise<AutomaticBackupOptionsSnapshot>;
  updateCadence(
    cadence: AutomaticBackupCadence,
  ): Promise<AutomaticBackupOptionsSnapshot>;
  chooseFolder(): Promise<AutomaticBackupOptionsSnapshot>;
  reauthorize(): Promise<AutomaticBackupOptionsSnapshot>;
}

type OptionsRuntime = Pick<
  AutomaticBackupRuntimeCore,
  'adoptDirectory' | 'reconcileCadenceChange' | 'reconcileStartup'
>;

export class AutomaticBackupOptionsService implements AutomaticBackupOptionsApplication {
  constructor(
    private readonly settings: SettingsApplication,
    private readonly stateRepository: AutomaticBackupStateRepository,
    private readonly directoryPort: AutomaticBackupDirectoryPort,
    private readonly folderAccess: AutomaticBackupFolderAccess,
    private readonly runtime: OptionsRuntime,
  ) {}

  async load(): Promise<AutomaticBackupOptionsSnapshot> {
    const [settings, state] = await Promise.all([
      this.settings.load(),
      this.stateRepository.load(),
    ]);
    const cadence = settings.automaticBackupCadence;
    if (cadence === 'off') {
      return {
        cadence,
        status: 'off',
        hasLocation: state !== undefined,
        canReauthorize: false,
      };
    }
    if (state === undefined) {
      return {
        cadence,
        status: 'no-location',
        hasLocation: false,
        canReauthorize: false,
      };
    }
    const permission = await this.directoryPort.queryPermission(
      state.directoryHandle,
    );
    return {
      cadence,
      status: permission === 'granted' ? 'ready' : 'attention',
      hasLocation: true,
      canReauthorize: permission !== 'granted',
    };
  }

  async updateCadence(
    cadence: AutomaticBackupCadence,
  ): Promise<AutomaticBackupOptionsSnapshot> {
    const current = await this.settings.load();
    await this.settings.save(
      current.defaultModel ?? '',
      current.snippetPasteMode,
      cadence,
    );
    await this.runtime.reconcileCadenceChange();
    return this.load();
  }

  async chooseFolder(): Promise<AutomaticBackupOptionsSnapshot> {
    const selected = await this.folderAccess.pickDirectory();
    if (selected === undefined) return this.load();
    if ((await this.directoryPort.queryPermission(selected)) === 'prompt') {
      await this.folderAccess.requestPermission(selected);
    }
    await this.runtime.adoptDirectory(selected);
    return this.load();
  }

  async reauthorize(): Promise<AutomaticBackupOptionsSnapshot> {
    const state = await this.stateRepository.load();
    if (state === undefined) return this.load();
    await this.folderAccess.requestPermission(state.directoryHandle);
    await this.runtime.reconcileStartup();
    return this.load();
  }
}
