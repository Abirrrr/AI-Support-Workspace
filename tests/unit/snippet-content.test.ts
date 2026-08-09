import { describe, expect, it } from 'vitest';

import {
  InvalidSnippetContentError,
  cloneSnippetContent,
  convertPlainSnippetToRich,
  createPlainSnippetContent,
  isSafeSnippetImageUrl,
  isSafeSnippetLinkUrl,
  renderSnippetPlainText,
  validateSnippetContent,
  type RichSnippetContent,
} from '../../src/domain/snippet-content';

const richContent: RichSnippetContent = {
  kind: 'rich',
  blocks: [
    {
      type: 'paragraph',
      children: [
        { type: 'text', text: 'See ', bold: false, italic: false },
        {
          type: 'link',
          text: 'the guide',
          url: 'https://example.com/guide',
          bold: true,
          italic: false,
        },
        {
          type: 'link',
          text: 'mailto:help@example.com',
          url: 'mailto:help@example.com',
          bold: false,
          italic: true,
        },
      ],
    },
    {
      type: 'reference',
      referenceType: 'image',
      label: 'Receipt',
      url: 'http://example.com/receipt.png',
    },
  ],
};

describe('SnippetContent', () => {
  it('creates and projects plain content exactly', () => {
    const content = createPlainSnippetContent('  exact\ntext  ');
    expect(content).toEqual({ kind: 'plain', text: '  exact\ntext  ' });
    expect(renderSnippetPlainText(content)).toBe('  exact\ntext  ');
  });

  it('converts Plain to Rich without inferring formatting or losing readable text', () => {
    const plain = createPlainSnippetContent('  First line\nSecond line  ');
    const rich = convertPlainSnippetToRich(plain);

    expect(rich).toEqual({
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: plain.text,
              bold: false,
              italic: false,
            },
          ],
        },
      ],
    });
    expect(renderSnippetPlainText(rich)).toBe(plain.text);
  });

  it('projects every rich block deterministically without markup', () => {
    const expected =
      'See the guide (https://example.com/guide)mailto:help@example.com\n\n' +
      '[Image: Receipt] http://example.com/receipt.png';
    expect(renderSnippetPlainText(richContent)).toBe(expected);
    expect(renderSnippetPlainText(richContent)).toBe(expected);
  });

  it('validates local-image blocks and projects alt text without exposing asset IDs', () => {
    const assetId = '123e4567-e89b-42d3-a456-426614174000';
    const content = validateSnippetContent({
      kind: 'rich',
      blocks: [
        { type: 'image', assetId, altText: 'Receipt' },
        { type: 'image', assetId, altText: '' },
      ],
    });
    expect(renderSnippetPlainText(content)).toBe('[Image: Receipt]\n\n[Image]');
    expect(renderSnippetPlainText(content)).not.toContain(assetId);
    expect(() =>
      validateSnippetContent({
        kind: 'rich',
        blocks: [{ type: 'image', assetId: 'not-a-uuid', altText: '' }],
      }),
    ).toThrow(InvalidSnippetContentError);
    expect(() =>
      validateSnippetContent({
        kind: 'rich',
        blocks: [{ type: 'image', assetId, altText: '', extra: true }],
      }),
    ).toThrow(InvalidSnippetContentError);
  });

  it('preserves local images and legacy URL references in one ordered Rich document', () => {
    const content = validateSnippetContent({
      kind: 'rich',
      blocks: [
        {
          type: 'reference',
          referenceType: 'image',
          label: 'Remote',
          url: 'https://example.com/image.png',
        },
        {
          type: 'image',
          assetId: '123e4567-e89b-42d3-a456-426614174000',
          altText: 'Local',
        },
      ],
    });
    const projection = renderSnippetPlainText(content);
    expect(projection).toBe(
      '[Image: Remote] https://example.com/image.png\n\n[Image: Local]',
    );
    expect(projection).not.toContain('[object Object]');
  });

  it('validates non-recursive unordered and ordered lists and projects them deterministically', () => {
    const content = validateSnippetContent({
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Steps:', bold: true, italic: false },
          ],
        },
        {
          type: 'list',
          listType: 'unordered',
          items: [
            {
              children: [
                { type: 'text', text: 'Open ', bold: true, italic: true },
                {
                  type: 'link',
                  text: 'Settings',
                  url: 'https://example.com/settings',
                  bold: false,
                  italic: false,
                },
              ],
            },
            {
              children: [
                { type: 'text', text: 'Save', bold: false, italic: false },
              ],
            },
          ],
        },
        {
          type: 'list',
          listType: 'ordered',
          items: [
            {
              children: [
                { type: 'text', text: 'First', bold: false, italic: false },
              ],
            },
            {
              children: [
                { type: 'text', text: 'Second', bold: false, italic: false },
              ],
            },
          ],
        },
      ],
    });

    expect(renderSnippetPlainText(content)).toBe(
      'Steps:\n\n- Open Settings (https://example.com/settings)\n- Save\n\n1. First\n2. Second',
    );
    expect(JSON.stringify(content)).not.toContain('<ul');
  });

  it.each([
    {
      kind: 'rich',
      blocks: [{ type: 'list', listType: 'task', items: [] }],
    },
    {
      kind: 'rich',
      blocks: [
        {
          type: 'list',
          listType: 'unordered',
          items: [{ children: [], extra: true }],
        },
      ],
    },
    {
      kind: 'rich',
      blocks: [
        {
          type: 'list',
          listType: 'ordered',
          items: [{ children: [{ type: 'list', items: [] }] }],
        },
      ],
    },
  ])('rejects malformed or nested list content %#', (value) => {
    expect(() => validateSnippetContent(value)).toThrow(
      InvalidSnippetContentError,
    );
  });

  it('validates the exact ImageSnippetContent contract and has no text projection', () => {
    const assetId = '123e4567-e89b-42d3-a456-426614174000';
    const content = validateSnippetContent({ kind: 'image', assetId });
    expect(content).toEqual({ kind: 'image', assetId });
    expect(renderSnippetPlainText(content)).toBe('');
    expect(() =>
      validateSnippetContent({ kind: 'image', assetId, text: '[Image]' }),
    ).toThrow(InvalidSnippetContentError);
    expect(() =>
      validateSnippetContent({ kind: 'image', assetId: 'not-a-uuid' }),
    ).toThrow(InvalidSnippetContentError);
  });

  it('accepts only the approved link and image protocols', () => {
    expect(isSafeSnippetLinkUrl('https://example.com')).toBe(true);
    expect(isSafeSnippetLinkUrl('http://example.com')).toBe(true);
    expect(isSafeSnippetLinkUrl('mailto:help@example.com')).toBe(true);
    expect(isSafeSnippetLinkUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeSnippetImageUrl('https://example.com/image.png')).toBe(true);
    expect(isSafeSnippetImageUrl('mailto:help@example.com')).toBe(false);
    expect(isSafeSnippetImageUrl('data:image/png;base64,AA==')).toBe(false);
  });

  it('strictly validates and deep-clones the non-recursive structure', () => {
    const clone = validateSnippetContent(richContent);
    expect(clone).toEqual(richContent);
    expect(clone).not.toBe(richContent);
    if (clone.kind !== 'rich') throw new Error('Expected rich content.');
    expect(clone.blocks).not.toBe(richContent.blocks);
    expect(cloneSnippetContent(richContent)).toEqual(richContent);
  });

  it.each([
    { kind: 'plain', text: 'ok', extra: true },
    { kind: 'rich', blocks: [{ type: 'unknown' }] },
    {
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              text: 'unsafe',
              url: 'javascript:alert(1)',
              bold: false,
              italic: false,
            },
          ],
        },
      ],
    },
    {
      kind: 'rich',
      blocks: [
        {
          type: 'reference',
          referenceType: 'image',
          label: 'unsafe',
          url: 'file:///tmp/image.png',
        },
      ],
    },
  ])('rejects malformed or unsafe content %#', (value) => {
    expect(() => validateSnippetContent(value)).toThrow(
      InvalidSnippetContentError,
    );
  });
});
