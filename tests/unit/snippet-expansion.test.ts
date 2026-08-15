// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FrameTriggerCatalogCache } from '../../src/extension/snippet-trigger/frame-catalog-cache';
import {
  type BeforeInputEventLike,
  SnippetExpansionController,
  toBeforeInputEventLike,
  type SnippetDeliveryFeedback,
  type SnippetDeliveryRequester,
} from '../../src/extension/snippet-trigger/expansion-controller';

function enabledCache(kind: 'text' | 'image' = 'text', trigger = ';hello') {
  const cache = new FrameTriggerCatalogCache();
  cache.markConnected();
  cache.receive({
    type: 'trigger-catalog-snapshot',
    epoch: 'epoch-1',
    revision: 1,
    entries: [{ kind, trigger, snippetId: 'snippet-1' }],
  });
  return cache;
}

function beforeInput(
  target: EventTarget,
  overrides: Partial<BeforeInputEventLike> = {},
): BeforeInputEventLike {
  return {
    target,
    inputType: 'insertText',
    data: ' ',
    isTrusted: true,
    cancelable: true,
    isComposing: false,
    preventDefault: vi.fn(),
    ...overrides,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function harness(kind: 'text' | 'image' = 'text') {
  const delivery = deferred<unknown>();
  const requester: SnippetDeliveryRequester = {
    requestDelivery: vi.fn(() => delivery.promise),
  };
  const feedback: SnippetDeliveryFeedback = { show: vi.fn() };
  const controller = new SnippetExpansionController(
    document,
    enabledCache(kind),
    requester,
    feedback,
    () => 'request-1',
  );
  return { controller, delivery, requester, feedback };
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
}

function insertDefaultSpace(element: HTMLTextAreaElement | HTMLInputElement) {
  const caret = element.selectionEnd;
  if (caret === null) throw new Error('Expected a caret.');
  element.setRangeText(' ', caret, caret, 'end');
}

describe('isolated-world beforeinput boundary', () => {
  it('accepts a structurally valid event without constructor identity', () => {
    const raw = beforeInput(document.body);
    expect(raw).not.toBeInstanceOf(InputEvent);
    expect(toBeforeInputEventLike(raw)).toBe(raw);
  });

  it.each([
    null,
    { inputType: 1 },
    { data: 1 },
    { isTrusted: 'true' },
    { cancelable: 'true' },
    { isComposing: 0 },
    { preventDefault: undefined },
    { composedPath: [] },
    { getTargetRanges: [] },
  ])('rejects malformed event shape %#', (override) => {
    const raw =
      override === null ? null : { ...beforeInput(document.body), ...override };
    expect(toBeforeInputEventLike(raw)).toBeUndefined();
  });
});

describe('asynchronous clipboard activation and compare-and-swap cleanup', () => {
  beforeEach(() => document.body.replaceChildren());

  it('allows the activation Space, copies, then removes exactly trigger plus Space', async () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Before ;HELLO after';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(13, 13);
    const input = vi.fn();
    textarea.addEventListener('input', input);
    const event = beforeInput(textarea);
    const { controller, delivery, requester, feedback } = harness();

    expect(controller.handleBeforeInput(event)).toBe(true);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(textarea.value).toBe('Before ;HELLO after');
    expect(requester.requestDelivery).toHaveBeenCalledWith({
      type: 'snippet-trigger-activation',
      requestId: 'request-1',
      snippetId: 'snippet-1',
      trigger: ';hello',
      kind: 'text',
      epoch: 'epoch-1',
      revision: 1,
    });

    insertDefaultSpace(textarea);
    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'text',
    });
    await flush();

    expect(textarea.value).toBe('Before  after');
    expect(textarea.selectionStart).toBe(7);
    expect(textarea.selectionEnd).toBe(7);
    expect(input).toHaveBeenCalledOnce();
    expect(input.mock.calls[0]?.[0]).toMatchObject({
      bubbles: true,
      composed: true,
      inputType: 'deleteContentBackward',
      data: null,
    });
    expect(feedback.show).toHaveBeenCalledWith(
      'Snippet copied — press Ctrl+V',
      'success',
    );
  });

  it.each([null, 'text', 'search'])(
    'cleans a supported %s input after clipboard success',
    async (type) => {
      const input = document.createElement('input');
      if (type !== null) input.type = type;
      input.value = ';hello';
      document.body.append(input);
      input.focus();
      input.setSelectionRange(6, 6);
      const { controller, delivery } = harness();
      expect(controller.handleBeforeInput(beforeInput(input))).toBe(true);
      insertDefaultSpace(input);
      delivery.resolve({
        type: 'snippet-trigger-activation-result',
        requestId: 'request-1',
        outcome: 'copied',
        kind: 'text',
      });
      await flush();
      expect(input.value).toBe('');
      expect(input.selectionStart).toBe(0);
    },
  );

  it('preserves trigger, Space, and surrounding content when delivery fails', async () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'A ;hello B';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(8, 8);
    const { controller, delivery, feedback } = harness('image');
    expect(controller.handleBeforeInput(beforeInput(textarea))).toBe(true);
    insertDefaultSpace(textarea);
    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'failed',
      code: 'host-unavailable',
      message:
        "Windows Image Snippets aren't ready. Check Settings. [host-unavailable]",
    });
    await flush();
    expect(textarea.value).toBe('A ;hello  B');
    expect(feedback.show).toHaveBeenCalledWith(
      "Windows Image Snippets aren't ready. Check Settings. [host-unavailable]",
      'error',
    );
    expect(feedback.show).not.toHaveBeenCalledWith(
      expect.stringContaining('copied'),
      'success',
    );
  });

  it.each([
    ['native-permission-required', 'permission-required'],
    ['host-unavailable', 'failed'],
    ['invalid-host-response', 'failed'],
    ['native-delivery-busy', 'failed'],
    ['clipboard-write-failed', 'failed'],
  ] as const)(
    'preserves the Image trigger/page and shows no copied notice after native failure %s',
    async (code, outcome) => {
      const textarea = document.createElement('textarea');
      textarea.value = 'A ;hello B';
      document.body.append(textarea);
      textarea.focus();
      textarea.setSelectionRange(8, 8);
      const { controller, delivery, feedback } = harness('image');
      expect(controller.handleBeforeInput(beforeInput(textarea))).toBe(true);
      insertDefaultSpace(textarea);
      delivery.resolve({
        type: 'snippet-trigger-activation-result',
        requestId: 'request-1',
        outcome,
        code,
        message: `Safe native failure [${code}]`,
      });
      await flush();
      expect(textarea.value).toBe('A ;hello  B');
      expect(feedback.show).toHaveBeenCalledWith(
        `Safe native failure [${code}]`,
        'error',
      );
      expect(feedback.show).not.toHaveBeenCalledWith(
        expect.stringContaining('copied'),
        'success',
      );
    },
  );

  it('skips Image cleanup after native success if page text became stale', async () => {
    const textarea = document.createElement('textarea');
    textarea.value = ';hello';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(6, 6);
    const { controller, delivery, feedback } = harness('image');
    controller.handleBeforeInput(beforeInput(textarea));
    insertDefaultSpace(textarea);
    textarea.value = ';hello edited';
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'image',
    });
    await flush();
    expect(textarea.value).toBe(';hello edited');
    expect(feedback.show).toHaveBeenCalledWith(
      'Image copied — press Ctrl+V (trigger unchanged)',
      'success',
    );
  });

  it('skips cleanup if the caret moves', async () => {
    const textarea = document.createElement('textarea');
    textarea.value = ';hello';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(6, 6);
    const { controller, delivery } = harness();
    controller.handleBeforeInput(beforeInput(textarea));
    insertDefaultSpace(textarea);
    textarea.setSelectionRange(0, 0);
    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'text',
    });
    await flush();
    expect(textarea.value).toBe(';hello ');
  });

  it('skips cleanup if the catalog epoch/revision changes while copying', async () => {
    const textarea = document.createElement('textarea');
    textarea.value = ';hello';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(6, 6);
    const cache = enabledCache();
    const delivery = deferred<unknown>();
    const feedback: SnippetDeliveryFeedback = { show: vi.fn() };
    const controller = new SnippetExpansionController(
      document,
      cache,
      { requestDelivery: () => delivery.promise },
      feedback,
      () => 'request-1',
    );
    controller.handleBeforeInput(beforeInput(textarea));
    insertDefaultSpace(textarea);
    cache.receive({
      type: 'trigger-catalog-invalidate',
      epoch: 'epoch-1',
      revision: 2,
    });
    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'text',
    });
    await flush();
    expect(textarea.value).toBe(';hello ');
    expect(feedback.show).toHaveBeenCalledWith(
      'Snippet copied — press Ctrl+V (trigger unchanged)',
      'success',
    );
  });

  it('cleans an Image trigger after correlated native success and shows the copied notice', async () => {
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    const text = document.createTextNode('Before ;hello');
    editor.append(text);
    document.body.append(editor);
    editor.focus();
    const selection = document.getSelection();
    const caret = document.createRange();
    caret.setStart(text, text.length);
    caret.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(caret);
    const input = vi.fn();
    editor.addEventListener('input', input);
    const { controller, delivery, feedback } = harness('image');
    expect(controller.handleBeforeInput(beforeInput(editor))).toBe(true);

    text.data += ' ';
    caret.setStart(text, text.length);
    caret.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(caret);
    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'image',
    });
    await flush();
    expect(editor.textContent).toBe('Before ');
    expect(input).toHaveBeenCalledOnce();
    expect(feedback.show).toHaveBeenCalledWith(
      'Image copied — press Ctrl+V',
      'success',
    );
  });

  it('isolates rapid activation snapshots and request identities', async () => {
    const first = document.createElement('textarea');
    const second = document.createElement('textarea');
    first.value = ';hello';
    second.value = ';hello';
    document.body.append(first, second);
    const deliveries = [deferred<unknown>(), deferred<unknown>()];
    const requester: SnippetDeliveryRequester = {
      requestDelivery: vi
        .fn()
        .mockReturnValueOnce(deliveries[0]?.promise)
        .mockReturnValueOnce(deliveries[1]?.promise),
    };
    const feedback: SnippetDeliveryFeedback = { show: vi.fn() };
    let id = 0;
    const controller = new SnippetExpansionController(
      document,
      enabledCache(),
      requester,
      feedback,
      () => `request-${++id}`,
    );
    first.focus();
    first.setSelectionRange(6, 6);
    controller.handleBeforeInput(beforeInput(first));
    insertDefaultSpace(first);
    second.focus();
    second.setSelectionRange(6, 6);
    controller.handleBeforeInput(beforeInput(second));
    insertDefaultSpace(second);
    deliveries[1]?.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-2',
      outcome: 'copied',
      kind: 'text',
    });
    await flush();
    expect(second.value).toBe('');
    expect(first.value).toBe(';hello ');
    first.focus();
    first.setSelectionRange(7, 7);
    deliveries[0]?.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'text',
    });
    await flush();
    expect(first.value).toBe('');
  });

  it('leaves unknown, unsupported, selected, composing, and disconnected cases untouched', () => {
    const textarea = document.createElement('textarea');
    textarea.value = ';unknown';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(8, 8);
    const { controller, requester } = harness();
    expect(controller.handleBeforeInput(beforeInput(textarea))).toBe(false);
    textarea.value = ';hello';
    textarea.setSelectionRange(0, 6);
    expect(controller.handleBeforeInput(beforeInput(textarea))).toBe(false);
    textarea.setSelectionRange(6, 6);
    expect(
      controller.handleBeforeInput(
        beforeInput(textarea, { isComposing: true }),
      ),
    ).toBe(false);
    expect(requester.requestDelivery).not.toHaveBeenCalled();
  });
});
