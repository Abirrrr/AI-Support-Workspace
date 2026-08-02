export const BACKUP_MESSAGES = {
  exportSuccess: 'Backup exported.',
  exportFailure: "Couldn't export your data. Try again.",
  tooLarge: 'This backup file is too large. Choose a file smaller than 25 MB.',
  readFailure: "Couldn't read this backup file. Choose another file.",
  invalid: "This isn't a valid AI Support Workspace backup file.",
  unsupportedVersion:
    "This backup version isn't supported by this version of AI Support Workspace.",
  restoreFailure:
    "Couldn't restore the backup. Your existing data was not changed.",
  restoreSuccess: 'Backup restored.',
  noSavedModel: 'No saved default model',
  settingsRestored: 'Settings restored',
} as const;

export type BackupExportErrorCode = 'too-large' | 'failure';
export type BackupImportErrorCode =
  'too-large' | 'read-failure' | 'invalid' | 'unsupported-version';

function messageForExportCode(code: BackupExportErrorCode): string {
  return code === 'too-large'
    ? BACKUP_MESSAGES.tooLarge
    : BACKUP_MESSAGES.exportFailure;
}

function messageForImportCode(code: BackupImportErrorCode): string {
  switch (code) {
    case 'too-large':
      return BACKUP_MESSAGES.tooLarge;
    case 'read-failure':
      return BACKUP_MESSAGES.readFailure;
    case 'unsupported-version':
      return BACKUP_MESSAGES.unsupportedVersion;
    case 'invalid':
      return BACKUP_MESSAGES.invalid;
  }
}

export class BackupExportError extends Error {
  constructor(
    readonly code: BackupExportErrorCode,
    cause?: unknown,
  ) {
    super(
      messageForExportCode(code),
      cause === undefined ? undefined : { cause },
    );
    this.name = 'BackupExportError';
  }
}

export class BackupImportError extends Error {
  constructor(
    readonly code: BackupImportErrorCode,
    cause?: unknown,
  ) {
    super(
      messageForImportCode(code),
      cause === undefined ? undefined : { cause },
    );
    this.name = 'BackupImportError';
  }
}

export class BackupRestoreError extends Error {
  constructor(cause: unknown) {
    super(BACKUP_MESSAGES.restoreFailure, { cause });
    this.name = 'BackupRestoreError';
  }
}
