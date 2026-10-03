import { describe, expect, it, vi } from 'vitest';

import type { AutomaticPasteDiagnosticsRepository } from '../../src/application/persistence/automatic-paste-diagnostics-repository';
import { AutomaticPasteDiagnosticsService } from '../../src/application/snippet/automatic-paste-diagnostics';
import type { AutomaticPasteDiagnosticRecordV1 } from '../../src/domain/automatic-paste-diagnostics';

const now = new Date('2026-10-03T12:00:00.000Z');
const retainFrom = new Date(
  now.getTime() - 30 * 24 * 60 * 60 * 1_000,
).toISOString();

function record(
  id: string,
  occurredAt: string,
): AutomaticPasteDiagnosticRecordV1 {
  return {
    schemaVersion: 1,
    id,
    occurredAt,
    requestId:
      id === '123e4567-e89b-42d3-a456-426614174000'
        ? '223e4567-e89b-42d3-a456-426614174000'
        : '323e4567-e89b-42d3-a456-426614174000',
    kind: 'text',
    result: 'paste-issued',
    terminalStage: 'complete',
    safetyCategory: null,
    failureCode: null,
    timingsMs: {
      clipboardPreparation: 1,
      clipboardWrite: 2,
      browserSafetyPreparation: 3,
      nativeContextCaptureRoundtrip: 4,
      triggerCleanupAndRevalidation: 5,
      nativePasteRequestRoundtrip: 6,
      totalObservedDelivery: 7,
    },
  };
}

function createRepository(
  overrides: Partial<AutomaticPasteDiagnosticsRepository> = {},
): AutomaticPasteDiagnosticsRepository {
  return {
    isEnabled: vi.fn(async () => false),
    setEnabled: vi.fn(async () => undefined),
    appendAndPrune: vi.fn(async () => undefined),
    pruneAndList: vi.fn(async () => []),
    clearRecords: vi.fn(async () => undefined),
    ...overrides,
  };
}

function terminalInput() {
  return {
    kind: 'text' as const,
    result: 'paste-issued' as const,
    terminalStage: 'complete' as const,
    safetyCategory: null,
    failureCode: null,
    timingsMs: {
      clipboardPreparation: 1,
      clipboardWrite: 2,
      browserSafetyPreparation: 3,
      nativeContextCaptureRoundtrip: 4,
      triggerCleanupAndRevalidation: 5,
      nativePasteRequestRoundtrip: 6,
      totalObservedDelivery: 7,
    },
  };
}

describe('AutomaticPasteDiagnosticsService', () => {
  it('defaults disabled and initializes state plus best-effort pruning', async () => {
    const repository = createRepository({
      isEnabled: vi.fn(async () => true),
    });
    const service = new AutomaticPasteDiagnosticsService(repository, () => now);

    expect(service.isRecordingEnabled()).toBe(false);
    await expect(service.initialize()).resolves.toBeUndefined();
    expect(service.isRecordingEnabled()).toBe(true);
    expect(repository.pruneAndList).toHaveBeenCalledWith(retainFrom);
  });

  it('fails an initialization read safely toward no recording', async () => {
    const repository = createRepository({
      isEnabled: vi.fn(async () => {
        throw new Error('IndexedDB unavailable');
      }),
      pruneAndList: vi.fn(async () => {
        throw new Error('IndexedDB unavailable');
      }),
    });
    const service = new AutomaticPasteDiagnosticsService(repository, () => now);

    await expect(service.initialize()).resolves.toBeUndefined();
    expect(service.isRecordingEnabled()).toBe(false);
  });

  it('fails a later state refresh safely toward no recording', async () => {
    const isEnabled = vi
      .fn<AutomaticPasteDiagnosticsRepository['isEnabled']>()
      .mockResolvedValueOnce(true)
      .mockRejectedValueOnce(new Error('IndexedDB unavailable'));
    const service = new AutomaticPasteDiagnosticsService(
      createRepository({ isEnabled }),
      () => now,
    );
    await service.initialize();
    expect(service.isRecordingEnabled()).toBe(true);

    await expect(service.loadEnabled()).rejects.toThrow(
      'IndexedDB unavailable',
    );
    expect(service.isRecordingEnabled()).toBe(false);
  });

  it('does not let a late startup read overwrite a newer explicit enable action', async () => {
    let resolveStartup!: (enabled: boolean) => void;
    const startup = new Promise<boolean>((resolve) => {
      resolveStartup = resolve;
    });
    const repository = createRepository({
      isEnabled: vi.fn(() => startup),
    });
    const service = new AutomaticPasteDiagnosticsService(repository, () => now);
    const initialization = service.initialize();

    await service.setEnabled(true);
    resolveStartup(false);
    await initialization;

    expect(service.isRecordingEnabled()).toBe(true);
  });

  it('persists explicit enablement and updates the in-memory gate only after success', async () => {
    const repository = createRepository();
    const service = new AutomaticPasteDiagnosticsService(repository, () => now);

    await service.setEnabled(true);
    expect(repository.setEnabled).toHaveBeenCalledWith(true);
    expect(repository.pruneAndList).toHaveBeenCalledWith(retainFrom);
    expect(service.isRecordingEnabled()).toBe(true);

    await service.setEnabled(false);
    expect(service.isRecordingEnabled()).toBe(false);
    expect(repository.clearRecords).not.toHaveBeenCalled();
  });

  it('leaves the cached gate unchanged when persistence rejects enablement', async () => {
    const repository = createRepository({
      setEnabled: vi.fn(async () => {
        throw new Error('write failed');
      }),
    });
    const service = new AutomaticPasteDiagnosticsService(repository, () => now);

    await expect(service.setEnabled(true)).rejects.toThrow('write failed');
    expect(service.isRecordingEnabled()).toBe(false);
  });

  it('preserves retained records when diagnostics are disabled', async () => {
    const retained = record(
      '123e4567-e89b-42d3-a456-426614174000',
      now.toISOString(),
    );
    const repository = createRepository({
      pruneAndList: async () => [retained],
    });
    const service = new AutomaticPasteDiagnosticsService(repository, () => now);
    await service.setEnabled(true);
    await service.setEnabled(false);

    expect((await service.createExport()).records).toEqual([retained]);
    expect(repository.clearRecords).not.toHaveBeenCalled();
    expect(service.isRecordingEnabled()).toBe(false);
  });

  it('creates independently generated IDs and appends one strict terminal record', async () => {
    const repository = createRepository();
    const ids = [
      '123e4567-e89b-42d3-a456-426614174000',
      '223e4567-e89b-42d3-a456-426614174000',
    ];
    const createId = vi.fn(() => ids.shift() as string);
    const service = new AutomaticPasteDiagnosticsService(
      repository,
      () => now,
      createId,
    );
    await service.setEnabled(true);
    vi.mocked(repository.appendAndPrune).mockClear();

    service.recordEligibleTerminal(terminalInput());
    await vi.waitFor(() => {
      expect(repository.appendAndPrune).toHaveBeenCalledOnce();
    });
    expect(createId).toHaveBeenCalledTimes(2);
    expect(repository.appendAndPrune).toHaveBeenCalledWith(
      {
        schemaVersion: 1,
        id: '123e4567-e89b-42d3-a456-426614174000',
        occurredAt: now.toISOString(),
        requestId: '223e4567-e89b-42d3-a456-426614174000',
        ...terminalInput(),
      },
      retainFrom,
    );
  });

  it('records an already-eligible terminal input after Disable', async () => {
    const repository = createRepository();
    const createId = vi.fn(() => crypto.randomUUID());
    const service = new AutomaticPasteDiagnosticsService(
      repository,
      () => now,
      createId,
    );

    await service.setEnabled(true);
    await service.setEnabled(false);
    service.recordEligibleTerminal(terminalInput());
    expect(service.isRecordingEnabled()).toBe(false);
    expect(createId).toHaveBeenCalledTimes(2);
    expect(repository.appendAndPrune).toHaveBeenCalledOnce();
    expect(repository.clearRecords).not.toHaveBeenCalled();
  });

  it('swallows construction and append failures so delivery remains final', async () => {
    const repository = createRepository({
      appendAndPrune: vi.fn(async () => {
        throw new Error('quota');
      }),
    });
    const invalidIds = vi.fn(() => 'not-a-uuid');
    const invalidService = new AutomaticPasteDiagnosticsService(
      repository,
      () => now,
      invalidIds,
    );
    await invalidService.setEnabled(true);
    expect(() =>
      invalidService.recordEligibleTerminal(terminalInput()),
    ).not.toThrow();
    expect(repository.appendAndPrune).not.toHaveBeenCalled();

    const validIds = [
      '123e4567-e89b-42d3-a456-426614174000',
      '223e4567-e89b-42d3-a456-426614174000',
    ];
    const service = new AutomaticPasteDiagnosticsService(
      repository,
      () => now,
      () => validIds.shift() as string,
    );
    await service.setEnabled(true);
    expect(() => service.recordEligibleTerminal(terminalInput())).not.toThrow();
    await vi.waitFor(() => {
      expect(repository.appendAndPrune).toHaveBeenCalledOnce();
    });
  });

  it('prunes, validates, and deterministically orders an explicit export', async () => {
    const laterId = '223e4567-e89b-42d3-a456-426614174000';
    const earlierId = '123e4567-e89b-42d3-a456-426614174000';
    const repository = createRepository({
      pruneAndList: vi.fn(async () => [
        record(laterId, '2026-10-03T10:00:00.000Z'),
        record(earlierId, '2026-10-03T10:00:00.000Z'),
      ]),
    });
    const service = new AutomaticPasteDiagnosticsService(repository, () => now);

    await expect(service.createExport()).resolves.toEqual({
      format: 'ai-support-workspace-automatic-paste-diagnostics',
      formatVersion: 1,
      exportedAt: now.toISOString(),
      records: [
        record(earlierId, '2026-10-03T10:00:00.000Z'),
        record(laterId, '2026-10-03T10:00:00.000Z'),
      ],
    });
    expect(repository.pruneAndList).toHaveBeenCalledWith(retainFrom);
  });

  it('delegates Clear without changing cached enablement', async () => {
    const repository = createRepository();
    const service = new AutomaticPasteDiagnosticsService(repository, () => now);
    await service.setEnabled(true);

    await service.clearRecords();
    expect(repository.clearRecords).toHaveBeenCalledOnce();
    expect(service.isRecordingEnabled()).toBe(true);
  });
});
