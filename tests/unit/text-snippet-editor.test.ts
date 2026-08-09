// @vitest-environment jsdom

import { Editor, type JSONContent } from '@tiptap/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  snippetContentToTextEditorDocument,
  textEditorDocumentToRichSnippetContent,
  type TextEditorNode,
} from '../../src/ui/snippet/text-editor-document';
import { textSnippetExtensions } from '../../src/ui/snippet/TextSnippetEditor';

const editors: Editor[] = [];

function editorWithText(
  text = 'Hello',
  onUpdate?: (editor: Editor) => void,
): Editor {
  const editor = new Editor({
    extensions: textSnippetExtensions,
    content: snippetContentToTextEditorDocument({
      kind: 'plain',
      text,
    }) as JSONContent,
    ...(onUpdate === undefined
      ? {}
      : { onUpdate: ({ editor: updatedEditor }) => onUpdate(updatedEditor) }),
  });
  editors.push(editor);
  return editor;
}

function content(editor: Editor) {
  return textEditorDocumentToRichSnippetContent(
    editor.getJSON() as TextEditorNode,
  );
}

afterEach(() => {
  for (const editor of editors.splice(0)) editor.destroy();
});

describe('constrained Text Snippet Tiptap behavior', () => {
  it('applies and removes bold, italic, and safe links on selected text', () => {
    const editor = editorWithText();
    editor.commands.setTextSelection({ from: 1, to: 6 });
    editor.commands.toggleBold();
    editor.commands.toggleItalic();
    editor.commands.setLink({ href: 'https://example.com/help' });
    expect(content(editor).blocks[0]).toEqual({
      type: 'paragraph',
      children: [
        {
          type: 'link',
          text: 'Hello',
          url: 'https://example.com/help',
          bold: true,
          italic: true,
        },
      ],
    });
    editor.commands.unsetLink();
    expect(content(editor).blocks[0]).toMatchObject({
      children: [{ type: 'text', text: 'Hello', bold: true, italic: true }],
    });
  });

  it('creates bullet and numbered lists and splits a normal next item', () => {
    const bullet = editorWithText('First');
    bullet.commands.selectAll();
    bullet.commands.toggleBulletList();
    bullet.commands.setTextSelection(bullet.state.doc.content.size - 1);
    bullet.commands.splitListItem('listItem');
    const bulletContent = content(bullet);
    expect(bulletContent.blocks[0]).toMatchObject({
      type: 'list',
      listType: 'unordered',
      items: [{ children: [{ text: 'First' }] }, { children: [] }],
    });

    const ordered = editorWithText('First');
    ordered.commands.selectAll();
    ordered.commands.toggleOrderedList();
    expect(content(ordered).blocks[0]).toMatchObject({
      type: 'list',
      listType: 'ordered',
    });
  });

  it('supports undo and redo without leaving the domain schema', () => {
    const editor = editorWithText();
    editor.commands.setTextSelection(6);
    editor.commands.insertContent('!');
    expect(content(editor).blocks[0]).toMatchObject({
      children: [{ text: 'Hello!' }],
    });
    editor.commands.undo();
    expect(content(editor).blocks[0]).toMatchObject({
      children: [{ text: 'Hello' }],
    });
    editor.commands.redo();
    expect(content(editor).blocks[0]).toMatchObject({
      children: [{ text: 'Hello!' }],
    });
  });

  it('constrains formatted HTML to supported semantics and cannot persist images', () => {
    const editor = editorWithText();
    editor.commands.setContent(
      '<p><strong>Bold</strong> <em>Italic</em> <a href="https://example.com">Link</a><img src="https://example.com/x.png"></p><ul><li>One</li></ul>',
    );
    const mapped = content(editor);
    expect(mapped.blocks).toMatchObject([
      {
        type: 'paragraph',
        children: [
          { type: 'text', text: 'Bold', bold: true },
          { type: 'text', text: ' ', bold: false },
          { type: 'text', text: 'Italic', italic: true },
          { type: 'text', text: ' ', italic: false },
          { type: 'link', text: 'Link', url: 'https://example.com' },
        ],
      },
      { type: 'list', listType: 'unordered' },
    ]);
    expect(JSON.stringify(mapped)).not.toContain('img');
    expect(JSON.stringify(mapped)).not.toContain('<');
  });

  it.each([
    ['multiple paragraphs', '<ul><li><p>One</p><p>Two</p></li></ul>'],
    [
      'a nested list',
      '<ul><li><p>One</p><ul><li><p>Nested</p></li></ul></li></ul>',
    ],
    [
      'an unsupported block',
      '<ul><li><p>One</p><blockquote><p>Quote</p></blockquote></li></ul>',
    ],
  ])(
    'constrains pasted list HTML containing %s to representable editor state',
    (_label, html) => {
      let updateError: unknown;
      const editor = editorWithText('Safe', (updatedEditor) => {
        try {
          content(updatedEditor);
        } catch (error) {
          updateError = error;
        }
      });

      expect(() => editor.commands.setContent(html)).not.toThrow();
      expect(updateError).toBeUndefined();
      expect(() => content(editor)).not.toThrow();

      const document = editor.getJSON() as TextEditorNode;
      const listItems: TextEditorNode[] = [];
      const visit = (node: TextEditorNode) => {
        if (node.type === 'listItem') listItems.push(node);
        for (const child of node.content ?? []) visit(child);
      };
      visit(document);
      for (const item of listItems) {
        expect(item.content).toHaveLength(1);
        expect(item.content?.[0]?.type).toBe('paragraph');
      }

      expect(() => editor.commands.insertContent('!')).not.toThrow();
      expect(updateError).toBeUndefined();
      expect(() => content(editor)).not.toThrow();
    },
  );

  it('rejects a transaction that would introduce a nested list', () => {
    const editor = editorWithText('Safe');
    const before = editor.getJSON();
    editor.commands.setContent({
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'One' }] },
                {
                  type: 'bulletList',
                  content: [
                    {
                      type: 'listItem',
                      content: [
                        {
                          type: 'paragraph',
                          content: [{ type: 'text', text: 'Nested' }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
    expect(editor.getJSON()).toEqual(before);
  });
});
