import { defineBackground } from 'wxt/utils/define-background';

import {
  getWorkspaceCaptureChromeApi,
  registerWorkspaceCaptureCommand,
} from './keyboard-shortcut/background-command';

export default defineBackground(() => {
  const chromeApi = getWorkspaceCaptureChromeApi();

  if (chromeApi !== undefined) {
    registerWorkspaceCaptureCommand(chromeApi);
  }

  console.info('AI Support Workspace service worker initialized.');
});
