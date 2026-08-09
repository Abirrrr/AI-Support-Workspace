import { describe, expect, it, vi } from 'vitest';

import {
  CatalogUnavailableAfterMutationError,
  runCatalogCoordinatedMutation,
  type CatalogMutationPort,
} from '../../src/application/snippet/catalog-mutation';
import { TriggerCatalogService } from '../../src/application/snippet/trigger-catalog';
import type { SnippetEntryRepository } from '../../src/application/persistence/snippet-entry-repository';
import { FrameTriggerCatalogCache } from '../../src/extension/snippet-trigger/frame-catalog-cache';
import { FrameTriggerCatalogClient } from '../../src/extension/snippet-trigger/frame-catalog-client';
import type { SnippetEntry } from '../../src/domain/snippet-entry';
import { createPlainSnippetContent } from '../../src/domain/snippet-content';
import { TRIGGER_CATALOG_PORT_NAME } from '../../src/shared/trigger-catalog-messages';

const entry: SnippetEntry = {
  id: 'snippet-1',
  title: 'Private title',
  content: createPlainSnippetContent('Plain text content'),
  tags: ['private-tag'],
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
  trigger: ';hello',
};

function repositoryFor(
  entries: readonly SnippetEntry[],
): SnippetEntryRepository {
  return {
    create: vi.fn(),
    get: vi.fn(),
    list: vi.fn(async () => entries),
    findByTrigger: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

class EventHub<Listener extends (...args: never[]) => void> {
  readonly listeners = new Set<Listener>();

  addListener = (listener: Listener) => this.listeners.add(listener);
  removeListener = (listener: Listener) => this.listeners.delete(listener);
}

describe('trigger catalog application and frame cache', () => {
  it('derives only trigger, Snippet ID, and plain-text content', async () => {
    const triggerless = { ...entry, id: 'snippet-2', trigger: null };
    const catalog = await new TriggerCatalogService(
      repositoryFor([entry, triggerless]),
    ).readCatalog();

    expect(catalog).toEqual([
      {
        trigger: ';hello',
        snippetId: 'snippet-1',
        content: 'Plain text content',
      },
    ]);
    expect(JSON.stringify(catalog)).not.toContain('Private title');
    expect(JSON.stringify(catalog)).not.toContain('private-tag');
    expect(JSON.stringify(catalog)).not.toContain('createdAt');
  });

  it('publishes only the deterministic projection for rich content', async () => {
    const rich: SnippetEntry = {
      ...entry,
      content: {
        kind: 'rich',
        blocks: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Open ', bold: true, italic: false },
              {
                type: 'link',
                text: 'the guide',
                url: 'https://example.com/guide',
                bold: false,
                italic: true,
              },
            ],
          },
          {
            type: 'reference',
            referenceType: 'image',
            label: 'Example',
            url: 'https://example.com/image.png',
          },
        ],
      },
    };

    await expect(
      new TriggerCatalogService(repositoryFor([rich])).readCatalog(),
    ).resolves.toEqual([
      {
        trigger: ';hello',
        snippetId: 'snippet-1',
        content:
          'Open the guide (https://example.com/guide)\n\n' +
          '[Image: Example] https://example.com/image.png',
      },
    ]);
  });

  it('omits only local-image Snippets until the Delivery Planner exists', async () => {
    const localImage: SnippetEntry = {
      ...entry,
      id: 'snippet-local-image',
      trigger: ';local',
      content: {
        kind: 'rich',
        blocks: [
          {
            type: 'image',
            assetId: '123e4567-e89b-42d3-a456-426614174000',
            altText: 'Secret receipt',
          },
        ],
      },
    };
    const richTextOnly: SnippetEntry = {
      ...entry,
      id: 'snippet-rich-text',
      trigger: ';richtext',
      content: {
        kind: 'rich',
        blocks: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Still published',
                bold: true,
                italic: false,
              },
            ],
          },
        ],
      },
    };
    const catalog = await new TriggerCatalogService(
      repositoryFor([entry, localImage, richTextOnly]),
    ).readCatalog();

    expect(catalog.map(({ trigger }) => trigger)).toEqual([
      ';hello',
      ';richtext',
    ]);
    expect(JSON.stringify(catalog)).not.toContain('123e4567');
    expect(JSON.stringify(catalog)).not.toContain('Secret receipt');
    expect(JSON.stringify(catalog)).not.toContain('[Image]');
  });

  it('enables only a complete snapshot and clears on invalidate or disconnect', () => {
    const cache = new FrameTriggerCatalogCache();
    const snapshot = {
      type: 'trigger-catalog-snapshot',
      epoch: 'epoch-1',
      revision: 1,
      entries: [{ trigger: ';hello', snippetId: 'snippet-1', content: 'Hi' }],
    } as const;

    cache.receive(snapshot);
    expect(cache.isEnabled).toBe(false);
    cache.markConnected();
    cache.receive(snapshot);
    expect(cache.find(';hello')?.content).toBe('Hi');

    cache.receive({
      type: 'trigger-catalog-invalidate',
      epoch: 'epoch-1',
      revision: 2,
    });
    expect(cache.isEnabled).toBe(false);
    expect(cache.find(';hello')).toBeUndefined();

    cache.receive({ ...snapshot, revision: 3 });
    cache.disconnect();
    expect(cache.isEnabled).toBe(false);
    expect(cache.find(';hello')).toBeUndefined();
  });

  it('rejects malformed, duplicate, regressed, and old-epoch snapshots', () => {
    const cache = new FrameTriggerCatalogCache();
    cache.markConnected();
    cache.receive({
      type: 'trigger-catalog-snapshot',
      epoch: 'epoch-new',
      revision: 5,
      entries: [{ trigger: ';hello', snippetId: 'one', content: 'Current' }],
    });
    expect(cache.isEnabled).toBe(true);

    cache.receive({
      type: 'trigger-catalog-snapshot',
      epoch: 'epoch-new',
      revision: 4,
      entries: [],
    });
    expect(cache.isEnabled).toBe(false);
    cache.receive({
      type: 'trigger-catalog-snapshot',
      epoch: 'epoch-old',
      revision: 99,
      entries: [{ trigger: ';stale', snippetId: 'old', content: 'Old' }],
    });
    expect(cache.find(';stale')).toBeUndefined();
    cache.receive({
      type: 'trigger-catalog-snapshot',
      epoch: 'epoch-new',
      revision: 6,
      entries: [
        { trigger: ';same', snippetId: 'one', content: 'One' },
        { trigger: ';same', snippetId: 'two', content: 'Two' },
      ],
    });
    expect(cache.isEnabled).toBe(false);
  });

  it('uses one port, requests a complete snapshot, and clears on disconnect', () => {
    const messages = new EventHub<(message: unknown) => void>();
    const disconnects = new EventHub<() => void>();
    const postMessage = vi.fn();
    const runtime = {
      connect: vi.fn(() => ({
        onMessage: messages,
        onDisconnect: disconnects,
        postMessage,
      })),
    };
    const client = new FrameTriggerCatalogClient(runtime);

    client.connect();
    client.connect();
    expect(runtime.connect).toHaveBeenCalledOnce();
    expect(runtime.connect).toHaveBeenCalledWith({
      name: TRIGGER_CATALOG_PORT_NAME,
    });
    expect(postMessage).toHaveBeenCalledWith({
      type: 'trigger-catalog-request-snapshot',
    });
    for (const listener of messages.listeners) {
      listener({
        type: 'trigger-catalog-snapshot',
        epoch: 'epoch-1',
        revision: 0,
        entries: [
          { trigger: ';hello', snippetId: 'snippet-1', content: 'Hello' },
        ],
      });
    }
    expect(client.cache.isEnabled).toBe(true);
    for (const listener of disconnects.listeners) listener();
    expect(client.isConnected).toBe(false);
    expect(client.cache.isEnabled).toBe(false);
    client.connect();
    expect(runtime.connect).toHaveBeenCalledTimes(2);
    expect(postMessage).toHaveBeenCalledTimes(2);
    expect(client.cache.isEnabled).toBe(false);
  });
});

describe('catalog mutation coordination', () => {
  it('invalidates before persistence and publishes after success', async () => {
    const order: string[] = [];
    const port: CatalogMutationPort = {
      invalidateBeforeMutation: vi.fn(async () => {
        order.push('invalidate');
        return 'mutation-1';
      }),
      publishAfterMutation: vi.fn(async (_id, outcome) => {
        order.push(`publish-${outcome}`);
        return true;
      }),
    };

    await expect(
      runCatalogCoordinatedMutation(port, async () => {
        order.push('persist');
        return 'persisted';
      }),
    ).resolves.toBe('persisted');
    expect(order).toEqual(['invalidate', 'persist', 'publish-succeeded']);
  });

  it('republishes after failure and reports post-write publication accurately', async () => {
    const failedPort: CatalogMutationPort = {
      invalidateBeforeMutation: async () => 'mutation-1',
      publishAfterMutation: vi.fn(async () => true),
    };
    const persistenceFailure = new Error('persistence failed');
    await expect(
      runCatalogCoordinatedMutation(failedPort, async () => {
        throw persistenceFailure;
      }),
    ).rejects.toBe(persistenceFailure);
    expect(failedPort.publishAfterMutation).toHaveBeenCalledWith(
      'mutation-1',
      'failed',
    );

    const unavailablePort: CatalogMutationPort = {
      invalidateBeforeMutation: async () => 'mutation-2',
      publishAfterMutation: async () => false,
    };
    const result = { id: 'persisted' };
    await expect(
      runCatalogCoordinatedMutation(unavailablePort, async () => result),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'CatalogUnavailableAfterMutationError',
        persistedResult: result,
      }),
    );
    await expect(
      runCatalogCoordinatedMutation(unavailablePort, async () => result),
    ).rejects.toBeInstanceOf(CatalogUnavailableAfterMutationError);
  });
});
