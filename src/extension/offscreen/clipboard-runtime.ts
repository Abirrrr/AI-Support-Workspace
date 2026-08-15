import {
  isOffscreenClipboardWriteMessage,
  type OffscreenClipboardFailureCode,
  type OffscreenClipboardWriteResponse,
} from '../../shared/snippet-delivery-messages';

export interface OffscreenClipboardEnvironment {
  readonly document: Document;
}

export interface TextClipboardRepresentations {
  readonly plainText: string;
  readonly html: string;
}

export function copyTextRepresentations(
  document: Document,
  representations: TextClipboardRepresentations,
): OffscreenClipboardFailureCode | undefined {
  let handlerExecuted = false;
  let representationsWritten = false;
  let dataWriteFailed = false;
  const copyListener = (event: Event) => {
    handlerExecuted = true;
    const clipboardEvent = event as ClipboardEvent & {
      readonly clipboardData?: DataTransfer | null;
    };
    const clipboardData = clipboardEvent.clipboardData;
    if (clipboardData === null || clipboardData === undefined) return;
    try {
      clipboardData.setData('text/plain', representations.plainText);
      clipboardData.setData('text/html', representations.html);
      clipboardEvent.preventDefault();
      representationsWritten = true;
    } catch {
      dataWriteFailed = true;
    }
  };

  try {
    document.addEventListener('copy', copyListener);
  } catch {
    return 'clipboard-copy-event-unavailable';
  }

  let commandSucceeded = false;
  let commandFailed = false;
  let cleanupFailed = false;
  try {
    commandSucceeded = document.execCommand('copy');
  } catch {
    commandFailed = true;
  } finally {
    try {
      document.removeEventListener('copy', copyListener);
    } catch {
      cleanupFailed = true;
    }
  }

  if (commandFailed || !commandSucceeded) {
    return 'clipboard-copy-command-failed';
  }
  if (cleanupFailed || !handlerExecuted) {
    return 'clipboard-copy-event-unavailable';
  }
  if (dataWriteFailed) return 'clipboard-copy-data-failed';
  if (!representationsWritten) return 'clipboard-copy-event-unavailable';
  return undefined;
}

export async function handleOffscreenClipboardWrite(
  value: unknown,
  environment: OffscreenClipboardEnvironment,
): Promise<OffscreenClipboardWriteResponse | undefined> {
  if (!isOffscreenClipboardWriteMessage(value)) return undefined;
  const failure = (
    error: OffscreenClipboardFailureCode,
  ): OffscreenClipboardWriteResponse => ({
    type: 'offscreen-clipboard-write-result',
    requestId: value.requestId,
    succeeded: false,
    error,
  });
  const textFailure = copyTextRepresentations(environment.document, {
    plainText: value.plainText,
    html: value.html,
  });
  return textFailure === undefined
    ? {
        type: 'offscreen-clipboard-write-result',
        requestId: value.requestId,
        succeeded: true,
      }
    : failure(textFailure);
}
