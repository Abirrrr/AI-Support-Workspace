import {
  containsLocalImageBlock,
  isSafeSnippetLinkUrl,
  renderSnippetPlainText,
  type RichSnippetInline,
  type SnippetContent,
} from '../../domain/snippet-content';

export class UnsupportedSnippetClipboardContentError extends Error {
  constructor() {
    super(
      'Snippet content cannot be safely serialized for clipboard delivery.',
    );
    this.name = 'UnsupportedSnippetClipboardContentError';
  }
}

function escapeText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeText(value).replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function serializeMarkedText(text: string, bold: boolean, italic: boolean) {
  let result = escapeText(text);
  if (italic) result = `<em>${result}</em>`;
  if (bold) result = `<strong>${result}</strong>`;
  return result;
}

function serializeInline(inline: RichSnippetInline): string {
  const marked = serializeMarkedText(inline.text, inline.bold, inline.italic);
  if (inline.type === 'text') return marked;
  if (!isSafeSnippetLinkUrl(inline.url)) {
    throw new UnsupportedSnippetClipboardContentError();
  }
  return `<a href="${escapeAttribute(inline.url)}">${marked}</a>`;
}

function serializePlainHtml(text: string): string {
  const normalized = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
  const paragraphs = normalized.split(/\n{2,}/);
  return paragraphs
    .map(
      (paragraph) =>
        `<p>${paragraph.split('\n').map(escapeText).join('<br>')}</p>`,
    )
    .join('');
}

export interface TextClipboardRepresentation {
  readonly plainText: string;
  readonly html: string;
}

export function serializeSnippetClipboardText(
  content: SnippetContent,
): TextClipboardRepresentation {
  if (content.kind === 'image' || containsLocalImageBlock(content)) {
    throw new UnsupportedSnippetClipboardContentError();
  }
  const plainText = renderSnippetPlainText(content);
  if (content.kind === 'plain') {
    return { plainText, html: serializePlainHtml(content.text) };
  }
  const html = content.blocks
    .map((block) => {
      if (block.type === 'paragraph') {
        return `<p>${block.children.map(serializeInline).join('')}</p>`;
      }
      if (block.type === 'list') {
        const tag = block.listType === 'unordered' ? 'ul' : 'ol';
        return `<${tag}>${block.items
          .map(
            (item) => `<li>${item.children.map(serializeInline).join('')}</li>`,
          )
          .join('')}</${tag}>`;
      }
      if (block.type === 'reference') {
        return `<p>${escapeText(`[Image: ${block.label}] ${block.url}`)}</p>`;
      }
      throw new UnsupportedSnippetClipboardContentError();
    })
    .join('');
  return { plainText, html };
}
