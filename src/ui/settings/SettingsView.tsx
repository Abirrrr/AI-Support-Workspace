import { type FormEvent, useEffect, useState } from 'react';

import {
  normalizeDefaultModel,
  type SettingsApplication,
} from '../../application/settings/settings-service';
import type { ClipboardDeliveryPermission } from '../../extension/snippet-trigger/clipboard-permission';
import type { WindowsImageClipboardCapability } from '../../extension/snippet-trigger/native-clipboard-capability';
import type { NativeClipboardCapabilityStatus } from '../../application/snippet/image-clipboard-transport';

const LOAD_FAILURE_MESSAGE = "Couldn't load settings. Reload and try again.";
const SAVE_FAILURE_MESSAGE = "Couldn't save settings. Try again.";
const SAVE_SUCCESS_MESSAGE = 'Settings saved.';

interface SettingsViewProps {
  settings: SettingsApplication;
  clipboardDelivery?: ClipboardDeliveryPermission | undefined;
  windowsImageClipboard?: WindowsImageClipboardCapability | undefined;
}

interface Feedback {
  readonly kind: 'success' | 'error';
  readonly message: string;
}

export function SettingsView({
  settings,
  clipboardDelivery,
  windowsImageClipboard,
}: SettingsViewProps) {
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  );
  const [defaultModelInput, setDefaultModelInput] = useState('');
  const [loadedDefaultModel, setLoadedDefaultModel] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [clipboardState, setClipboardState] = useState<
    'loading' | 'disabled' | 'enabled' | 'failed'
  >(clipboardDelivery === undefined ? 'failed' : 'loading');
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(
    null,
  );
  const [windowsImageState, setWindowsImageState] = useState<
    NativeClipboardCapabilityStatus | 'checking' | 'status-unavailable'
  >(windowsImageClipboard === undefined ? 'status-unavailable' : 'checking');

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

  useEffect(() => {
    if (clipboardDelivery === undefined) return;
    let active = true;
    void clipboardDelivery.isEnabled().then(
      (enabled) => {
        if (active) setClipboardState(enabled ? 'enabled' : 'disabled');
      },
      () => {
        if (active) setClipboardState('failed');
      },
    );
    return () => {
      active = false;
    };
  }, [clipboardDelivery]);

  useEffect(() => {
    if (windowsImageClipboard === undefined) return;
    let active = true;
    void windowsImageClipboard.getStatus().then(
      (status) => {
        if (active) setWindowsImageState(status);
      },
      () => {
        if (active) setWindowsImageState('status-unavailable');
      },
    );
    return () => {
      active = false;
    };
  }, [windowsImageClipboard]);

  async function enableClipboardDelivery() {
    if (clipboardDelivery === undefined || clipboardState !== 'disabled') {
      return;
    }
    setClipboardState('loading');
    setClipboardFeedback(null);
    try {
      const granted = await clipboardDelivery.requestEnable();
      setClipboardState(granted ? 'enabled' : 'disabled');
      setClipboardFeedback(
        granted
          ? 'Text clipboard delivery enabled.'
          : 'Text clipboard delivery was not enabled.',
      );
    } catch {
      setClipboardState('disabled');
      setClipboardFeedback('Could not enable Text clipboard. Try again.');
    }
  }

  async function enableWindowsImageClipboard() {
    if (
      windowsImageClipboard === undefined ||
      windowsImageState !== 'permission-not-granted'
    ) {
      return;
    }
    setWindowsImageState('checking');
    try {
      setWindowsImageState(await windowsImageClipboard.requestEnable());
    } catch {
      setWindowsImageState('permission-not-granted');
    }
  }

  async function checkWindowsImageClipboard() {
    if (windowsImageClipboard === undefined) return;
    setWindowsImageState('checking');
    try {
      setWindowsImageState(await windowsImageClipboard.getStatus());
    } catch {
      setWindowsImageState('status-unavailable');
    }
  }

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

      {clipboardDelivery === undefined ? null : (
        <section
          aria-labelledby="clipboard-delivery-heading"
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3
            className="text-base font-semibold text-slate-950"
            id="clipboard-delivery-heading"
          >
            Text Snippet Clipboard
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Allows AI Support Workspace to prepare Text Snippets as plain text
            and safe formatted text for you to paste with Ctrl+V.
          </p>
          {clipboardState === 'enabled' ? (
            <p className="mt-4 text-sm font-medium text-emerald-700">
              Text clipboard delivery is enabled.
            </p>
          ) : (
            <button
              className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={clipboardState !== 'disabled'}
              onClick={() => void enableClipboardDelivery()}
              type="button"
            >
              {clipboardState === 'loading'
                ? 'Checking Text clipboard…'
                : 'Enable Text clipboard'}
            </button>
          )}
          {clipboardState === 'failed' ? (
            <p className="mt-3 text-sm text-red-700" role="alert">
              Text clipboard status is unavailable. Reload and try again.
            </p>
          ) : null}
          {clipboardFeedback === null ? null : (
            <p aria-live="polite" className="mt-3 text-sm text-slate-700">
              {clipboardFeedback}
            </p>
          )}
        </section>
      )}

      {windowsImageClipboard === undefined ? null : (
        <section
          aria-labelledby="windows-image-clipboard-heading"
          className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h3
            className="text-base font-semibold text-slate-950"
            id="windows-image-clipboard-heading"
          >
            Windows Image Snippets
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the Windows Clipboard Companion to copy Image Snippets as real
            images, then paste them with Ctrl+V. Text Snippets do not require
            the companion.
          </p>

          <p
            aria-live="polite"
            className={`mt-4 text-sm font-medium ${
              windowsImageState === 'ready'
                ? 'text-emerald-700'
                : windowsImageState === 'host-unavailable' ||
                    windowsImageState === 'host-version-mismatch' ||
                    windowsImageState === 'invalid-host-response' ||
                    windowsImageState === 'status-unavailable'
                  ? 'text-red-700'
                  : 'text-slate-700'
            }`}
          >
            {windowsImageState === 'checking'
              ? 'Checking companion…'
              : windowsImageState === 'permission-not-granted'
                ? 'Not enabled'
                : windowsImageState === 'host-unavailable'
                  ? 'Companion not found'
                  : windowsImageState === 'host-version-mismatch'
                    ? 'Companion incompatible'
                    : windowsImageState === 'invalid-host-response'
                      ? 'Companion incompatible'
                      : windowsImageState === 'ready'
                        ? 'Ready'
                        : windowsImageState === 'unsupported-platform'
                          ? 'Available on Windows only'
                          : 'Companion status unavailable'}
          </p>

          {windowsImageState === 'permission-not-granted' ? (
            <button
              className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
              onClick={() => void enableWindowsImageClipboard()}
              type="button"
            >
              Enable Windows Image Snippets
            </button>
          ) : null}
          {windowsImageState === 'host-unavailable' ||
          windowsImageState === 'host-version-mismatch' ||
          windowsImageState === 'invalid-host-response' ||
          windowsImageState === 'status-unavailable' ? (
            <button
              className="mt-4 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              onClick={() => void checkWindowsImageClipboard()}
              type="button"
            >
              Check companion again
            </button>
          ) : null}
        </section>
      )}

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
