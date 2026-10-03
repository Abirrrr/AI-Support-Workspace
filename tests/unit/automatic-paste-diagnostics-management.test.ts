import { describe, expect, it, vi } from 'vitest';

import type { AutomaticPasteDiagnosticsService } from '../../src/application/snippet/automatic-paste-diagnostics';
import { registerAutomaticPasteDiagnosticsManagement } from '../../src/application/snippet/automatic-paste-diagnostics-management';
import {
  createAutomaticPasteDiagnosticsFilename,
  RuntimeAutomaticPasteDiagnosticsApplication,
} from '../../src/extension/options/automatic-paste-diagnostics-client';
import {
  isAutomaticPasteDiagnosticsRequest,
  validateAutomaticPasteDiagnosticsResponse,
} from '../../src/shared/automatic-paste-diagnostics-messages';

function validExport() {
  return {
    format: 'ai-support-workspace-automatic-paste-diagnostics' as const,
    formatVersion: 1 as const,
    exportedAt: '2026-10-03T12:34:56.789Z',
    records: [],
  };
}

describe('Automatic Paste diagnostics management boundary', () => {
  it('accepts only exact management messages and validates exact responses', () => {
    expect(
      isAutomaticPasteDiagnosticsRequest({
        type: 'automatic-paste-diagnostics-set-enabled',
        enabled: true,
      }),
    ).toBe(true);
    expect(
      isAutomaticPasteDiagnosticsRequest({
        type: 'automatic-paste-diagnostics-set-enabled',
        enabled: true,
        extra: true,
      }),
    ).toBe(false);
    expect(() =>
      validateAutomaticPasteDiagnosticsResponse({
        type: 'automatic-paste-diagnostics-state',
        enabled: true,
        extra: true,
      }),
    ).toThrow(TypeError);
  });

  it('routes load, enable, export, and clear through one application service', async () => {
    let listener: ((message: unknown) => unknown) | undefined;
    const service = {
      loadEnabled: vi.fn(async () => false),
      setEnabled: vi.fn(async () => undefined),
      createExport: vi.fn(async () => validExport()),
      clearRecords: vi.fn(async () => undefined),
    } as unknown as AutomaticPasteDiagnosticsService;
    const unregister = registerAutomaticPasteDiagnosticsManagement(
      {
        onMessage: {
          addListener: (added) => {
            listener = added;
          },
          removeListener: vi.fn(),
        },
      },
      service,
    );
    expect(listener).toBeDefined();
    await expect(
      listener?.({ type: 'automatic-paste-diagnostics-get-state' }),
    ).resolves.toEqual({
      type: 'automatic-paste-diagnostics-state',
      enabled: false,
    });
    await expect(
      listener?.({
        type: 'automatic-paste-diagnostics-set-enabled',
        enabled: true,
      }),
    ).resolves.toEqual({
      type: 'automatic-paste-diagnostics-state',
      enabled: true,
    });
    await expect(
      listener?.({ type: 'automatic-paste-diagnostics-export' }),
    ).resolves.toEqual({
      type: 'automatic-paste-diagnostics-export-result',
      export: validExport(),
    });
    await expect(
      listener?.({ type: 'automatic-paste-diagnostics-clear' }),
    ).resolves.toEqual({ type: 'automatic-paste-diagnostics-cleared' });
    expect(service.setEnabled).toHaveBeenCalledWith(true);
    expect(service.clearRecords).toHaveBeenCalledOnce();
    unregister();
  });

  it('downloads only after a strict bounded export response succeeds', async () => {
    const download = vi.fn(async () => undefined);
    const sendMessage = vi.fn(async () => ({
      type: 'automatic-paste-diagnostics-export-result',
      export: validExport(),
    }));
    const application = new RuntimeAutomaticPasteDiagnosticsApplication(
      { sendMessage },
      { download },
    );

    await application.exportDiagnostics();

    expect(download).toHaveBeenCalledWith(
      JSON.stringify(validExport(), null, 2),
      'ai-support-workspace-automatic-paste-diagnostics-2026-10-03T12-34-56Z.json',
    );
    expect(
      createAutomaticPasteDiagnosticsFilename(validExport().exportedAt),
    ).toBe(
      'ai-support-workspace-automatic-paste-diagnostics-2026-10-03T12-34-56Z.json',
    );
  });

  it('creates no partial download when export read or validation fails', async () => {
    const download = vi.fn(async () => undefined);
    const rejected = new RuntimeAutomaticPasteDiagnosticsApplication(
      {
        sendMessage: vi.fn(async () => {
          throw new Error('prune failed');
        }),
      },
      { download },
    );
    await expect(rejected.exportDiagnostics()).rejects.toThrow('prune failed');

    const malformed = new RuntimeAutomaticPasteDiagnosticsApplication(
      {
        sendMessage: vi.fn(async () => ({
          type: 'automatic-paste-diagnostics-export-result',
          export: { ...validExport(), enabled: true },
        })),
      },
      { download },
    );
    await expect(malformed.exportDiagnostics()).rejects.toThrow(TypeError);
    expect(download).not.toHaveBeenCalled();
  });
});
