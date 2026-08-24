// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEditorAdapter } from '../../src/extension/snippet-trigger/editor-adapters';
import type { TriggerActivationSnapshot } from '../../src/extension/snippet-trigger/editor-adapters';
import { SNIPPET_DELIVERY_NOTICE_ID } from '../../src/extension/snippet-trigger/expansion-controller';

function readDiagnostic(snapshot: TriggerActivationSnapshot) {
  const read = snapshot.readAutomaticPasteDiagnostic;
  if (read === undefined) throw new Error('Expected diagnostic evidence.');
  return read();
}

function captureTextControl(element: HTMLTextAreaElement) {
  element.value = ';hello';
  document.body.append(element);
  element.focus();
  element.setSelectionRange(6, 6);
  const adapter = createEditorAdapter({ target: element }, document);
  const candidate = adapter?.readTriggerCandidate(32);
  if (adapter === undefined || candidate === undefined) {
    throw new Error('Expected a text-control trigger candidate.');
  }
  const snapshot = adapter.captureActivation(candidate);
  if (snapshot === undefined)
    throw new Error('Expected an activation snapshot.');
  snapshot.beginAutomaticPasteAuthorization();
  return snapshot;
}

function captureContenteditable() {
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  const trigger = document.createTextNode(';hello');
  editor.append(trigger);
  document.body.append(editor);
  editor.focus();
  const selection = document.getSelection();
  if (selection === null) throw new Error('Expected a selection.');
  const setCaret = (container: Node, offset: number) => {
    const caret = document.createRange();
    caret.setStart(container, offset);
    caret.collapse(true);
    selection.removeAllRanges();
    selection.addRange(caret);
  };
  setCaret(trigger, trigger.length);
  const adapter = createEditorAdapter({ target: editor }, document);
  const candidate = adapter?.readTriggerCandidate(32);
  if (adapter === undefined || candidate === undefined) {
    throw new Error('Expected a contenteditable trigger candidate.');
  }
  const snapshot = adapter.captureActivation(candidate);
  if (snapshot === undefined)
    throw new Error('Expected an activation snapshot.');
  snapshot.beginAutomaticPasteAuthorization();
  return { editor, selection, setCaret, snapshot, trigger };
}

function captureShadowContenteditable() {
  const host = document.createElement('div');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  const trigger = document.createTextNode(';hello');
  editor.append(trigger);
  shadow.append(editor);
  editor.focus();
  const selection = document.getSelection();
  if (selection === null) throw new Error('Expected a selection.');
  Object.defineProperty(selection, 'getComposedRanges', {
    configurable: true,
    value: vi.fn(() => [
      {
        startContainer: trigger,
        startOffset: trigger.length,
        endContainer: trigger,
        endOffset: trigger.length,
      },
    ]),
  });
  const event = {
    target: host,
    composedPath: () => [editor, shadow, host, document.body, document, window],
    getTargetRanges: () => [
      {
        startContainer: trigger,
        startOffset: trigger.length,
        endContainer: trigger,
        endOffset: trigger.length,
      },
    ],
  };
  const adapter = createEditorAdapter(event, document);
  const candidate = adapter?.readTriggerCandidate(32);
  const snapshot = candidate && adapter?.captureActivation(candidate);
  if (snapshot === undefined)
    throw new Error('Expected a Shadow-DOM activation snapshot.');
  snapshot.beginAutomaticPasteAuthorization();
  return { editor, host, shadow, snapshot, trigger };
}

describe('automatic-paste editor authorization', () => {
  beforeEach(() => {
    document.getSelection()?.removeAllRanges();
    document.body.replaceChildren();
  });

  it('accepts clipboard success with the original focused editor and caret', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    expect(snapshot.isAutomaticPasteSafe()).toBe(true);
  });

  it('invalidates a new real input after the prevented activation', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    editor.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        composed: true,
        inputType: 'insertText',
      }),
    );

    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      activationBeforeInputPrevented: false,
      activationInputObserved: false,
      firstInvalidationCause: 'unrelated-input',
      externalInputTrusted: false,
      externalInputType: 'insertText',
      externalInputSameEditor: true,
      externalInputSameRoot: true,
      externalInputComposed: true,
      externalInputSameActivationTask: true,
      externalInputRelativePhase: 'activation',
      externalInputSequenceRelation: 'before-owned-cleanup-input',
    });
  });

  it('classifies a delayed synthetic input after the prevented activation', async () => {
    const { editor, snapshot } = captureContenteditable();
    await Promise.resolve();
    editor.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        composed: true,
        inputType: 'insertText',
      }),
    );

    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      firstInvalidationCause: 'unrelated-input',
      cleanupInputProvenance: 'external-input',
      activationInputObserved: false,
      externalInputTrusted: false,
      externalInputType: 'insertText',
      externalInputSameEditor: true,
      externalInputSameRoot: true,
      externalInputComposed: true,
      externalInputSameActivationTask: false,
      externalInputRelativePhase: 'activation',
      externalInputSequenceRelation: 'before-owned-cleanup-input',
    });
  });

  it('invalidates another Space instead of broadly suppressing input', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    editor.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        composed: true,
        inputType: 'insertText',
        data: ' ',
      }),
    );

    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      firstInvalidationCause: 'unrelated-input',
      activationInputObserved: true,
      externalInputTrusted: false,
      externalInputType: 'insertText',
      externalInputSameEditor: true,
      externalInputSameRoot: true,
      externalInputComposed: true,
      externalInputSameActivationTask: true,
      externalInputRelativePhase: 'activation',
      externalInputSequenceRelation: 'before-owned-cleanup-input',
    });
  });

  it('does not invalidate when a pre-existing outside-editor notice is removed', async () => {
    const notice = document.createElement('div');
    notice.id = SNIPPET_DELIVERY_NOTICE_ID;
    document.documentElement.append(notice);
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);

    notice.remove();
    await Promise.resolve();

    expect(snapshot.isAutomaticPasteSafe()).toBe(true);
    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(true);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: null,
      firstInvalidationCause: null,
      noticeMutationWithinAuthorizationObserverScope: true,
      noticeMountedInsideEditor: false,
    });
  });

  it('permanently declines after focus leaves the editor', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    const other = document.createElement('button');
    document.body.append(other);
    other.focus();
    editor.focus();
    editor.setSelectionRange(7, 7);
    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
  });

  it('permanently declines after the browser window blurs even if focus returns', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    window.dispatchEvent(new Event('blur'));
    editor.focus();
    editor.setSelectionRange(7, 7);
    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
  });

  it('permanently declines when an editor is disconnected', async () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    editor.remove();
    await Promise.resolve();
    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: 'editor-disconnected',
      postCleanupChecks: { editorConnected: false },
    });
  });

  it('declines after the caret moves', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    editor.setSelectionRange(0, 0);
    document.dispatchEvent(new Event('selectionchange'));
    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
  });

  it('declines after unrelated editor input changes', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    editor.value += 'x';
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
  });

  it('declines after pagehide and cannot be resurrected', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    window.dispatchEvent(new Event('pagehide'));
    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
  });

  it('prohibits automatic paste when exact cleanup fails', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    editor.value = ';hello changed';
    editor.setSelectionRange(editor.value.length, editor.value.length);
    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(false);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
  });

  it('accepts exact cleanup with the expected post-cleanup caret once only', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    expect(snapshot.isAutomaticPasteSafe()).toBe(true);
    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(editor.value).toBe('');
    expect(editor.selectionStart).toBe(0);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(true);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: null,
      firstInvalidationCause: null,
      focusTopology: 'direct-editor',
      cleanupInputProvenance: 'extension-owned',
      firstInvalidatingInputPhase: null,
      postCleanupChecks: {
        authorizationStillValid: true,
        editorConnected: true,
        composedFocusValid: true,
        selectionExists: true,
        selectionCollapsed: true,
        caretOffsetMatches: true,
        structureMatches: true,
      },
    });
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
  });

  it('clears exact cleanup input ownership immediately after dispatch', async () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    await Promise.resolve();
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: 'authorization-invalidated',
      firstInvalidationCause: 'unrelated-input',
      cleanupInputProvenance: 'external-input',
      firstInvalidatingInputPhase: 'outside-authorized-cleanup-dispatch',
      externalInputTrusted: false,
      externalInputType: 'other',
      externalInputSameEditor: true,
      externalInputSameRoot: true,
      externalInputComposed: false,
      externalInputSameActivationTask: false,
      externalInputRelativePhase: 'post-cleanup',
      externalInputSequenceRelation: 'later',
    });
  });

  it('declines a second input nested inside the owned cleanup dispatch', async () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    editor.addEventListener(
      'input',
      () => editor.dispatchEvent(new InputEvent('input', { bubbles: true })),
      { once: true },
    );
    await Promise.resolve();

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: 'authorization-invalidated',
      firstInvalidationCause: 'unrelated-input',
      cleanupInputProvenance: 'nested-destination-input',
      firstInvalidatingInputPhase: 'during-authorized-cleanup-dispatch',
      externalInputTrusted: false,
      externalInputType: 'other',
      externalInputSameEditor: true,
      externalInputSameRoot: true,
      externalInputComposed: false,
      externalInputSameActivationTask: false,
      externalInputRelativePhase: 'during-owned-cleanup-input',
      externalInputSequenceRelation: 'during-owned-cleanup-input',
    });
  });

  it('declines input from another editor during the owned cleanup dispatch', () => {
    const editor = document.createElement('textarea');
    const otherEditor = document.createElement('textarea');
    document.body.append(otherEditor);
    const snapshot = captureTextControl(editor);
    editor.addEventListener(
      'input',
      () =>
        otherEditor.dispatchEvent(new InputEvent('input', { bubbles: true })),
      { once: true },
    );

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      firstInvalidationCause: 'unrelated-input',
      cleanupInputProvenance: 'nested-destination-input',
      firstInvalidatingInputPhase: 'during-authorized-cleanup-dispatch',
      externalInputSameEditor: false,
      externalInputSameRoot: true,
      externalInputRelativePhase: 'during-owned-cleanup-input',
      externalInputSequenceRelation: 'during-owned-cleanup-input',
    });
  });

  it('declines user-like input emitted before the owned cleanup dispatch', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    const setRangeText = editor.setRangeText.bind(editor);
    vi.spyOn(editor, 'setRangeText').mockImplementation(
      (replacement, start, end, selectionMode) => {
        setRangeText(replacement, start, end, selectionMode);
        editor.dispatchEvent(new InputEvent('input', { bubbles: true }));
      },
    );

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      firstInvalidationCause: 'unrelated-input',
      cleanupInputProvenance: 'external-input',
      firstInvalidatingInputPhase: 'outside-authorized-cleanup-dispatch',
      externalInputTrusted: false,
      externalInputType: 'other',
      externalInputSameEditor: true,
      externalInputSameRoot: true,
      externalInputComposed: false,
      externalInputSameActivationTask: true,
      externalInputRelativePhase: 'cleanup-before-owned-input',
      externalInputSequenceRelation: 'before-owned-cleanup-input',
    });
  });

  it('clears ownership and declines automatic paste when cleanup dispatch throws', () => {
    const editor = document.createElement('textarea');
    const snapshot = captureTextControl(editor);
    vi.spyOn(editor, 'dispatchEvent').mockImplementation(() => {
      throw new Error('destination dispatch failed');
    });

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: 'authorization-invalidated',
      firstInvalidationCause: 'predicate-failed',
      cleanupInputProvenance: 'none',
      firstInvalidatingInputPhase: null,
    });
  });

  it('keeps manual clipboard-only cleanup behavior unchanged', () => {
    const editor = document.createElement('textarea');
    editor.value = ';hello';
    document.body.append(editor);
    editor.focus();
    editor.setSelectionRange(6, 6);
    const adapter = createEditorAdapter({ target: editor }, document);
    const candidate = adapter?.readTriggerCandidate(32);
    const snapshot = candidate && adapter?.captureActivation(candidate);
    if (snapshot === undefined)
      throw new Error('Expected a manual activation snapshot.');
    const input = vi.fn();
    editor.addEventListener('input', input);

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(editor.value).toBe('');
    expect(input).toHaveBeenCalledOnce();
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
  });

  it('accepts the exact cleanup caret after a structurally identical editor normalization', () => {
    const { editor, selection, setCaret, snapshot, trigger } =
      captureContenteditable();
    editor.addEventListener(
      'input',
      () => {
        const replacement = trigger.cloneNode(true);
        editor.replaceChild(replacement, trigger);
        setCaret(replacement, 0);
      },
      { once: true },
    );

    expect(snapshot.isAutomaticPasteSafe()).toBe(true);
    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(editor.textContent).toBe('');
    expect(selection.anchorNode).toBe(editor.firstChild);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(true);
  });

  it("does not let cleanup's own selection transition invalidate authorization", () => {
    const { selection, snapshot } = captureContenteditable();
    const removeAllRanges = selection.removeAllRanges.bind(selection);
    vi.spyOn(selection, 'removeAllRanges').mockImplementation(() => {
      removeAllRanges();
      document.dispatchEvent(new Event('selectionchange'));
    });

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(true);
  });

  it('declines an unrelated content mutation during cleanup', () => {
    const { editor, snapshot } = captureContenteditable();
    editor.addEventListener(
      'input',
      () => editor.append(document.createTextNode('unrelated')),
      { once: true },
    );

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
    expect(readDiagnostic(snapshot).postCleanupFailure).toBe(
      'structure-mismatch',
    );
  });

  it('classifies the first asynchronously observed mutation immutably', async () => {
    const { editor, snapshot } = captureContenteditable();
    editor.append(document.createElement('br'));
    await Promise.resolve();

    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: 'mutation-invalidated',
      firstInvalidationCause: 'mutation',
      postCleanupChecks: { mutationValid: false },
    });
  });

  it('declines an unrelated caret change during cleanup', () => {
    const { editor, setCaret, snapshot } = captureContenteditable();
    editor.addEventListener(
      'input',
      () => {
        setCaret(editor, editor.childNodes.length);
        document.dispatchEvent(new Event('selectionchange'));
      },
      { once: true },
    );

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: 'selection-invalidated',
      firstInvalidationCause: 'selectionchange',
      postCleanupChecks: { selectionValid: false },
    });
  });

  it('distinguishes a post-cleanup caret path mismatch from selection invalidation', () => {
    const { editor, setCaret, snapshot } = captureContenteditable();
    editor.addEventListener(
      'input',
      () => {
        const alternate = document.createElement('span');
        alternate.append(document.createTextNode(''));
        editor.replaceChildren(alternate);
        setCaret(alternate.firstChild ?? alternate, 0);
      },
      { once: true },
    );

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: 'caret-path-mismatch',
      firstInvalidationCause: 'predicate-failed',
      postCleanupChecks: { caretPathMatches: false },
    });
  });

  it('permanently declines focus departure and return during cleanup', () => {
    const { editor, setCaret, snapshot } = captureContenteditable();
    const other = document.createElement('button');
    document.body.append(other);
    editor.addEventListener(
      'input',
      () => {
        other.focus();
        editor.focus();
        const postCleanupNode = editor.firstChild ?? editor;
        setCaret(postCleanupNode, 0);
      },
      { once: true },
    );

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: 'focus-invalidated',
      firstInvalidationCause: 'window-blur',
      postCleanupChecks: { focusValid: false },
    });
  });

  it('accepts composed focus and selection for a Shadow-DOM editor', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    const trigger = document.createTextNode(';hello');
    editor.append(trigger);
    shadow.append(editor);
    editor.focus();
    const selection = document.getSelection();
    if (selection === null) throw new Error('Expected a selection.');
    let liveCaret: Node = trigger;
    const exposeCaret = () => {
      Object.defineProperty(selection, 'getComposedRanges', {
        configurable: true,
        value: vi.fn(() => [
          {
            startContainer: liveCaret,
            startOffset: liveCaret.textContent?.length ?? 0,
            endContainer: liveCaret,
            endOffset: liveCaret.textContent?.length ?? 0,
          },
        ]),
      });
    };
    exposeCaret();
    const event = {
      target: host,
      composedPath: () => [
        editor,
        shadow,
        host,
        document.body,
        document,
        window,
      ],
      getTargetRanges: () => [
        {
          startContainer: trigger,
          startOffset: trigger.length,
          endContainer: trigger,
          endOffset: trigger.length,
        },
      ],
    };
    const adapter = createEditorAdapter(event, document);
    const candidate = adapter?.readTriggerCandidate(32);
    if (adapter === undefined || candidate === undefined) {
      throw new Error('Expected a Shadow-DOM trigger candidate.');
    }
    const snapshot = adapter.captureActivation(candidate);
    if (snapshot === undefined)
      throw new Error('Expected an activation snapshot.');
    snapshot.beginAutomaticPasteAuthorization();
    editor.addEventListener(
      'input',
      () => {
        const replacement = trigger.cloneNode(true);
        editor.replaceChild(replacement, trigger);
        liveCaret = replacement;
        exposeCaret();
      },
      { once: true },
    );
    expect(document.activeElement).toBe(host);
    expect(shadow.activeElement).toBe(editor);
    expect(snapshot.isAutomaticPasteSafe()).toBe(true);
    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(true);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: null,
      focusTopology: 'shadow-host-retargeted',
      cleanupInputProvenance: 'extension-owned',
      firstInvalidatingInputPhase: null,
      activationInputObserved: false,
    });
  });

  it('classifies invalid composed focus after Shadow-DOM cleanup', () => {
    const { shadow, snapshot } = captureShadowContenteditable();
    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    Object.defineProperty(shadow, 'activeElement', {
      configurable: true,
      get: () => null,
    });

    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      postCleanupFailure: 'composed-focus-mismatch',
      focusTopology: 'no-valid-composed-focus',
      postCleanupChecks: { composedFocusValid: false },
    });
  });

  it('classifies one retargeted Shadow-DOM input without duplicate observation', async () => {
    const { editor, snapshot } = captureShadowContenteditable();
    await Promise.resolve();
    editor.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        composed: true,
        inputType: 'insertText',
      }),
    );

    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
    expect(readDiagnostic(snapshot)).toMatchObject({
      firstInvalidationCause: 'unrelated-input',
      focusTopology: 'shadow-host-retargeted',
      activationInputObserved: false,
      externalInputTrusted: false,
      externalInputType: 'insertText',
      externalInputSameEditor: true,
      externalInputSameRoot: true,
      externalInputComposed: true,
      externalInputSameActivationTask: false,
      externalInputRelativePhase: 'activation',
      externalInputSequenceRelation: 'before-owned-cleanup-input',
    });
  });

  it('declines unrelated internal Shadow-DOM mutation after exact cleanup', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const shadow = host.attachShadow({ mode: 'open' });
    const editor = document.createElement('div');
    editor.setAttribute('contenteditable', 'true');
    const trigger = document.createTextNode(';hello');
    editor.append(trigger);
    shadow.append(editor);
    editor.focus();
    const selection = document.getSelection();
    if (selection === null) throw new Error('Expected a selection.');
    Object.defineProperty(selection, 'getComposedRanges', {
      configurable: true,
      value: vi.fn(() => [
        {
          startContainer: trigger,
          startOffset: trigger.length,
          endContainer: trigger,
          endOffset: trigger.length,
        },
      ]),
    });
    const event = {
      target: host,
      composedPath: () => [
        editor,
        shadow,
        host,
        document.body,
        document,
        window,
      ],
      getTargetRanges: () => [
        {
          startContainer: trigger,
          startOffset: trigger.length,
          endContainer: trigger,
          endOffset: trigger.length,
        },
      ],
    };
    const adapter = createEditorAdapter(event, document);
    const candidate = adapter?.readTriggerCandidate(32);
    const snapshot = candidate && adapter?.captureActivation(candidate);
    if (snapshot === undefined)
      throw new Error('Expected a Shadow-DOM activation snapshot.');
    snapshot.beginAutomaticPasteAuthorization();
    editor.addEventListener(
      'input',
      () => editor.append(document.createElement('br')),
      { once: true },
    );

    expect(snapshot.cleanupAfterClipboardSuccess()).toBe(true);
    expect(snapshot.consumeAutomaticPasteAuthorization()).toBe(false);
  });

  it('declines when focus leaves the internal Shadow-DOM editor', () => {
    const { snapshot } = captureShadowContenteditable();
    const other = document.createElement('button');
    document.body.append(other);
    other.focus();

    expect(snapshot.isAutomaticPasteSafe()).toBe(false);
  });

  it('does not treat a retargeted outer Shadow host alone as editor ownership', () => {
    const host = document.createElement('div');
    document.body.append(host);
    host.attachShadow({ mode: 'open' });
    host.focus();
    expect(
      createEditorAdapter(
        {
          target: host,
          composedPath: () => [host, document.body, document, window],
          getTargetRanges: () => [],
        },
        document,
      ),
    ).toBeUndefined();
  });
});
