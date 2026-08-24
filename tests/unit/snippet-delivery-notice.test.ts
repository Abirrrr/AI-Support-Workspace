// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { showSnippetDeliveryNotice } from '../../src/extension/snippet-trigger/content-runtime';
import { SNIPPET_DELIVERY_NOTICE_ID } from '../../src/extension/snippet-trigger/expansion-controller';

describe('snippet delivery notice focus isolation', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.getElementById(SNIPPET_DELIVERY_NOTICE_ID)?.remove();
  });

  it('mounts outside the editor without focus, autofocus, or selectionchange', async () => {
    const editor = document.createElement('textarea');
    editor.value = 'unchanged';
    document.body.append(editor);
    editor.focus();
    editor.setSelectionRange(3, 3);
    const activeBefore = document.activeElement;
    const selectionChanges = vi.fn();
    document.addEventListener('selectionchange', selectionChanges);
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    const mutations: MutationRecord[] = [];
    const observer = new MutationObserver((records) =>
      mutations.push(...records),
    );
    observer.observe(document, { childList: true, subtree: true });

    showSnippetDeliveryNotice(
      document,
      { setTimeout: vi.fn(() => 1) },
      'safe status',
      'success',
    );
    await Promise.resolve();

    const notice = document.getElementById(SNIPPET_DELIVERY_NOTICE_ID);
    expect(notice).not.toBeNull();
    expect(notice?.hasAttribute('autofocus')).toBe(false);
    expect(focus).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(activeBefore);
    expect(editor.selectionStart).toBe(3);
    expect(editor.selectionEnd).toBe(3);
    expect(selectionChanges).not.toHaveBeenCalled();
    expect(editor.contains(notice)).toBe(false);
    expect(
      notice !== null &&
        mutations.some((record) => [...record.addedNodes].includes(notice)),
    ).toBe(true);

    observer.disconnect();
    document.removeEventListener('selectionchange', selectionChanges);
    focus.mockRestore();
  });
});
