export interface PlainSnippetContent {
  readonly kind: 'plain';
  readonly text: string;
}

export interface RichSnippetText {
  readonly type: 'text';
  readonly text: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

export interface RichSnippetLink {
  readonly type: 'link';
  readonly text: string;
  readonly url: string;
  readonly bold: boolean;
  readonly italic: boolean;
}

export type RichSnippetInline = RichSnippetText | RichSnippetLink;

export interface RichSnippetParagraph {
  readonly type: 'paragraph';
  readonly children: readonly RichSnippetInline[];
}

export interface RichSnippetImageReference {
  readonly type: 'reference';
  readonly referenceType: 'image';
  readonly label: string;
  readonly url: string;
}

export interface RichSnippetLocalImage {
  readonly type: 'image';
  readonly assetId: string;
  readonly altText: string;
}

export type RichSnippetBlock =
  RichSnippetParagraph | RichSnippetImageReference | RichSnippetLocalImage;

export interface RichSnippetContent {
  readonly kind: 'rich';
  readonly blocks: readonly RichSnippetBlock[];
}

export type SnippetContent = PlainSnippetContent | RichSnippetContent;

export class InvalidSnippetContentError extends Error {
  constructor() {
    super('Snippet content does not match the approved structured format.');
    this.name = 'InvalidSnippetContentError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const sortedExpected = [...expected].sort();
  return (
    actual.length === sortedExpected.length &&
    actual.every((key, index) => key === sortedExpected[index])
  );
}

function hasAllowedProtocol(
  value: string,
  allowed: readonly string[],
): boolean {
  try {
    return allowed.includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function isSafeSnippetLinkUrl(value: string): boolean {
  return hasAllowedProtocol(value, ['http:', 'https:', 'mailto:']);
}

export function isSafeSnippetImageUrl(value: string): boolean {
  return hasAllowedProtocol(value, ['http:', 'https:']);
}

function validateInline(value: unknown): RichSnippetInline {
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new InvalidSnippetContentError();
  }
  if (
    value.type === 'text' &&
    hasExactKeys(value, ['type', 'text', 'bold', 'italic']) &&
    typeof value.text === 'string' &&
    typeof value.bold === 'boolean' &&
    typeof value.italic === 'boolean'
  ) {
    return {
      type: 'text',
      text: value.text,
      bold: value.bold,
      italic: value.italic,
    };
  }
  if (
    value.type === 'link' &&
    hasExactKeys(value, ['type', 'text', 'url', 'bold', 'italic']) &&
    typeof value.text === 'string' &&
    typeof value.url === 'string' &&
    typeof value.bold === 'boolean' &&
    typeof value.italic === 'boolean' &&
    isSafeSnippetLinkUrl(value.url)
  ) {
    return {
      type: 'link',
      text: value.text,
      url: value.url,
      bold: value.bold,
      italic: value.italic,
    };
  }
  throw new InvalidSnippetContentError();
}

function validateBlock(value: unknown): RichSnippetBlock {
  if (!isRecord(value) || typeof value.type !== 'string') {
    throw new InvalidSnippetContentError();
  }
  if (
    value.type === 'image' &&
    hasExactKeys(value, ['type', 'assetId', 'altText']) &&
    typeof value.assetId === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      value.assetId,
    ) &&
    typeof value.altText === 'string'
  ) {
    return { type: 'image', assetId: value.assetId, altText: value.altText };
  }
  if (
    value.type === 'paragraph' &&
    hasExactKeys(value, ['type', 'children']) &&
    Array.isArray(value.children)
  ) {
    return {
      type: 'paragraph',
      children: value.children.map(validateInline),
    };
  }
  if (
    value.type === 'reference' &&
    hasExactKeys(value, ['type', 'referenceType', 'label', 'url']) &&
    value.referenceType === 'image' &&
    typeof value.label === 'string' &&
    typeof value.url === 'string' &&
    isSafeSnippetImageUrl(value.url)
  ) {
    return {
      type: 'reference',
      referenceType: 'image',
      label: value.label,
      url: value.url,
    };
  }
  throw new InvalidSnippetContentError();
}

export function validateSnippetContent(value: unknown): SnippetContent {
  if (!isRecord(value) || typeof value.kind !== 'string') {
    throw new InvalidSnippetContentError();
  }
  if (
    value.kind === 'plain' &&
    hasExactKeys(value, ['kind', 'text']) &&
    typeof value.text === 'string'
  ) {
    return { kind: 'plain', text: value.text };
  }
  if (
    value.kind === 'rich' &&
    hasExactKeys(value, ['kind', 'blocks']) &&
    Array.isArray(value.blocks)
  ) {
    return { kind: 'rich', blocks: value.blocks.map(validateBlock) };
  }
  throw new InvalidSnippetContentError();
}

export function createPlainSnippetContent(text: string): PlainSnippetContent {
  return { kind: 'plain', text };
}

export function convertPlainSnippetToRich(
  content: PlainSnippetContent,
): RichSnippetContent {
  return {
    kind: 'rich',
    blocks: [
      {
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: content.text,
            bold: false,
            italic: false,
          },
        ],
      },
    ],
  };
}

export function cloneSnippetContent(content: SnippetContent): SnippetContent {
  return validateSnippetContent(content);
}

function renderInline(inline: RichSnippetInline): string {
  if (inline.type === 'text') return inline.text;
  return inline.text === inline.url
    ? inline.url
    : `${inline.text} (${inline.url})`;
}

function renderBlock(block: RichSnippetBlock): string {
  if (block.type === 'paragraph')
    return block.children.map(renderInline).join('');
  if (block.type === 'image') {
    return block.altText.length > 0 ? `[Image: ${block.altText}]` : '[Image]';
  }
  return `[Image: ${block.label}] ${block.url}`;
}

export function getLocalImageAssetIds(
  content: SnippetContent,
): readonly string[] {
  return content.kind === 'rich'
    ? content.blocks.flatMap((block) =>
        block.type === 'image' ? [block.assetId] : [],
      )
    : [];
}

export function containsLocalImageBlock(content: SnippetContent): boolean {
  return getLocalImageAssetIds(content).length > 0;
}

export function renderSnippetPlainText(content: SnippetContent): string {
  if (content.kind === 'plain') return content.text;
  return content.blocks.map(renderBlock).join('\n\n');
}
