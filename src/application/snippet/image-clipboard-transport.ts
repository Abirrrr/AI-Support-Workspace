import type { ImageClipboardPlan } from './snippet-delivery-planner';

export type NativeImageClipboardErrorCode =
  | 'native-permission-required'
  | 'host-unavailable'
  | 'host-version-mismatch'
  | 'invalid-host-response'
  | 'native-delivery-busy'
  | 'image-invalid'
  | 'image-decode-failed'
  | 'image-too-large'
  | 'clipboard-write-failed';

export class NativeImageClipboardError extends Error {
  constructor(readonly code: NativeImageClipboardErrorCode) {
    super('Windows Image Snippet delivery is unavailable.');
    this.name = 'NativeImageClipboardError';
  }
}

export type NativeClipboardCapabilityStatus =
  | 'unsupported-platform'
  | 'permission-not-granted'
  | 'host-unavailable'
  | 'host-version-mismatch'
  | 'invalid-host-response'
  | 'ready';

export interface ImagePngPreparer {
  prepare(plan: ImageClipboardPlan): Promise<Uint8Array>;
}

export interface ImageClipboardTransport {
  writePng(pngBytes: Uint8Array): Promise<void>;
}

export interface NativeClipboardCapability {
  getStatus(): Promise<NativeClipboardCapabilityStatus>;
}
