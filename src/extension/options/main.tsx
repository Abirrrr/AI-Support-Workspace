import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { KnowledgeLibraryService } from '../../application/knowledge/knowledge-library';
import {
  BackupExportService,
  BackupImportService,
  BackupRestoreService,
  type PreparedBackupImport,
} from '../../application/backup/backup-service';
import { SettingsService } from '../../application/settings/settings-service';
import { SnippetLibraryService } from '../../application/snippet/snippet-library';
import { BrowserBackupDownloadAdapter } from '../../infrastructure/backup/browser-backup-download-adapter';
import { BrowserBackupFileSource } from '../../infrastructure/backup/browser-backup-file-source';
import { createDatabase } from '../../infrastructure/persistence/database';
import {
  DexieBackupSnapshotReader,
  DexieTransactionalBackupRestorePort,
} from '../../infrastructure/persistence/dexie-backup-persistence';
import { DexieKnowledgeEntryRepository } from '../../infrastructure/persistence/dexie-knowledge-entry-repository';
import { DexieSettingsRepository } from '../../infrastructure/persistence/dexie-settings-repository';
import { DexieSnippetEntryRepository } from '../../infrastructure/persistence/dexie-snippet-entry-repository';
import { DexieSnippetAssetRepository } from '../../infrastructure/persistence/dexie-snippet-asset-repository';
import { RuntimeCatalogMutationPort } from '../../infrastructure/snippet-trigger/runtime-catalog-mutation-port';
import { ChromeClipboardDeliveryPermission } from '../snippet-trigger/clipboard-permission';
import { ChromeWindowsImageClipboardCapability } from '../snippet-trigger/native-clipboard-capability';
import { OptionsShell } from '../../ui/options/OptionsShell';
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
const settings = new SettingsService(new DexieSettingsRepository(database));
const optionsChrome = (
  globalThis as typeof globalThis & {
    chrome?: {
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
const snippetLibrary = new SnippetLibraryService(
  new DexieSnippetEntryRepository(database),
  catalogMutationPort,
  new DexieSnippetAssetRepository(database),
);
const backupExport = new BackupExportService(
  new DexieBackupSnapshotReader(database),
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

createRoot(root).render(
  <StrictMode>
    <OptionsShell
      clipboardDelivery={clipboardDelivery}
      knowledgeLibrary={knowledgeLibrary}
      importExport={importExport}
      settings={settings}
      snippetLibrary={snippetLibrary}
      windowsImageClipboard={windowsImageClipboard}
    />
  </StrictMode>,
);
