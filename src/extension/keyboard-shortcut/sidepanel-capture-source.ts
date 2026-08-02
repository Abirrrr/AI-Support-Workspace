import type {
  WorkspaceCaptureHandler,
  WorkspaceCaptureSource,
} from '../../ui/workspace/workspace-capture-source';
import {
  isWorkspaceCaptureDeliveryMessage,
  WORKSPACE_CAPTURE_READY,
  type WorkspaceCaptureAcknowledgement,
} from './messages';

type SendResponse = (response?: unknown) => void;
type RuntimeMessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: SendResponse,
) => boolean | undefined;

export interface WorkspaceCaptureRuntimeApi {
  readonly onMessage: {
    addListener(listener: RuntimeMessageListener): void;
    removeListener(listener: RuntimeMessageListener): void;
  };
  sendMessage(message: unknown): Promise<unknown>;
}

export class ChromeWorkspaceCaptureSource implements WorkspaceCaptureSource {
  constructor(private readonly runtime: WorkspaceCaptureRuntimeApi) {}

  subscribe(handler: WorkspaceCaptureHandler): () => void {
    const listener: RuntimeMessageListener = (
      message,
      _sender,
      sendResponse,
    ) => {
      if (!isWorkspaceCaptureDeliveryMessage(message)) return;

      void Promise.resolve(handler(message.result))
        .then(() => {
          const acknowledgement: WorkspaceCaptureAcknowledgement = {
            type: 'workspace-capture-acknowledgement',
            deliveryId: message.deliveryId,
          };
          sendResponse(acknowledgement);
        })
        .catch(() => {
          sendResponse();
        });

      return true;
    };

    this.runtime.onMessage.addListener(listener);
    void this.runtime.sendMessage(WORKSPACE_CAPTURE_READY).catch(() => {
      // The background may be starting; a later command delivery can retry.
    });

    return () => {
      this.runtime.onMessage.removeListener(listener);
    };
  }
}

export function createChromeWorkspaceCaptureSource():
  ChromeWorkspaceCaptureSource | undefined {
  const runtime = (
    globalThis as typeof globalThis & {
      chrome?: { readonly runtime?: WorkspaceCaptureRuntimeApi };
    }
  ).chrome?.runtime;

  return runtime === undefined
    ? undefined
    : new ChromeWorkspaceCaptureSource(runtime);
}
