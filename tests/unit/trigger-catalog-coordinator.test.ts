import { describe, expect, it, vi } from 'vitest';

import type { TriggerCatalogReader } from '../../src/application/snippet/trigger-catalog';
import {
  TriggerCatalogCoordinator,
  registerTriggerCatalogCoordinator,
  type TriggerCatalogCoordinatorRuntime,
  type TriggerCatalogRuntimePort,
} from '../../src/extension/snippet-trigger/catalog-coordinator';
import { FrameTriggerCatalogCache } from '../../src/extension/snippet-trigger/frame-catalog-cache';
import { TRIGGER_CATALOG_PORT_NAME } from '../../src/shared/trigger-catalog-messages';

class EventHub<Listener> {
  readonly listeners = new Set<Listener>();

  addListener = (listener: Listener) => this.listeners.add(listener);
  removeListener = (listener: Listener) => this.listeners.delete(listener);
}

interface FakePort extends TriggerCatalogRuntimePort {
  readonly messages: unknown[];
  readonly messageHub: EventHub<(message: unknown) => void>;
  readonly disconnectHub: EventHub<() => void>;
}

function createPort(onPost?: (message: unknown) => void): FakePort {
  const messageHub = new EventHub<(message: unknown) => void>();
  const disconnectHub = new EventHub<() => void>();
  const messages: unknown[] = [];
  return {
    name: TRIGGER_CATALOG_PORT_NAME,
    messages,
    messageHub,
    disconnectHub,
    onMessage: messageHub,
    onDisconnect: disconnectHub,
    disconnect() {
      for (const listener of disconnectHub.listeners) listener();
    },
    postMessage(message) {
      messages.push(message);
      onPost?.(message);
    },
  };
}

function emitMessage(port: FakePort, message: unknown) {
  for (const listener of port.messageHub.listeners) listener(message);
}

async function flushCoordinatorQueue() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function catalogReader(content = 'Current content'): TriggerCatalogReader {
  void content;
  return {
    readCatalog: vi.fn(async () => [
      { kind: 'text' as const, trigger: ';hello', snippetId: 'snippet-1' },
    ]),
  };
}

describe('service-worker trigger catalog coordinator', () => {
  it('publishes an initial complete snapshot over a matched frame port', async () => {
    const reader = catalogReader();
    const coordinator = new TriggerCatalogCoordinator(reader, () => 'epoch-1');
    const port = createPort();
    coordinator.connect(port);

    emitMessage(port, { type: 'trigger-catalog-request-snapshot' });

    await vi.waitFor(() => expect(port.messages).toHaveLength(1));
    expect(port.messages[0]).toEqual({
      type: 'trigger-catalog-snapshot',
      epoch: 'epoch-1',
      revision: 0,
      entries: [
        {
          trigger: ';hello',
          snippetId: 'snippet-1',
          kind: 'text',
        },
      ],
    });
  });

  it('orders invalidation before persistence refresh and removes disconnected frames', async () => {
    const reader = catalogReader('Refreshed content');
    const coordinator = new TriggerCatalogCoordinator(reader, () => 'epoch-1');
    const cache = new FrameTriggerCatalogCache();
    cache.markConnected();
    const port = createPort((message) => cache.receive(message));
    coordinator.connect(port);
    emitMessage(port, { type: 'trigger-catalog-request-snapshot' });
    await vi.waitFor(() => expect(cache.isEnabled).toBe(true));

    const mutationId = await coordinator.beginMutation(() => 'mutation-1');
    expect(cache.isEnabled).toBe(false);
    expect(port.messages.at(-1)).toMatchObject({
      type: 'trigger-catalog-invalidate',
      revision: 1,
    });
    await expect(coordinator.finishMutation(mutationId)).resolves.toBe(true);
    expect(cache.find(';hello')?.kind).toBe('text');
    expect(port.messages.at(-1)).toMatchObject({
      type: 'trigger-catalog-snapshot',
      revision: 2,
    });

    for (const listener of port.disconnectHub.listeners) listener();
    cache.disconnect();
    expect(coordinator.connectedFrameCount).toBe(0);
    expect(cache.isEnabled).toBe(false);
  });

  it('keeps an enabled frame disabled when it requests a snapshot during a mutation', async () => {
    const readCatalog = vi
      .fn<TriggerCatalogReader['readCatalog']>()
      .mockResolvedValueOnce([
        { kind: 'text', trigger: ';hello', snippetId: 'snippet-1' },
      ])
      .mockResolvedValueOnce([
        {
          trigger: ';hello',
          snippetId: 'snippet-1',
          kind: 'text',
        },
      ]);
    const coordinator = new TriggerCatalogCoordinator(
      { readCatalog },
      () => 'epoch-1',
    );
    const cache = new FrameTriggerCatalogCache();
    cache.markConnected();
    const port = createPort((message) => cache.receive(message));
    coordinator.connect(port);
    emitMessage(port, { type: 'trigger-catalog-request-snapshot' });
    await vi.waitFor(() => expect(cache.isEnabled).toBe(true));

    const mutationId = await coordinator.beginMutation(() => 'mutation-1');
    expect(cache.isEnabled).toBe(false);
    emitMessage(port, { type: 'trigger-catalog-request-snapshot' });
    await flushCoordinatorQueue();

    expect(readCatalog).toHaveBeenCalledTimes(1);
    expect(port.messages.slice(1)).toEqual([
      {
        type: 'trigger-catalog-invalidate',
        epoch: 'epoch-1',
        revision: 1,
      },
    ]);
    expect(cache.isEnabled).toBe(false);

    await expect(coordinator.finishMutation(mutationId)).resolves.toBe(true);
    expect(readCatalog).toHaveBeenCalledTimes(2);
    expect(
      port.messages
        .slice(1)
        .filter(
          (message) =>
            (message as { type?: string }).type === 'trigger-catalog-snapshot',
        ),
    ).toHaveLength(1);
    expect(cache.find(';hello')?.kind).toBe('text');
  });

  it('keeps a frame connected during a mutation disabled until the final snapshot', async () => {
    const reader = catalogReader('Authoritative content');
    const coordinator = new TriggerCatalogCoordinator(reader, () => 'epoch-1');
    const mutationId = await coordinator.beginMutation(() => 'mutation-1');
    const cache = new FrameTriggerCatalogCache();
    cache.markConnected();
    const port = createPort((message) => cache.receive(message));
    coordinator.connect(port);

    emitMessage(port, { type: 'trigger-catalog-request-snapshot' });
    await flushCoordinatorQueue();
    expect(reader.readCatalog).not.toHaveBeenCalled();
    expect(port.messages).toEqual([]);
    expect(cache.isEnabled).toBe(false);
    expect(coordinator.connectedFrameCount).toBe(1);

    await expect(coordinator.finishMutation(mutationId)).resolves.toBe(true);
    expect(reader.readCatalog).toHaveBeenCalledOnce();
    expect(port.messages).toHaveLength(1);
    expect(cache.find(';hello')?.kind).toBe('text');
  });

  it.each([
    ['mutation-a', 'mutation-b'],
    ['mutation-b', 'mutation-a'],
  ])(
    'releases an overlapping mutation barrier only after finishing %s then %s',
    async (firstFinished, finalFinished) => {
      const reader = catalogReader('Authoritative content');
      const coordinator = new TriggerCatalogCoordinator(
        reader,
        () => 'epoch-1',
      );
      const cache = new FrameTriggerCatalogCache();
      cache.markConnected();
      const port = createPort((message) => cache.receive(message));
      coordinator.connect(port);

      const mutationA = await coordinator.beginMutation(() => 'mutation-a');
      const mutationB = await coordinator.beginMutation(() => 'mutation-b');
      expect([mutationA, mutationB]).toEqual(['mutation-a', 'mutation-b']);
      expect(
        port.messages.map((message) => (message as { type: string }).type),
      ).toEqual(['trigger-catalog-invalidate', 'trigger-catalog-invalidate']);
      expect(cache.isEnabled).toBe(false);

      await expect(coordinator.finishMutation(firstFinished)).resolves.toBe(
        false,
      );
      expect(reader.readCatalog).not.toHaveBeenCalled();
      expect(cache.isEnabled).toBe(false);
      expect(
        port.messages.filter(
          (message) =>
            (message as { type: string }).type === 'trigger-catalog-snapshot',
        ),
      ).toHaveLength(0);

      await expect(coordinator.finishMutation(finalFinished)).resolves.toBe(
        true,
      );
      expect(reader.readCatalog).toHaveBeenCalledOnce();
      const snapshots = port.messages.filter(
        (message) =>
          (message as { type: string }).type === 'trigger-catalog-snapshot',
      );
      expect(snapshots).toEqual([
        {
          type: 'trigger-catalog-snapshot',
          epoch: 'epoch-1',
          revision: 3,
          entries: [
            {
              trigger: ';hello',
              snippetId: 'snippet-1',
              kind: 'text',
            },
          ],
        },
      ]);
      expect(cache.find(';hello')?.kind).toBe('text');
    },
  );

  it('ignores unknown and already-finished mutation IDs without releasing or revising the barrier', async () => {
    const reader = catalogReader('Authoritative content');
    const coordinator = new TriggerCatalogCoordinator(reader, () => 'epoch-1');
    const port = createPort();
    coordinator.connect(port);

    const mutationId = await coordinator.beginMutation(() => 'mutation-1');
    await expect(coordinator.finishMutation('unknown')).resolves.toBe(false);
    expect(reader.readCatalog).not.toHaveBeenCalled();
    expect(port.messages).toHaveLength(1);

    emitMessage(port, { type: 'trigger-catalog-request-snapshot' });
    await flushCoordinatorQueue();
    expect(reader.readCatalog).not.toHaveBeenCalled();
    expect(port.messages).toHaveLength(1);

    await expect(coordinator.finishMutation(mutationId)).resolves.toBe(true);
    expect(reader.readCatalog).toHaveBeenCalledOnce();
    expect(port.messages.at(-1)).toMatchObject({
      type: 'trigger-catalog-snapshot',
      revision: 2,
    });

    await expect(coordinator.finishMutation(mutationId)).resolves.toBe(false);
    expect(reader.readCatalog).toHaveBeenCalledOnce();
    expect(port.messages).toHaveLength(2);

    const nextMutationId = await coordinator.beginMutation(() => 'mutation-2');
    await expect(coordinator.finishMutation(mutationId)).resolves.toBe(false);
    emitMessage(port, { type: 'trigger-catalog-request-snapshot' });
    await flushCoordinatorQueue();
    expect(reader.readCatalog).toHaveBeenCalledOnce();
    expect(port.messages).toHaveLength(3);

    await expect(coordinator.finishMutation(nextMutationId)).resolves.toBe(
      true,
    );
    expect(reader.readCatalog).toHaveBeenCalledTimes(2);
    expect(port.messages.at(-1)).toMatchObject({
      type: 'trigger-catalog-snapshot',
      revision: 4,
    });
  });

  it('rebuilds the authoritative snapshot for failed persistence', async () => {
    const reader = catalogReader('Unchanged content');
    const coordinator = new TriggerCatalogCoordinator(reader, () => 'epoch-1');
    const port = createPort();
    coordinator.connect(port);

    const begin = await coordinator.handleRuntimeMessage({
      type: 'trigger-catalog-mutation-begin',
    });
    expect(begin).toMatchObject({ type: 'trigger-catalog-mutation-begun' });
    const mutationId = (begin as { mutationId: string }).mutationId;
    const finish = await coordinator.handleRuntimeMessage({
      type: 'trigger-catalog-mutation-finish',
      mutationId,
      outcome: 'failed',
    });

    expect(finish).toEqual({
      type: 'trigger-catalog-mutation-finished',
      published: true,
    });
    expect(
      port.messages.map((message) => (message as { type: string }).type),
    ).toEqual(['trigger-catalog-invalidate', 'trigger-catalog-snapshot']);
  });

  it('leaves an invalidated frame disabled when snapshot publication fails', async () => {
    const cache = new FrameTriggerCatalogCache();
    cache.markConnected();
    cache.receive({
      type: 'trigger-catalog-snapshot',
      epoch: 'epoch-1',
      revision: 0,
      entries: [{ kind: 'text', trigger: ';old', snippetId: 'old' }],
    });
    const port = createPort((message) => {
      if ((message as { type?: string }).type === 'trigger-catalog-snapshot') {
        throw new Error('port unavailable');
      }
      cache.receive(message);
    });
    const coordinator = new TriggerCatalogCoordinator(
      catalogReader('New'),
      () => 'epoch-1',
    );
    coordinator.connect(port);

    const mutationId = await coordinator.beginMutation(() => 'mutation-1');
    expect(cache.isEnabled).toBe(false);
    await expect(coordinator.finishMutation(mutationId)).resolves.toBe(false);
    expect(cache.isEnabled).toBe(false);
    expect(cache.find(';old')).toBeUndefined();
  });

  it('leaves frames disabled when the final authoritative catalog read fails', async () => {
    const reader: TriggerCatalogReader = {
      readCatalog: vi.fn(async () => {
        throw new Error('catalog unavailable');
      }),
    };
    const cache = new FrameTriggerCatalogCache();
    cache.markConnected();
    cache.receive({
      type: 'trigger-catalog-snapshot',
      epoch: 'epoch-1',
      revision: 0,
      entries: [{ kind: 'text', trigger: ';old', snippetId: 'old' }],
    });
    const port = createPort((message) => cache.receive(message));
    const coordinator = new TriggerCatalogCoordinator(reader, () => 'epoch-1');
    coordinator.connect(port);

    const mutationId = await coordinator.beginMutation(() => 'mutation-1');
    await expect(coordinator.finishMutation(mutationId)).rejects.toThrow(
      'catalog unavailable',
    );
    expect(cache.isEnabled).toBe(false);
    expect(cache.find(';old')).toBeUndefined();
    expect(
      port.messages.map((message) => (message as { type: string }).type),
    ).toEqual(['trigger-catalog-invalidate']);
  });

  it('creates a new epoch after worker restart and registers without replacing runtime listeners', () => {
    const first = new TriggerCatalogCoordinator(
      catalogReader(),
      () => 'epoch-1',
    );
    const second = new TriggerCatalogCoordinator(
      catalogReader(),
      () => 'epoch-2',
    );
    expect(second.epoch).not.toBe(first.epoch);

    const connectHub = new EventHub<
      (port: TriggerCatalogRuntimePort) => void
    >();
    const messageHub = new EventHub<(message: unknown) => unknown>();
    const runtime: TriggerCatalogCoordinatorRuntime = {
      onConnect: connectHub,
      onMessage: messageHub,
    };
    const unregister = registerTriggerCatalogCoordinator(runtime, second);
    expect(connectHub.listeners.size).toBe(1);
    expect(messageHub.listeners.size).toBe(1);
    unregister();
    expect(connectHub.listeners.size).toBe(0);
    expect(messageHub.listeners.size).toBe(0);
  });
});
