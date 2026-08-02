import type { SelectionCaptureResult } from '../../shared/selection-capture';

export function extractSelectionFromPage(): SelectionCaptureResult {
  const focusedElement = document.activeElement;
  let selectedText: string | undefined;

  if (focusedElement instanceof HTMLTextAreaElement) {
    const { selectionEnd, selectionStart, value } = focusedElement;

    if (
      selectionStart !== null &&
      selectionEnd !== null &&
      selectionEnd > selectionStart
    ) {
      selectedText = value.substring(selectionStart, selectionEnd);
    }
  } else if (
    focusedElement instanceof HTMLInputElement &&
    ['text', 'search', 'url', 'tel', 'password'].includes(focusedElement.type)
  ) {
    const { selectionEnd, selectionStart, value } = focusedElement;

    if (
      selectionStart !== null &&
      selectionEnd !== null &&
      selectionEnd > selectionStart
    ) {
      selectedText = value.substring(selectionStart, selectionEnd);
    }
  }

  selectedText ??= window.getSelection()?.toString() ?? '';

  if (selectedText.trim().length === 0) {
    return { kind: 'empty' };
  }

  return { kind: 'success', text: selectedText };
}
