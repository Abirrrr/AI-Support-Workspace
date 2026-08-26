import { type ChangeEvent, useEffect, useRef, useState } from 'react';

import {
  BACKUP_MESSAGES,
  BackupExportError,
  BackupImportError,
  BackupRestoreError,
} from '../../application/backup/backup-errors';
import type { PreparedBackupImport } from '../../application/backup/backup-service';
import type { BackupReminderSnapshot } from '../../application/backup/backup-reminder';
import { CatalogUnavailableAfterMutationError } from '../../application/snippet/catalog-mutation';

export interface ImportExportActions {
  exportBackup(): Promise<void>;
  loadBackupReminder(): Promise<BackupReminderSnapshot>;
  prepareImport(file: File): Promise<PreparedBackupImport>;
  restoreBackup(prepared: PreparedBackupImport): Promise<void>;
}

interface ImportExportViewProps {
  actions: ImportExportActions;
  onRestored(): void;
}

interface Feedback {
  readonly kind: 'success' | 'error';
  readonly message: string;
  readonly summary?: readonly string[];
}

function safeExportMessage(error: unknown): string {
  return error instanceof BackupExportError
    ? error.message
    : BACKUP_MESSAGES.exportFailure;
}

function safeImportMessage(error: unknown): string {
  return error instanceof BackupImportError
    ? error.message
    : BACKUP_MESSAGES.invalid;
}

function safeRestoreMessage(error: unknown): string {
  return error instanceof BackupRestoreError
    ? error.message
    : BACKUP_MESSAGES.restoreFailure;
}

export function ImportExportView({
  actions,
  onRestored,
}: ImportExportViewProps) {
  const [exporting, setExporting] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [prepared, setPrepared] = useState<PreparedBackupImport>();
  const [acknowledged, setAcknowledged] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<Feedback>();
  const [backupReminder, setBackupReminder] =
    useState<BackupReminderSnapshot>();
  const [importFeedback, setImportFeedback] = useState<Feedback>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewHeadingRef = useRef<HTMLHeadingElement>(null);
  const importStatusRef = useRef<HTMLDivElement>(null);
  const busy = exporting || processingFile || restoring;

  useEffect(() => {
    let active = true;
    void actions.loadBackupReminder().then(
      (snapshot) => {
        if (active) setBackupReminder(snapshot);
      },
      () => {
        if (active) {
          setBackupReminder({ lastSuccessfulBackupAt: null, status: 'never' });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [actions]);

  useEffect(() => {
    if (prepared) previewHeadingRef.current?.focus();
  }, [prepared]);

  useEffect(() => {
    if (importFeedback?.kind === 'error') importStatusRef.current?.focus();
  }, [importFeedback]);

  function clearPendingImport(clearStatus: boolean) {
    setPrepared(undefined);
    setAcknowledged(false);
    if (clearStatus) setImportFeedback(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function exportBackup() {
    if (busy) return;
    setExporting(true);
    setExportFeedback(undefined);

    try {
      await actions.exportBackup();
      try {
        setBackupReminder(await actions.loadBackupReminder());
      } catch {
        setBackupReminder({ lastSuccessfulBackupAt: null, status: 'never' });
      }
      setExportFeedback({
        kind: 'success',
        message: BACKUP_MESSAGES.exportSuccess,
      });
    } catch (error) {
      setExportFeedback({ kind: 'error', message: safeExportMessage(error) });
    } finally {
      setExporting(false);
    }
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    setPrepared(undefined);
    setAcknowledged(false);
    setImportFeedback(undefined);
    if (!file) return;

    setProcessingFile(true);
    try {
      setPrepared(await actions.prepareImport(file));
    } catch (error) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setImportFeedback({ kind: 'error', message: safeImportMessage(error) });
    } finally {
      setProcessingFile(false);
    }
  }

  async function restoreBackup() {
    if (!prepared || !acknowledged || busy) return;
    setRestoring(true);
    setImportFeedback(undefined);

    try {
      await actions.restoreBackup(prepared);
      const { knowledgeCount, snippetCount } = prepared.preview;
      clearPendingImport(false);
      setImportFeedback({
        kind: 'success',
        message: BACKUP_MESSAGES.restoreSuccess,
        summary: [
          `Knowledge restored: ${knowledgeCount}`,
          `Snippets restored: ${snippetCount}`,
          BACKUP_MESSAGES.settingsRestored,
        ],
      });
      onRestored();
    } catch (error) {
      if (error instanceof CatalogUnavailableAfterMutationError) {
        const { knowledgeCount, snippetCount } = prepared.preview;
        clearPendingImport(false);
        setImportFeedback({
          kind: 'success',
          message:
            'Backup restored. Trigger expansion is temporarily unavailable.',
          summary: [
            `Knowledge restored: ${knowledgeCount}`,
            `Snippets restored: ${snippetCount}`,
            BACKUP_MESSAGES.settingsRestored,
          ],
        });
        onRestored();
      } else {
        setImportFeedback({
          kind: 'error',
          message: safeRestoreMessage(error),
        });
      }
    } finally {
      setRestoring(false);
    }
  }

  return (
    <section aria-labelledby="import-export-heading" className="mt-8">
      <h2
        className="text-xl font-semibold text-slate-950"
        id="import-export-heading"
      >
        Import / Export
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Download a local backup or restore one that you moved from another
        profile or computer.
      </p>

      <section
        aria-busy={exporting}
        aria-labelledby="export-backup-heading"
        className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h3 className="font-semibold text-slate-950" id="export-backup-heading">
          Export backup
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Export your current Knowledge, Snippets, local image assets, and saved
          Settings as one JSON file.
        </p>
        <dl className="mt-4 text-sm">
          <div>
            <dt className="font-medium text-slate-700">Last backup</dt>
            <dd className="mt-1 text-slate-950">
              {backupReminder?.lastSuccessfulBackupAt === undefined
                ? 'Loading…'
                : backupReminder.lastSuccessfulBackupAt === null
                  ? 'Never'
                  : new Intl.DateTimeFormat(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(backupReminder.lastSuccessfulBackupAt))}
            </dd>
          </div>
        </dl>
        {backupReminder?.status === 'never' ||
        backupReminder?.status === 'due' ? (
          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Backup recommended</p>
            <p className="mt-1">
              {backupReminder.status === 'never'
                ? 'Create a backup so you have a recovery copy of your local data.'
                : 'Your last backup is at least 30 days old.'}
            </p>
          </div>
        ) : null}
        <p className="mt-3 text-sm font-medium text-amber-800">
          Backup files may contain merchant knowledge, internal notes, reusable
          support replies, and local images. Store them securely.
        </p>
        <button
          className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          onClick={() => void exportBackup()}
          type="button"
        >
          {exporting ? 'Exporting…' : 'Export backup'}
        </button>
        <div
          aria-live={exportFeedback?.kind === 'error' ? 'assertive' : 'polite'}
          className="mt-4 min-h-6 text-sm"
          role={exportFeedback?.kind === 'error' ? 'alert' : 'status'}
        >
          {exportFeedback ? (
            <p
              className={
                exportFeedback.kind === 'error'
                  ? 'text-red-700'
                  : 'text-emerald-700'
              }
            >
              {exportFeedback.message}
            </p>
          ) : null}
        </div>
      </section>

      <section
        aria-busy={processingFile || restoring}
        aria-labelledby="restore-backup-heading"
        className="mt-6 max-w-full rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h3
          className="font-semibold text-slate-950"
          id="restore-backup-heading"
        >
          Restore backup
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Choose an AI Support Workspace JSON backup to validate before
          restoring it.
        </p>
        <label
          className="mt-4 block text-sm font-medium text-slate-700"
          htmlFor="backup-file"
        >
          Backup file
        </label>
        <input
          accept=".json,application/json"
          className="mt-1 block max-w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold file:text-slate-800 hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
          id="backup-file"
          onChange={(event) => void selectFile(event)}
          ref={fileInputRef}
          type="file"
        />
        {processingFile ? (
          <p className="mt-3 text-sm text-slate-600">Validating backup…</p>
        ) : null}

        {prepared ? (
          <div className="mt-5 rounded-lg bg-slate-50 p-4">
            <h3
              className="font-semibold text-slate-950 outline-none focus:ring-2 focus:ring-blue-500"
              ref={previewHeadingRef}
              tabIndex={-1}
            >
              Backup preview
            </h3>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-slate-600">Format version</dt>
                <dd className="text-slate-950">
                  {prepared.preview.formatVersion}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="font-medium text-slate-600">Filename</dt>
                <dd className="break-all text-slate-950">
                  {prepared.preview.filename}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Exported at</dt>
                <dd className="text-slate-950">
                  {prepared.preview.exportedAt}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Knowledge</dt>
                <dd className="text-slate-950">
                  {prepared.preview.knowledgeCount}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">Snippets</dt>
                <dd className="text-slate-950">
                  {prepared.preview.snippetCount}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-600">
                  Local image assets
                </dt>
                <dd className="text-slate-950">
                  {prepared.preview.assetCount}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-medium text-slate-600">
                  Saved default model
                </dt>
                <dd className="break-all text-slate-950">
                  {prepared.preview.defaultModel ??
                    BACKUP_MESSAGES.noSavedModel}
                </dd>
              </div>
            </dl>

            <p className="mt-5 text-sm font-semibold text-red-800">
              Restoring this backup will replace your current Knowledge,
              Snippets, local image assets, and saved Settings.
            </p>
            {prepared.preview.triggerWarning ? (
              <p className="mt-3 text-sm font-semibold text-amber-800">
                {prepared.preview.triggerWarning}
              </p>
            ) : null}
            <label className="mt-3 flex items-start gap-2 text-sm text-slate-800">
              <input
                checked={acknowledged}
                className="mt-0.5"
                disabled={busy}
                onChange={(event) => setAcknowledged(event.target.checked)}
                type="checkbox"
              />
              <span>
                I understand that my current local data will be replaced.
              </span>
            </label>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!acknowledged || busy}
                onClick={() => void restoreBackup()}
                type="button"
              >
                {restoring ? 'Restoring…' : 'Restore backup'}
              </button>
              <button
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
                onClick={() => clearPendingImport(true)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}

        <div
          aria-live={importFeedback?.kind === 'error' ? 'assertive' : 'polite'}
          className="mt-4 min-h-6 text-sm outline-none"
          ref={importStatusRef}
          role={importFeedback?.kind === 'error' ? 'alert' : 'status'}
          tabIndex={importFeedback?.kind === 'error' ? -1 : undefined}
        >
          {importFeedback ? (
            <div
              className={
                importFeedback.kind === 'error'
                  ? 'text-red-700'
                  : 'text-emerald-700'
              }
            >
              <p>{importFeedback.message}</p>
              {importFeedback.summary ? (
                <ul className="mt-2 list-disc pl-5">
                  {importFeedback.summary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
