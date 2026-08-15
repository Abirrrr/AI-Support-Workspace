import { describe, expect, it, vi } from 'vitest';

import { NativeImageClipboardError } from '../../src/application/snippet/image-clipboard-transport';
import { RoutedClipboardTransport } from '../../src/extension/snippet-trigger/clipboard-transport';

const textPlan = {
  kind: 'text' as const,
  snippetId: 'snippet-1',
  plainText: 'plain',
  html: '<p>plain</p>',
};

const imagePlan = {
  kind: 'image' as const,
  snippetId: 'private-snippet-id',
  mimeType: 'image/jpeg' as const,
  blob: new Blob(['private jpeg bytes'], { type: 'image/jpeg' }),
  dimensions: { width: 1, height: 1 },
};

function transports() {
  const textTransport = { write: vi.fn(async () => undefined) };
  const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47]);
  const imagePngPreparer = { prepare: vi.fn(async () => png) };
  const imageTransport = { writePng: vi.fn(async () => undefined) };
  return {
    value: new RoutedClipboardTransport(
      textTransport,
      imagePngPreparer,
      imageTransport,
    ),
    textTransport,
    imagePngPreparer,
    imageTransport,
    png,
  };
}

describe('Text/Image clipboard transport routing', () => {
  it('keeps Text entirely on the browser offscreen transport', async () => {
    const subject = transports();
    await subject.value.write(textPlan, 'activation-request');
    expect(subject.textTransport.write).toHaveBeenCalledWith(
      textPlan,
      'activation-request',
    );
    expect(subject.imagePngPreparer.prepare).not.toHaveBeenCalled();
    expect(subject.imageTransport.writePng).not.toHaveBeenCalled();
  });

  it('routes Image only through PNG preparation and native transport', async () => {
    const subject = transports();
    await subject.value.write(imagePlan, 'private-activation-request');
    expect(subject.imagePngPreparer.prepare).toHaveBeenCalledWith(imagePlan);
    expect(subject.imageTransport.writePng).toHaveBeenCalledWith(subject.png);
    expect(subject.textTransport.write).not.toHaveBeenCalled();
  });

  it('does not invoke any browser Image fallback after native failure', async () => {
    const subject = transports();
    subject.imageTransport.writePng.mockRejectedValue(
      new NativeImageClipboardError('host-unavailable'),
    );
    await expect(
      subject.value.write(imagePlan, 'private-activation-request'),
    ).rejects.toMatchObject({ code: 'host-unavailable' });
    expect(subject.imageTransport.writePng).toHaveBeenCalledOnce();
    expect(subject.textTransport.write).not.toHaveBeenCalled();
  });

  it('maps preparation failure without leaking private payload metadata', async () => {
    const subject = transports();
    subject.imagePngPreparer.prepare.mockRejectedValue(
      new Error('private-snippet-id private jpeg bytes'),
    );
    await expect(
      subject.value.write(imagePlan, 'private-activation-request'),
    ).rejects.toMatchObject({
      code: 'image-decode-failed',
      message: 'Could not prepare the clipboard. Try again.',
    });
    expect(subject.imageTransport.writePng).not.toHaveBeenCalled();
  });
});
