import {
  NativeImageClipboardError,
  type ImagePngPreparer,
} from '../../application/snippet/image-clipboard-transport';
import {
  ClipboardImageSafetyError,
  inspectClipboardImageDimensions,
  validateClipboardImageDimensions,
} from '../../application/snippet/clipboard-image-safety';
import type { ImageClipboardPlan } from '../../application/snippet/snippet-delivery-planner';
import { MAX_SNIPPET_ASSET_BYTES } from '../../domain/snippet-asset';

interface RasterCanvas {
  width: number;
  height: number;
  getContext(
    contextId: '2d',
  ): Pick<OffscreenCanvasRenderingContext2D, 'drawImage'> | null;
  convertToBlob(options: { readonly type: 'image/png' }): Promise<Blob>;
}

export interface BrowserImagePngEnvironment {
  createImageBitmap(
    image: ImageBitmapSource,
    options: ImageBitmapOptions,
  ): Promise<Pick<ImageBitmap, 'width' | 'height' | 'close'>>;
  createCanvas(width: number, height: number): RasterCanvas;
}

function defaultEnvironment(): BrowserImagePngEnvironment {
  return {
    createImageBitmap: (image, options) =>
      globalThis.createImageBitmap(image, options),
    createCanvas: (width, height) => new OffscreenCanvas(width, height),
  };
}

function mapPreparationError(error: unknown): NativeImageClipboardError {
  if (
    error instanceof ClipboardImageSafetyError &&
    error.code === 'image-too-large'
  ) {
    return new NativeImageClipboardError('image-too-large');
  }
  if (error instanceof NativeImageClipboardError) return error;
  return new NativeImageClipboardError('image-decode-failed');
}

export class BrowserImagePngPreparer implements ImagePngPreparer {
  constructor(
    private readonly environment: BrowserImagePngEnvironment = defaultEnvironment(),
  ) {}

  async prepare(plan: ImageClipboardPlan): Promise<Uint8Array> {
    try {
      const sourceBytes = new Uint8Array(await plan.blob.arrayBuffer());
      const dimensions = inspectClipboardImageDimensions(
        plan.mimeType,
        sourceBytes,
      );
      if (
        dimensions.width !== plan.dimensions.width ||
        dimensions.height !== plan.dimensions.height
      ) {
        throw new NativeImageClipboardError('image-invalid');
      }

      if (plan.mimeType === 'image/png') {
        if (sourceBytes.byteLength > MAX_SNIPPET_ASSET_BYTES) {
          throw new NativeImageClipboardError('image-too-large');
        }
        return sourceBytes;
      }

      const ownedBytes = new Uint8Array(sourceBytes.byteLength);
      ownedBytes.set(sourceBytes);
      const source = new Blob([ownedBytes.buffer], { type: plan.mimeType });
      const bitmap = await this.environment.createImageBitmap(source, {
        imageOrientation: 'from-image',
      });
      let canvas: RasterCanvas | undefined;
      try {
        const decodedDimensions = validateClipboardImageDimensions(
          bitmap.width,
          bitmap.height,
        );
        canvas = this.environment.createCanvas(
          decodedDimensions.width,
          decodedDimensions.height,
        );
        const context = canvas.getContext('2d');
        if (context === null) {
          throw new NativeImageClipboardError('image-decode-failed');
        }
        context.drawImage(bitmap as CanvasImageSource, 0, 0);
        const png = await canvas.convertToBlob({ type: 'image/png' });
        if (png.type !== 'image/png' || png.size > MAX_SNIPPET_ASSET_BYTES) {
          throw new NativeImageClipboardError(
            png.size > MAX_SNIPPET_ASSET_BYTES
              ? 'image-too-large'
              : 'image-invalid',
          );
        }
        const pngBytes = new Uint8Array(await png.arrayBuffer());
        const pngDimensions = inspectClipboardImageDimensions(
          'image/png',
          pngBytes,
        );
        if (
          pngDimensions.width !== decodedDimensions.width ||
          pngDimensions.height !== decodedDimensions.height
        ) {
          throw new NativeImageClipboardError('image-invalid');
        }
        return pngBytes;
      } finally {
        bitmap.close();
        if (canvas !== undefined) {
          canvas.width = 0;
          canvas.height = 0;
        }
      }
    } catch (error) {
      throw mapPreparationError(error);
    }
  }
}
