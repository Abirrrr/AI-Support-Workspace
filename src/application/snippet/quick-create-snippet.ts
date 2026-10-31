import type { SnippetAssetDraft } from '../../domain/snippet-asset';
import type { RichSnippetContent } from '../../domain/snippet-content';

export type QuickCreateDraft =
  | { readonly kind: 'text'; readonly content: RichSnippetContent }
  | { readonly kind: 'image'; readonly asset: SnippetAssetDraft };

export type QuickCreateFailureCode =
  | 'permission-required'
  | 'api-unavailable'
  | 'read-failed'
  | 'empty-or-unsupported'
  | 'unsupported-image'
  | 'invalid-image'
  | 'image-too-large';

export class QuickCreateError extends Error {
  constructor(readonly code: QuickCreateFailureCode) {
    super(code);
    this.name = 'QuickCreateError';
  }
}

export interface QuickCreateClipboard {
  requestEnable(): Promise<boolean>;
  readDraft(): Promise<QuickCreateDraft>;
}

export interface QuickCreateNavigation {
  subscribe(listener: (intentId: string) => void): () => void;
}

export function quickCreateFailureMessage(error: unknown): string {
  const code = error instanceof QuickCreateError ? error.code : 'read-failed';
  const messages: Record<QuickCreateFailureCode, string> = {
    'permission-required':
      'Enable clipboard access to create a snippet from your clipboard, or choose Text or Image and paste manually.',
    'api-unavailable':
      'Clipboard reading is unavailable. Choose Text or Image and paste manually.',
    'read-failed':
      'We could not read the clipboard. Copy your content again and retry, or paste manually.',
    'empty-or-unsupported':
      'The clipboard is empty or has no supported Text or Image. Copy text or a screenshot, or paste manually.',
    'unsupported-image':
      'That clipboard image type is unsupported. Copy a PNG screenshot, or choose an image manually.',
    'invalid-image':
      'That clipboard image could not be validated. Copy a fresh screenshot or choose another image.',
    'image-too-large':
      'That image exceeds the safe image limits. Use an image up to 5 MiB, 8,192 pixels per side and 16,777,216 total pixels.',
  };
  return messages[code];
}
