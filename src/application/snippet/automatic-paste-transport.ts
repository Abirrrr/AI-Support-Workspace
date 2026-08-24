export type AutomaticPasteResult =
  | 'paste-issued'
  | 'clipboard-only'
  | 'unsafe-focus'
  | 'not-foreground'
  | 'clipboard-changed'
  | 'unsafe-keyboard-state'
  | 'busy'
  | 'native-unavailable'
  | 'input-injection-failed'
  | 'indeterminate';

export interface NativePasteContext {
  readonly foregroundWindowHandle: string;
  readonly rootWindowHandle: string;
  readonly processId: number;
  readonly clipboardSequenceNumber: number;
}

export interface AutomaticPasteRequest extends NativePasteContext {
  readonly activationId: string;
}

export interface NativePasteAttemptDiagnostic {
  readonly sendInputRequestedCount: number;
  readonly sendInputInsertedCount: number;
  readonly sendInputStructSize: number;
  readonly sendInputLastError: number;
  readonly foregroundValidationPassed: boolean;
  readonly rootWindowValidationPassed: boolean;
  readonly pidValidationPassed: boolean;
  readonly clipboardSequenceValidationPassed: boolean;
  readonly modifierValidationPassed: boolean;
  readonly hostSessionMatchesTarget: boolean | null;
  readonly hostIntegrityRelation:
    'same' | 'host-lower' | 'host-higher' | 'unknown';
}

export class AutomaticPasteUnavailableError extends Error {
  constructor() {
    super('Automatic paste is unavailable.');
    this.name = 'AutomaticPasteUnavailableError';
  }
}

/** Shared post-clipboard capability for both Text and Image delivery. */
export interface AutomaticPasteTransport {
  capturePasteContext(activationId: string): Promise<NativePasteContext>;
  requestPaste(request: AutomaticPasteRequest): Promise<AutomaticPasteResult>;
  takeLastPasteAttemptDiagnostic?(): NativePasteAttemptDiagnostic | undefined;
}
