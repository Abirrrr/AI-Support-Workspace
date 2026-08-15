/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest';

import {
  serializeSnippetClipboardText,
  UnsupportedSnippetClipboardContentError,
} from '../../src/application/snippet/snippet-clipboard-serializer';
import type { SnippetContent } from '../../src/domain/snippet-content';

function parseClipboardHtml(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html');
}

function text(value: string, bold = false, italic = false) {
  return { type: 'text' as const, text: value, bold, italic };
}

describe('project-owned Snippet clipboard serializer', () => {
  it('preserves historical Plain text and emits paragraph/line HTML safely', () => {
    expect(
      serializeSnippetClipboardText({
        kind: 'plain',
        text: 'First <line>\ncontinued\n\nSecond & final',
      }),
    ).toEqual({
      plainText: 'First <line>\ncontinued\n\nSecond & final',
      html:
        '<p>First &lt;line&gt;<br>continued</p>' + '<p>Second &amp; final</p>',
    });
  });

  it('serializes paragraphs, marks, safe links, and both list kinds semantically', () => {
    const content: SnippetContent = {
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', text: 'Hello ', bold: false, italic: false },
            { type: 'text', text: '<there>', bold: true, italic: true },
            {
              type: 'link',
              text: ' guide ',
              url: 'https://example.com/?a=1&b="two"',
              bold: true,
              italic: false,
            },
          ],
        },
        {
          type: 'list',
          listType: 'unordered',
          items: [
            {
              children: [
                { type: 'text', text: 'One', bold: false, italic: true },
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
                { type: 'text', text: 'First', bold: true, italic: false },
              ],
            },
            {
              children: [
                {
                  type: 'link',
                  text: 'Second',
                  url: 'mailto:support@example.com',
                  bold: false,
                  italic: true,
                },
              ],
            },
          ],
        },
      ],
    };
    expect(serializeSnippetClipboardText(content)).toEqual({
      plainText:
        'Hello <there> guide  (https://example.com/?a=1&b="two")\n\n' +
        '- One\n\n1. First\n2. Second (mailto:support@example.com)',
      html:
        '<p>Hello <strong><em>&lt;there&gt;</em></strong>' +
        '<a href="https://example.com/?a=1&amp;b=&quot;two&quot;"><strong> guide </strong></a></p>' +
        '<ul><li><em>One</em></li></ul>' +
        '<ol><li><strong>First</strong></li>' +
        '<li><a href="mailto:support@example.com"><em>Second</em></a></li></ol>',
    });
  });

  it('emits three independent direct list items for bullet and numbered lists', () => {
    const result = serializeSnippetClipboardText({
      kind: 'rich',
      blocks: [
        {
          type: 'list',
          listType: 'unordered',
          items: [
            { children: [text('1st line')] },
            { children: [text('2nd line')] },
            { children: [text('3rd line')] },
          ],
        },
        {
          type: 'list',
          listType: 'ordered',
          items: [
            { children: [text('1st line')] },
            { children: [text('2nd line')] },
            { children: [text('3rd line')] },
          ],
        },
      ],
    });

    expect(result).toEqual({
      plainText:
        '- 1st line\n- 2nd line\n- 3rd line\n\n' +
        '1. 1st line\n2. 2nd line\n3. 3rd line',
      html:
        '<ul><li>1st line</li><li>2nd line</li><li>3rd line</li></ul>' +
        '<ol><li>1st line</li><li>2nd line</li><li>3rd line</li></ol>',
    });

    const document = parseClipboardHtml(result.html);
    expect(
      Array.from(document.querySelectorAll('ul > li'), (item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['1st line', '2nd line', '3rd line']);
    expect(
      Array.from(document.querySelectorAll('ol > li'), (item) =>
        item.textContent?.trim(),
      ),
    ).toEqual(['1st line', '2nd line', '3rd line']);
    expect(document.querySelectorAll('li > p')).toHaveLength(0);
  });

  it('keeps paragraph-list-paragraph siblings independent after DOM normalization', () => {
    const result = serializeSnippetClipboardText({
      kind: 'rich',
      blocks: [
        { type: 'paragraph', children: [text('Intro paragraph')] },
        {
          type: 'list',
          listType: 'unordered',
          items: [
            { children: [text('first')] },
            { children: [text('second')] },
          ],
        },
        { type: 'paragraph', children: [text('Closing paragraph')] },
      ],
    });

    expect(result.html).toBe(
      '<p>Intro paragraph</p><ul><li>first</li><li>second</li></ul><p>Closing paragraph</p>',
    );
    expect(result.plainText).toBe(
      'Intro paragraph\n\n- first\n- second\n\nClosing paragraph',
    );
    const document = parseClipboardHtml(result.html);
    expect(
      Array.from(document.body.children, (element) => element.tagName),
    ).toEqual(['P', 'UL', 'P']);
  });

  it('preserves marks, safe links, and explicit hard breaks inside their list item', () => {
    const result = serializeSnippetClipboardText({
      kind: 'rich',
      blocks: [
        {
          type: 'list',
          listType: 'unordered',
          items: [
            {
              children: [
                text('plain '),
                text('bold', true),
                text(' italic', false, true),
                {
                  type: 'link',
                  text: ' safe link',
                  url: 'https://example.com/help',
                  bold: false,
                  italic: false,
                },
              ],
            },
            { children: [text('first line\nsecond line')] },
          ],
        },
      ],
    });

    expect(result.html).toBe(
      '<ul><li>plain <strong>bold</strong><em> italic</em>' +
        '<a href="https://example.com/help"> safe link</a></li>' +
        '<li>first line<br>second line</li></ul>',
    );
    expect(result.plainText).toBe(
      '- plain bold italic safe link (https://example.com/help)\n' +
        '- first line\nsecond line',
    );
    const document = parseClipboardHtml(result.html);
    const items = document.querySelectorAll('ul > li');
    expect(items).toHaveLength(2);
    expect(items[0]?.querySelectorAll('strong, em, a')).toHaveLength(3);
    expect(items[1]?.querySelectorAll(':scope > br')).toHaveLength(1);
    expect(items[1]?.textContent).toBe('first linesecond line');
  });

  it('serializes empty supported list structures without malformed DOM', () => {
    const emptyList = serializeSnippetClipboardText({
      kind: 'rich',
      blocks: [
        { type: 'list', listType: 'unordered', items: [] },
        {
          type: 'list',
          listType: 'ordered',
          items: [{ children: [] }],
        },
      ],
    });

    expect(emptyList).toEqual({
      plainText: '\n\n1. ',
      html: '<ul></ul><ol><li></li></ol>',
    });
    const document = parseClipboardHtml(emptyList.html);
    expect(document.querySelectorAll('body > ul')).toHaveLength(1);
    expect(document.querySelectorAll('body > ol > li')).toHaveLength(1);
  });

  it('preserves explicit hard breaks inside marked paragraphs', () => {
    const result = serializeSnippetClipboardText({
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [text('first\r\nsecond\rthird', true, true)],
        },
      ],
    });

    expect(result.html).toBe(
      '<p><strong><em>first<br>second<br>third</em></strong></p>',
    );
    expect(result.plainText).toBe('first\r\nsecond\rthird');
  });

  it('represents a legacy URL Image Reference as safe text, never an image element', () => {
    const result = serializeSnippetClipboardText({
      kind: 'rich',
      blocks: [
        {
          type: 'reference',
          referenceType: 'image',
          label: '<legacy>',
          url: 'https://example.com/image.png?a=1&b=2',
        },
      ],
    });
    expect(result.html).toBe(
      '<p>[Image: &lt;legacy&gt;] https://example.com/image.png?a=1&amp;b=2</p>',
    );
    expect(result.html).not.toContain('<img');
  });

  it('fails closed for unsafe links, Image Snippets, and legacy local-image blocks', () => {
    const unsafe = {
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'link',
              text: 'bad',
              url: 'javascript:alert(1)',
              bold: false,
              italic: false,
            },
          ],
        },
      ],
    } as SnippetContent;
    expect(() => serializeSnippetClipboardText(unsafe)).toThrow(
      UnsupportedSnippetClipboardContentError,
    );
    expect(() =>
      serializeSnippetClipboardText({
        kind: 'image',
        assetId: '123e4567-e89b-42d3-a456-426614174000',
      }),
    ).toThrow(UnsupportedSnippetClipboardContentError);
    expect(() =>
      serializeSnippetClipboardText({
        kind: 'rich',
        blocks: [
          {
            type: 'image',
            assetId: '123e4567-e89b-42d3-a456-426614174000',
            altText: 'legacy',
          },
        ],
      }),
    ).toThrow(UnsupportedSnippetClipboardContentError);
  });

  it('emits no arbitrary style, class, ID, script, or event attributes', () => {
    const { html } = serializeSnippetClipboardText({
      kind: 'plain',
      text: '<script onclick="bad()">alert(1)</script>',
    });
    expect(html).toBe(
      '<p>&lt;script onclick="bad()"&gt;alert(1)&lt;/script&gt;</p>',
    );
    expect(html).not.toMatch(/<(script|style)| class="| id="|<p onclick=/);
  });
});
