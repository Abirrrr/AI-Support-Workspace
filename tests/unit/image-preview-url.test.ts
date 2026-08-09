import { describe, expect, it, vi } from 'vitest';

import { ImagePreviewUrl } from '../../src/ui/snippet/image-preview-url';

describe('ImagePreviewUrl', () => {
  it('creates local URLs and revokes replacement and cleared URLs', () => {
    const api = {
      createObjectURL: vi
        .fn()
        .mockReturnValueOnce('blob:first')
        .mockReturnValueOnce('blob:second'),
      revokeObjectURL: vi.fn(),
    };
    const preview = new ImagePreviewUrl(api);
    expect(preview.replace(new Blob(['one']))).toBe('blob:first');
    expect(preview.replace(new Blob(['two']))).toBe('blob:second');
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:first');
    preview.clear();
    expect(api.revokeObjectURL).toHaveBeenCalledWith('blob:second');
    preview.clear();
    expect(api.revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
