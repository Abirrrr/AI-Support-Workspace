import type { SnippetAssetRepository } from '../persistence/snippet-asset-repository';
import type { SnippetEntryRepository } from '../persistence/snippet-entry-repository';
import type {
  RichSnippetInline,
  SnippetContent,
} from '../../domain/snippet-content';
import { serializeSnippetClipboardText } from './snippet-clipboard-serializer';
import { SnippetDeliveryPlanner } from './snippet-delivery-planner';
import { normalizeSnippetTrigger } from './snippet-trigger';

export class SnippetListDiagnosticError extends Error {
  constructor(
    readonly code:
      'trigger-required' | 'snippet-not-found' | 'image-snippet-unsupported',
  ) {
    super(
      code === 'trigger-required'
        ? 'Enter the exact trigger for the failing Text Snippet.'
        : code === 'snippet-not-found'
          ? 'No saved Snippet uses that trigger.'
          : 'The selected Snippet is not a Text Snippet.',
    );
    this.name = 'SnippetListDiagnosticError';
  }
}

interface HardBreakDiagnostic {
  readonly inlineIndex: number;
  readonly offset: number;
  readonly sequence: 'LF' | 'CRLF' | 'CR';
}

interface InlineMarkDiagnostic {
  readonly inlineIndex: number;
  readonly marks: readonly ('bold' | 'italic' | 'link')[];
}

function hardBreaks(
  children: readonly RichSnippetInline[],
): readonly HardBreakDiagnostic[] {
  return children.flatMap((inline, inlineIndex) => {
    const breaks: HardBreakDiagnostic[] = [];
    for (const match of inline.text.matchAll(/\r\n|\r|\n/g)) {
      const sequence =
        match[0] === '\r\n' ? 'CRLF' : match[0] === '\r' ? 'CR' : 'LF';
      breaks.push({ inlineIndex, offset: match.index, sequence });
    }
    return breaks;
  });
}

function marks(
  children: readonly RichSnippetInline[],
): readonly InlineMarkDiagnostic[] {
  return children.map((inline, inlineIndex) => ({
    inlineIndex,
    marks: [
      ...(inline.bold ? (['bold'] as const) : []),
      ...(inline.italic ? (['italic'] as const) : []),
      ...(inline.type === 'link' ? (['link'] as const) : []),
    ],
  }));
}

function describeStructure(content: SnippetContent) {
  if (content.kind !== 'rich') {
    return {
      topLevelBlocks: [{ index: 0, type: content.kind }],
      paragraphs: [],
      lists: [],
    };
  }

  return {
    topLevelBlocks: content.blocks.map((block, index) => ({
      index,
      type: block.type,
      ...(block.type === 'list' ? { listType: block.listType } : {}),
    })),
    paragraphs: content.blocks.flatMap((block, blockIndex) =>
      block.type === 'paragraph'
        ? [
            {
              blockIndex,
              children: block.children,
              marks: marks(block.children),
              hardBreaks: hardBreaks(block.children),
            },
          ]
        : [],
    ),
    lists: content.blocks.flatMap((block, blockIndex) =>
      block.type === 'list'
        ? [
            {
              blockIndex,
              listType: block.listType,
              itemCount: block.items.length,
              items: block.items.map((item, itemIndex) => ({
                itemIndex,
                children: item.children,
                marks: marks(item.children),
                hardBreaks: hardBreaks(item.children),
              })),
            },
          ]
        : [],
    ),
  };
}

export async function diagnoseSnippetListSerialization(
  snippetRepository: SnippetEntryRepository,
  assetRepository: SnippetAssetRepository,
  requestedTrigger: string,
) {
  const trigger = normalizeSnippetTrigger(requestedTrigger.trim());
  if (trigger === null) {
    throw new SnippetListDiagnosticError('trigger-required');
  }
  const snippet = await snippetRepository.findByTrigger(trigger);
  if (snippet === undefined) {
    throw new SnippetListDiagnosticError('snippet-not-found');
  }
  if (snippet.content.kind === 'image') {
    throw new SnippetListDiagnosticError('image-snippet-unsupported');
  }

  const clipboard = serializeSnippetClipboardText(snippet.content);
  const request = {
    snippetId: snippet.id,
    trigger,
    kind: 'text' as const,
  };
  const deliveryPayload = await new SnippetDeliveryPlanner(
    snippetRepository,
    assetRepository,
  ).plan(request);
  if (deliveryPayload.kind !== 'text') {
    throw new SnippetListDiagnosticError('image-snippet-unsupported');
  }

  return {
    record: {
      id: snippet.id,
      kind: 'text' as const,
      trigger: snippet.trigger,
      content: snippet.content,
    },
    structure: describeStructure(snippet.content),
    clipboard,
    delivery: {
      request,
      payload: deliveryPayload,
      matchesSerializer: {
        html: deliveryPayload.html === clipboard.html,
        plainText: deliveryPayload.plainText === clipboard.plainText,
      },
    },
  };
}
