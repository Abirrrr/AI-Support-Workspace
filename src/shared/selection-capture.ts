export type SelectionCaptureResult =
  | {
      readonly kind: 'success';
      readonly text: string;
    }
  | {
      readonly kind: 'empty';
    }
  | {
      readonly kind: 'failure';
    };

export const CAPTURE_SUCCESS_MESSAGE =
  'Selected text added to Merchant Context.';
export const EMPTY_SELECTION_MESSAGE =
  'Select text on the page, then use the shortcut again.';
export const CAPTURE_FAILURE_MESSAGE =
  "Couldn't capture selected text from this page. Copy and paste it into Merchant Context.";

export function isSelectionCaptureResult(
  value: unknown,
): value is SelectionCaptureResult {
  if (typeof value !== 'object' || value === null || !('kind' in value)) {
    return false;
  }

  if (value.kind === 'empty' || value.kind === 'failure') {
    return true;
  }

  return (
    value.kind === 'success' &&
    'text' in value &&
    typeof value.text === 'string' &&
    value.text.trim().length > 0
  );
}
