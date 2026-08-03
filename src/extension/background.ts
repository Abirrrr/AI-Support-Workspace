import { defineBackground } from 'wxt/utils/define-background';

import {
  getWorkspaceCaptureChromeApi,
  registerWorkspaceCaptureCommand,
} from './keyboard-shortcut/background-command';
import { TriggerCatalogService } from '../application/snippet/trigger-catalog';
import { createDatabase } from '../infrastructure/persistence/database';
import { DexieSnippetEntryRepository } from '../infrastructure/persistence/dexie-snippet-entry-repository';
import {
  registerTriggerCatalogCoordinator,
  TriggerCatalogCoordinator,
  type TriggerCatalogCoordinatorRuntime,
} from './snippet-trigger/catalog-coordinator';

export default defineBackground(() => {
  const chromeApi = getWorkspaceCaptureChromeApi();

  if (chromeApi !== undefined) {
    registerWorkspaceCaptureCommand(chromeApi);
  }

  const runtime = (
    globalThis as typeof globalThis & {
      chrome?: { runtime?: TriggerCatalogCoordinatorRuntime };
    }
  ).chrome?.runtime;
  if (runtime !== undefined) {
    const database = createDatabase();
    const repository = new DexieSnippetEntryRepository(database);
    registerTriggerCatalogCoordinator(
      runtime,
      new TriggerCatalogCoordinator(new TriggerCatalogService(repository)),
    );
  }

  console.info('AI Support Workspace service worker initialized.');
});
