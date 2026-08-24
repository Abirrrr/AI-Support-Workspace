import { indexedDB } from 'fake-indexeddb';
import { describe, expect, it, vi } from 'vitest';

import type {
  FeasibilityDirectoryHandle,
  FeasibilityFileHandle,
  SelectedFolderScratchRecord,
} from '../../src/extension/backup-feasibility/contracts';
import { createEmptyFeasibilityReport } from '../../src/extension/backup-feasibility/contracts';
import {
  FEASIBILITY_BACKGROUND_SAFE_CHECK,
  registerSelectedFolderFeasibilityBackground,
} from '../../src/extension/backup-feasibility/background-handler';
import {
  artifactNameForRun,
  classifyReadWritePermission,
  mayRemoveOwnedArtifact,
  runExactOwnedFileRoundTrip,
} from '../../src/extension/backup-feasibility/file-round-trip';
import { SelectedFolderScratchRepository } from '../../src/extension/backup-feasibility/scratch-repository';

const RUN_ID = '9d74859d-7d47-4ed9-9bec-334d2aa7362b';

function notFound(): DOMException {
  return new DOMException('not found', 'NotFoundError');
}

describe('selected-folder feasibility plumbing', () => {
  it('persists and recovers isolated scratch state without production Dexie', async () => {
    const repository = new SelectedFolderScratchRepository(indexedDB);
    const sentinel = { kind: 'directory', token: 'structured-clone-sentinel' };
    const record = {
      handle: sentinel,
      selectionSessionId: 'first-options-lifecycle',
      report: createEmptyFeasibilityReport(),
    } as unknown as SelectedFolderScratchRecord;

    await repository.write(record);
    const recovered = await repository.read();

    expect(recovered).toEqual(record);
    await repository.clear();
    expect(await repository.read()).toBeUndefined();
  });

  it.each([
    ['granted', 'granted'],
    ['prompt', 'prompt'],
    ['denied', 'denied'],
    ['unexpected', 'unsupported/error'],
  ] as const)('classifies permission %s as %s', async (actual, expected) => {
    expect(
      await classifyReadWritePermission({
        queryPermission: vi.fn().mockResolvedValue(actual),
      }),
    ).toBe(expected);
  });

  it('classifies a permission exception without throwing', async () => {
    expect(
      await classifyReadWritePermission({
        queryPermission: vi.fn().mockRejectedValue(new Error('revoked')),
      }),
    ).toBe('unsupported/error');
  });

  it('names and removes only the exact artifact owned by the current run', () => {
    const exact = artifactNameForRun(RUN_ID);
    expect(exact).toBe(
      'ai-support-workspace-feasibility-9d74859d-7d47-4ed9-9bec-334d2aa7362b.tmp',
    );
    expect(exact).toBeDefined();
    if (exact === undefined) throw new Error('expected valid fixture UUID');
    expect(mayRemoveOwnedArtifact(exact, RUN_ID, true)).toBe(true);
    expect(mayRemoveOwnedArtifact(`${exact}.other`, RUN_ID, true)).toBe(false);
    expect(mayRemoveOwnedArtifact(exact, RUN_ID, false)).toBe(false);
    expect(artifactNameForRun('not-a-uuid')).toBeUndefined();
  });

  it('performs an exact create, write, reopen, read, and delete round trip', async () => {
    const name = artifactNameForRun(RUN_ID);
    if (name === undefined) throw new Error('expected valid fixture UUID');
    let payload = '';
    const file: FeasibilityFileHandle = {
      kind: 'file',
      name,
      createWritable: vi.fn(async () => ({
        write: vi.fn(async (data: string) => {
          payload = data;
        }),
        close: vi.fn(async () => undefined),
      })),
      getFile: vi.fn(async () => ({ text: vi.fn(async () => payload) })),
      isSameEntry: vi.fn(async (other) => other === file),
    };
    const getFileHandle = vi
      .fn<FeasibilityDirectoryHandle['getFileHandle']>()
      .mockRejectedValueOnce(notFound())
      .mockResolvedValue(file);
    const removeEntry = vi.fn(async () => undefined);
    const directory = {
      kind: 'directory',
      name: 'never-reported',
      queryPermission: vi.fn(async () => 'granted' as PermissionState),
      getFileHandle,
      removeEntry,
    } satisfies FeasibilityDirectoryHandle;

    const result = await runExactOwnedFileRoundTrip(directory, RUN_ID);

    expect(result).toMatchObject({
      writeSucceeded: true,
      readVerified: true,
      deleteSucceeded: true,
      testArtifactMayRemain: false,
      outcome: 'round-trip-verified',
    });
    expect(getFileHandle).toHaveBeenNthCalledWith(1, name);
    expect(getFileHandle).toHaveBeenNthCalledWith(2, name, { create: true });
    expect(getFileHandle).toHaveBeenNthCalledWith(3, name);
    expect(removeEntry).toHaveBeenCalledExactlyOnceWith(name);
  });

  it('fails closed without creating or deleting when authority is unavailable', async () => {
    const directory = {
      kind: 'directory',
      name: 'never-reported',
      queryPermission: vi.fn(async () => 'prompt' as PermissionState),
      getFileHandle: vi.fn(),
      removeEntry: vi.fn(),
    } as unknown as FeasibilityDirectoryHandle;

    const result = await runExactOwnedFileRoundTrip(directory, RUN_ID);

    expect(result).toMatchObject({
      permissionState: 'prompt',
      writeSucceeded: false,
      unavailableLocationFailsSafe: true,
      testArtifactMayRemain: false,
    });
    expect(directory.getFileHandle).not.toHaveBeenCalled();
    expect(directory.removeEntry).not.toHaveBeenCalled();
  });

  it('refuses cleanup if the random name already exists', async () => {
    const existing = { name: artifactNameForRun(RUN_ID) };
    const directory = {
      kind: 'directory',
      name: 'never-reported',
      queryPermission: vi.fn(async () => 'granted' as PermissionState),
      getFileHandle: vi.fn(async () => existing),
      removeEntry: vi.fn(),
    } as unknown as FeasibilityDirectoryHandle;

    const result = await runExactOwnedFileRoundTrip(directory, RUN_ID);

    expect(result.outcome).toBe('random-name-collision');
    expect(directory.getFileHandle).toHaveBeenCalledOnce();
    expect(directory.removeEntry).not.toHaveBeenCalled();
  });

  it('makes the service worker recover scratch state and fail closed without authority', async () => {
    const directory = {
      kind: 'directory',
      name: 'never-reported',
      queryPermission: vi.fn(async () => 'denied' as PermissionState),
      getFileHandle: vi.fn(),
      removeEntry: vi.fn(),
    } as unknown as FeasibilityDirectoryHandle;
    const record: SelectedFolderScratchRecord = {
      handle: directory,
      selectionSessionId: 'options-lifecycle',
      report: createEmptyFeasibilityReport(),
    };
    const repository = {
      read: vi.fn(async () => record),
      write: vi.fn(async () => undefined),
    };
    let listener:
      | ((
          message: unknown,
          sender: unknown,
          sendResponse: (response: unknown) => void,
        ) => boolean | undefined)
      | undefined;
    registerSelectedFolderFeasibilityBackground(
      {
        onMessage: {
          addListener: (candidate) => {
            listener = candidate;
          },
        },
      },
      repository,
    );
    if (listener === undefined) throw new Error('listener was not registered');

    const response = await new Promise<unknown>((resolve) => {
      expect(
        listener?.({ type: FEASIBILITY_BACKGROUND_SAFE_CHECK }, {}, resolve),
      ).toBe(true);
    });

    expect(repository.read).toHaveBeenCalledOnce();
    expect(directory.queryPermission).toHaveBeenCalledExactlyOnceWith({
      mode: 'readwrite',
    });
    expect(directory.getFileHandle).not.toHaveBeenCalled();
    expect(directory.removeEntry).not.toHaveBeenCalled();
    expect(response).toMatchObject({
      ok: true,
      report: {
        backgroundHandleRecovered: true,
        permissionState: 'denied',
        unavailableLocationFailsSafe: true,
      },
    });
  });
});
