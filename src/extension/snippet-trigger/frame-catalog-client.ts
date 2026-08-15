import { TRIGGER_CATALOG_PORT_NAME } from '../../shared/trigger-catalog-messages';
import { FrameTriggerCatalogCache } from './frame-catalog-cache';

interface ListenerEvent<Listener> {
  addListener(listener: Listener): void;
  removeListener(listener: Listener): void;
}

type MessageListener = (message: unknown) => void;
type DisconnectListener = () => void;

export interface FrameCatalogPort {
  readonly onMessage: ListenerEvent<MessageListener>;
  readonly onDisconnect: ListenerEvent<DisconnectListener>;
  postMessage(message: unknown): void;
  disconnect?(): void;
}

export interface FrameCatalogRuntime {
  connect(options: { readonly name: string }): FrameCatalogPort;
}

export class FrameTriggerCatalogClient {
  private port: FrameCatalogPort | undefined;
  private messageListener: MessageListener | undefined;
  private disconnectListener: DisconnectListener | undefined;

  constructor(
    private readonly runtime: FrameCatalogRuntime,
    readonly cache = new FrameTriggerCatalogCache(),
  ) {}

  get isConnected(): boolean {
    return this.port !== undefined;
  }

  connect(): boolean {
    if (this.port !== undefined) return true;

    let port: FrameCatalogPort;
    try {
      port = this.runtime.connect({ name: TRIGGER_CATALOG_PORT_NAME });
    } catch {
      this.cache.disconnect();
      return false;
    }

    const messageListener: MessageListener = (message) => {
      this.cache.receive(message);
    };
    const disconnectListener: DisconnectListener = () => {
      this.detach(port);
      this.cache.disconnect();
    };
    this.port = port;
    this.messageListener = messageListener;
    this.disconnectListener = disconnectListener;
    this.cache.markConnected();
    port.onMessage.addListener(messageListener);
    port.onDisconnect.addListener(disconnectListener);

    try {
      port.postMessage({ type: 'trigger-catalog-request-snapshot' });
    } catch {
      this.detach(port);
      this.cache.disconnect();
      return false;
    }
    return true;
  }

  disconnect(): void {
    const port = this.port;
    if (port !== undefined) {
      this.detach(port);
      try {
        port.disconnect?.();
      } catch {
        // The cache is cleared regardless of runtime disconnect behavior.
      }
    }
    this.cache.disconnect();
  }

  private detach(port: FrameCatalogPort): void {
    if (this.port !== port) return;
    if (this.messageListener !== undefined) {
      port.onMessage.removeListener(this.messageListener);
    }
    if (this.disconnectListener !== undefined) {
      port.onDisconnect.removeListener(this.disconnectListener);
    }
    this.port = undefined;
    this.messageListener = undefined;
    this.disconnectListener = undefined;
  }
}
