import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['https://example.com/*'],
  main() {
    console.info('AI Support Workspace content script initialized.');
  },
});
