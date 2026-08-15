import type { NativeClipboardCapabilityStatus } from '../../application/snippet/image-clipboard-transport';
import {
  isNativeClipboardStatusRequest,
  isNativeClipboardStatusResponse,
  type NativeClipboardStatusResponse,
} from '../../shared/native-clipboard-messages';
import type { NativeClipboardCapability } from '../../application/snippet/image-clipboard-transport';

export const NATIVE_CLIPBOARD_PERMISSION = ['nativeMessaging'] as const;

type RuntimeMessageListener = (
  message: unknown,
  sender: unknown,
  sendResponse: (response: NativeClipboardStatusResponse) => void,
) => boolean | undefined;

interface RuntimeMessageEvent {
  addListener(listener: RuntimeMessageListener): void;
  removeListener(listener: RuntimeMessageListener): void;
}

export interface NativeClipboardCapabilityRuntime {
  readonly onMessage: RuntimeMessageEvent;
}

export function registerNativeClipboardCapability(
  runtime: NativeClipboardCapabilityRuntime,
  capability: NativeClipboardCapability,
): () => void {
  const listener: RuntimeMessageListener = (message, _sender, sendResponse) => {
    if (!isNativeClipboardStatusRequest(message)) return undefined;
    void capability.getStatus().then(
      (status) =>
        sendResponse({
          type: 'native-clipboard-status-response',
          status,
        }),
      () =>
        sendResponse({
          type: 'native-clipboard-status-response',
          status: 'invalid-host-response',
        }),
    );
    return true;
  };
  runtime.onMessage.addListener(listener);
  return () => runtime.onMessage.removeListener(listener);
}

export interface WindowsImageClipboardCapability {
  getStatus(): Promise<NativeClipboardCapabilityStatus>;
  requestEnable(): Promise<NativeClipboardCapabilityStatus>;
}

export interface WindowsImageClipboardOptionsApi {
  readonly permissions: {
    request(options: {
      readonly permissions: readonly ['nativeMessaging'];
    }): Promise<boolean>;
  };
  readonly runtime: {
    sendMessage(message: unknown): Promise<unknown>;
  };
}

export class ChromeWindowsImageClipboardCapability implements WindowsImageClipboardCapability {
  constructor(private readonly chromeApi: WindowsImageClipboardOptionsApi) {}

  async getStatus(): Promise<NativeClipboardCapabilityStatus> {
    const response = await this.chromeApi.runtime.sendMessage({
      type: 'native-clipboard-status-request',
    });
    if (!isNativeClipboardStatusResponse(response)) {
      throw new Error('Native clipboard status response was invalid.');
    }
    return response.status;
  }

  async requestEnable(): Promise<NativeClipboardCapabilityStatus> {
    const granted = await this.chromeApi.permissions.request({
      permissions: NATIVE_CLIPBOARD_PERMISSION,
    });
    return granted ? this.getStatus() : 'permission-not-granted';
  }
}
