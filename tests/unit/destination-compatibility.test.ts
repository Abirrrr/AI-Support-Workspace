// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FrameTriggerCatalogCache } from '../../src/extension/snippet-trigger/frame-catalog-cache';
import { createEditorAdapter } from '../../src/extension/snippet-trigger/editor-adapters';
import {
  type BeforeInputEventLike,
  SnippetExpansionController,
  type SnippetDeliveryFeedback,
  type SnippetDeliveryRequester,
} from '../../src/extension/snippet-trigger/expansion-controller';

interface ControlledFixture {
  readonly editor: HTMLElement;
  readonly target: EventTarget;
  readonly expectedAfterCleanup: string;
  readonly expectedCaretOffset: number;
  insertActivationSpace(): void;
  readContent(): string;
  readCaretOffset(): number | undefined;
}

function enabledCache(kind: 'text' | 'image' = 'text') {
  const cache = new FrameTriggerCatalogCache();
  cache.markConnected();
  cache.receive({
    type: 'trigger-catalog-snapshot',
    epoch: 'epoch-1',
    revision: 1,
    entries: [{ kind, trigger: ';hello', snippetId: 'snippet-1' }],
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
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createHarness(kind: 'text' | 'image' = 'text') {
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
  return { controller, delivery, feedback, requester };
}

async function flushDelivery() {
  await Promise.resolve();
  await Promise.resolve();
}

function createTextControlFixture(
  kind: 'input' | 'textarea',
): ControlledFixture {
  const editor = document.createElement(kind);
  const initial =
    kind === 'input' ? 'Before ;hello After' : 'Header\n;hello\nFooter';
  const triggerEnd = initial.indexOf(';hello') + ';hello'.length;
  const expectedAfterCleanup = initial.replace(';hello', '');
  editor.value = initial;
  document.body.append(editor);
  editor.focus();
  editor.setSelectionRange(triggerEnd, triggerEnd);
  return {
    editor,
    target: editor,
    expectedAfterCleanup,
    expectedCaretOffset: initial.indexOf(';hello'),
    insertActivationSpace: () =>
      editor.setRangeText(' ', triggerEnd, triggerEnd, 'end'),
    readContent: () => editor.value,
    readCaretOffset: () => editor.selectionStart ?? undefined,
  };
}

function placeCaret(node: Text, offset: number) {
  const selection = document.getSelection();
  const caret = document.createRange();
  caret.setStart(node, offset);
  caret.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(caret);
}

function readContenteditableCaretOffset(root: HTMLElement) {
  const selection = document.getSelection();
  if (selection === null || selection.rangeCount !== 1) return undefined;
  const caret = selection.getRangeAt(0);
  if (!root.contains(caret.startContainer)) return undefined;
  const prefix = document.createRange();
  prefix.selectNodeContents(root);
  prefix.setEnd(caret.startContainer, caret.startOffset);
  return prefix.toString().length;
}

function createContenteditableFixture(
  initial = 'Before ;hello After',
): ControlledFixture {
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  const text = document.createTextNode(initial);
  editor.append(text);
  document.body.append(editor);
  const triggerEnd = text.data.indexOf(';hello') + ';hello'.length;
  editor.focus();
  placeCaret(text, triggerEnd);
  return {
    editor,
    target: editor,
    expectedAfterCleanup: initial.replace(';hello', ''),
    expectedCaretOffset: text.data.indexOf(';hello'),
    insertActivationSpace: () => {
      text.insertData(triggerEnd, ' ');
      placeCaret(text, triggerEnd + 1);
    },
    readContent: () => editor.textContent ?? '',
    readCaretOffset: () => readContenteditableCaretOffset(editor),
  };
}

function createBrBoundaryFixture(): ControlledFixture {
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  const prefix = document.createTextNode('hello');
  const lineBreak = document.createElement('br');
  const trigger = document.createTextNode(';hello');
  editor.append(prefix, lineBreak, trigger);
  document.body.append(editor);
  editor.focus();
  placeCaret(trigger, trigger.length);
  return {
    editor,
    target: editor,
    expectedAfterCleanup: 'hello|br=1|',
    expectedCaretOffset: prefix.length,
    insertActivationSpace: () => {
      trigger.appendData(' ');
      placeCaret(trigger, trigger.length);
    },
    readContent: () =>
      `${prefix.data}|br=${editor.querySelectorAll('br').length}|${trigger.data}`,
    readCaretOffset: () => readContenteditableCaretOffset(editor),
  };
}

function createBlockBoundaryFixture(blockName: 'div' | 'p'): ControlledFixture {
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  const firstBlock = document.createElement(blockName);
  firstBlock.textContent = 'hello';
  const triggerBlock = document.createElement(blockName);
  const trigger = document.createTextNode(';hello');
  triggerBlock.append(trigger);
  editor.append(firstBlock, triggerBlock);
  document.body.append(editor);
  editor.focus();
  placeCaret(trigger, trigger.length);
  return {
    editor,
    target: triggerBlock,
    expectedAfterCleanup: `hello||${blockName}=2`,
    expectedCaretOffset: 'hello'.length,
    insertActivationSpace: () => {
      trigger.appendData(' ');
      placeCaret(trigger, trigger.length);
    },
    readContent: () =>
      `${firstBlock.textContent ?? ''}|${triggerBlock.textContent ?? ''}|${blockName}=${editor.querySelectorAll(blockName).length}`,
    readCaretOffset: () => readContenteditableCaretOffset(editor),
  };
}

function createNestedBlockBoundaryFixture(): ControlledFixture {
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  const firstBlock = document.createElement('div');
  const previousFormatting = document.createElement('strong');
  previousFormatting.textContent = 'hello';
  firstBlock.append(previousFormatting);
  const triggerBlock = document.createElement('div');
  const triggerFormatting = document.createElement('em');
  const trigger = document.createTextNode(';hello');
  triggerFormatting.append(trigger);
  triggerBlock.append(triggerFormatting);
  editor.append(firstBlock, triggerBlock);
  document.body.append(editor);
  editor.focus();
  placeCaret(trigger, trigger.length);
  return {
    editor,
    target: triggerFormatting,
    expectedAfterCleanup: 'hello||strong=1|em=1|div=2',
    expectedCaretOffset: 'hello'.length,
    insertActivationSpace: () => {
      trigger.appendData(' ');
      placeCaret(trigger, trigger.length);
    },
    readContent: () =>
      `${firstBlock.textContent ?? ''}|${triggerBlock.textContent ?? ''}|strong=${editor.querySelectorAll('strong').length}|em=${editor.querySelectorAll('em').length}|div=${editor.querySelectorAll(':scope > div').length}`,
    readCaretOffset: () => readContenteditableCaretOffset(editor),
  };
}

interface ShadowEditorFixture {
  readonly host: HTMLDivElement;
  readonly shadow: ShadowRoot;
  readonly editor: HTMLDivElement;
  readonly trigger: Text;
  readonly expectedAfterCleanup: string;
  insertActivationSpace(): void;
  readContent(): string;
}

function exposeComposedCaret(node: Text) {
  const selection = document.getSelection();
  if (selection === null) throw new Error('Expected a Selection.');
  Object.defineProperty(selection, 'getComposedRanges', {
    configurable: true,
    value: vi.fn(() => [targetRange(node, node.length)]),
  });
}

function readShadowCaretOffset(root: HTMLElement) {
  const selection = document.getSelection();
  const composed = selection?.getComposedRanges?.()[0];
  if (composed === undefined || !root.contains(composed.startContainer)) {
    return undefined;
  }
  const prefix = document.createRange();
  prefix.selectNodeContents(root);
  prefix.setEnd(composed.startContainer, composed.startOffset);
  return prefix.toString().length;
}

function createShadowEditorFixture(
  shape: 'editor-start' | 'block-start' | 'invalid-continuation',
  mode: ShadowRootMode = 'open',
): ShadowEditorFixture {
  const host = document.createElement('div');
  host.id = 'shadow-host';
  document.body.append(host);
  const shadow = host.attachShadow({ mode });
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  editor.setAttribute('role', 'textbox');
  let trigger: Text;
  if (shape === 'block-start') {
    const previous = document.createElement('p');
    previous.textContent = 'hello';
    const current = document.createElement('p');
    trigger = document.createTextNode(';hello');
    current.append(trigger);
    editor.append(previous, current);
  } else {
    const paragraph = document.createElement('p');
    if (shape === 'invalid-continuation') {
      paragraph.append(document.createTextNode('hello'));
      const formatting = document.createElement('em');
      trigger = document.createTextNode(';hello');
      formatting.append(trigger);
      paragraph.append(formatting);
    } else {
      trigger = document.createTextNode(';hello');
      paragraph.append(trigger);
    }
    editor.append(paragraph);
  }
  shadow.append(editor);
  editor.focus();
  placeCaret(trigger, trigger.length);
  return {
    host,
    shadow,
    editor,
    trigger,
    expectedAfterCleanup: shape === 'block-start' ? 'hello|' : '',
    insertActivationSpace: () => {
      trigger.appendData(' ');
      placeCaret(trigger, trigger.length);
      exposeComposedCaret(trigger);
    },
    readContent: () =>
      Array.from(editor.querySelectorAll('p'))
        .map((paragraph) => paragraph.textContent ?? '')
        .join('|'),
  };
}

function targetRange(node: Node, startOffset: number, endOffset = startOffset) {
  return {
    startContainer: node,
    startOffset,
    endContainer: node,
    endOffset,
  };
}

function shadowBeforeInput(
  fixture: ShadowEditorFixture,
  ranges: readonly ReturnType<typeof targetRange>[] = [
    targetRange(fixture.trigger, fixture.trigger.length),
  ],
  path: EventTarget[] = [
    fixture.editor,
    fixture.shadow,
    fixture.host,
    document.body,
    document.documentElement,
    document,
    window,
  ],
) {
  return beforeInput(fixture.host, {
    composedPath: () => path,
    getTargetRanges: () => ranges,
  });
}

function createStructuredRichEditorFixture(): ControlledFixture {
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  const firstParagraph = document.createElement('p');
  const prefix = document.createElement('span');
  const triggerStart = document.createElement('strong');
  const triggerEnd = document.createElement('em');
  const suffix = document.createElement('span');
  prefix.textContent = 'Before ';
  triggerStart.textContent = ';hel';
  triggerEnd.textContent = 'lo';
  suffix.textContent = ' After';
  firstParagraph.append(prefix, triggerStart, triggerEnd, suffix);
  const secondParagraph = document.createElement('p');
  secondParagraph.textContent = 'Second paragraph';
  editor.append(firstParagraph, secondParagraph);
  document.body.append(editor);
  const triggerEndText = triggerEnd.firstChild as Text;
  editor.focus();
  placeCaret(triggerEndText, triggerEndText.length);
  return {
    editor,
    target: triggerEnd,
    expectedAfterCleanup: 'Before  After|Second paragraph',
    expectedCaretOffset: 'Before '.length,
    insertActivationSpace: () => {
      triggerEndText.appendData(' ');
      placeCaret(triggerEndText, triggerEndText.length);
    },
    readContent: () =>
      `${firstParagraph.textContent ?? ''}|${secondParagraph.textContent ?? ''}`,
    readCaretOffset: () => readContenteditableCaretOffset(editor),
  };
}

const fixtureCases = [
  ['standard single-line input', () => createTextControlFixture('input')],
  ['standard textarea', () => createTextControlFixture('textarea')],
  ['generic contenteditable', createContenteditableFixture],
  ['structured nested rich editor', createStructuredRichEditorFixture],
  [
    'contenteditable editor start',
    () => createContenteditableFixture(';hello After'),
  ],
  [
    'contenteditable Unicode whitespace boundary',
    () => createContenteditableFixture('Before\u2003;hello After'),
  ],
  ['contenteditable br line boundary', createBrBoundaryFixture],
  [
    'contenteditable div block boundary',
    () => createBlockBoundaryFixture('div'),
  ],
  ['contenteditable paragraph boundary', () => createBlockBoundaryFixture('p')],
  [
    'contenteditable nested inline block boundary',
    createNestedBlockBoundaryFixture,
  ],
] as const;

describe('M14-J controlled destination compatibility fixtures', () => {
  beforeEach(() => document.body.replaceChildren());

  it.each(fixtureCases)(
    'preserves focus, surrounding content, and cleanup caret in a %s',
    async (_name, createFixture) => {
      const fixture = createFixture();
      const input = vi.fn();
      fixture.editor.addEventListener('input', input);
      const event = beforeInput(fixture.target);
      const { controller, delivery, feedback, requester } = createHarness();

      expect(controller.handleBeforeInput(event)).toBe(true);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(requester.requestDelivery).toHaveBeenCalledOnce();
      fixture.insertActivationSpace();
      delivery.resolve({
        type: 'snippet-trigger-activation-result',
        requestId: 'request-1',
        outcome: 'copied',
        kind: 'text',
      });
      await flushDelivery();

      expect(fixture.readContent()).toBe(fixture.expectedAfterCleanup);
      expect(document.activeElement).toBe(fixture.editor);
      expect(fixture.readCaretOffset()).toBe(fixture.expectedCaretOffset);
      expect(input).toHaveBeenCalledOnce();
      expect(feedback.show).toHaveBeenCalledWith(
        'Snippet copied — press Ctrl+V',
        'success',
      );
    },
  );

  it.each([
    ['generic contenteditable', createContenteditableFixture],
    ['structured nested rich editor', createStructuredRichEditorFixture],
    ['contenteditable br line boundary', createBrBoundaryFixture],
    [
      'contenteditable div block boundary',
      () => createBlockBoundaryFixture('div'),
    ],
  ] as const)(
    'preserves the %s unchanged after native Image delivery failure',
    async (_name, createFixture) => {
      const fixture = createFixture();
      const event = beforeInput(fixture.target);
      const { controller, delivery, feedback } = createHarness('image');

      expect(controller.handleBeforeInput(event)).toBe(true);
      fixture.insertActivationSpace();
      const contentAfterNormalSpace = fixture.readContent();
      delivery.resolve({
        type: 'snippet-trigger-activation-result',
        requestId: 'request-1',
        outcome: 'failed',
        code: 'host-unavailable',
        message:
          "Windows Image Snippets aren't ready. Check Settings. [host-unavailable]",
      });
      await flushDelivery();

      expect(fixture.readContent()).toBe(contentAfterNormalSpace);
      expect(document.activeElement).toBe(fixture.editor);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(feedback.show).toHaveBeenCalledWith(
        "Windows Image Snippets aren't ready. Check Settings. [host-unavailable]",
        'error',
      );
    },
  );

  it('rejects an inline non-whitespace predecessor across nested inline nodes', () => {
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    editor.append(document.createTextNode('hello'));
    const formatting = document.createElement('em');
    const trigger = document.createTextNode(';hello');
    formatting.append(trigger);
    editor.append(formatting);
    document.body.append(editor);
    editor.focus();
    placeCaret(trigger, trigger.length);
    const event = beforeInput(formatting);
    const { controller, requester } = createHarness();

    expect(controller.handleBeforeInput(event)).toBe(false);
    expect(requester.requestDelivery).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(editor.textContent).toBe('hello;hello');
    expect(document.activeElement).toBe(editor);
  });

  it('leaves a structural-boundary trigger untouched when the selection becomes stale', async () => {
    const fixture = createBlockBoundaryFixture('div');
    const event = beforeInput(fixture.target);
    const { controller, delivery, feedback } = createHarness();

    expect(controller.handleBeforeInput(event)).toBe(true);
    fixture.insertActivationSpace();
    const contentAfterNormalSpace = fixture.readContent();
    const selection = document.getSelection();
    selection?.collapse(fixture.editor, 0);
    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'text',
    });
    await flushDelivery();

    expect(fixture.readContent()).toBe(contentAfterNormalSpace);
    expect(document.activeElement).toBe(fixture.editor);
    expect(feedback.show).toHaveBeenCalledWith(
      'Snippet copied — press Ctrl+V (trigger unchanged)',
      'success',
    );
  });
});

describe('M14-J.3 retargeted Shadow DOM editor resolution', () => {
  beforeEach(() => document.body.replaceChildren());

  it.each([
    ['internal paragraph at editor start', 'editor-start'],
    ['internal paragraph at a new block', 'block-start'],
  ] as const)(
    'recognizes and cleans an exact trigger in an %s',
    async (_name, shape) => {
      const fixture = createShadowEditorFixture(shape);
      const event = shadowBeforeInput(fixture);
      const { controller, delivery, feedback, requester } = createHarness();

      expect(document.activeElement).toBe(fixture.host);
      expect(fixture.shadow.activeElement).toBe(fixture.editor);
      const path = event.composedPath?.();
      const ranges = event.getTargetRanges?.();
      expect(path).toContain(fixture.editor);
      expect(Array.isArray(ranges)).toBe(true);
      expect(ranges).toHaveLength(1);
      expect(ranges?.[0]?.startContainer.ownerDocument).toBe(document);
      expect(fixture.editor.contains(ranges?.[0]?.startContainer ?? null)).toBe(
        true,
      );
      const adapter = createEditorAdapter(event, document);
      expect(adapter?.kind).toBe('contenteditable');
      expect(adapter?.readTriggerCandidate(32)?.text).toBe(';hello');
      expect(controller.handleBeforeInput(event)).toBe(true);
      expect(requester.requestDelivery).toHaveBeenCalledOnce();
      fixture.insertActivationSpace();
      delivery.resolve({
        type: 'snippet-trigger-activation-result',
        requestId: 'request-1',
        outcome: 'copied',
        kind: 'text',
      });
      await flushDelivery();

      expect(fixture.readContent()).toBe(fixture.expectedAfterCleanup);
      expect(fixture.host.textContent).toBe('');
      expect(fixture.host.childNodes).toHaveLength(0);
      expect(document.activeElement).toBe(fixture.host);
      expect(fixture.shadow.activeElement).toBe(fixture.editor);
      expect(readShadowCaretOffset(fixture.editor)).toBe(
        shape === 'block-start' ? 'hello'.length : 0,
      );
      expect(feedback.show).toHaveBeenCalledWith(
        'Snippet copied — press Ctrl+V',
        'success',
      );
    },
  );

  it('uses the current composed selection for cleanup when ordinary Selection is retargeted', async () => {
    const fixture = createShadowEditorFixture('editor-start');
    const event = shadowBeforeInput(fixture);
    const { controller, delivery } = createHarness();
    expect(controller.handleBeforeInput(event)).toBe(true);
    fixture.insertActivationSpace();

    const selection = document.getSelection();
    if (selection === null) throw new Error('Expected a Selection.');
    const currentInternalRange = targetRange(
      fixture.trigger,
      fixture.trigger.length,
    );
    const outerCaret = document.createRange();
    outerCaret.setStart(document.body, 0);
    outerCaret.collapse(true);
    selection.removeAllRanges();
    selection.addRange(outerCaret);
    Object.defineProperty(selection, 'getComposedRanges', {
      configurable: true,
      value: vi.fn(() => [currentInternalRange]),
    });

    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'text',
    });
    await flushDelivery();

    expect(fixture.readContent()).toBe('');
    expect(fixture.host.textContent).toBe('');
    expect(document.activeElement).toBe(fixture.host);
    expect(fixture.shadow.activeElement).toBe(fixture.editor);
  });

  it('supports the event-provided path and range without reading host.shadowRoot', async () => {
    const fixture = createShadowEditorFixture('editor-start', 'closed');
    expect(fixture.host.shadowRoot).toBeNull();
    const event = shadowBeforeInput(fixture);
    const { controller, delivery } = createHarness();

    expect(controller.handleBeforeInput(event)).toBe(true);
    fixture.insertActivationSpace();
    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'text',
    });
    await flushDelivery();

    expect(fixture.readContent()).toBe('');
    expect(fixture.host.textContent).toBe('');
  });

  it('rejects an internal inline non-whitespace continuation', () => {
    const fixture = createShadowEditorFixture('invalid-continuation');
    const event = shadowBeforeInput(fixture);
    const { controller, requester } = createHarness();

    expect(controller.handleBeforeInput(event)).toBe(false);
    expect(requester.requestDelivery).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(fixture.readContent()).toBe('hello;hello');
    expect(fixture.host.textContent).toBe('');
  });

  it('preserves Shadow DOM editor state on clipboard failure', async () => {
    const fixture = createShadowEditorFixture('block-start');
    const event = shadowBeforeInput(fixture);
    const { controller, delivery, feedback } = createHarness();

    expect(controller.handleBeforeInput(event)).toBe(true);
    fixture.insertActivationSpace();
    const contentAfterNormalSpace = fixture.readContent();
    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'failed',
      code: 'clipboard-copy-command-failed',
      message:
        'Could not prepare this Snippet. Try again. [clipboard-copy-command-failed]',
    });
    await flushDelivery();

    expect(fixture.readContent()).toBe(contentAfterNormalSpace);
    expect(fixture.host.textContent).toBe('');
    expect(document.activeElement).toBe(fixture.host);
    expect(fixture.shadow.activeElement).toBe(fixture.editor);
    expect(feedback.show).toHaveBeenCalledWith(
      'Could not prepare this Snippet. Try again. [clipboard-copy-command-failed]',
      'error',
    );
  });

  it('rejects cleanup after internal Shadow DOM content becomes stale', async () => {
    const fixture = createShadowEditorFixture('editor-start');
    const event = shadowBeforeInput(fixture);
    const { controller, delivery, feedback } = createHarness();

    expect(controller.handleBeforeInput(event)).toBe(true);
    fixture.insertActivationSpace();
    fixture.trigger.appendData('edited');
    placeCaret(fixture.trigger, fixture.trigger.length);
    delivery.resolve({
      type: 'snippet-trigger-activation-result',
      requestId: 'request-1',
      outcome: 'copied',
      kind: 'text',
    });
    await flushDelivery();

    expect(fixture.readContent()).toBe(';hello edited');
    expect(fixture.host.textContent).toBe('');
    expect(feedback.show).toHaveBeenCalledWith(
      'Snippet copied — press Ctrl+V (trigger unchanged)',
      'success',
    );
  });

  it.each([
    ['no target ranges', []],
    [
      'multiple target ranges',
      [targetRange(document.body, 0), targetRange(document.body, 0)],
    ],
  ] as const)('declines safely for %s', (_name, ranges) => {
    const fixture = createShadowEditorFixture('editor-start');
    const event = shadowBeforeInput(fixture, ranges);
    const { controller, requester } = createHarness();

    expect(controller.handleBeforeInput(event)).toBe(false);
    expect(requester.requestDelivery).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(fixture.readContent()).toBe(';hello');
  });

  it.each([
    [
      'a non-collapsed target range',
      (fixture: ShadowEditorFixture) => [
        targetRange(fixture.trigger, 0, fixture.trigger.length),
      ],
      undefined,
    ],
    [
      'a target range outside the editor',
      () => [targetRange(document.body, 0)],
      undefined,
    ],
    [
      'a target range in an unrelated composed-path node',
      () => {
        const unrelated = document.createElement('span');
        const text = document.createTextNode(';hello');
        unrelated.append(text);
        document.body.append(unrelated);
        return [targetRange(text, text.length)];
      },
      (fixture: ShadowEditorFixture) => {
        const unrelated = document.body.lastElementChild as HTMLElement;
        return [
          fixture.editor,
          unrelated,
          fixture.shadow,
          fixture.host,
          document.body,
          document,
          window,
        ];
      },
    ],
    [
      'an invalid target-range offset',
      (fixture: ShadowEditorFixture) => [
        targetRange(fixture.trigger, fixture.trigger.length + 1),
      ],
      undefined,
    ],
  ] as const)('declines safely for %s', (_name, createRanges, createPath) => {
    const fixture = createShadowEditorFixture('editor-start');
    const ranges = createRanges(fixture);
    const event = shadowBeforeInput(fixture, ranges, createPath?.(fixture));
    const { controller, requester } = createHarness();

    expect(controller.handleBeforeInput(event)).toBe(false);
    expect(requester.requestDelivery).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(fixture.readContent()).toBe(';hello');
    expect(fixture.host.textContent).toBe('');
  });

  it('declines when the composed path has no supported editor', () => {
    const fixture = createShadowEditorFixture('editor-start');
    const event = shadowBeforeInput(
      fixture,
      [targetRange(fixture.trigger, fixture.trigger.length)],
      [fixture.host, document.body, document, window],
    );
    const { controller, requester } = createHarness();

    expect(controller.handleBeforeInput(event)).toBe(false);
    expect(requester.requestDelivery).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('declines a contenteditable=false candidate in the composed path', () => {
    const fixture = createShadowEditorFixture('editor-start');
    fixture.editor.setAttribute('contenteditable', 'false');
    const event = shadowBeforeInput(fixture);
    const { controller, requester } = createHarness();

    expect(controller.handleBeforeInput(event)).toBe(false);
    expect(requester.requestDelivery).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});
