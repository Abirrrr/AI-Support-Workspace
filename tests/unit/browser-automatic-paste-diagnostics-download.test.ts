// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import {
  BrowserAutomaticPasteDiagnosticsDownloadAdapter,
  type BrowserDiagnosticsDownloadEnvironment,
} from '../../src/infrastructure/diagnostics/browser-automatic-paste-diagnostics-download-adapter';

describe('BrowserAutomaticPasteDiagnosticsDownloadAdapter', () => {
  it('uses a local JSON Blob/object URL/temporary anchor and always revokes it', async () => {
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const createObjectUrl = vi.fn<(blob: Blob) => string>(
      () => 'blob:local-diagnostics',
    );
    const revokeObjectUrl = vi.fn();
    const environment: BrowserDiagnosticsDownloadEnvironment = {
      document,
      createObjectUrl,
      revokeObjectUrl,
    };
    await new BrowserAutomaticPasteDiagnosticsDownloadAdapter(
      environment,
    ).download('{}', 'diagnostics.json');
    const blob = createObjectUrl.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.type).toBe('application/json');
    expect(anchor.download).toBe('diagnostics.json');
    expect(click).toHaveBeenCalledOnce();
    expect(document.body.contains(anchor)).toBe(false);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:local-diagnostics');
  });
});
