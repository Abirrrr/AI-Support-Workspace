import { defineBackground } from 'wxt/utils/define-background';

import {
  getWorkspaceCaptureChromeApi,
  registerWorkspaceCaptureCommand,
} from './keyboard-shortcut/background-command';
import { TriggerCatalogService } from '../application/snippet/trigger-catalog';
import { createDatabase } from '../infrastructure/persistence/database';
import { DexieSnippetEntryRepository } from '../infrastructure/persistence/dexie-snippet-entry-repository';
import { DexieSnippetAssetRepository } from '../infrastructure/persistence/dexie-snippet-asset-repository';
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
  type SnippetDeliveryRuntime,
} from './snippet-trigger/delivery-coordinator';
import {
  registerNativeClipboardCapability,
  type NativeClipboardCapabilityRuntime,
} from './snippet-trigger/native-clipboard-capability';

export default defineBackground(() => {
  const chromeApi = getWorkspaceCaptureChromeApi();

  if (chromeApi !== undefined) {
    registerWorkspaceCaptureCommand(chromeApi);
  }

  const extensionApi = (
    globalThis as typeof globalThis & {
      chrome?: Partial<ClipboardExtensionApi> & {
        permissions?: NativeClipboardExtensionApi['permissions'];
        runtime?: TriggerCatalogCoordinatorRuntime &
          SnippetDeliveryRuntime &
          NativeClipboardCapabilityRuntime &
          NativeClipboardExtensionApi['runtime'];
      };
    }
  ).chrome;
  const runtime = extensionApi?.runtime;
  if (runtime !== undefined) {
    const database = createDatabase();
    const repository = new DexieSnippetEntryRepository(database);
    const coordinator = new TriggerCatalogCoordinator(
      new TriggerCatalogService(repository),
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
        ),
      );
    }
  }

  console.info('AI Support Workspace service worker initialized.');
});
