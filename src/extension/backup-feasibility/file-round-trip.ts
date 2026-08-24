import type {
  FeasibilityDirectoryHandle,
  FeasibilityPermissionState,
} from './contracts';

const ARTIFACT_PREFIX = 'ai-support-workspace-feasibility-';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface FileRoundTripResult {
  readonly permissionState: FeasibilityPermissionState;
  readonly writeSucceeded: boolean;
  readonly readVerified: boolean;
  readonly deleteSucceeded: boolean;
  readonly unavailableLocationFailsSafe: boolean;
  readonly testArtifactMayRemain: boolean;
  readonly outcome: string;
}

export async function classifyReadWritePermission(
  handle: Pick<FeasibilityDirectoryHandle, 'queryPermission'>,
): Promise<FeasibilityPermissionState> {
  try {
    const state = await handle.queryPermission({ mode: 'readwrite' });
    return state === 'granted' || state === 'prompt' || state === 'denied'
      ? state
      : 'unsupported/error';
  } catch {
    return 'unsupported/error';
  }
}

export function artifactNameForRun(runId: string): string | undefined {
  return UUID_PATTERN.test(runId)
    ? `${ARTIFACT_PREFIX}${runId}.tmp`
    : undefined;
}

export function mayRemoveOwnedArtifact(
  candidateName: string,
  runId: string,
  createdByThisRun: boolean,
): boolean {
  return (
    createdByThisRun &&
    artifactNameForRun(runId) !== undefined &&
    candidateName === artifactNameForRun(runId)
  );
}

function isNotFound(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'NotFoundError') ||
    (typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      error.name === 'NotFoundError')
  );
}

export async function runExactOwnedFileRoundTrip(
  directory: FeasibilityDirectoryHandle,
  runId: string,
): Promise<FileRoundTripResult> {
  const permissionState = await classifyReadWritePermission(directory);
  const base = {
    permissionState,
    writeSucceeded: false,
    readVerified: false,
    deleteSucceeded: false,
    testArtifactMayRemain: false,
  };
  if (permissionState !== 'granted') {
    return {
      ...base,
      unavailableLocationFailsSafe: true,
      outcome: `permission-${permissionState}`,
    };
  }

  const name = artifactNameForRun(runId);
  if (name === undefined) {
    return {
      ...base,
      unavailableLocationFailsSafe: true,
      outcome: 'invalid-run-id',
    };
  }

  try {
    await directory.getFileHandle(name);
    return {
      ...base,
      unavailableLocationFailsSafe: true,
      outcome: 'random-name-collision',
    };
  } catch (error) {
    if (!isNotFound(error)) {
      return {
        ...base,
        unavailableLocationFailsSafe: true,
        outcome: 'preflight-access-failed',
      };
    }
  }

  let createdByThisRun = false;
  let writeSucceeded = false;
  let readVerified = false;
  let deleteSucceeded = false;
  let outcome: string;
  try {
    const created = await directory.getFileHandle(name, { create: true });
    createdByThisRun = created.name === name;
    if (!createdByThisRun) throw new Error('created-name-mismatch');
    const writable = await created.createWritable();
    const payload = `${ARTIFACT_PREFIX}${runId}\n`;
    await writable.write(payload);
    await writable.close();
    writeSucceeded = true;

    const reopened = await directory.getFileHandle(name);
    const identityMatches =
      reopened.name === name &&
      (created.isSameEntry === undefined ||
        (await created.isSameEntry(reopened)) === true);
    readVerified =
      identityMatches && (await (await reopened.getFile()).text()) === payload;
    outcome = readVerified ? 'round-trip-verified' : 'read-verification-failed';
  } catch {
    outcome = writeSucceeded ? 'read-failed' : 'write-failed';
  } finally {
    if (mayRemoveOwnedArtifact(name, runId, createdByThisRun)) {
      try {
        await directory.removeEntry(name);
        deleteSucceeded = true;
      } catch {
        outcome = 'owned-artifact-cleanup-failed';
      }
    }
  }

  return {
    permissionState,
    writeSucceeded,
    readVerified,
    deleteSucceeded,
    unavailableLocationFailsSafe: !writeSucceeded,
    testArtifactMayRemain: createdByThisRun && !deleteSucceeded,
    outcome,
  };
}
