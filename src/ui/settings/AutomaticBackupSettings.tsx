import { useEffect, useState } from 'react';

import type {
  AutomaticBackupOptionsApplication,
  AutomaticBackupOptionsSnapshot,
} from '../../application/automatic-backup/automatic-backup-options';
import type { AutomaticBackupCadence } from '../../domain/automatic-backup';

const FAILURE_MESSAGE =
  "Couldn't update Automatic Backup. Check the backup location and try again.";

const STATUS_LABELS = {
  off: 'Off',
  ready: 'Ready',
  attention: 'Backup location needs attention',
  'no-location': 'No backup location selected',
} as const;

export function AutomaticBackupSettings({
  automaticBackup,
}: {
  readonly automaticBackup: AutomaticBackupOptionsApplication;
}) {
  const [snapshot, setSnapshot] = useState<AutomaticBackupOptionsSnapshot>();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    void automaticBackup.load().then(
      (loaded) => {
        if (active) setSnapshot(loaded);
      },
      () => {
        if (active) setFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, [automaticBackup]);

  async function run(action: () => Promise<AutomaticBackupOptionsSnapshot>) {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      setSnapshot(await action());
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  function updateCadence(cadence: AutomaticBackupCadence) {
    void run(() => automaticBackup.updateCadence(cadence));
  }

  const disabled = snapshot === undefined || busy;

  return (
    <section
      aria-labelledby="automatic-backup-heading"
      className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h3
        className="text-base font-semibold text-slate-950"
        id="automatic-backup-heading"
      >
        Automatic Backup
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Save verified backups to a folder you choose. Manual Export remains
        available in Import / Export.
      </p>

      <label
        className="mt-4 block text-sm font-medium text-slate-700"
        htmlFor="automatic-backup-cadence"
      >
        Automatic Backup
      </label>
      <select
        className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
        disabled={disabled}
        id="automatic-backup-cadence"
        onChange={(event) =>
          updateCadence(event.target.value as AutomaticBackupCadence)
        }
        value={snapshot?.cadence ?? 'weekly'}
      >
        <option value="off">Off</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-700">Backup location</p>
        <p
          aria-live="polite"
          className="mt-1 text-sm text-slate-700"
          role="status"
        >
          {snapshot === undefined
            ? 'Checking backup location…'
            : STATUS_LABELS[snapshot.status]}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={disabled}
            onClick={() => void run(() => automaticBackup.chooseFolder())}
            type="button"
          >
            {snapshot?.hasLocation ? 'Change Folder' : 'Choose Folder'}
          </button>
          {snapshot?.canReauthorize ? (
            <button
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              onClick={() => void run(() => automaticBackup.reauthorize())}
              type="button"
            >
              Reauthorize
            </button>
          ) : null}
        </div>
      </div>

      {failed ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {FAILURE_MESSAGE}
        </p>
      ) : null}
    </section>
  );
}
