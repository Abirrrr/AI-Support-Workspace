export const SELECTED_FOLDER_FEASIBILITY_MARKER =
  'native-dev-selected-folder-backup-feasibility-v1';

export type FeasibilityPermissionState =
  'granted' | 'prompt' | 'denied' | 'unsupported/error' | 'not-checked';

export interface FeasibilityFileHandle {
  readonly kind: 'file';
  readonly name: string;
  createWritable(): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
  }>;
  getFile(): Promise<{ text(): Promise<string> }>;
  isSameEntry?(other: FeasibilityFileHandle): Promise<boolean>;
}

export interface FeasibilityDirectoryHandle {
  readonly kind: 'directory';
  readonly name: string;
  queryPermission(options: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission?(options: { mode: 'readwrite' }): Promise<PermissionState>;
  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<FeasibilityFileHandle>;
  removeEntry(name: string): Promise<void>;
  isSameEntry?(other: FeasibilityDirectoryHandle): Promise<boolean>;
}

export interface SelectedFolderFeasibilityReport {
  readonly marker: typeof SELECTED_FOLDER_FEASIBILITY_MARKER;
  pickerAvailable: boolean;
  pickerOpened: boolean;
  directorySelected: boolean;
  handleStored: boolean;
  handleRecovered: boolean;
  optionsReloadRecovered: boolean;
  browserRestartRecovered: boolean;
  permissionState: FeasibilityPermissionState;
  backgroundHandleRecovered: boolean;
  backgroundWriteSucceeded: boolean;
  backgroundReadVerified: boolean;
  backgroundDeleteSucceeded: boolean;
  sameEntrySupported: boolean;
  sameFolderRecognized: boolean;
  differentFolderDistinguished: boolean;
  unavailableLocationFailsSafe: boolean;
  scratchCleanupSucceeded: boolean;
  testArtifactMayRemain: boolean;
  lastOutcome: string;
}

export interface SelectedFolderScratchRecord {
  readonly handle: FeasibilityDirectoryHandle;
  readonly selectionSessionId: string;
  readonly report: SelectedFolderFeasibilityReport;
}

export function createEmptyFeasibilityReport(): SelectedFolderFeasibilityReport {
  return {
    marker: SELECTED_FOLDER_FEASIBILITY_MARKER,
    pickerAvailable: false,
    pickerOpened: false,
    directorySelected: false,
    handleStored: false,
    handleRecovered: false,
    optionsReloadRecovered: false,
    browserRestartRecovered: false,
    permissionState: 'not-checked',
    backgroundHandleRecovered: false,
    backgroundWriteSucceeded: false,
    backgroundReadVerified: false,
    backgroundDeleteSucceeded: false,
    sameEntrySupported: false,
    sameFolderRecognized: false,
    differentFolderDistinguished: false,
    unavailableLocationFailsSafe: false,
    scratchCleanupSucceeded: false,
    testArtifactMayRemain: false,
    lastOutcome: 'not-run',
  };
}

export function isDirectoryHandleCompatible(
  value: unknown,
): value is FeasibilityDirectoryHandle {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<FeasibilityDirectoryHandle>;
  return (
    candidate.kind === 'directory' &&
    typeof candidate.queryPermission === 'function' &&
    typeof candidate.getFileHandle === 'function' &&
    typeof candidate.removeEntry === 'function'
  );
}
