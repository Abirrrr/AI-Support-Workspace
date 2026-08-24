import { describe, expect, it, vi } from 'vitest';

import type { SnippetEntryRepository } from '../../src/application/persistence/snippet-entry-repository';
import {
  CatalogUnavailableAfterMutationError,
  runCatalogCoordinatedMutation,
  type CatalogMutationPort,
} from '../../src/application/snippet/catalog-mutation';
import { TriggerCatalogService } from '../../src/application/snippet/trigger-catalog';
import type { SnippetEntry } from '../../src/domain/snippet-entry';
import { FrameTriggerCatalogCache } from '../../src/extension/snippet-trigger/frame-catalog-cache';
import { FrameTriggerCatalogClient } from '../../src/extension/snippet-trigger/frame-catalog-client';
import { TRIGGER_CATALOG_PORT_NAME } from '../../src/shared/trigger-catalog-messages';

const base: SnippetEntry = {
  id: 'snippet-1',
  title: 'Private title',
  content: { kind: 'plain', text: 'Private text' },
  tags: ['private-tag'],
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
  trigger: ';plain',
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

describe('typed trigger catalog privacy boundary', () => {
  it('publishes only activation metadata, including single-line eligibility', async () => {
    const rich: SnippetEntry = {
      ...base,
      id: 'snippet-2',
      trigger: ';rich',
      content: {
        kind: 'rich',
        blocks: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'Secret rich text',
                bold: true,
                italic: false,
              },
            ],
          },
          {
            type: 'reference',
            referenceType: 'image',
            label: 'Legacy URL reference',
            url: 'https://example.com/image.png',
          },
        ],
      },
    };
    const image: SnippetEntry = {
      ...base,
      id: 'snippet-3',
      title: 'private.png',
      trigger: ';image',
      content: {
        kind: 'image',
        assetId: '123e4567-e89b-42d3-a456-426614174000',
      },
    };
    const catalog = await new TriggerCatalogService(
      repositoryFor([base, rich, image]),
    ).readCatalog();
    expect(catalog).toEqual([
      {
        kind: 'text',
        trigger: ';plain',
        snippetId: 'snippet-1',
        singleLineEligible: true,
      },
      {
        kind: 'text',
        trigger: ';rich',
        snippetId: 'snippet-2',
        singleLineEligible: false,
      },
      {
        kind: 'image',
        trigger: ';image',
        snippetId: 'snippet-3',
        singleLineEligible: true,
      },
    ]);
    const serialized = JSON.stringify(catalog);
    for (const secret of [
      'Private text',
      'Secret rich text',
      'Private title',
      'private-tag',
      '123e4567',
      'private.png',
      'image/png',
      'Blob',
      'base64',
      '<p>',
    ]) {
      expect(serialized).not.toContain(secret);
    }
  });

  it('omits triggerless and Decision 38 legacy local-image Rich records', async () => {
    const triggerless = { ...base, id: 'triggerless', trigger: null };
    const legacyLocalImage: SnippetEntry = {
      ...base,
      id: 'legacy',
      trigger: ';legacy',
      content: {
        kind: 'rich',
        blocks: [
          {
            type: 'image',
            assetId: '123e4567-e89b-42d3-a456-426614174000',
            altText: 'preserved',
          },
        ],
      },
    };
    await expect(
      new TriggerCatalogService(
        repositoryFor([triggerless, legacyLocalImage]),
      ).readCatalog(),
    ).resolves.toEqual([]);
  });

  it('validates complete typed snapshots and rejects content-bearing entries', () => {
    const cache = new FrameTriggerCatalogCache();
    cache.markConnected();
    cache.receive({
      type: 'trigger-catalog-snapshot',
      epoch: 'epoch-1',
      revision: 1,
      entries: [{ kind: 'image', trigger: ';image', snippetId: 'snippet-3' }],
    });
    expect(cache.find(';image')).toEqual({
      kind: 'image',
      trigger: ';image',
      snippetId: 'snippet-3',
    });
    expect(cache.identity).toEqual({ epoch: 'epoch-1', revision: 1 });
    cache.receive({
      type: 'trigger-catalog-snapshot',
      epoch: 'epoch-1',
      revision: 2,
      entries: [
        {
          kind: 'text',
          trigger: ';plain',
          snippetId: 'snippet-1',
          content: 'leak',
        },
      ],
    });
    expect(cache.isEnabled).toBe(false);
  });

  it('keeps one long-lived port and clears metadata on disconnect', () => {
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
    for (const listener of messages.listeners) {
      listener({
        type: 'trigger-catalog-snapshot',
        epoch: 'epoch-1',
        revision: 0,
        entries: [{ kind: 'text', trigger: ';plain', snippetId: 'snippet-1' }],
      });
    }
    expect(client.cache.find(';plain')?.kind).toBe('text');
    for (const listener of disconnects.listeners) listener();
    expect(client.cache.isEnabled).toBe(false);
  });

  it('reconnects once after worker disconnect and adopts the new epoch snapshot', () => {
    const firstMessages = new EventHub<(message: unknown) => void>();
    const firstDisconnects = new EventHub<() => void>();
    const secondMessages = new EventHub<(message: unknown) => void>();
    const secondDisconnects = new EventHub<() => void>();
    const firstPost = vi.fn();
    const secondPost = vi.fn();
    const runtime = {
      connect: vi
        .fn()
        .mockReturnValueOnce({
          onMessage: firstMessages,
          onDisconnect: firstDisconnects,
          postMessage: firstPost,
        })
        .mockReturnValueOnce({
          onMessage: secondMessages,
          onDisconnect: secondDisconnects,
          postMessage: secondPost,
        }),
    };
    const client = new FrameTriggerCatalogClient(runtime);
    expect(client.connect()).toBe(true);
    for (const listener of firstMessages.listeners) {
      listener({
        type: 'trigger-catalog-snapshot',
        epoch: 'epoch-1',
        revision: 4,
        entries: [{ kind: 'text', trigger: ';old', snippetId: 'old' }],
      });
    }
    for (const listener of firstDisconnects.listeners) listener();
    expect(client.cache.isEnabled).toBe(false);

    expect(client.connect()).toBe(true);
    expect(client.connect()).toBe(true);
    expect(runtime.connect).toHaveBeenCalledTimes(2);
    expect(secondPost).toHaveBeenCalledOnce();
    for (const listener of secondMessages.listeners) {
      listener({
        type: 'trigger-catalog-snapshot',
        epoch: 'epoch-2',
        revision: 0,
        entries: [{ kind: 'image', trigger: ';new', snippetId: 'new' }],
      });
    }
    expect(client.cache.identity).toEqual({ epoch: 'epoch-2', revision: 0 });
    expect(client.cache.find(';old')).toBeUndefined();
    expect(client.cache.find(';new')?.kind).toBe('image');
  });
});

describe('catalog mutation publication barrier', () => {
  it('invalidates before persistence and publishes only after completion', async () => {
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

  it('reports unavailable final publication without losing persisted result', async () => {
    const port: CatalogMutationPort = {
      invalidateBeforeMutation: async () => 'mutation-1',
      publishAfterMutation: async () => false,
    };
    await expect(
      runCatalogCoordinatedMutation(port, async () => ({ id: 'persisted' })),
    ).rejects.toBeInstanceOf(CatalogUnavailableAfterMutationError);
  });
});
