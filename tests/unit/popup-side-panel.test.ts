import { afterEach, describe, expect, it, vi } from 'vitest';

import { openWorkspaceSidePanel } from '../../src/extension/popup/open-workspace';

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'chrome');
});

describe('openWorkspaceSidePanel', () => {
  it('opens the global Side Panel in the current Chrome window', async () => {
    const open = vi.fn(async () => undefined);

    Object.defineProperty(globalThis, 'chrome', {
      configurable: true,
      value: {
        sidePanel: { open },
        windows: { WINDOW_ID_CURRENT: -2 },
      },
    });

    await openWorkspaceSidePanel();

    expect(open).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith({ windowId: -2 });
  });

  it('rejects safely when the Chrome Side Panel API is unavailable', async () => {
    await expect(openWorkspaceSidePanel()).rejects.toThrow(
      'Chrome Side Panel API is unavailable.',
    );
  });
});
