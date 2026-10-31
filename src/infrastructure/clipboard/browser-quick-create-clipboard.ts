import {
  QuickCreateError,
  type QuickCreateClipboard,
  type QuickCreateDraft,
} from '../../application/snippet/quick-create-snippet';
import { convertPlainSnippetToRich } from '../../domain/snippet-content';
import {
  MAX_SNIPPET_ASSET_BYTES,
  validateSnippetAssetDraft,
  type SnippetAssetMimeType,
} from '../../domain/snippet-asset';
import {
  EncodedRasterSafetyError,
  inspectEncodedRasterDimensions,
  validateEncodedRasterDimensions,
} from '../../application/image/encoded-raster-safety';

export interface QuickCreatePermissionApi {
  contains(options: {
    readonly permissions: readonly string[];
  }): Promise<boolean>;
  request(options: {
    readonly permissions: readonly string[];
  }): Promise<boolean>;
}

export interface ClipboardSnapshotApi {
  read(): Promise<
    readonly {
      readonly types: readonly string[];
      getType(type: string): Promise<Blob>;
    }[]
  >;
}

type DecodeImage = (blob: Blob) => Promise<{
  readonly width: number;
  readonly height: number;
  close(): void;
}>;

export class BrowserQuickCreateClipboard implements QuickCreateClipboard {
  constructor(
    private readonly permissions: QuickCreatePermissionApi,
    private readonly clipboard: ClipboardSnapshotApi | undefined,
    private readonly decode: DecodeImage = (blob) => createImageBitmap(blob),
    private readonly isFocused: () => boolean = () =>
      document.visibilityState === 'visible' && document.hasFocus(),
  ) {}

  requestEnable(): Promise<boolean> {
    // No await before requesting: preserve the Options button's user gesture.
    return this.permissions.request({ permissions: ['clipboardRead'] });
  }

  private async requirePermission(): Promise<void> {
    let granted: boolean;
    try {
      granted = await this.permissions.contains({
        permissions: ['clipboardRead'],
      });
    } catch {
      throw new QuickCreateError('read-failed');
    }
    if (!granted) {
      throw new QuickCreateError('permission-required');
    }
  }

  async readDraft(): Promise<QuickCreateDraft> {
    try {
      await this.requirePermission();
      if (typeof this.clipboard?.read !== 'function')
        throw new QuickCreateError('api-unavailable');
      if (!this.isFocused()) throw new QuickCreateError('read-failed');
      const items = await this.clipboard.read();
      let result: QuickCreateDraft | undefined;
      // Deterministic representation preference, including across ClipboardItems.
      for (const type of ['image/png', 'image/jpeg', 'image/webp'] as const) {
        const item = items.find((candidate) => candidate.types.includes(type));
        if (item === undefined) continue;
        result = await this.imageDraft(await item.getType(type), type);
        break;
      }
      if (result === undefined) {
        if (
          items.some((item) =>
            item.types.some((type) => type.startsWith('image/')),
          )
        )
          throw new QuickCreateError('unsupported-image');
        const item = items.find((candidate) =>
          candidate.types.includes('text/plain'),
        );
        if (item === undefined)
          throw new QuickCreateError('empty-or-unsupported');
        const text = await (await item.getType('text/plain')).text();
        if (text.length === 0)
          throw new QuickCreateError('empty-or-unsupported');
        result = {
          kind: 'text',
          content: convertPlainSnippetToRich({ kind: 'plain', text }),
        };
      }
      await this.requirePermission();
      return result;
    } catch (error) {
      if (!(
        error instanceof QuickCreateError &&
        error.code === 'permission-required'
      ))
        await this.requirePermission();
      if (error instanceof QuickCreateError) throw error;
      // Raw API errors/clipboard payloads never escape this boundary.
      throw new QuickCreateError('read-failed');
    }
  }

  private async imageDraft(
    blob: Blob,
    mimeType: SnippetAssetMimeType,
  ): Promise<QuickCreateDraft> {
    try {
      if (blob.size > MAX_SNIPPET_ASSET_BYTES)
        throw new QuickCreateError('image-too-large');
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const dimensions = inspectEncodedRasterDimensions(mimeType, bytes); // Guard before any raster allocation.
      const asset = await validateSnippetAssetDraft({
        id: crypto.randomUUID(),
        mimeType,
        blob,
        byteSize: blob.size,
        originalFilename: null,
        createdAt: new Date().toISOString(),
      });
      const bitmap = await this.decode(blob);
      try {
        validateEncodedRasterDimensions(bitmap.width, bitmap.height);
        if (
          mimeType === 'image/png' &&
          (bitmap.width !== dimensions.width ||
            bitmap.height !== dimensions.height)
        )
          throw new QuickCreateError('invalid-image');
      } finally {
        bitmap.close();
      }
      return { kind: 'image', asset };
    } catch (error) {
      if (error instanceof QuickCreateError) throw error;
      throw new QuickCreateError(
        error instanceof EncodedRasterSafetyError &&
          error.code === 'image-too-large'
          ? 'image-too-large'
          : 'invalid-image',
      );
    }
  }
}
