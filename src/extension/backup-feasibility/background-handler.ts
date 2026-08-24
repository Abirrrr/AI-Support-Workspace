import {
  isDirectoryHandleCompatible,
  SELECTED_FOLDER_FEASIBILITY_MARKER,
  type SelectedFolderFeasibilityReport,
} from './contracts';
import {
  classifyReadWritePermission,
  runExactOwnedFileRoundTrip,
} from './file-round-trip';
import { SelectedFolderScratchRepository } from './scratch-repository';

export const FEASIBILITY_BACKGROUND_ROUND_TRIP =
  'native-dev-selected-folder-background-round-trip';
export const FEASIBILITY_BACKGROUND_SAFE_CHECK =
  'native-dev-selected-folder-background-safe-check';

type FeasibilityMessage =
  | { readonly type: typeof FEASIBILITY_BACKGROUND_ROUND_TRIP }
  | { readonly type: typeof FEASIBILITY_BACKGROUND_SAFE_CHECK };

export interface FeasibilityRuntime {
  readonly onMessage: {
    addListener(
      listener: (
        message: unknown,
        sender: unknown,
        sendResponse: (response: unknown) => void,
      ) => boolean | undefined,
    ): void;
  };
}

export interface FeasibilityScratchPort {
  read(): Promise<
    | {
        readonly handle: import('./contracts').FeasibilityDirectoryHandle;
        readonly selectionSessionId: string;
        readonly report: SelectedFolderFeasibilityReport;
      }
    | undefined
  >;
  write(record: {
    readonly handle: import('./contracts').FeasibilityDirectoryHandle;
    readonly selectionSessionId: string;
    readonly report: SelectedFolderFeasibilityReport;
  }): Promise<void>;
}

function isMessage(message: unknown): message is FeasibilityMessage {
  if (typeof message !== 'object' || message === null || !('type' in message)) {
    return false;
  }
  return (
    message.type === FEASIBILITY_BACKGROUND_ROUND_TRIP ||
    message.type === FEASIBILITY_BACKGROUND_SAFE_CHECK
  );
}

export function registerSelectedFolderFeasibilityBackground(
  runtime: FeasibilityRuntime,
  repository: FeasibilityScratchPort = new SelectedFolderScratchRepository(),
): void {
  runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!isMessage(message)) return;
    void (async () => {
      try {
        const record = await repository.read();
        if (
          record === undefined ||
          !isDirectoryHandleCompatible(record.handle)
        ) {
          sendResponse({
            ok: false,
            marker: SELECTED_FOLDER_FEASIBILITY_MARKER,
            outcome: 'background-handle-unavailable',
          });
          return;
        }

        const permissionState = await classifyReadWritePermission(
          record.handle,
        );
        let report: SelectedFolderFeasibilityReport = {
          ...record.report,
          handleRecovered: true,
          backgroundHandleRecovered: true,
          permissionState,
          lastOutcome: 'background-permission-queried',
        };
        if (message.type === FEASIBILITY_BACKGROUND_ROUND_TRIP) {
          const result = await runExactOwnedFileRoundTrip(
            record.handle,
            crypto.randomUUID(),
          );
          report = {
            ...report,
            permissionState: result.permissionState,
            backgroundWriteSucceeded: result.writeSucceeded,
            backgroundReadVerified: result.readVerified,
            backgroundDeleteSucceeded: result.deleteSucceeded,
            unavailableLocationFailsSafe:
              report.unavailableLocationFailsSafe ||
              result.unavailableLocationFailsSafe,
            testArtifactMayRemain: result.testArtifactMayRemain,
            lastOutcome: result.outcome,
          };
        } else {
          report = {
            ...report,
            unavailableLocationFailsSafe: permissionState !== 'granted',
            lastOutcome:
              permissionState === 'granted'
                ? 'location-still-authorized'
                : 'unavailable-location-failed-safe',
          };
        }
        await repository.write({ ...record, report });
        sendResponse({ ok: true, report });
      } catch {
        sendResponse({
          ok: false,
          marker: SELECTED_FOLDER_FEASIBILITY_MARKER,
          outcome: 'background-operation-failed-closed',
        });
      }
    })();
    return true;
  });
}
