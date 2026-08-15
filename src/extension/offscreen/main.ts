import { handleOffscreenClipboardWrite } from './clipboard-runtime';
import { isOffscreenClipboardWriteMessage } from '../../shared/snippet-delivery-messages';

const runtime = (
  globalThis as typeof globalThis & {
    chrome: {
      runtime: {
        onMessage: {
          addListener(listener: (message: unknown) => unknown): void;
        };
      };
    };
  }
).chrome.runtime;

runtime.onMessage.addListener((message) => {
  if (!isOffscreenClipboardWriteMessage(message)) return undefined;
  return handleOffscreenClipboardWrite(message, { document });
});
