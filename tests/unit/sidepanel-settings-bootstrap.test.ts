import { describe, expect, it, vi } from 'vitest';

import type { SettingsApplication } from '../../src/application/settings/settings-service';
import {
  loadWorkspaceSettings,
  WORKSPACE_SETTINGS_LOAD_FAILURE_MESSAGE,
} from '../../src/extension/sidepanel/settings-bootstrap';

describe('Side Panel Settings bootstrap', () => {
  it('resolves a saved model before Workspace initialization', async () => {
    const settings: Pick<SettingsApplication, 'load'> = {
      load: vi.fn(async () => ({
        defaultModel: 'qwen2.5:7b',
        snippetPasteMode: 'clipboard-only' as const,
      })),
    };

    await expect(loadWorkspaceSettings(settings)).resolves.toEqual({
      initialModel: 'qwen2.5:7b',
      loadFailureMessage: null,
    });
    expect(settings.load).toHaveBeenCalledOnce();
  });

  it.each([
    { defaultModel: null, snippetPasteMode: 'clipboard-only' as const },
    { defaultModel: '', snippetPasteMode: 'clipboard-only' as const },
  ])('initializes blank for $defaultModel', async (loaded) => {
    await expect(
      loadWorkspaceSettings({ load: vi.fn(async () => loaded) }),
    ).resolves.toEqual({ initialModel: '', loadFailureMessage: null });
  });

  it('maps load failure to blank non-blocking bootstrap feedback', async () => {
    await expect(
      loadWorkspaceSettings({
        load: vi.fn(async () => {
          throw new Error('raw persistence failure');
        }),
      }),
    ).resolves.toEqual({
      initialModel: '',
      loadFailureMessage: WORKSPACE_SETTINGS_LOAD_FAILURE_MESSAGE,
    });
  });
});
