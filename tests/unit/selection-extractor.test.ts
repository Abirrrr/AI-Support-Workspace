// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';

import { extractSelectionFromPage } from '../../src/extension/keyboard-shortcut/selection-extractor';

function selectNodeContents(node: Node): void {
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

afterEach(() => {
  window.getSelection()?.removeAllRanges();
  document.body.replaceChildren();
});

describe('extractSelectionFromPage', () => {
  it('returns only the explicit normal document selection', () => {
    const paragraph = document.createElement('p');
    const selectedTextNode = document.createTextNode('selected text');
    paragraph.append('Surrounding ', selectedTextNode);
    document.body.append(paragraph, ' after');
    selectNodeContents(selectedTextNode);

    expect(extractSelectionFromPage()).toEqual({
      kind: 'success',
      text: 'selected text',
    });
  });

  it('uses ordinary document selection for contenteditable content', () => {
    const editor = document.createElement('div');
    editor.contentEditable = 'true';
    editor.textContent = 'Editable selection 🌍';
    document.body.append(editor);
    selectNodeContents(editor);

    expect(extractSelectionFromPage()).toEqual({
      kind: 'success',
      text: 'Editable selection 🌍',
    });
  });

  it('returns the exact selected textarea substring with whitespace and line breaks', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'prefix  first line\nsecond line  suffix';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(6, 32);

    expect(extractSelectionFromPage()).toEqual({
      kind: 'success',
      text: '  first line\nsecond line  ',
    });
  });

  it.each(['text', 'search', 'url', 'tel', 'password'])(
    'returns the exact selected substring from a supported %s input',
    (type) => {
      const input = document.createElement('input');
      input.type = type;
      input.value = 'before Unicode-日本語 after';
      document.body.append(input);
      input.focus();
      input.setSelectionRange(7, 18);

      expect(extractSelectionFromPage()).toEqual({
        kind: 'success',
        text: 'Unicode-日本語',
      });
    },
  );

  it('treats whitespace-only textarea selection as empty without falling back', () => {
    const textarea = document.createElement('textarea');
    textarea.value = 'before   after';
    document.body.append(textarea);
    textarea.focus();
    textarea.setSelectionRange(6, 9);

    const unrelated = document.createElement('p');
    unrelated.textContent = 'Unrelated document selection';
    document.body.append(unrelated);
    selectNodeContents(unrelated);
    textarea.focus();

    expect(extractSelectionFromPage()).toEqual({ kind: 'empty' });
  });

  it('returns empty when there is no explicit selection', () => {
    document.body.textContent = 'Whole page text must not be captured.';

    expect(extractSelectionFromPage()).toEqual({ kind: 'empty' });
  });

  it('does not read unsupported focused control values', () => {
    const input = document.createElement('input');
    input.type = 'email';
    input.value = 'merchant@example.com';
    document.body.append(input);
    input.focus();

    expect(extractSelectionFromPage()).toEqual({ kind: 'empty' });
  });
});
