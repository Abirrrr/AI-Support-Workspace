import { type FormEvent, useEffect, useState } from 'react';

import {
  normalizeDefaultModel,
  type SettingsApplication,
} from '../../application/settings/settings-service';

const LOAD_FAILURE_MESSAGE = "Couldn't load settings. Reload and try again.";
const SAVE_FAILURE_MESSAGE = "Couldn't save settings. Try again.";
const SAVE_SUCCESS_MESSAGE = 'Settings saved.';

interface SettingsViewProps {
  settings: SettingsApplication;
}

interface Feedback {
  readonly kind: 'success' | 'error';
  readonly message: string;
}

export function SettingsView({ settings }: SettingsViewProps) {
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [defaultModelInput, setDefaultModelInput] = useState('');
  const [loadedDefaultModel, setLoadedDefaultModel] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    let active = true;

    void settings.load().then(
      (loaded) => {
        if (!active) return;
        setLoadedDefaultModel(loaded.defaultModel);
        setDefaultModelInput(loaded.defaultModel ?? '');
        setLoadState('ready');
      },
      () => {
        if (!active) return;
        setLoadState('failed');
        setFeedback({ kind: 'error', message: LOAD_FAILURE_MESSAGE });
      },
    );

    return () => {
      active = false;
    };
  }, [settings]);

  const normalizedInput = normalizeDefaultModel(defaultModelInput);
  const dirty = normalizedInput !== loadedDefaultModel;
  const formDisabled = loadState !== 'ready' || saving;
  const saveDisabled = formDisabled || !dirty;

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveDisabled) return;

    setSaving(true);
    setFeedback(null);

    try {
      const saved = await settings.save(defaultModelInput);
      setLoadedDefaultModel(saved.defaultModel);
      setDefaultModelInput(saved.defaultModel ?? '');
      setFeedback({ kind: 'success', message: SAVE_SUCCESS_MESSAGE });
    } catch {
      setFeedback({ kind: 'error', message: SAVE_FAILURE_MESSAGE });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="settings-heading" className="mt-8">
      <h2
        id="settings-heading"
        className="text-xl font-semibold text-slate-950"
      >
        Settings
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Choose the default local model for new Workspace sessions.
      </p>

      <form
        aria-label="Default model settings"
        className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        onSubmit={(event) => void saveSettings(event)}
      >
        <div>
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="default-ollama-model"
          >
            Default Ollama model
          </label>
          <input
            aria-describedby="default-ollama-model-help"
            className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-950 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-100"
            disabled={formDisabled}
            id="default-ollama-model"
            onChange={(event) => {
              setDefaultModelInput(event.target.value);
              setFeedback(null);
            }}
            placeholder="qwen2.5:7b"
            type="text"
            value={defaultModelInput}
          />
          <p
            className="mt-2 text-xs leading-5 text-slate-500"
            id="default-ollama-model-help"
          >
            New Workspace Side Panel sessions start with this model. It must
            already exist in your Ollama installation, and you can still change
            it temporarily inside Workspace.
          </p>
        </div>

        <button
          className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={saveDisabled}
          type="submit"
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      <div
        aria-live={feedback?.kind === 'error' ? 'assertive' : 'polite'}
        className="mt-5 min-h-6 text-sm"
        role={feedback?.kind === 'error' ? 'alert' : 'status'}
      >
        {loadState === 'loading' ? (
          <p className="text-slate-600">Loading settings…</p>
        ) : null}
        {feedback === null ? null : (
          <p
            className={
              feedback.kind === 'error' ? 'text-red-700' : 'text-emerald-700'
            }
          >
            {feedback.message}
          </p>
        )}
      </div>
    </section>
  );
}
