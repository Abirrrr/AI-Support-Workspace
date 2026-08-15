import type { SnippetAssetRepository } from '../persistence/snippet-asset-repository';
import type { SnippetEntryRepository } from '../persistence/snippet-entry-repository';
import {
  validateSnippetAsset,
  type SnippetAssetMimeType,
} from '../../domain/snippet-asset';
import { containsLocalImageBlock } from '../../domain/snippet-content';
import type { TriggerCatalogEntryKind } from '../../shared/trigger-catalog-messages';
import {
  inspectClipboardImageDimensions,
  type ClipboardImageDimensions,
} from './clipboard-image-safety';
import { serializeSnippetClipboardText } from './snippet-clipboard-serializer';

export type SnippetDeliveryErrorCode =
  | 'snippet-unavailable'
  | 'stale-trigger'
  | 'unsupported-content'
  | 'asset-unavailable'
  | 'asset-ownership-invalid'
  | 'asset-invalid';

export class SnippetDeliveryError extends Error {
  constructor(readonly code: SnippetDeliveryErrorCode) {
    super('Snippet delivery is unavailable.');
    this.name = 'SnippetDeliveryError';
  }
}

export interface SnippetDeliveryRequest {
  readonly snippetId: string;
  readonly trigger: string;
  readonly kind: TriggerCatalogEntryKind;
}

export interface TextClipboardPlan {
  readonly kind: 'text';
  readonly snippetId: string;
  readonly plainText: string;
  readonly html: string;
}

export interface ImageClipboardPlan {
  readonly kind: 'image';
  readonly snippetId: string;
  readonly mimeType: SnippetAssetMimeType;
  readonly blob: Blob;
  readonly dimensions: ClipboardImageDimensions;
}

export type SnippetDeliveryPlan = TextClipboardPlan | ImageClipboardPlan;

export class SnippetDeliveryPlanner {
  constructor(
    private readonly snippetRepository: SnippetEntryRepository,
    private readonly assetRepository: SnippetAssetRepository,
  ) {}

  async plan(request: SnippetDeliveryRequest): Promise<SnippetDeliveryPlan> {
    const snippet = await this.snippetRepository.get(request.snippetId);
    if (snippet === undefined) {
      throw new SnippetDeliveryError('snippet-unavailable');
    }
    if (snippet.trigger !== request.trigger) {
      throw new SnippetDeliveryError('stale-trigger');
    }
    if (request.kind === 'text') {
      if (
        snippet.content.kind === 'image' ||
        containsLocalImageBlock(snippet.content)
      ) {
        throw new SnippetDeliveryError('unsupported-content');
      }
      return {
        kind: 'text',
        snippetId: snippet.id,
        ...serializeSnippetClipboardText(snippet.content),
      };
    }
    if (snippet.content.kind !== 'image') {
      throw new SnippetDeliveryError('unsupported-content');
    }
    const [asset, ownedAssets] = await Promise.all([
      this.assetRepository.get(snippet.content.assetId),
      this.assetRepository.listBySnippet(snippet.id),
    ]);
    if (asset === undefined) {
      throw new SnippetDeliveryError('asset-unavailable');
    }
    if (
      asset.snippetId !== snippet.id ||
      ownedAssets.length !== 1 ||
      ownedAssets[0]?.id !== asset.id
    ) {
      throw new SnippetDeliveryError('asset-ownership-invalid');
    }
    let validated;
    try {
      validated = await validateSnippetAsset(asset);
    } catch {
      throw new SnippetDeliveryError('asset-invalid');
    }
    const bytes = new Uint8Array(await validated.blob.arrayBuffer());
    return {
      kind: 'image',
      snippetId: snippet.id,
      mimeType: validated.mimeType,
      blob: validated.blob,
      dimensions: inspectClipboardImageDimensions(validated.mimeType, bytes),
    };
  }
}
