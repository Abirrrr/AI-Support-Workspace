import { FrameTriggerCatalogCache } from '../../src/extension/snippet-trigger/frame-catalog-cache';
import { handleSnippetBeforeInput } from '../../src/extension/snippet-trigger/content-runtime';
import {
  SnippetExpansionController,
  type BeforeInputEventLike,
} from '../../src/extension/snippet-trigger/expansion-controller';

async function runTriggerAudit() {
  const rows = [];
  for (const count of [100, 10000])
    for (const mode of ['clipboard-only', 'automatic'] as const) {
      const cache = new FrameTriggerCatalogCache();
      cache.markConnected();
      cache.receive({
        type: 'trigger-catalog-snapshot',
        epoch: 'audit',
        revision: 1,
        snippetPasteMode: mode,
        entries: Array.from({ length: count }, (_, i) => ({
          kind: 'text',
          trigger: `;q${i}`,
          snippetId: `snippet-${i}`,
          singleLineEligible: true,
        })),
      });
      for (const kind of ['input', 'textarea', 'rich', 'shadow'])
        for (const scenario of ['ordinary', 'unknown', 'accepted']) {
          const host = document.createElement('div');
          document.body.append(host);
          const element = document.createElement(
            kind === 'input' || kind === 'textarea' ? kind : 'div',
          );
          if (kind === 'shadow')
            host.attachShadow({ mode: 'open' }).append(element);
          else host.append(element);
          const textControl =
            element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement;
          if (!textControl) element.contentEditable = 'true';
          const runs = [];
          for (let i = 0; i < 32; i++) {
            const value = `Before ${scenario === 'unknown' ? ';missing' : ';q0'}`;
            if (textControl) element.value = value;
            else element.textContent = value;
            element.focus();
            if (textControl)
              element.setSelectionRange(value.length, value.length);
            else {
              const range = document.createRange();
              range.selectNodeContents(element);
              range.collapse(false);
              const selection = document.getSelection();
              selection?.removeAllRanges();
              selection?.addRange(range);
            }
            let calls = 0;
            let notice = '';
            let done: () => void = () => undefined;
            const finished = new Promise<void>((resolve) => {
              done = resolve;
            });
            const controller = new SnippetExpansionController(
              document,
              cache,
              {
                requestDelivery: async (message) => {
                  calls++;
                  if (message.type === 'snippet-automatic-paste-finalize')
                    return {
                      type: 'snippet-automatic-paste-result',
                      requestId: message.requestId,
                      kind: 'text',
                      result: 'paste-issued',
                    };
                  if (message.type !== 'snippet-trigger-activation')
                    throw new Error('Unexpected request');
                  return {
                    type: 'snippet-trigger-activation-result',
                    requestId: message.requestId,
                    kind: 'text',
                    ...(mode === 'automatic'
                      ? {
                          outcome: 'automatic-ready',
                          authorizationId: 'a'.repeat(32),
                        }
                      : { outcome: 'copied' }),
                  };
                },
              },
              {
                show: (message) => {
                  notice = message;
                  done();
                },
              },
              () => 'audit-request',
            );
            let prevented = false;
            const event: BeforeInputEventLike = {
              target: element,
              inputType: 'insertText',
              data: scenario === 'ordinary' ? 'a' : ' ',
              isTrusted: true,
              cancelable: true,
              isComposing: false,
              get defaultPrevented() {
                return prevented;
              },
              preventDefault() {
                prevented = true;
              },
              composedPath: () => [element, host, document],
            };
            const started = performance.now();
            const accepted = handleSnippetBeforeInput(controller, event);
            const synchronousMs = performance.now() - started;
            if (accepted) await finished;
            const totalMs = performance.now() - started;
            const remaining = textControl ? element.value : element.textContent;
            if (scenario !== 'accepted' && (accepted || calls))
              throw new Error('Nontrigger invoked delivery');
            if (
              scenario === 'accepted' &&
              (!accepted || !prevented || remaining !== 'Before ')
            )
              throw new Error(
                `Acceptance/cleanup failed: ${kind}/${mode}: ${remaining}`,
              );
            runs.push({
              phase: i === 0 ? 'first-use' : i === 1 ? 'warmup' : 'warm',
              synchronousMs,
              totalMs,
              accepted,
              prevented,
              calls,
              notice,
              exactCleanup: remaining === 'Before ',
            });
          }
          rows.push({ count, mode, kind, scenario, warmups: 2, runs });
          host.remove();
        }
      cache.disconnect();
    }
  return rows;
}
declare global {
  var m14QTriggerResult:
    Awaited<ReturnType<typeof runTriggerAudit>> | undefined;
  var m14QTriggerError: string | undefined;
}
void runTriggerAudit()
  .then((result) => {
    globalThis.m14QTriggerResult = result;
  })
  .catch((error) => {
    globalThis.m14QTriggerError = String(error);
  });
