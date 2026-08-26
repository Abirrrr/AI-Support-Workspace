import { describe, expect, it, vi } from 'vitest';

import { CopySnippetToClipboardService } from '../../src/application/snippet/copy-snippet-to-clipboard';
import type { SnippetDeliveryPlan } from '../../src/application/snippet/snippet-delivery-planner';

const textPlan: SnippetDeliveryPlan = {
  kind: 'text',
  snippetId: 'stable-snippet-id',
  plainText: 'Hello',
  html: '<p>Hello</p>',
};

describe('CopySnippetToClipboard', () => {
  it('loads by stable ID and writes the authoritative Text plan once', async () => {
    const planner = { planById: vi.fn(async () => textPlan) };
    const writer = {
      write: vi
        .fn<(plan: SnippetDeliveryPlan, requestId: string) => Promise<void>>()
        .mockResolvedValue(undefined),
    };
    const copy = new CopySnippetToClipboardService(
      planner,
      writer,
      () => 'copy-request-id',
    );

    await expect(copy.copy('stable-snippet-id')).resolves.toEqual({
      outcome: 'copied',
      kind: 'text',
    });
    expect(planner.planById).toHaveBeenCalledWith('stable-snippet-id');
    expect(writer.write).toHaveBeenCalledWith(textPlan, 'copy-request-id');
  });

  it('passes authoritative Image bytes to the shared writer without preview input', async () => {
    const blob = new Blob([Uint8Array.from([1, 2, 3])], { type: 'image/png' });
    const plan: SnippetDeliveryPlan = {
      kind: 'image',
      snippetId: 'image-snippet-id',
      mimeType: 'image/png',
      blob,
      dimensions: { width: 1, height: 1 },
    };
    const planner = { planById: vi.fn(async () => plan) };
    const writer = {
      write: vi
        .fn<(plan: SnippetDeliveryPlan, requestId: string) => Promise<void>>()
        .mockResolvedValue(undefined),
    };
    const copy = new CopySnippetToClipboardService(planner, writer, () => 'id');

    expect(await copy.copy('image-snippet-id')).toEqual({
      outcome: 'copied',
      kind: 'image',
    });
    expect(writer.write).toHaveBeenCalledWith(plan, 'id');
    expect(writer.write.mock.calls[0]?.[0]).toHaveProperty('blob', blob);
  });

  it.each(['load', 'write'] as const)(
    'returns typed failure when %s fails',
    async (stage) => {
      const planner = {
        planById: vi.fn(async () => {
          if (stage === 'load') throw new Error('load failed');
          return textPlan;
        }),
      };
      const writer = {
        write: vi.fn<
          (plan: SnippetDeliveryPlan, requestId: string) => Promise<void>
        >(async () => {
          if (stage === 'write') throw new Error('write failed');
        }),
      };
      const copy = new CopySnippetToClipboardService(planner, writer);
      await expect(copy.copy('stable-snippet-id')).resolves.toEqual({
        outcome: 'failed',
      });
    },
  );
});
