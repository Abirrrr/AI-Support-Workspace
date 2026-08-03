// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FrameTriggerCatalogCache } from '../../src/extension/snippet-trigger/frame-catalog-cache';
import {
  type BeforeInputEventLike,
  SnippetExpansionController,
  toBeforeInputEventLike,
} from '../../src/extension/snippet-trigger/expansion-controller';

function enabledCache(content = 'Expanded text', trigger = ';hello') {
  const cache = new FrameTriggerCatalogCache();
  cache.markConnected();
  cache.receive({
    type: 'trigger-catalog-snapshot',
    epoch: 'epoch-1',
    revision: 1,
    entries: [{ trigger, snippetId: 'snippet-1', content }],
  });
  return cache;
}

describe('isolated-world event boundary', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('forwards a structurally valid trusted Space event without constructor identity', () => {
    const textarea = document.createElement('textarea');
    textarea.value = ';hello';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(6, 6);
    const rawEvent = beforeInput(textarea);

    expect(rawEvent).not.toBeInstanceOf(InputEvent);
    const event = toBeforeInputEventLike(rawEvent);
    expect(event).toBeDefined();
    expect(
      new SnippetExpansionController(
        document,
        enabledCache(),
      ).handleBeforeInput(event as BeforeInputEventLike),
    ).toBe(true);
    expect(textarea.value).toBe('Expanded text ');
    expect(rawEvent.preventDefault).toHaveBeenCalledOnce();
  });

  it.each([
    ['wrong event value', null],
    ['wrong inputType type', { inputType: 1 }],
    ['wrong data type', { data: 1 }],
    ['wrong trusted type', { isTrusted: 'true' }],
    ['wrong cancelable type', { cancelable: 'true' }],
    ['wrong composition type', { isComposing: 0 }],
    ['missing preventDefault', { preventDefault: undefined }],
  ])('rejects %s at the structural boundary', (_label, override) => {
    const rawEvent =
      override === null ? null : { ...beforeInput(document.body), ...override };
    expect(toBeforeInputEventLike(rawEvent)).toBeUndefined();
    if (
      rawEvent !== null &&
      'preventDefault' in rawEvent &&
      vi.isMockFunction(rawEvent.preventDefault)
    ) {
      expect(rawEvent.preventDefault).not.toHaveBeenCalled();
    }
  });

  it('rejects an ordinary event without InputEvent properties', () => {
    const event = new Event('beforeinput', { cancelable: true });
    const preventDefault = vi.spyOn(event, 'preventDefault');
    expect(toBeforeInputEventLike(event)).toBeUndefined();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});

function beforeInput(
  target: EventTarget,
  overrides: Partial<BeforeInputEventLike> = {},
) {
  return {
    target,
    inputType: 'insertText',
    data: ' ',
    isTrusted: true,
    cancelable: true,
    isComposing: false,
    preventDefault: vi.fn(),
    ...overrides,
  } satisfies BeforeInputEventLike;
}

function placeCaret(element: HTMLTextAreaElement | HTMLInputElement) {
  element.focus();
  const caret = element.value.indexOf(';HELLO') + ';HELLO'.length;
  element.setSelectionRange(caret, caret);
}

describe('Snippet expansion activation and text controls', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('replaces exactly at a textarea caret, preserving multiline text and notifying the host', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'Before ;HELLO after';
    document.body.append(textarea);
    placeCaret(textarea);
    const inputEvents: InputEvent[] = [];
    const changeListener = vi.fn();
    textarea.addEventListener('input', (event) =>
      inputEvents.push(event as InputEvent),
    );
    textarea.addEventListener('change', changeListener);
    const event = beforeInput(textarea);

    expect(
      new SnippetExpansionController(
        document,
        enabledCache('Line one\nLine two'),
      ).handleBeforeInput(event),
    ).toBe(true);

    expect(textarea.value).toBe('Before Line one\nLine two  after');
    expect(textarea.selectionStart).toBe('Before Line one\nLine two '.length);
    expect(textarea.selectionEnd).toBe(textarea.selectionStart);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(inputEvents).toHaveLength(1);
    expect(inputEvents[0]).toMatchObject({ bubbles: true, composed: true });
    expect(changeListener).not.toHaveBeenCalled();
  });

  it.each([null, 'text', 'search'])(
    'expands single-line content in a supported %s input',
    (type) => {
      const input = document.createElement('input');
      if (type !== null) input.type = type;
      input.value = ';HELLO';
      document.body.append(input);
      placeCaret(input);
      const event = beforeInput(input);

      expect(
        new SnippetExpansionController(
          document,
          enabledCache('Single line'),
        ).handleBeforeInput(event),
      ).toBe(true);
      expect(input.value).toBe('Single line ');
      expect(input.selectionStart).toBe('Single line '.length);
      expect(event.preventDefault).toHaveBeenCalledOnce();
    },
  );

  it('declines multiline content in an input without mutation or blocking Space', () => {
    const input = document.createElement('input');
    input.value = 'Before ;HELLO after';
    document.body.append(input);
    placeCaret(input);
    const event = beforeInput(input);
    const inputListener = vi.fn();
    input.addEventListener('input', inputListener);

    expect(
      new SnippetExpansionController(
        document,
        enabledCache('Line one\r\nLine two'),
      ).handleBeforeInput(event),
    ).toBe(false);
    expect(input.value).toBe('Before ;HELLO after');
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(inputListener).not.toHaveBeenCalled();
  });

  it.each(['password', 'email', 'url', 'tel', 'number', 'date'])(
    'leaves unsupported %s inputs unchanged',
    (type) => {
      const input = document.createElement('input');
      input.type = type;
      input.value = ';hello';
      const originalValue = input.value;
      document.body.append(input);
      input.focus();
      const event = beforeInput(input);
      expect(
        new SnippetExpansionController(
          document,
          enabledCache(),
        ).handleBeforeInput(event),
      ).toBe(false);
      expect(input.value).toBe(originalValue);
      expect(event.preventDefault).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['untrusted', { isTrusted: false }],
    ['noncancelable', { cancelable: false }],
    ['composition', { isComposing: true }],
    ['paste', { inputType: 'insertFromPaste' }],
    ['non-Space', { data: 'x' }],
  ] as const)('declines %s activation without mutation', (_label, override) => {
    const textarea = document.createElement('textarea');
    textarea.value = ';hello';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(6, 6);
    const event = beforeInput(textarea, override);
    expect(
      new SnippetExpansionController(
        document,
        enabledCache(),
      ).handleBeforeInput(event),
    ).toBe(false);
    expect(textarea.value).toBe(';hello');
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it('requires a collapsed caret, a whitespace/start boundary, and an exact catalog hit', () => {
    const textarea = document.createElement('textarea');
    document.body.append(textarea);
    const controller = new SnippetExpansionController(document, enabledCache());

    for (const value of ['prefix;hello', ';unknown', ';hel']) {
      textarea.value = value;
      textarea.focus();
      textarea.setSelectionRange(value.length, value.length);
      const event = beforeInput(textarea);
      expect(controller.handleBeforeInput(event)).toBe(false);
      expect(textarea.value).toBe(value);
      expect(event.preventDefault).not.toHaveBeenCalled();
    }

    textarea.value = ';hello';
    textarea.setSelectionRange(0, textarea.value.length);
    expect(controller.handleBeforeInput(beforeInput(textarea))).toBe(false);
  });

  it('fails open while disconnected or invalidated and never uses the old snapshot', () => {
    const textarea = document.createElement('textarea');
    textarea.value = ';hello';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(6, 6);
    const cache = enabledCache();
    cache.receive({
      type: 'trigger-catalog-invalidate',
      epoch: 'epoch-1',
      revision: 2,
    });
    const event = beforeInput(textarea);
    expect(
      new SnippetExpansionController(document, cache).handleBeforeInput(event),
    ).toBe(false);
    expect(textarea.value).toBe(';hello');
    expect(event.preventDefault).not.toHaveBeenCalled();
  });
});

describe('generic contenteditable adapter', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  function createEditable(html: string) {
    const root = document.createElement('div');
    root.setAttribute('contenteditable', 'true');
    root.tabIndex = 0;
    root.innerHTML = html;
    document.body.append(root);
    root.focus();
    return root;
  }

  function setCaret(node: Node, offset: number) {
    const range = document.createRange();
    range.setStart(node, offset);
    range.collapse(true);
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  it('preserves multiline plain text with text nodes and br boundaries', () => {
    const root = createEditable('Before ;hello');
    const text = root.firstChild;
    expect(text).toBeInstanceOf(Text);
    setCaret(text as Text, (text as Text).data.length);
    const inputListener = vi.fn();
    const changeListener = vi.fn();
    root.addEventListener('input', inputListener);
    root.addEventListener('change', changeListener);
    const event = beforeInput(root);

    expect(
      new SnippetExpansionController(
        document,
        enabledCache('Line <b>one</b>\nLine two'),
      ).handleBeforeInput(event),
    ).toBe(true);
    expect(root.innerHTML).toBe(
      'Before Line &lt;b&gt;one&lt;/b&gt;<br>Line two ',
    );
    expect(root.querySelector('b')).toBeNull();
    expect(inputListener).toHaveBeenCalledOnce();
    const notification = inputListener.mock.calls[0]?.[0] as InputEvent;
    expect(notification).toMatchObject({ bubbles: true, composed: true });
    expect(changeListener).not.toHaveBeenCalled();
    expect(document.getSelection()?.isCollapsed).toBe(true);
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it('preserves surrounding DOM and replaces only the candidate range', () => {
    const root = createEditable('<span>Prefix</span> ;hello suffix');
    const text = root.lastChild as Text;
    setCaret(text, ' ;hello'.length);
    const event = beforeInput(root);

    expect(
      new SnippetExpansionController(
        document,
        enabledCache('Replacement'),
      ).handleBeforeInput(event),
    ).toBe(true);
    expect(root.innerHTML).toBe('<span>Prefix</span> Replacement  suffix');
  });

  it('replaces a candidate split across safe adjacent text nodes', () => {
    const root = createEditable('');
    root.append(
      document.createTextNode('Before '),
      document.createTextNode(';he'),
      document.createTextNode('llo'),
    );
    const finalNode = root.lastChild as Text;
    setCaret(finalNode, finalNode.data.length);
    const event = beforeInput(root);

    expect(
      new SnippetExpansionController(
        document,
        enabledCache('Adjacent'),
      ).handleBeforeInput(event),
    ).toBe(true);
    expect(root.textContent).toBe('Before Adjacent ');
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });

  it('declines at embedded and br boundaries without mutating the DOM', () => {
    for (const html of ['<span>embedded</span>;hello', 'before<br>;hello']) {
      const root = createEditable(html);
      const text = root.lastChild as Text;
      setCaret(text, text.data.length);
      const before = root.innerHTML;
      const event = beforeInput(root);
      expect(
        new SnippetExpansionController(
          document,
          enabledCache(),
        ).handleBeforeInput(event),
      ).toBe(false);
      expect(root.innerHTML).toBe(before);
      expect(event.preventDefault).not.toHaveBeenCalled();
      root.remove();
    }
  });

  it('handles a nested target only once through the active editing root', () => {
    const root = createEditable('<span>;hello</span>');
    const span = root.firstElementChild as HTMLSpanElement;
    const text = span.firstChild as Text;
    setCaret(text, text.data.length);
    const event = beforeInput(span);
    const inputListener = vi.fn();
    root.addEventListener('input', inputListener);

    expect(
      new SnippetExpansionController(
        document,
        enabledCache('Nested'),
      ).handleBeforeInput(event),
    ).toBe(true);
    expect(root.textContent).toBe('Nested ');
    expect(inputListener).toHaveBeenCalledOnce();
  });

  it('expands in a framework-shaped nested inline structure without HTML execution', () => {
    const root = createEditable(
      '<p><span>test </span><span data-editor-leaf="true">;hi</span></p>',
    );
    const triggerLeaf = root.querySelector('[data-editor-leaf]');
    const text = triggerLeaf?.firstChild;
    expect(text?.nodeType).toBe(3);
    setCaret(text as Text, (text as Text).data.length);
    const inputListener = vi.fn();
    const changeListener = vi.fn();
    root.addEventListener('input', inputListener);
    root.addEventListener('change', changeListener);
    const event = beforeInput(triggerLeaf as Element);

    expect(
      new SnippetExpansionController(
        document,
        enabledCache('Hello <img src=x onerror=alert(1)>', ';hi'),
      ).handleBeforeInput(event),
    ).toBe(true);
    expect(root.textContent).toBe('test Hello <img src=x onerror=alert(1)> ');
    expect(root.querySelector('img')).toBeNull();
    expect(root.textContent?.startsWith('test ')).toBe(true);
    expect(root.textContent).not.toContain(';hi');
    expect(inputListener).toHaveBeenCalledOnce();
    expect(changeListener).not.toHaveBeenCalled();
    const selection = document.getSelection();
    expect(selection?.isCollapsed).toBe(true);
    const caretRange = selection?.getRangeAt(0);
    expect(
      caretRange?.startContainer.childNodes[caretRange.startOffset - 1]
        ?.textContent,
    ).toBe(' ');
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });
});

describe('realm-safe editor boundaries', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  function createForeignRealm() {
    const iframe = document.createElement('iframe');
    document.body.append(iframe);
    const foreignDocument = iframe.contentDocument;
    const foreignWindow = iframe.contentWindow;
    if (foreignDocument === null || foreignWindow === null) {
      throw new Error('iframe document unavailable');
    }
    return { foreignDocument, foreignWindow };
  }

  it.each([
    ['textarea', 'textarea'],
    ['supported text input', 'input'],
  ] as const)(
    'detects a %s without current-global constructor identity',
    (_label, localName) => {
      const { foreignDocument } = createForeignRealm();
      const element = foreignDocument.createElement(localName);
      element.value = ';hello';
      foreignDocument.body.append(element);
      element.focus();
      element.setSelectionRange(6, 6);

      expect(element).not.toBeInstanceOf(
        localName === 'textarea' ? HTMLTextAreaElement : HTMLInputElement,
      );
      const event = beforeInput(element);
      expect(
        new SnippetExpansionController(
          foreignDocument,
          enabledCache('Foreign realm'),
        ).handleBeforeInput(event),
      ).toBe(true);
      expect(element.value).toBe('Foreign realm ');
      expect(event.preventDefault).toHaveBeenCalledOnce();
    },
  );

  it('detects and replaces contenteditable text without current-global Element, Text, or Range identity', () => {
    const { foreignDocument } = createForeignRealm();
    const root = foreignDocument.createElement('div');
    root.setAttribute('contenteditable', 'true');
    root.tabIndex = 0;
    const span = foreignDocument.createElement('span');
    const text = foreignDocument.createTextNode('Before ;hello');
    span.append(text);
    root.append(span);
    foreignDocument.body.append(root);
    root.focus();
    const range = foreignDocument.createRange();
    range.setStart(text, text.data.length);
    range.collapse(true);
    const selection = foreignDocument.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    expect(root).not.toBeInstanceOf(Element);
    expect(text).not.toBeInstanceOf(Text);
    expect(range).not.toBeInstanceOf(Range);
    const inputListener = vi.fn();
    root.addEventListener('input', inputListener);
    const event = beforeInput(span);
    expect(
      new SnippetExpansionController(
        foreignDocument,
        enabledCache('Foreign realm'),
      ).handleBeforeInput(event),
    ).toBe(true);
    expect(root.textContent).toBe('Before Foreign realm ');
    expect(inputListener).toHaveBeenCalledOnce();
    expect(event.preventDefault).toHaveBeenCalledOnce();
  });
});
