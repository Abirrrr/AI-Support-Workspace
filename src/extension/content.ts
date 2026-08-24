import { defineContentScript } from 'wxt/utils/define-content-script';
import {
  bootstrapSnippetContentRuntime,
  SnippetContentRuntime,
  type SnippetContentRuntimeApi,
} from './snippet-trigger/content-runtime';
import {
  reportAutomaticPasteActivationTrace,
  reportAutomaticPastePostCleanupTrace,
} from './snippet-trigger/automatic-paste-result-diagnostic';

export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  allFrames: true,
  main() {
    const runtime = (
      globalThis as typeof globalThis & {
        chrome?: { runtime?: SnippetContentRuntimeApi };
      }
    ).chrome?.runtime;
    if (runtime === undefined) return;

    bootstrapSnippetContentRuntime(
      globalThis as unknown as Record<string, unknown>,
      runtime,
      () =>
        new SnippetContentRuntime(
          runtime,
          document,
          globalThis,
          import.meta.env.MODE === 'native-dev'
            ? ({ requestId, kind, activationPasteMode }) => {
                void reportAutomaticPasteActivationTrace(
                  runtime,
                  requestId,
                  kind,
                  activationPasteMode,
                );
              }
            : undefined,
          import.meta.env.MODE === 'native-dev'
            ? (diagnostic) => {
                void reportAutomaticPastePostCleanupTrace(runtime, diagnostic);
              }
            : undefined,
        ),
    );
  },
});
