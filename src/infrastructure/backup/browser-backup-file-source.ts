import type { BackupFileSource } from '../../application/backup/backup-ports';

export class BrowserBackupFileSource implements BackupFileSource {
  constructor(private readonly file: File) {}

  get name(): string {
    return this.file.name;
  }

  get size(): number {
    return this.file.size;
  }

  readText(): Promise<string> {
    return this.file.text();
  }
}
