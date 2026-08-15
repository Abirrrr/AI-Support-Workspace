import type { TriggerCatalogReader } from '../../application/snippet/trigger-catalog';
import {
  TRIGGER_CATALOG_PORT_NAME,
  isTriggerCatalogMutationBeginMessage,
  isTriggerCatalogMutationFinishMessage,
  isTriggerCatalogSnapshotMessage,
  isTriggerCatalogSnapshotRequest,
  type TriggerCatalogInvalidateMessage,
  type TriggerCatalogMutationBeginResponse,
  type TriggerCatalogMutationFinishResponse,
  type TriggerCatalogSnapshotMessage,
} from '../../shared/trigger-catalog-messages';

interface ListenerEvent<Listener extends (...args: never[]) => unknown> {
  addListener(listener: Listener): void;
  removeListener(listener: Listener): void;
}

type PortMessageListener = (message: unknown) => void;
type PortDisconnectListener = () => void;

export interface TriggerCatalogRuntimePort {
  readonly name: string;
  readonly onMessage: ListenerEvent<PortMessageListener>;
  readonly onDisconnect: ListenerEvent<PortDisconnectListener>;
  postMessage(message: unknown): void;
  disconnect(): void;
}

type RuntimeConnectListener = (port: TriggerCatalogRuntimePort) => void;
type RuntimeMessageListener = (message: unknown) => unknown;

export interface TriggerCatalogCoordinatorRuntime {
  readonly onConnect: ListenerEvent<RuntimeConnectListener>;
  readonly onMessage: ListenerEvent<RuntimeMessageListener>;
}

interface ConnectedFrame {
  readonly port: TriggerCatalogRuntimePort;
  readonly messageListener: PortMessageListener;
  readonly disconnectListener: PortDisconnectListener;
}

export class TriggerCatalogCoordinator {
  readonly epoch: string;
  private revision = 0;
  private readonly frames = new Map<
    TriggerCatalogRuntimePort,
    ConnectedFrame
  >();
  private readonly mutations = new Set<string>();
  private operationChain: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly catalogReader: TriggerCatalogReader,
    createId: () => string = () => crypto.randomUUID(),
  ) {
    this.epoch = createId();
  }

  get connectedFrameCount(): number {
    return this.frames.size;
  }

  isCurrentSnapshot(epoch: string, revision: number): boolean {
    return (
      this.mutations.size === 0 &&
      epoch === this.epoch &&
      revision === this.revision
    );
  }

  connect(port: TriggerCatalogRuntimePort): void {
    if (port.name !== TRIGGER_CATALOG_PORT_NAME || this.frames.has(port))
      return;

    const messageListener: PortMessageListener = (message) => {
      if (isTriggerCatalogSnapshotRequest(message)) {
        void this.enqueue(() => this.publishSnapshotTo(port));
        return;
      }
      this.invalidatePort(port);
    };
    const disconnectListener: PortDisconnectListener = () => {
      this.disconnect(port);
    };
    const frame = { port, messageListener, disconnectListener };
    this.frames.set(port, frame);
    port.onMessage.addListener(messageListener);
    port.onDisconnect.addListener(disconnectListener);
  }

  disconnect(port: TriggerCatalogRuntimePort): void {
    const frame = this.frames.get(port);
    if (frame === undefined) return;
    port.onMessage.removeListener(frame.messageListener);
    port.onDisconnect.removeListener(frame.disconnectListener);
    this.frames.delete(port);
  }

  async beginMutation(createId: () => string = () => crypto.randomUUID()) {
    const mutationId = createId();
    this.mutations.add(mutationId);
    this.revision += 1;
    const message: TriggerCatalogInvalidateMessage = {
      type: 'trigger-catalog-invalidate',
      epoch: this.epoch,
      revision: this.revision,
    };
    this.postToAll(message);
    return mutationId;
  }

  async finishMutation(mutationId: string): Promise<boolean> {
    if (!this.mutations.delete(mutationId)) return false;
    if (this.mutations.size > 0) return false;
    const entries = await this.catalogReader.readCatalog();
    this.revision += 1;
    const message: TriggerCatalogSnapshotMessage = {
      type: 'trigger-catalog-snapshot',
      epoch: this.epoch,
      revision: this.revision,
      entries,
    };
    if (!isTriggerCatalogSnapshotMessage(message)) return false;
    return this.postToAll(message);
  }

  private async publishSnapshotTo(
    port: TriggerCatalogRuntimePort,
  ): Promise<boolean> {
    if (!this.frames.has(port) || this.mutations.size > 0) return false;
    const entries = await this.catalogReader.readCatalog();
    const message: TriggerCatalogSnapshotMessage = {
      type: 'trigger-catalog-snapshot',
      epoch: this.epoch,
      revision: this.revision,
      entries,
    };
    if (!isTriggerCatalogSnapshotMessage(message)) {
      this.invalidatePort(port);
      return false;
    }
    try {
      port.postMessage(message);
      return true;
    } catch {
      this.disablePort(port);
      return false;
    }
  }

  private invalidatePort(port: TriggerCatalogRuntimePort): void {
    try {
      port.postMessage({
        type: 'trigger-catalog-invalidate',
        epoch: this.epoch,
        revision: this.revision,
      } satisfies TriggerCatalogInvalidateMessage);
    } catch {
      this.disablePort(port);
    }
  }

  private postToAll(message: unknown): boolean {
    let published = true;
    for (const { port } of this.frames.values()) {
      try {
        port.postMessage(message);
      } catch {
        published = false;
        this.disablePort(port);
      }
    }
    return published;
  }

  private disablePort(port: TriggerCatalogRuntimePort): void {
    try {
      port.disconnect();
    } catch {
      // Local cleanup still removes a failed port from the coordinator.
    }
    this.disconnect(port);
  }

  private enqueue<Result>(operation: () => Promise<Result>): Promise<Result> {
    const result = this.operationChain.then(operation, operation);
    this.operationChain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  handleRuntimeMessage(message: unknown): Promise<unknown> | undefined {
    if (isTriggerCatalogMutationBeginMessage(message)) {
      return this.enqueue(async () => {
        const mutationId = await this.beginMutation();
        return {
          type: 'trigger-catalog-mutation-begun',
          mutationId,
        } satisfies TriggerCatalogMutationBeginResponse;
      });
    }
    if (isTriggerCatalogMutationFinishMessage(message)) {
      return this.enqueue(
        async () =>
          ({
            type: 'trigger-catalog-mutation-finished',
            published: await this.finishMutation(message.mutationId),
          }) satisfies TriggerCatalogMutationFinishResponse,
      );
    }
    return undefined;
  }
}

export function registerTriggerCatalogCoordinator(
  runtime: TriggerCatalogCoordinatorRuntime,
  coordinator: TriggerCatalogCoordinator,
): () => void {
  const connectListener: RuntimeConnectListener = (port) => {
    coordinator.connect(port);
  };
  const messageListener: RuntimeMessageListener = (message) =>
    coordinator.handleRuntimeMessage(message);
  runtime.onConnect.addListener(connectListener);
  runtime.onMessage.addListener(messageListener);
  return () => {
    runtime.onConnect.removeListener(connectListener);
    runtime.onMessage.removeListener(messageListener);
  };
}
