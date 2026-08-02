// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import {
  BrowserBackupDownloadAdapter,
  type BrowserBackupDownloadEnvironment,
} from '../../src/infrastructure/backup/browser-backup-download-adapter';
import { BrowserBackupFileSource } from '../../src/infrastructure/backup/browser-backup-file-source';

describe('BrowserBackupDownloadAdapter', () => {
  it('creates a JSON Blob, clicks a temporary anchor, removes it, and revokes the URL', async () => {
    const anchor = document.createElement('a');
    const click = vi.spyOn(anchor, 'click').mockImplementation(() => undefined);
    const createElement = vi
      .spyOn(document, 'createElement')
      .mockReturnValue(anchor);
    const createObjectUrl = vi.fn<(blob: Blob) => string>(
      () => 'blob:test-backup',
    );
    const revokeObjectUrl = vi.fn();
    const environment: BrowserBackupDownloadEnvironment = {
      document,
      createObjectUrl,
      revokeObjectUrl,
    };

    await new BrowserBackupDownloadAdapter(environment).download(
      '{"format":"ai-support-workspace-backup"}',
      'backup.json',
    );

    expect(createElement).toHaveBeenCalledWith('a');
    expect(createObjectUrl).toHaveBeenCalledOnce();
    const createUrlCall = createObjectUrl.mock.calls[0];
    if (!createUrlCall) throw new Error('Object URL was not created.');
    const [blob] = createUrlCall;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/json');
    expect(blob.size).toBeGreaterThan(0);
    expect(anchor.download).toBe('backup.json');
    expect(anchor.href).toBe('blob:test-backup');
    expect(click).toHaveBeenCalledOnce();
    expect(document.body.contains(anchor)).toBe(false);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test-backup');
  });

  it('revokes the object URL and removes the anchor when clicking fails', async () => {
    const anchor = document.createElement('a');
    vi.spyOn(anchor, 'click').mockImplementation(() => {
      throw new Error('click failed');
    });
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    const revokeObjectUrl = vi.fn();

    await expect(
      new BrowserBackupDownloadAdapter({
        document,
        createObjectUrl: () => 'blob:failed-backup',
        revokeObjectUrl,
      }).download('{}', 'backup.json'),
    ).rejects.toThrow('click failed');

    expect(document.body.contains(anchor)).toBe(false);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:failed-backup');
  });
});

describe('BrowserBackupFileSource', () => {
  it('exposes browser file metadata and delegates text reading', async () => {
    const readText = vi.fn(async () => '{"valid":"text"}');
    const file = new File(['browser file contents'], 'backup.json', {
      type: 'application/json',
    });
    Object.defineProperty(file, 'text', { value: readText });
    const source = new BrowserBackupFileSource(file);

    expect(source.name).toBe('backup.json');
    expect(source.size).toBe(file.size);
    await expect(source.readText()).resolves.toBe('{"valid":"text"}');
    expect(readText).toHaveBeenCalledOnce();
  });
});
