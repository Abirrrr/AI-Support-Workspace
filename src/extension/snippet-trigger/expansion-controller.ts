import { SNIPPET_TRIGGER_MAX_LENGTH } from '../../application/snippet/snippet-trigger';
import type { FrameTriggerCatalogCache } from './frame-catalog-cache';
import { createEditorAdapter } from './editor-adapters';

export interface BeforeInputEventLike {
  readonly target: EventTarget | null;
  readonly inputType: string;
  readonly data: string | null;
  readonly isTrusted: boolean;
  readonly cancelable: boolean;
  readonly isComposing: boolean;
  preventDefault(): void;
}

export function toBeforeInputEventLike(
  event: unknown,
): BeforeInputEventLike | undefined {
  if (
    (typeof event !== 'object' && typeof event !== 'function') ||
    event === null
  )
    return undefined;

  try {
    const candidate = event as Partial<BeforeInputEventLike>;
    if (
      (candidate.target !== null &&
        typeof candidate.target !== 'object' &&
        typeof candidate.target !== 'function') ||
      typeof candidate.inputType !== 'string' ||
      (candidate.data !== null && typeof candidate.data !== 'string') ||
      typeof candidate.isTrusted !== 'boolean' ||
      typeof candidate.cancelable !== 'boolean' ||
      typeof candidate.isComposing !== 'boolean' ||
      typeof candidate.preventDefault !== 'function'
    ) {
      return undefined;
    }
    return candidate as BeforeInputEventLike;
  } catch {
    return undefined;
  }
}

export class SnippetExpansionController {
  private inserting = false;

  constructor(
    private readonly document: Document,
    private readonly cache: FrameTriggerCatalogCache,
  ) {}

  handleBeforeInput(event: BeforeInputEventLike): boolean {
    if (
      this.inserting ||
      !event.isTrusted ||
      !event.cancelable ||
      event.inputType !== 'insertText' ||
      event.data !== ' ' ||
      event.isComposing ||
      !this.cache.isEnabled
    ) {
      return false;
    }

    const adapter = createEditorAdapter(event.target, this.document);
    const candidate = adapter?.readTriggerCandidate(SNIPPET_TRIGGER_MAX_LENGTH);
    if (adapter === undefined || candidate === undefined) return false;
    const catalogEntry = this.cache.find(candidate.text.toLowerCase());
    if (catalogEntry === undefined) return false;

    this.inserting = true;
    try {
      if (
        !adapter.replaceTriggerWithPlainText(candidate, catalogEntry.content)
      ) {
        return false;
      }
      event.preventDefault();
      return true;
    } finally {
      this.inserting = false;
    }
  }
}
