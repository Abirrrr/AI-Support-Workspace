import { describe, expect, it, vi } from 'vitest';
import { BrowserQuickCreateClipboard } from '../../src/infrastructure/clipboard/browser-quick-create-clipboard';
import { renderSnippetPlainText } from '../../src/domain/snippet-content';

function png(width = 1265, height = 808) {
  const bytes = new Uint8Array(24);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(8, 13);
  bytes.set([73, 72, 68, 82], 12);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return new Blob([bytes], { type: 'image/png' });
}
function setup(
  representations: Record<string, Blob>[] = [
    { 'text/plain': new Blob(['Text']) },
  ],
) {
  const permissions = {
    contains: vi.fn().mockResolvedValue(true),
    request: vi.fn().mockResolvedValue(true),
  };
  const read = vi.fn().mockResolvedValue(
    representations.map((values) => ({
      types: Object.keys(values),
      getType: vi.fn(async (type: string) => values[type]),
    })),
  );
  const close = vi.fn();
  const decode = vi.fn().mockResolvedValue({ width: 1265, height: 808, close });
  const source = new BrowserQuickCreateClipboard(
    permissions,
    { read },
    decode,
    () => true,
  );
  return { source, permissions, read, decode, close };
}
describe('Quick Create clipboard boundary', () => {
  it.each(['image/jpeg', 'image/webp'] as const)(
    'retains original validated %s bytes without conversion',
    async (type) => {
      const bytes =
        type === 'image/jpeg'
          ? Uint8Array.from([255, 216, 255, 192, 0, 7, 8, 0, 2, 0, 2, 255, 217])
          : new Uint8Array(30);
      if (type === 'image/webp') {
        bytes.set([82, 73, 70, 70]);
        new DataView(bytes.buffer).setUint32(4, 22, true);
        bytes.set([87, 69, 66, 80, 86, 80, 56, 88], 8);
        new DataView(bytes.buffer).setUint32(16, 10, true);
        bytes[24] = 1;
        bytes[27] = 1;
      }
      const blob = new Blob([bytes], { type });
      const s = setup([{ [type]: blob, 'text/plain': new Blob(['text']) }]);
      s.decode.mockResolvedValue({ width: 2, height: 2, close: s.close });
      const draft = await s.source.readDraft();
      expect(draft.kind).toBe('image');
      if (draft.kind === 'image') {
        expect(draft.asset.mimeType).toBe(type);
        expect(await draft.asset.blob.arrayBuffer()).toEqual(
          await blob.arrayBuffer(),
        );
      }
    },
  );
  it('preserves literal multiline Unicode/whitespace and never interprets HTML', async () => {
    const text = '  <img onerror=x>\r\n\nবাংলা café 😀\n';
    const { source, read, decode } = setup([
      {
        'text/plain': new Blob([text]),
        'text/html': new Blob(['<script>bad</script>']),
      },
    ]);
    const draft = await source.readDraft();
    expect(draft.kind).toBe('text');
    if (draft.kind === 'text')
      expect(renderSnippetPlainText(draft.content)).toBe(text);
    expect(read).toHaveBeenCalledTimes(1);
    expect(decode).not.toHaveBeenCalled();
  });
  it('prioritizes genuine PNG over accompanying text; closes the decoder and retains bytes', async () => {
    const blob = png();
    const { source, read, close } = setup([
      { 'text/plain': new Blob(['text']) },
      { 'image/png': blob },
    ]);
    const draft = await source.readDraft();
    expect(draft.kind).toBe('image');
    if (draft.kind === 'image') {
      expect(draft.asset.originalFilename).toBeNull();
      expect(await draft.asset.blob.arrayBuffer()).toEqual(
        await blob.arrayBuffer(),
      );
    }
    expect(read).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
  });
  it.each<{ data: Record<string, Blob>[] }>([
    { data: [] },
    { data: [{ 'text/html': new Blob(['<b>only HTML</b>']) }] },
    { data: [{ 'text/plain': new Blob([]) }] },
  ])(
    'rejects empty/unsupported content without a second acquisition: $data',
    async ({ data }) => {
      const { source, read } = setup(data);
      await expect(source.readDraft()).rejects.toMatchObject({
        code: 'empty-or-unsupported',
      });
      expect(read).toHaveBeenCalledTimes(1);
    },
  );
  it('does not fall back to text from unsupported or corrupt images', async () => {
    for (const [type, blob, code] of [
      ['image/gif', new Blob(['x']), 'unsupported-image'],
      ['image/png', new Blob(['bad'], { type: 'image/png' }), 'invalid-image'],
    ] as const) {
      const { source } = setup([
        { [type]: blob, 'text/plain': new Blob(['text']) },
      ]);
      await expect(source.readDraft()).rejects.toMatchObject({ code });
    }
  });
  it('rejects encoded/raster excess before decode and rejects decode failure safely', async () => {
    for (const blob of [
      png(8193, 1),
      png(8192, 8192),
      new Blob([new Uint8Array(5_242_881)], { type: 'image/png' }),
    ]) {
      const { source, decode } = setup([{ 'image/png': blob }]);
      await expect(source.readDraft()).rejects.toMatchObject({
        code: 'image-too-large',
      });
      expect(decode).not.toHaveBeenCalled();
    }
    const { source, decode } = setup([{ 'image/png': png() }]);
    decode.mockRejectedValue(new Error('secret raw detail'));
    await expect(source.readDraft()).rejects.toMatchObject({
      code: 'invalid-image',
    });
  });
  it('checks permission before read, rechecks revocation, and grants only through the explicit method', async () => {
    const { source, permissions, read } = setup();
    permissions.contains.mockResolvedValue(false);
    await expect(source.readDraft()).rejects.toMatchObject({
      code: 'permission-required',
    });
    expect(read).not.toHaveBeenCalled();
    expect(permissions.request).not.toHaveBeenCalled();
    const promise = source.requestEnable();
    expect(permissions.request).toHaveBeenCalledWith({
      permissions: ['clipboardRead'],
    });
    await promise;
    permissions.contains
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    await expect(source.readDraft()).rejects.toMatchObject({
      code: 'permission-required',
    });
  });
  it('sanitizes API failures and rejects unavailable APIs', async () => {
    const { source, read, permissions } = setup();
    read.mockRejectedValue(new Error('private clipboard data'));
    await expect(source.readDraft()).rejects.toMatchObject({
      code: 'read-failed',
      message: 'read-failed',
    });
    await expect(
      new BrowserQuickCreateClipboard(permissions, undefined).readDraft(),
    ).rejects.toMatchObject({ code: 'api-unavailable' });
  });
  it('detects permission revoked during a failed read and offers permission recovery', async () => {
    const { source, read, permissions } = setup();
    permissions.contains.mockResolvedValueOnce(true).mockResolvedValue(false);
    read.mockRejectedValue(new Error('private browser error'));
    await expect(source.readDraft()).rejects.toMatchObject({
      code: 'permission-required',
    });
  });
  it('never acquires clipboard while the extension document is unfocused', async () => {
    const s = setup();
    const source = new BrowserQuickCreateClipboard(
      s.permissions,
      { read: s.read },
      s.decode,
      () => false,
    );
    await expect(source.readDraft()).rejects.toMatchObject({
      code: 'read-failed',
    });
    expect(s.read).not.toHaveBeenCalled();
  });
  it('rejects decoded raster excess and PNG dimension mismatch, always closing its bitmap', async () => {
    for (const [width, height, code] of [
      [8192, 8192, 'image-too-large'],
      [1, 1, 'invalid-image'],
    ] as const) {
      const { source, decode, close } = setup([{ 'image/png': png() }]);
      decode.mockResolvedValue({ width, height, close });
      await expect(source.readDraft()).rejects.toMatchObject({ code });
      expect(close).toHaveBeenCalledTimes(1);
    }
  });
});
