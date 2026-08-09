import {
  InvalidSnippetContentError,
  isSafeSnippetLinkUrl,
  validateSnippetContent,
  type PlainSnippetContent,
  type RichSnippetContent,
  type RichSnippetInline,
} from '../../domain/snippet-content';

export interface TextEditorMark {
  readonly type: 'bold' | 'italic' | 'link';
  readonly attrs?: Readonly<Record<string, unknown>>;
}

export interface TextEditorNode {
  readonly type: string;
  readonly text?: string;
  readonly marks?: readonly TextEditorMark[];
  readonly content?: readonly TextEditorNode[];
}

function textNodes(inline: RichSnippetInline): readonly TextEditorNode[] {
  const marks: TextEditorMark[] = [];
  if (inline.bold) marks.push({ type: 'bold' });
  if (inline.italic) marks.push({ type: 'italic' });
  if (inline.type === 'link') {
    marks.push({ type: 'link', attrs: { href: inline.url } });
  }
  const pieces = inline.text.split('\n');
  return pieces.flatMap((text, index) => [
    ...(text.length === 0 ? [] : [{ type: 'text', text, marks }]),
    ...(index === pieces.length - 1 ? [] : [{ type: 'hardBreak' }]),
  ]);
}

export function snippetContentToTextEditorDocument(
  content: PlainSnippetContent | RichSnippetContent,
): TextEditorNode {
  if (content.kind === 'plain') {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: textNodes({
            type: 'text',
            text: content.text,
            bold: false,
            italic: false,
          }),
        },
      ],
    };
  }

  return {
    type: 'doc',
    content: content.blocks.map((block) => {
      if (block.type === 'paragraph') {
        return {
          type: 'paragraph',
          content: block.children.flatMap(textNodes),
        };
      }
      if (block.type !== 'list') throw new InvalidSnippetContentError();
      return {
        type: block.listType === 'unordered' ? 'bulletList' : 'orderedList',
        content: block.items.map((item) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: item.children.flatMap(textNodes),
            },
          ],
        })),
      };
    }),
  };
}

function inlinesFromEditorNodes(
  nodes: readonly TextEditorNode[] = [],
): RichSnippetInline[] {
  const inlines: RichSnippetInline[] = [];
  for (const node of nodes) {
    if (node.type === 'hardBreak') {
      const prior = inlines.at(-1);
      if (prior === undefined) {
        inlines.push({ type: 'text', text: '\n', bold: false, italic: false });
      } else {
        inlines[inlines.length - 1] = { ...prior, text: `${prior.text}\n` };
      }
      continue;
    }
    if (node.type !== 'text' || typeof node.text !== 'string') {
      throw new InvalidSnippetContentError();
    }
    const marks = node.marks ?? [];
    if (marks.some((mark) => !['bold', 'italic', 'link'].includes(mark.type))) {
      throw new InvalidSnippetContentError();
    }
    const links = marks.filter((mark) => mark.type === 'link');
    if (links.length > 1) throw new InvalidSnippetContentError();
    const href = links[0]?.attrs?.href;
    const bold = marks.some((mark) => mark.type === 'bold');
    const italic = marks.some((mark) => mark.type === 'italic');
    const inline: RichSnippetInline =
      links.length === 0
        ? { type: 'text', text: node.text, bold, italic }
        : typeof href === 'string' && isSafeSnippetLinkUrl(href)
          ? { type: 'link', text: node.text, url: href, bold, italic }
          : (() => {
              throw new InvalidSnippetContentError();
            })();
    const prior = inlines.at(-1);
    if (
      prior !== undefined &&
      prior.type === inline.type &&
      prior.bold === inline.bold &&
      prior.italic === inline.italic &&
      (prior.type === 'text' ||
        (inline.type === 'link' && prior.url === inline.url))
    ) {
      inlines[inlines.length - 1] = {
        ...prior,
        text: prior.text + inline.text,
      };
    } else {
      inlines.push(inline);
    }
  }
  return inlines;
}

export function textEditorDocumentToRichSnippetContent(
  document: TextEditorNode,
): RichSnippetContent {
  if (document.type !== 'doc') throw new InvalidSnippetContentError();
  const blocks = (document.content ?? []).map((node) => {
    if (node.type === 'paragraph') {
      return {
        type: 'paragraph' as const,
        children: inlinesFromEditorNodes(node.content),
      };
    }
    if (node.type !== 'bulletList' && node.type !== 'orderedList') {
      throw new InvalidSnippetContentError();
    }
    const items = (node.content ?? []).map((item) => {
      if (
        item.type !== 'listItem' ||
        item.content?.length !== 1 ||
        item.content[0]?.type !== 'paragraph'
      ) {
        throw new InvalidSnippetContentError();
      }
      return { children: inlinesFromEditorNodes(item.content[0].content) };
    });
    return {
      type: 'list' as const,
      listType:
        node.type === 'bulletList'
          ? ('unordered' as const)
          : ('ordered' as const),
      items,
    };
  });
  return validateSnippetContent({ kind: 'rich', blocks }) as RichSnippetContent;
}

export function isSupportedTextSnippetContent(
  content: RichSnippetContent,
): boolean {
  return content.blocks.every(
    (block) => block.type === 'paragraph' || block.type === 'list',
  );
}
