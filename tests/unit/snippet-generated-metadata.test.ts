import { describe, expect, it } from 'vitest';

import { createPlainSnippetContent } from '../../src/domain/snippet-content';
import {
  createSnippetSourceFingerprint,
  serializeSnippetSourceMaterial,
} from '../../src/domain/snippet-generated-metadata';

function source(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Refund café',
    content: createPlainSnippetContent('Hi 👋\nদ্রুত'),
    tags: ['Billing', 'ＡＢＣ'],
    trigger: ';refund',
    usageCount: 9,
    lastUsedAt: '2026-08-27T00:00:00.000Z',
    generatedAt: '2026-08-27T00:00:00.000Z',
    generatedTags: ['ignored'],
    ...overrides,
  };
}

describe('M14-O Snippet material fingerprint', () => {
  it('uses the explicit version-1 canonical UTF-8 serialization and SHA-256 result', async () => {
    const material = source();
    expect(serializeSnippetSourceMaterial(material)).toBe(
      '{"version":1,"title":"Refund café","renderedText":"Hi 👋\\nদ্রুত","authoredTags":["Billing","ＡＢＣ"]}',
    );
    await expect(createSnippetSourceFingerprint(material)).resolves.toBe(
      '0a995120b5c8e5b8854fb4c4a2f2405d5ed66b684db712741f10564690c488cf',
    );
    await expect(createSnippetSourceFingerprint(source())).resolves.toBe(
      await createSnippetSourceFingerprint(material),
    );
  });

  it.each([
    ['title', { title: 'Different title' }],
    ['content', { content: createPlainSnippetContent('Different content') }],
    ['authored tags', { tags: ['Billing', 'different'] }],
    ['authored tag order', { tags: ['ＡＢＣ', 'Billing'] }],
  ])('changes when %s changes', async (_label, overrides) => {
    expect(await createSnippetSourceFingerprint(source(overrides))).not.toBe(
      await createSnippetSourceFingerprint(source()),
    );
  });

  it.each([
    ['trigger', { trigger: ';changed' }],
    ['usage count', { usageCount: 999 }],
    ['last used time', { lastUsedAt: '2030-01-01T00:00:00.000Z' }],
    ['generated metadata', { generatedTags: ['different'] }],
    ['generated time', { generatedAt: '2030-01-01T00:00:00.000Z' }],
  ])('ignores non-material %s changes', async (_label, overrides) => {
    expect(await createSnippetSourceFingerprint(source(overrides))).toBe(
      await createSnippetSourceFingerprint(source()),
    );
  });

  it('does not silently Unicode-normalize authoritative material', async () => {
    expect(
      await createSnippetSourceFingerprint(source({ title: 'Café' })),
    ).not.toBe(
      await createSnippetSourceFingerprint(source({ title: 'Cafe\u0301' })),
    );
  });

  it('rejects Image Snippet fingerprinting', async () => {
    await expect(
      createSnippetSourceFingerprint(
        source({
          content: {
            kind: 'image',
            assetId: '123e4567-e89b-42d3-a456-426614174000',
          },
        }),
      ),
    ).rejects.toThrow('Image Snippets cannot have generated metadata.');
  });
});
