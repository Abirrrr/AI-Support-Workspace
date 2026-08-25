// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FrameTriggerCatalogCache } from '../../src/extension/snippet-trigger/frame-catalog-cache';
import { handleSnippetBeforeInput } from '../../src/extension/snippet-trigger/content-runtime';
import {
  type BeforeInputEventLike,
  SNIPPET_DELIVERY_NOTICE_ID,
  SnippetExpansionController,
  type SnippetDeliveryFeedback,
  type SnippetDeliveryRequester,
} from '../../src/extension/snippet-trigger/expansion-controller';

const authorizationId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function automaticCache(kind: 'text' | 'image') {
  const cache = new FrameTriggerCatalogCache();
  cache.markConnected();
  cache.receive({
    type: 'trigger-catalog-snapshot',
    epoch: 'epoch-1',
    revision: 1,
    snippetPasteMode: 'automatic',
    entries: [{ kind, trigger: ';hello', snippetId: 'snippet-1' }],
  });
  return cache;
}

function createHarness(kind: 'text' | 'image' = 'text', mountNotice = false) {
  const activation = deferred<unknown>();
  const requester: SnippetDeliveryRequester = {
    requestDelivery: vi.fn((message) =>
      message.type === 'snippet-trigger-activation'
        ? activation.promise
        : Promise.resolve({
            type: 'snippet-automatic-paste-result',
            requestId: message.requestId,
            kind,
            result: 'paste-issued',
          }),
    ),
  };
  const feedback: SnippetDeliveryFeedback = {
    show: vi.fn(() => {
      if (!mountNotice) return;
      const notice = document.createElement('div');
      notice.id = SNIPPET_DELIVERY_NOTICE_ID;
      document.documentElement.append(notice);
    }),
  };
  const activationTrace = vi.fn();
  const postCleanupTrace = vi.fn();
  return {
    activation,
    requester,
    feedback,
    activationTrace,
    postCleanupTrace,
    controller: new SnippetExpansionController(
      document,
      automaticCache(kind),
      requester,
      feedback,
      () => 'request-1',
      activationTrace,
      postCleanupTrace,
    ),
  };
}

function activate(controller: SnippetExpansionController) {
  const editor = document.createElement('textarea');
  editor.value = ';hello';
  document.body.append(editor);
  editor.focus();
  editor.setSelectionRange(6, 6);
  let defaultPrevented = false;
  const preventDefault = vi.fn(() => {
    defaultPrevented = true;
  });
  const event: BeforeInputEventLike = {
    target: editor,
    inputType: 'insertText',
    data: ' ',
    isTrusted: true,
    cancelable: true,
    isComposing: false,
    get defaultPrevented() {
      return defaultPrevented;
    },
    preventDefault,
  };
  expect(handleSnippetBeforeInput(controller, event)).toBe(true);
  expect(event.preventDefault).toHaveBeenCalledOnce();
  return editor;
}

async function flushDelivery() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('automatic expansion finalization', () => {
  beforeEach(() => document.body.replaceChildren());

  it.each(['text', 'image'] as const)(
    'cleans and finalizes one automatic %s activation as ready',
    async (kind) => {
      const harness = createHarness(kind);
      const editor = activate(harness.controller);
      expect(harness.activationTrace).toHaveBeenCalledWith({
        requestId: 'request-1',
        kind,
        activationPasteMode: 'automatic',
      });
      harness.activation.resolve({
        type: 'snippet-trigger-activation-result',
        requestId: 'request-1',
        outcome: 'automatic-ready',
        kind,
        authorizationId,
        usageReceiptId: 'usage-receipt-1',
      });
      await flushDelivery();
      expect(editor.value).toBe('');
      expect(harness.requester.requestDelivery).toHaveBeenCalledTimes(3);
      expect(harness.requester.requestDelivery).toHaveBeenNthCalledWith(2, {
        type: 'snippet-usage-receipt-acknowledgement',
        receiptId: 'usage-receipt-1',
        requestId: 'request-1',
        snippetId: 'snippet-1',
        kind,
        epoch: 'epoch-1',
        revision: 1,
      });
      expect(harness.requester.requestDelivery).toHaveBeenLastCalledWith({
        type: 'snippet-automatic-paste-finalize',
        requestId: 'request-1',
        authorizationId,
        editorState: 'ready',
      });
      expect(harness.feedback.show).toHaveBeenCalledWith(
        'Paste sent',
        'success',
      );
      expect(harness.postCleanupTrace).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          phase: 'before-post-cleanup-check',
          editor: expect.objectContaining({
            postCleanupFailure: null,
            cleanupInputProvenance: 'extension-owned',
            firstInvalidatingInputPhase: null,
            activationBeforeInputPrevented: true,
            activationInputObserved: false,
          }),
        }),
      );
    },
  );

  it('still performs valid normal cleanup when automatic authorization became unsafe', async () => {
    const harness = createHarness();
    const editor = activate(harness.controller);
    window.dispatchEvent(new Event('pagehide'));
    harness.activation.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'automatic-ready',
      kind: 'text',
      authorizationId,
      usageReceiptId: 'usage-receipt-1',
    });
    await flushDelivery();
    expect(editor.value).toBe('');
    expect(harness.requester.requestDelivery).toHaveBeenLastCalledWith(
      expect.objectContaining({ editorState: 'unsafe-focus' }),
    );
    expect(harness.postCleanupTrace).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        phase: 'before-post-cleanup-check',
        noticeExistedBeforePostCleanupCheck: false,
        editor: expect.objectContaining({
          postCleanupFailure: 'lifecycle-invalidated',
          firstInvalidationCause: 'pagehide',
        }),
      }),
    );
    expect(harness.postCleanupTrace).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        phase: 'after-automatic-result-notice',
        noticeExistsAfterPostCleanupFailure: false,
        fallbackNoticeSuppressed: true,
      }),
    );
  });

  it('reports cleanup failure and preserves the stale trigger without paste authority', async () => {
    const harness = createHarness();
    const editor = activate(harness.controller);
    editor.value = ';hello changed';
    editor.setSelectionRange(editor.value.length, editor.value.length);
    harness.activation.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'automatic-ready',
      kind: 'text',
      authorizationId,
    });
    await flushDelivery();
    expect(editor.value).toBe(';hello changed');
    expect(harness.requester.requestDelivery).toHaveBeenLastCalledWith(
      expect.objectContaining({ editorState: 'cleanup-failed' }),
    );
    expect(harness.requester.requestDelivery).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'snippet-usage-receipt-acknowledgement',
      }),
    );
  });

  it('proves controlled notice suppression does not change the post-cleanup result', async () => {
    const finalizeStates: string[] = [];
    for (const mountNotice of [true, false]) {
      document.body.replaceChildren();
      document.getElementById(SNIPPET_DELIVERY_NOTICE_ID)?.remove();
      const harness = createHarness('text', mountNotice);
      activate(harness.controller);
      window.dispatchEvent(new Event('pagehide'));
      harness.activation.resolve({
        type: 'snippet-trigger-activation-result',
        requestId: 'request-1',
        outcome: 'automatic-ready',
        kind: 'text',
        authorizationId,
      });
      await flushDelivery();
      const finalize = vi.mocked(harness.requester.requestDelivery).mock
        .calls[1]?.[0];
      if (finalize?.type === 'snippet-automatic-paste-finalize') {
        finalizeStates.push(finalize.editorState);
      }
      expect(harness.postCleanupTrace).toHaveBeenLastCalledWith(
        expect.objectContaining({
          phase: 'after-automatic-result-notice',
          noticeExistsAfterPostCleanupFailure: mountNotice,
          fallbackNoticeMountedAfterAutomaticResult: mountNotice,
          fallbackNoticeSuppressed: !mountNotice,
          noticeCallsFocus: false,
          noticeHasAutofocus: mountNotice ? false : null,
          activeElementChangedByNoticeMount: false,
          selectionchangeDuringNoticeMount: false,
          editor: expect.objectContaining({
            noticeMutationWithinAuthorizationObserverScope: true,
            noticeMountedInsideEditor: false,
          }),
        }),
      );
    }
    expect(finalizeStates).toEqual(['unsafe-focus', 'unsafe-focus']);
  });
});
