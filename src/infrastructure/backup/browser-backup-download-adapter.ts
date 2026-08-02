import type { BackupDownloadPort } from '../../application/backup/backup-ports';

export interface BrowserBackupDownloadEnvironment {
  readonly document: Document;
  createObjectUrl(blob: Blob): string;
  revokeObjectUrl(url: string): void;
}

function createDefaultEnvironment(): BrowserBackupDownloadEnvironment {
  return {
    document: globalThis.document,
    createObjectUrl: (blob) => URL.createObjectURL(blob),
    revokeObjectUrl: (url) => URL.revokeObjectURL(url),
  };
}

export class BrowserBackupDownloadAdapter implements BackupDownloadPort {
  constructor(
    private readonly environment: BrowserBackupDownloadEnvironment = createDefaultEnvironment(),
  ) {}

  async download(serializedBackup: string, filename: string): Promise<void> {
    const blob = new Blob([serializedBackup], { type: 'application/json' });
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
