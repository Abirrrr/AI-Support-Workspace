import type { SettingsApplication } from '../../application/settings/settings-service';

export const WORKSPACE_SETTINGS_LOAD_FAILURE_MESSAGE =
  "Couldn't load the saved model. Enter a model manually.";

export interface WorkspaceSettingsBootstrap {
  readonly initialModel: string;
  readonly loadFailureMessage: string | null;
}

export async function loadWorkspaceSettings(
  settings: Pick<SettingsApplication, 'load'>,
): Promise<WorkspaceSettingsBootstrap> {
  try {
    const loaded = await settings.load();
    return {
      initialModel: loaded.defaultModel ?? '',
      loadFailureMessage: null,
    };
  } catch {
    return {
      initialModel: '',
      loadFailureMessage: WORKSPACE_SETTINGS_LOAD_FAILURE_MESSAGE,
    };
  }
}
