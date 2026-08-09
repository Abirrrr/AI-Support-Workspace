import { describe, expect, it } from 'vitest';

import {
  InvalidSnippetContentError,
  type RichSnippetContent,
} from '../../src/domain/snippet-content';
import {
  snippetContentToTextEditorDocument,
  textEditorDocumentToRichSnippetContent,
  type TextEditorNode,
} from '../../src/ui/snippet/text-editor-document';

const rich: RichSnippetContent = {
  kind: 'rich',
  blocks: [
    {
      type: 'paragraph',
      children: [
        { type: 'text', text: 'Hello\nthere ', bold: true, italic: false },
        {
          type: 'link',
          text: 'help',
          url: 'https://example.com/help',
          bold: false,
          italic: true,
        },
      ],
    },
    {
      type: 'list',
      listType: 'unordered',
      items: [
        {
          children: [{ type: 'text', text: 'First', bold: true, italic: true }],
        },
        {
          children: [
            {
              type: 'link',
              text: 'Second',
              url: 'mailto:help@example.com',
              bold: false,
              italic: false,
            },
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
            { type: 'text', text: 'Done', bold: false, italic: false },
          ],
        },
      ],
    },
  ],
};

describe('Text editor document adapter', () => {
  it('maps the smallest Rich document to an editable document', () => {
    expect(
      snippetContentToTextEditorDocument({ kind: 'rich', blocks: [] }),
    ).toEqual({ type: 'doc', content: [] });
  });

  it('preserves historical Plain text and line breaks', () => {
    const document = snippetContentToTextEditorDocument({
      kind: 'plain',
      text: 'one\ntwo\n\nthree',
    });
    expect(textEditorDocumentToRichSnippetContent(document)).toEqual({
      kind: 'rich',
      blocks: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'one\ntwo\n\nthree',
              bold: false,
              italic: false,
            },
          ],
        },
      ],
    });
  });

  it('round-trips paragraphs, line breaks, marks, links, and both list types', () => {
    expect(
      textEditorDocumentToRichSnippetContent(
        snippetContentToTextEditorDocument(rich),
      ),
    ).toEqual(rich);
  });

  it('preserves supported editor semantics through domain and back', () => {
    const document = snippetContentToTextEditorDocument(rich);
    expect(
      snippetContentToTextEditorDocument(
        textEditorDocumentToRichSnippetContent(document),
      ),
    ).toEqual(document);
  });

  it.each(['heading', 'blockquote', 'codeBlock', 'image', 'horizontalRule'])(
    'rejects unsupported %s nodes',
    (type) => {
      expect(() =>
        textEditorDocumentToRichSnippetContent({
          type: 'doc',
          content: [{ type }],
        }),
      ).toThrow(InvalidSnippetContentError);
    },
  );

  it('rejects nested lists instead of flattening them', () => {
    const nested: TextEditorNode = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph' }, { type: 'bulletList' }],
            },
          ],
        },
      ],
    };
    expect(() => textEditorDocumentToRichSnippetContent(nested)).toThrow(
      InvalidSnippetContentError,
    );
  });

  it('rejects unsafe links', () => {
    const unsafe: TextEditorNode = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'bad',
              marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
            },
          ],
        },
      ],
    };
    expect(() => textEditorDocumentToRichSnippetContent(unsafe)).toThrow(
      InvalidSnippetContentError,
    );
  });

  it('rejects arbitrary marks rather than persisting HTML-like editor state', () => {
    const unsupported = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'x', marks: [{ type: 'strike' }] }],
        },
      ],
    } as unknown as TextEditorNode;
    expect(() => textEditorDocumentToRichSnippetContent(unsupported)).toThrow(
      InvalidSnippetContentError,
    );
  });
});
