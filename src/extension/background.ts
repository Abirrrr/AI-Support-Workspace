import { defineBackground } from 'wxt/utils/define-background';

import {
  getWorkspaceCaptureChromeApi,
  registerWorkspaceCaptureCommand,
} from './keyboard-shortcut/background-command';
import { TriggerCatalogService } from '../application/snippet/trigger-catalog';
import { createDatabase } from '../infrastructure/persistence/database';
import { DexieSnippetEntryRepository } from '../infrastructure/persistence/dexie-snippet-entry-repository';
import { DexieSnippetAssetRepository } from '../infrastructure/persistence/dexie-snippet-asset-repository';
import { DexieSettingsRepository } from '../infrastructure/persistence/dexie-settings-repository';
import { DexieSnippetUsageStatsRepository } from '../infrastructure/persistence/dexie-snippet-usage-stats-repository';
import { SnippetDeliveryPlanner } from '../application/snippet/snippet-delivery-planner';
import { BrowserImagePngPreparer } from '../infrastructure/clipboard/browser-image-png-preparer';
import {
  WindowsNativeImageClipboardTransport,
  type NativeClipboardExtensionApi,
} from '../infrastructure/clipboard/windows-native-image-clipboard-transport';
import nativeDevelopment from '../../config/native-clipboard-companion.development.json';
import {
  registerTriggerCatalogCoordinator,
  TriggerCatalogCoordinator,
  type TriggerCatalogCoordinatorRuntime,
} from './snippet-trigger/catalog-coordinator';
import {
  OffscreenClipboardTransport,
  RoutedClipboardTransport,
  type ClipboardExtensionApi,
} from './snippet-trigger/clipboard-transport';
import {
  registerSnippetDeliveryCoordinator,
  SnippetDeliveryCoordinator,
  type AutomaticPasteTraceDiagnosticSink,
  type SnippetDeliveryBrowserSafetyApi,
  type SnippetDeliveryRuntime,
} from './snippet-trigger/delivery-coordinator';
import {
  registerAutomaticPasteResultDiagnostic,
  type DiagnosticSessionStorage,
} from './snippet-trigger/automatic-paste-result-diagnostic';
import {
  registerNativeClipboardCapability,
  type NativeClipboardCapabilityRuntime,
} from './snippet-trigger/native-clipboard-capability';
import {
  ContentScriptLifecycleRecovery,
  registerContentScriptLifecycleRecovery,
  resolveStaticContentScriptFiles,
  type ContentScriptRecoveryChromeApi,
  type LifecycleRecoveryRuntime,
} from './snippet-trigger/lifecycle-recovery';
import { BackupV7CreationService } from '../application/backup/backup-service';
import { AutomaticBackupExecutionEngine } from '../application/automatic-backup/automatic-backup-engine';
import { AutomaticBackupRuntimeCore } from '../application/automatic-backup/automatic-backup-runtime';
import { BrowserAutomaticBackupDirectoryPort } from '../infrastructure/backup/browser-automatic-backup-directory';
import { DexieAutomaticBackupStateRepository } from '../infrastructure/persistence/dexie-automatic-backup-state-repository';
import { DexieBackupSnapshotReader } from '../infrastructure/persistence/dexie-backup-persistence';
import {
  ChromeAutomaticBackupAlarmPort,
  type AutomaticBackupChromeAlarmsApi,
} from './automatic-backup/chrome-alarm-port';
import { registerAutomaticBackupRuntime } from './automatic-backup/runtime-registration';

export default defineBackground(() => {
  const chromeApi = getWorkspaceCaptureChromeApi();

  if (chromeApi !== undefined) {
    registerWorkspaceCaptureCommand(chromeApi);
  }

  const extensionApi = (
    globalThis as typeof globalThis & {
      chrome?: Partial<ClipboardExtensionApi> & {
        permissions?: NativeClipboardExtensionApi['permissions'];
        scripting?: ContentScriptRecoveryChromeApi['scripting'];
        tabs?: ContentScriptRecoveryChromeApi['tabs'] &
          SnippetDeliveryBrowserSafetyApi['tabs'];
        windows?: SnippetDeliveryBrowserSafetyApi['windows'];
        runtime?: TriggerCatalogCoordinatorRuntime &
          SnippetDeliveryRuntime &
          NativeClipboardCapabilityRuntime &
          NativeClipboardExtensionApi['runtime'] &
          LifecycleRecoveryRuntime;
        storage?: {
          readonly session?: DiagnosticSessionStorage;
        };
        alarms?: AutomaticBackupChromeAlarmsApi;
      };
    }
  ).chrome;
  const runtime = extensionApi?.runtime;
  if (runtime !== undefined) {
    let reportAutomaticPasteTrace: AutomaticPasteTraceDiagnosticSink = () =>
      undefined;
    const diagnosticStorage = extensionApi?.storage?.session;
    if (
      import.meta.env.MODE === 'native-dev' &&
      diagnosticStorage !== undefined
    ) {
      const diagnostic = registerAutomaticPasteResultDiagnostic(
        runtime,
        diagnosticStorage,
      );
      reportAutomaticPasteTrace = diagnostic.reportTrace;
    }
    if (import.meta.env.MODE === 'native-dev') {
      void import('./backup-feasibility/background-handler').then(
        ({ registerSelectedFolderFeasibilityBackground }) =>
          registerSelectedFolderFeasibilityBackground(
            runtime as unknown as Parameters<
              typeof registerSelectedFolderFeasibilityBackground
            >[0],
          ),
      );
    }
    const contentScriptFiles = resolveStaticContentScriptFiles(runtime);
    const scripting = extensionApi?.scripting;
    const tabs = extensionApi?.tabs;
    if (
      contentScriptFiles !== undefined &&
      scripting !== undefined &&
      tabs !== undefined
    ) {
      registerContentScriptLifecycleRecovery(
        runtime,
        new ContentScriptLifecycleRecovery(
          { scripting, tabs },
          contentScriptFiles,
        ),
      );
    }
    const database = createDatabase();
    const repository = new DexieSnippetEntryRepository(database);
    const usageStatsRepository = new DexieSnippetUsageStatsRepository(database);
    const settingsRepository = new DexieSettingsRepository(database);
    const automaticBackupStateRepository =
      new DexieAutomaticBackupStateRepository(database);
    const automaticBackupDirectoryPort =
      new BrowserAutomaticBackupDirectoryPort();
    if (extensionApi?.alarms !== undefined) {
      const alarmPort = new ChromeAutomaticBackupAlarmPort(extensionApi.alarms);
      const automaticBackupExecution = new AutomaticBackupExecutionEngine(
        automaticBackupStateRepository,
        automaticBackupDirectoryPort,
        new BackupV7CreationService(new DexieBackupSnapshotReader(database)),
      );
      registerAutomaticBackupRuntime(
        extensionApi.alarms,
        new AutomaticBackupRuntimeCore(
          settingsRepository,
          automaticBackupStateRepository,
          automaticBackupDirectoryPort,
          alarmPort,
          automaticBackupExecution,
        ),
      );
    }
    const coordinator = new TriggerCatalogCoordinator(
      new TriggerCatalogService(repository),
      undefined,
      settingsRepository,
    );
    registerTriggerCatalogCoordinator(runtime, coordinator);
    if (
      extensionApi?.permissions !== undefined &&
      extensionApi.offscreen !== undefined
    ) {
      const nativeTransport = new WindowsNativeImageClipboardTransport(
        {
          permissions: extensionApi.permissions,
          runtime,
        },
        import.meta.env.MODE === 'native-dev'
          ? nativeDevelopment.hostName
          : undefined,
      );
      registerNativeClipboardCapability(runtime, nativeTransport);
      registerSnippetDeliveryCoordinator(
        runtime,
        new SnippetDeliveryCoordinator(
          new SnippetDeliveryPlanner(
            repository,
            new DexieSnippetAssetRepository(database),
          ),
          new RoutedClipboardTransport(
            new OffscreenClipboardTransport(
              extensionApi as ClipboardExtensionApi,
            ),
            new BrowserImagePngPreparer(),
            nativeTransport,
          ),
          coordinator,
          undefined,
          nativeTransport,
          settingsRepository,
          extensionApi.tabs === undefined || extensionApi.windows === undefined
            ? undefined
            : {
                tabs: extensionApi.tabs,
                windows: extensionApi.windows,
              },
          undefined,
          (diagnostic) => reportAutomaticPasteTrace(diagnostic),
          undefined,
          undefined,
          undefined,
          usageStatsRepository,
        ),
      );
    }
  }

  console.info('AI Support Workspace service worker initialized.');
});
