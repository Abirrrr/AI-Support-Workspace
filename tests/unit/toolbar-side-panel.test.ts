import { describe, expect, it, vi } from 'vitest';

import { enableToolbarSidePanelAction } from '../../src/extension/sidepanel/toolbar-action';

describe('toolbar Side Panel action ownership', () => {
  it('idempotently delegates toolbar action behavior to Chrome', async () => {
    const setPanelBehavior = vi.fn(async () => undefined);
    await enableToolbarSidePanelAction({ setPanelBehavior });
    expect(setPanelBehavior).toHaveBeenCalledOnce();
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: true,
    });
  });

  it('does nothing when the supported API is unavailable', async () => {
    await expect(
      enableToolbarSidePanelAction(undefined),
    ).resolves.toBeUndefined();
  });
});
