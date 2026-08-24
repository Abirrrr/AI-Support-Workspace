import { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
  createEmptyFeasibilityReport,
  isDirectoryHandleCompatible,
  type FeasibilityDirectoryHandle,
  type SelectedFolderFeasibilityReport,
  type SelectedFolderScratchRecord,
} from '../backup-feasibility/contracts';
import {
  FEASIBILITY_BACKGROUND_ROUND_TRIP,
  FEASIBILITY_BACKGROUND_SAFE_CHECK,
} from '../backup-feasibility/background-handler';
import { classifyReadWritePermission } from '../backup-feasibility/file-round-trip';
import { SelectedFolderScratchRepository } from '../backup-feasibility/scratch-repository';

interface DiagnosticRuntime {
  sendMessage(message: unknown): Promise<unknown>;
}

type DirectoryPicker = (options: {
  mode: 'readwrite';
}) => Promise<FeasibilityDirectoryHandle>;

interface BackgroundResponse {
  readonly ok: boolean;
  readonly report?: SelectedFolderFeasibilityReport;
  readonly outcome?: string;
}

const sessionId = crypto.randomUUID();
const diagnosticButtonClassName =
  'min-h-10 rounded-md border border-slate-400 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:border-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2';
const diagnosticCleanupButtonClassName =
  'min-h-10 rounded-md border border-red-400 bg-red-50 px-3 py-2 text-sm font-medium text-red-900 shadow-sm transition-colors hover:border-red-500 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2';

function getDirectoryPicker(): DirectoryPicker | undefined {
  const candidate = (
    globalThis as typeof globalThis & {
      showDirectoryPicker?: DirectoryPicker;
    }
  ).showDirectoryPicker;
  return typeof candidate === 'function'
    ? candidate.bind(globalThis)
    : undefined;
}

function Diagnostic({ runtime }: { readonly runtime: DiagnosticRuntime }) {
  const repository = useMemo(() => new SelectedFolderScratchRepository(), []);
  const [record, setRecord] = useState<SelectedFolderScratchRecord>();
  const [report, setReport] = useState<SelectedFolderFeasibilityReport>(() => ({
    ...createEmptyFeasibilityReport(),
    pickerAvailable: getDirectoryPicker() !== undefined,
  }));

  const persist = async (
    handle: FeasibilityDirectoryHandle,
    nextReport: SelectedFolderFeasibilityReport,
    selectionSessionId = record?.selectionSessionId ?? sessionId,
  ) => {
    const nextRecord = { handle, report: nextReport, selectionSessionId };
    await repository.write(nextRecord);
    setRecord(nextRecord);
    setReport(nextReport);
  };

  useEffect(() => {
    void repository
      .read()
      .then(async (stored) => {
        if (
          stored === undefined ||
          !isDirectoryHandleCompatible(stored.handle)
        ) {
          return;
        }
        const permissionState = await classifyReadWritePermission(
          stored.handle,
        );
        const nextReport = {
          ...stored.report,
          pickerAvailable: getDirectoryPicker() !== undefined,
          handleRecovered: true,
          optionsReloadRecovered: stored.selectionSessionId !== sessionId,
          permissionState,
          lastOutcome: 'options-handle-recovered',
        };
        await persist(stored.handle, nextReport, stored.selectionSessionId);
      })
      .catch(() =>
        setReport((current) => ({
          ...current,
          lastOutcome: 'scratch-recovery-failed-closed',
        })),
      );
    // This is a one-time recovery probe for the current Options lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repository]);

  const chooseFolder = () => {
    const picker = getDirectoryPicker();
    if (picker === undefined) {
      setReport((current) => ({
        ...current,
        pickerAvailable: false,
        lastOutcome: 'directory-picker-unavailable',
      }));
      return;
    }
    // The picker is invoked synchronously from the click handler before any await.
    const selection = picker({ mode: 'readwrite' });
    void selection
      .then(async (handle) => {
        const permissionState = await classifyReadWritePermission(handle);
        const nextReport = {
          ...createEmptyFeasibilityReport(),
          pickerAvailable: true,
          pickerOpened: true,
          directorySelected: true,
          handleStored: true,
          handleRecovered: true,
          permissionState,
          lastOutcome: 'directory-handle-stored',
        };
        try {
          await persist(handle, nextReport, sessionId);
        } catch {
          setReport({
            ...nextReport,
            handleStored: false,
            lastOutcome: 'directory-handle-store-failed',
          });
        }
      })
      .catch(() =>
        setReport((current) => ({
          ...current,
          pickerOpened: true,
          lastOutcome: 'directory-picker-cancelled-or-failed',
        })),
      );
  };

  const reauthorize = () => {
    const handle = record?.handle;
    if (handle?.requestPermission === undefined) {
      setReport((current) => ({
        ...current,
        lastOutcome: 'reauthorization-unsupported-or-no-handle',
      }));
      return;
    }
    // Permission request is invoked synchronously from this explicit click.
    const request = handle.requestPermission({ mode: 'readwrite' });
    void request.then(async () => {
      const permissionState = await classifyReadWritePermission(handle);
      await persist(handle, {
        ...report,
        permissionState,
        lastOutcome: 'reauthorization-completed',
      });
    });
  };

  const compareFolder = (expectedSame: boolean) => {
    const primary = record?.handle;
    const picker = getDirectoryPicker();
    if (primary === undefined || picker === undefined) return;
    const selection = picker({ mode: 'readwrite' });
    void selection.then(async (candidate) => {
      const compareEntry = primary.isSameEntry;
      const supported = typeof compareEntry === 'function';
      const same = supported
        ? await compareEntry.call(primary, candidate)
        : false;
      await persist(primary, {
        ...report,
        sameEntrySupported: supported,
        sameFolderRecognized:
          report.sameFolderRecognized || (expectedSame && same),
        differentFolderDistinguished:
          report.differentFolderDistinguished || (!expectedSame && !same),
        lastOutcome: supported
          ? expectedSame === same
            ? 'directory-identity-matched-expectation'
            : 'directory-identity-did-not-match-expectation'
          : 'directory-identity-unsupported',
      });
    });
  };

  const runBackground = async (type: string) => {
    try {
      const response = (await runtime.sendMessage({
        type,
      })) as BackgroundResponse;
      if (response.ok && response.report !== undefined) {
        const stored = await repository.read();
        if (stored !== undefined) setRecord(stored);
        setReport(response.report);
      } else {
        setReport((current) => ({
          ...current,
          lastOutcome: response.outcome ?? 'background-failed-closed',
        }));
      }
    } catch {
      setReport((current) => ({
        ...current,
        lastOutcome: 'background-message-failed-closed',
      }));
    }
  };

  const confirmBrowserRestart = async () => {
    if (record === undefined) return;
    await persist(record.handle, {
      ...report,
      browserRestartRecovered: true,
      lastOutcome: 'browser-restart-manually-confirmed',
    });
  };

  const clearScratch = async () => {
    try {
      await repository.clear();
      setRecord(undefined);
      setReport({
        ...createEmptyFeasibilityReport(),
        pickerAvailable: getDirectoryPicker() !== undefined,
        scratchCleanupSucceeded: true,
        lastOutcome: 'scratch-state-cleared',
      });
    } catch {
      setReport((current) => ({
        ...current,
        scratchCleanupSucceeded: false,
        lastOutcome: 'scratch-cleanup-failed',
      }));
    }
  };

  return (
    <section
      aria-labelledby="m14-m0-title"
      className="mx-auto my-6 max-w-5xl rounded-lg border border-amber-500 bg-amber-50 p-5 text-slate-950"
    >
      <h2 className="text-lg font-semibold" id="m14-m0-title">
        M14-M.0 selected-folder feasibility (native-dev only)
      </h2>
      <p className="mt-2 text-sm">
        Use only a disposable test folder. This diagnostic never lists folder
        contents and the service worker touches only its exact random test
        artifact.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className={diagnosticButtonClassName}
          type="button"
          onClick={chooseFolder}
        >
          Choose disposable folder
        </button>
        <button
          className={diagnosticButtonClassName}
          type="button"
          onClick={reauthorize}
        >
          Reauthorize stored folder
        </button>
        <button
          className={diagnosticButtonClassName}
          type="button"
          onClick={() => void runBackground(FEASIBILITY_BACKGROUND_ROUND_TRIP)}
        >
          Run service-worker round trip
        </button>
        <button
          className={diagnosticButtonClassName}
          type="button"
          onClick={() => compareFolder(true)}
        >
          Compare re-selected same folder
        </button>
        <button
          className={diagnosticButtonClassName}
          type="button"
          onClick={() => compareFolder(false)}
        >
          Compare a different folder
        </button>
        <button
          className={diagnosticButtonClassName}
          type="button"
          onClick={() => void runBackground(FEASIBILITY_BACKGROUND_SAFE_CHECK)}
        >
          Check revoked/unavailable safely
        </button>
        <button
          className={diagnosticButtonClassName}
          type="button"
          onClick={() => void confirmBrowserRestart()}
        >
          Confirm after browser restart
        </button>
        <button
          className={diagnosticCleanupButtonClassName}
          type="button"
          onClick={() => void clearScratch()}
        >
          Clear feasibility scratch state
        </button>
      </div>
      <p className="mt-4 text-xs">
        Privacy-safe report (contains no folder path, folder name, directory
        listing, or user content):
      </p>
      <pre className="mt-2 max-h-96 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-50">
        {JSON.stringify(report, null, 2)}
      </pre>
    </section>
  );
}

export function registerSelectedFolderFeasibilityDiagnostic(
  runtime: DiagnosticRuntime,
): void {
  const host = document.createElement('div');
  host.dataset.diagnostic = 'm14-m0-selected-folder-feasibility';
  document.body.append(host);
  createRoot(host).render(<Diagnostic runtime={runtime} />);
}
