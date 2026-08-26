import { describe, expect, it, vi } from 'vitest';

import { createOpenOptionsPage } from '../../src/extension/sidepanel/open-options-page';

describe('Settings existing Options application ownership', () => {
  it('delegates exactly once to Chrome runtime Options navigation', async () => {
    const openOptionsPage = vi.fn(async () => undefined);
    const openSettings = createOpenOptionsPage({ openOptionsPage });

    expect(openOptionsPage).not.toHaveBeenCalled();
    await openSettings();

    expect(openOptionsPage).toHaveBeenCalledOnce();
  });

  it('rejects safely when the existing runtime Options boundary is unavailable', async () => {
    await expect(createOpenOptionsPage(undefined)()).rejects.toThrow(
      'Options navigation unavailable.',
    );
  });
});
