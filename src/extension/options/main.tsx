import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { KnowledgeLibraryService } from '../../application/knowledge/knowledge-library';
import {
  BackupExportService,
  BackupImportService,
  BackupRestoreService,
  BackupV7CreationService,
  type PreparedBackupImport,
} from '../../application/backup/backup-service';
import { SettingsService } from '../../application/settings/settings-service';
import { AutomaticBackupOptionsService } from '../../application/automatic-backup/automatic-backup-options';
import { AutomaticBackupExecutionEngine } from '../../application/automatic-backup/automatic-backup-engine';
import { AutomaticBackupRuntimeCore } from '../../application/automatic-backup/automatic-backup-runtime';
import { SnippetLibraryService } from '../../application/snippet/snippet-library';
import { BrowserBackupDownloadAdapter } from '../../infrastructure/backup/browser-backup-download-adapter';
import { BrowserBackupFileSource } from '../../infrastructure/backup/browser-backup-file-source';
import { BrowserAutomaticBackupDirectoryPort } from '../../infrastructure/backup/browser-automatic-backup-directory';
import {
  BrowserAutomaticBackupFolderAccess,
  type DirectoryPickerEnvironment,
} from '../../infrastructure/backup/browser-automatic-backup-folder-access';
import { createDatabase } from '../../infrastructure/persistence/database';
import {
  DexieBackupSnapshotReader,
  DexieTransactionalBackupRestorePort,
} from '../../infrastructure/persistence/dexie-backup-persistence';
import { DexieKnowledgeEntryRepository } from '../../infrastructure/persistence/dexie-knowledge-entry-repository';
import { DexieSettingsRepository } from '../../infrastructure/persistence/dexie-settings-repository';
import { DexieSnippetEntryRepository } from '../../infrastructure/persistence/dexie-snippet-entry-repository';
import { DexieSnippetAssetRepository } from '../../infrastructure/persistence/dexie-snippet-asset-repository';
import { DexieSnippetUsageStatsRepository } from '../../infrastructure/persistence/dexie-snippet-usage-stats-repository';
import { DexieAutomaticBackupStateRepository } from '../../infrastructure/persistence/dexie-automatic-backup-state-repository';
import { RuntimeCatalogMutationPort } from '../../infrastructure/snippet-trigger/runtime-catalog-mutation-port';
import { ChromeClipboardDeliveryPermission } from '../snippet-trigger/clipboard-permission';
import { ChromeWindowsImageClipboardCapability } from '../snippet-trigger/native-clipboard-capability';
import { OptionsShell } from '../../ui/options/OptionsShell';
import {
  ChromeAutomaticBackupAlarmPort,
  type AutomaticBackupChromeAlarmsApi,
} from '../automatic-backup/chrome-alarm-port';
import '../../ui/styles.css';

const root = document.querySelector('#root');

if (!root) {
  throw new Error('Options root element was not found.');
}

const database = createDatabase();
const catalogRuntime = (
  globalThis as typeof globalThis & {
    chrome?: {
      runtime?: ConstructorParameters<typeof RuntimeCatalogMutationPort>[0];
    };
  }
).chrome?.runtime;
const catalogMutationPort =
  catalogRuntime === undefined
    ? undefined
    : new RuntimeCatalogMutationPort(catalogRuntime);
const knowledgeLibrary = new KnowledgeLibraryService(
  new DexieKnowledgeEntryRepository(database),
);
const settingsRepository = new DexieSettingsRepository(database);
const settings = new SettingsService(settingsRepository, catalogMutationPort);
const optionsChrome = (
  globalThis as typeof globalThis & {
    chrome?: {
      permissions?: ConstructorParameters<
        typeof ChromeClipboardDeliveryPermission
      >[0];
      runtime?: ConstructorParameters<
        typeof ChromeWindowsImageClipboardCapability
      >[0]['runtime'];
      alarms?: AutomaticBackupChromeAlarmsApi;
    };
  }
).chrome;
const clipboardDelivery =
  optionsChrome?.permissions === undefined
    ? undefined
    : new ChromeClipboardDeliveryPermission(optionsChrome.permissions);
const windowsImageClipboard =
  optionsChrome?.permissions === undefined ||
  optionsChrome.runtime === undefined
    ? undefined
    : new ChromeWindowsImageClipboardCapability({
        permissions: optionsChrome.permissions,
        runtime: optionsChrome.runtime,
      });
const snippetRepository = new DexieSnippetEntryRepository(database);
const snippetAssetRepository = new DexieSnippetAssetRepository(database);
const snippetLibrary = new SnippetLibraryService(
  snippetRepository,
  catalogMutationPort,
  snippetAssetRepository,
  new DexieSnippetUsageStatsRepository(database),
);
if (import.meta.env.MODE === 'native-dev' && catalogRuntime !== undefined) {
  void import('./selected-folder-feasibility-diagnostic').then(
    ({ registerSelectedFolderFeasibilityDiagnostic }) =>
      registerSelectedFolderFeasibilityDiagnostic(catalogRuntime),
  );
  void import('./snippet-list-serialization-diagnostic').then(
    ({ registerSnippetListSerializationDiagnostic }) =>
      registerSnippetListSerializationDiagnostic(
        globalThis,
        snippetRepository,
        snippetAssetRepository,
        catalogRuntime,
      ),
  );
}
const backupSnapshotReader = new DexieBackupSnapshotReader(database);
const backupExport = new BackupExportService(
  backupSnapshotReader,
  new BrowserBackupDownloadAdapter(),
);
const backupImport = new BackupImportService();
const backupRestore = new BackupRestoreService(
  new DexieTransactionalBackupRestorePort(database),
  catalogMutationPort,
);
const importExport = {
  exportBackup: () => backupExport.exportBackup(),
  prepareImport: (file: File) =>
    backupImport.prepareImport(new BrowserBackupFileSource(file)),
  restoreBackup: (prepared: PreparedBackupImport) =>
    backupRestore.restoreBackup(prepared.backup),
};
const automaticBackupStateRepository = new DexieAutomaticBackupStateRepository(
  database,
);
const automaticBackupDirectoryPort = new BrowserAutomaticBackupDirectoryPort();
const automaticBackup =
  optionsChrome?.alarms === undefined
    ? undefined
    : new AutomaticBackupOptionsService(
        settings,
        automaticBackupStateRepository,
        automaticBackupDirectoryPort,
        new BrowserAutomaticBackupFolderAccess(
          globalThis as DirectoryPickerEnvironment,
        ),
        new AutomaticBackupRuntimeCore(
          settingsRepository,
          automaticBackupStateRepository,
          automaticBackupDirectoryPort,
          new ChromeAutomaticBackupAlarmPort(optionsChrome.alarms),
          new AutomaticBackupExecutionEngine(
            automaticBackupStateRepository,
            automaticBackupDirectoryPort,
            new BackupV7CreationService(backupSnapshotReader),
          ),
        ),
      );

createRoot(root).render(
  <StrictMode>
    <OptionsShell
      automaticBackup={automaticBackup}
      clipboardDelivery={clipboardDelivery}
      knowledgeLibrary={knowledgeLibrary}
      importExport={importExport}
      settings={settings}
      snippetLibrary={snippetLibrary}
      windowsImageClipboard={windowsImageClipboard}
    />
  </StrictMode>,
);
