import { defineContentScript } from 'wxt/utils/define-content-script';
import { FrameTriggerCatalogClient } from './snippet-trigger/frame-catalog-client';
import {
  SnippetExpansionController,
  toBeforeInputEventLike,
} from './snippet-trigger/expansion-controller';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  allFrames: true,
  main() {
    const runtime = (
      globalThis as typeof globalThis & {
        chrome?: {
          runtime?: ConstructorParameters<typeof FrameTriggerCatalogClient>[0];
        };
      }
    ).chrome?.runtime;
    if (runtime === undefined) return;

    const client = new FrameTriggerCatalogClient(runtime);
    const controller = new SnippetExpansionController(document, client.cache);
    const beforeInputListener = (event: Event) => {
      const beforeInputEvent = toBeforeInputEventLike(event);
      if (beforeInputEvent !== undefined) {
        controller.handleBeforeInput(beforeInputEvent);
      }
    };
    const focusListener = () => {
      if (!client.isConnected) client.connect();
    };
    const unloadListener = () => client.disconnect();

    client.connect();
    document.addEventListener('beforeinput', beforeInputListener, true);
    document.addEventListener('focusin', focusListener, true);
    globalThis.addEventListener('pagehide', unloadListener, { once: true });
  },
});
