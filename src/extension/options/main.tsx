import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import {
  BackupExportService,
  BackupImportService,
  BackupRestoreService,
  type PreparedBackupImport,
} from '../../application/backup/backup-service';
import { BackupReminderService } from '../../application/backup/backup-reminder';
import { SettingsService } from '../../application/settings/settings-service';
import { SnippetLibraryService } from '../../application/snippet/snippet-library';
import { BrowserBackupDownloadAdapter } from '../../infrastructure/backup/browser-backup-download-adapter';
import { BrowserBackupFileSource } from '../../infrastructure/backup/browser-backup-file-source';
import { createDatabase } from '../../infrastructure/persistence/database';
import {
  DexieBackupSnapshotReader,
  DexieTransactionalBackupRestorePort,
} from '../../infrastructure/persistence/dexie-backup-persistence';
import { DexieSettingsRepository } from '../../infrastructure/persistence/dexie-settings-repository';
import { DexieSnippetEntryRepository } from '../../infrastructure/persistence/dexie-snippet-entry-repository';
import { DexieSnippetAssetRepository } from '../../infrastructure/persistence/dexie-snippet-asset-repository';
import { DexieSnippetUsageStatsRepository } from '../../infrastructure/persistence/dexie-snippet-usage-stats-repository';
import { DexieBackupReminderStateRepository } from '../../infrastructure/persistence/dexie-backup-reminder-state-repository';
import { RuntimeCatalogMutationPort } from '../../infrastructure/snippet-trigger/runtime-catalog-mutation-port';
import { ChromeClipboardDeliveryPermission } from '../snippet-trigger/clipboard-permission';
import { ChromeWindowsImageClipboardCapability } from '../snippet-trigger/native-clipboard-capability';
import { OptionsShell } from '../../ui/options/OptionsShell';
import { SnippetDeliveryPlanner } from '../../application/snippet/snippet-delivery-planner';
import { CopySnippetToClipboardService } from '../../application/snippet/copy-snippet-to-clipboard';
import { BrowserImagePngPreparer } from '../../infrastructure/clipboard/browser-image-png-preparer';
import {
  WindowsNativeImageClipboardTransport,
  type NativeClipboardExtensionApi,
} from '../../infrastructure/clipboard/windows-native-image-clipboard-transport';
import {
  OffscreenClipboardTransport,
  RoutedClipboardTransport,
  type ClipboardExtensionApi,
} from '../snippet-trigger/clipboard-transport';
import nativeDevelopment from '../../../config/native-clipboard-companion.development.json';
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
const settingsRepository = new DexieSettingsRepository(database);
const settings = new SettingsService(settingsRepository, catalogMutationPort);
const optionsChrome = (
  globalThis as typeof globalThis & {
    chrome?: Partial<ClipboardExtensionApi> & {
      permissions?: ConstructorParameters<
        typeof ChromeClipboardDeliveryPermission
      >[0];
      runtime?: ConstructorParameters<
        typeof ChromeWindowsImageClipboardCapability
      >[0]['runtime'];
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
const nativeClipboardTransport =
  optionsChrome?.permissions === undefined ||
  optionsChrome.runtime === undefined
    ? undefined
    : new WindowsNativeImageClipboardTransport(
        {
          permissions: optionsChrome.permissions,
          runtime:
            optionsChrome.runtime as unknown as NativeClipboardExtensionApi['runtime'],
        },
        import.meta.env.MODE === 'native-dev'
          ? nativeDevelopment.hostName
          : undefined,
      );
const copySnippet =
  optionsChrome?.permissions === undefined ||
  optionsChrome.offscreen === undefined ||
  optionsChrome.runtime === undefined ||
  nativeClipboardTransport === undefined
    ? undefined
    : new CopySnippetToClipboardService(
        new SnippetDeliveryPlanner(snippetRepository, snippetAssetRepository),
        new RoutedClipboardTransport(
          new OffscreenClipboardTransport(
            optionsChrome as ClipboardExtensionApi,
          ),
          new BrowserImagePngPreparer(),
          nativeClipboardTransport,
        ),
      );
const snippetLibrary = new SnippetLibraryService(
  snippetRepository,
  catalogMutationPort,
  snippetAssetRepository,
  new DexieSnippetUsageStatsRepository(database),
);
if (import.meta.env.MODE === 'native-dev' && catalogRuntime !== undefined) {
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
const backupReminder = new BackupReminderService(
  new DexieBackupReminderStateRepository(database),
);
const backupExport = new BackupExportService(
  backupSnapshotReader,
  new BrowserBackupDownloadAdapter(),
  undefined,
  undefined,
  backupReminder,
);
const backupImport = new BackupImportService();
const backupRestore = new BackupRestoreService(
  new DexieTransactionalBackupRestorePort(database),
  catalogMutationPort,
);
const importExport = {
  exportBackup: () => backupExport.exportBackup(),
  loadBackupReminder: () => backupReminder.load(),
  prepareImport: (file: File) =>
    backupImport.prepareImport(new BrowserBackupFileSource(file)),
  restoreBackup: (prepared: PreparedBackupImport) =>
    backupRestore.restoreBackup(prepared.backup),
};

createRoot(root).render(
  <StrictMode>
    <OptionsShell
      clipboardDelivery={clipboardDelivery}
      importExport={importExport}
      settings={settings}
      snippetLibrary={snippetLibrary}
      copySnippet={copySnippet}
      windowsImageClipboard={windowsImageClipboard}
    />
  </StrictMode>,
);
