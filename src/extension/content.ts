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
          runtime?: ConstructorParameters<
            typeof FrameTriggerCatalogClient
          >[0] & {
            sendMessage(message: unknown): Promise<unknown>;
          };
        };
      }
    ).chrome?.runtime;
    if (runtime === undefined) return;

    const client = new FrameTriggerCatalogClient(runtime);
    const controller = new SnippetExpansionController(
      document,
      client.cache,
      { requestDelivery: (message) => runtime.sendMessage(message) },
      {
        show(message, kind) {
          const previous = document.getElementById(
            'ai-support-workspace-snippet-notice',
          );
          previous?.remove();
          const notice = document.createElement('div');
          notice.id = 'ai-support-workspace-snippet-notice';
          notice.setAttribute('role', kind === 'error' ? 'alert' : 'status');
          notice.textContent = message;
          Object.assign(notice.style, {
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            zIndex: '2147483647',
            maxWidth: '320px',
            padding: '10px 12px',
            borderRadius: '8px',
            color: '#fff',
            background: kind === 'error' ? '#b91c1c' : '#166534',
            font: '13px/1.4 system-ui, sans-serif',
            boxShadow: '0 4px 16px rgb(0 0 0 / 25%)',
          });
          document.documentElement.append(notice);
          globalThis.setTimeout(() => notice.remove(), 3_500);
        },
      },
    );
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
    globalThis.addEventListener(
      'pagehide',
      () => {
        unloadListener();
      },
      { once: true },
    );
  },
});
