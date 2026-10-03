import type { AutomaticPasteDiagnosticsDownloadPort } from '../../extension/options/automatic-paste-diagnostics-client';

export interface BrowserDiagnosticsDownloadEnvironment {
  readonly document: Document;
  createObjectUrl(blob: Blob): string;
  revokeObjectUrl(url: string): void;
}

function createDefaultEnvironment(): BrowserDiagnosticsDownloadEnvironment {
  return {
    document: globalThis.document,
    createObjectUrl: (blob) => URL.createObjectURL(blob),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
  };
}

export class BrowserAutomaticPasteDiagnosticsDownloadAdapter implements AutomaticPasteDiagnosticsDownloadPort {
  constructor(
    private readonly environment: BrowserDiagnosticsDownloadEnvironment = createDefaultEnvironment(),
  ) {}

  async download(serialized: string, filename: string): Promise<void> {
    const blob = new Blob([serialized], { type: 'application/json' });
    const objectUrl = this.environment.createObjectUrl(blob);
    const anchor = this.environment.document.createElement('a');
    try {
      anchor.href = objectUrl;
      anchor.download = filename;
      anchor.hidden = true;
      this.environment.document.body.append(anchor);
      anchor.click();
    } finally {
      anchor.remove();
      this.environment.revokeObjectUrl(objectUrl);
    }
  }
}
