// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { SettingsApplication } from '../../src/application/settings/settings-service';
import type { Settings } from '../../src/domain/settings';
import { SettingsView } from '../../src/ui/settings/SettingsView';
import type { ClipboardDeliveryPermission } from '../../src/extension/snippet-trigger/clipboard-permission';
import type { WindowsImageClipboardCapability } from '../../src/extension/snippet-trigger/native-clipboard-capability';

function createDeferred<T>() {
  let resolvePromise!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });
  return { promise, resolve: resolvePromise };
}

function createSettings(
  overrides: Partial<SettingsApplication> = {},
): SettingsApplication {
  return {
    load: vi.fn(async () => ({
      defaultModel: null,
      snippetPasteMode: 'clipboard-only' as const,
    })),
    save: vi.fn(async (defaultModelInput, snippetPasteMode) => ({
      defaultModel: defaultModelInput.trim() || null,
      snippetPasteMode,
    })),
    ...overrides,
  };
}

afterEach(cleanup);

describe('SettingsView', () => {
  it('shows an accessible disabled loading state with label and help text', async () => {
    const deferred = createDeferred<Settings>();
    render(
      <SettingsView
        settings={createSettings({ load: vi.fn(() => deferred.promise) })}
      />,
    );

    const input = screen.getByLabelText('Default Ollama model');
    const save = screen.getByRole('button', { name: 'Save settings' });
    const loadingStatus = screen.getByRole('status');
    expect(loadingStatus.textContent).toContain('Loading settings');
    expect(loadingStatus.getAttribute('aria-live')).toBe('polite');
    expect(input).toHaveProperty('disabled', true);
    expect(save).toHaveProperty('disabled', true);
    expect(input.getAttribute('aria-describedby')).toBe(
      'default-ollama-model-help',
    );
    expect(input.className).toContain('w-full');
    expect(input.getAttribute('type')).toBe('text');
    expect(save.getAttribute('type')).toBe('submit');
    expect(
      input.compareDocumentPosition(save) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      screen.getByText(/New Workspace Side Panel sessions start with/),
    ).toBeTruthy();

    deferred.resolve({
      defaultModel: null,
      snippetPasteMode: 'clipboard-only',
    });
    await waitFor(() => expect(input).toHaveProperty('disabled', false));
  });

  it('loads a blank first-run state without saving or creating data', async () => {
    const settings = createSettings();
    render(<SettingsView settings={settings} />);

    const input = await screen.findByLabelText('Default Ollama model');
    await waitFor(() => expect(input).toHaveProperty('disabled', false));
    expect(input).toHaveProperty('value', '');
    expect(input).toHaveProperty('placeholder', 'qwen2.5:7b');
    expect(
      screen.getByRole('button', { name: 'Save settings' }),
    ).toHaveProperty('disabled', true);
    expect(settings.save).not.toHaveBeenCalled();
  });

  it('populates a saved model and compares dirty state after normalization', async () => {
    const settings = createSettings({
      load: vi.fn(async () => ({
        defaultModel: 'qwen2.5:7b',
        snippetPasteMode: 'clipboard-only' as const,
      })),
    });
    render(<SettingsView settings={settings} />);

    const input = await screen.findByDisplayValue('qwen2.5:7b');
    const save = screen.getByRole('button', { name: 'Save settings' });
    expect(save).toHaveProperty('disabled', true);

    fireEvent.change(input, { target: { value: '  qwen2.5:7b  ' } });
    expect(save).toHaveProperty('disabled', true);

    fireEvent.change(input, { target: { value: 'llama3.2' } });
    expect(save).toHaveProperty('disabled', false);
  });

  it('saves a normalized model, updates the baseline, and reports success', async () => {
    const settings = createSettings();
    render(<SettingsView settings={settings} />);
    const input = await screen.findByLabelText('Default Ollama model');
    await waitFor(() => expect(input).toHaveProperty('disabled', false));

    fireEvent.change(input, { target: { value: '  llama3.2:latest  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() =>
      expect(settings.save).toHaveBeenCalledWith(
        '  llama3.2:latest  ',
        'clipboard-only',
      ),
    );
    expect(await screen.findByText('Settings saved.')).toBeTruthy();
    expect(input).toHaveProperty('value', 'llama3.2:latest');
    expect(
      screen.getByRole('button', { name: 'Save settings' }),
    ).toHaveProperty('disabled', true);
  });

  it('disables editing and duplicate saves while a save is active', async () => {
    const deferred = createDeferred<Settings>();
    render(
      <SettingsView
        settings={createSettings({ save: vi.fn(() => deferred.promise) })}
      />,
    );
    const input = await screen.findByLabelText('Default Ollama model');
    await waitFor(() => expect(input).toHaveProperty('disabled', false));
    fireEvent.change(input, { target: { value: 'llama3.2:latest' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    const saving = screen.getByRole('button', { name: 'Saving…' });
    expect(saving).toHaveProperty('disabled', true);
    expect(input).toHaveProperty('disabled', true);

    deferred.resolve({
      defaultModel: 'llama3.2:latest',
      snippetPasteMode: 'clipboard-only',
    });
    expect(await screen.findByText('Settings saved.')).toBeTruthy();
  });

  it('clears the saved default to null and leaves the input blank', async () => {
    const save = vi.fn(async () => ({
      defaultModel: null,
      snippetPasteMode: 'clipboard-only' as const,
    }));
    const settings = createSettings({
      load: vi.fn(async () => ({
        defaultModel: 'qwen2.5:7b',
        snippetPasteMode: 'clipboard-only' as const,
      })),
      save,
    });
    render(<SettingsView settings={settings} />);
    const input = await screen.findByDisplayValue('qwen2.5:7b');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('   ', 'clipboard-only'),
    );
    expect(input).toHaveProperty('value', '');
    expect(screen.getByText('Settings saved.')).toBeTruthy();
  });

  it('shows the exact load failure and keeps saving disabled', async () => {
    render(
      <SettingsView
        settings={createSettings({
          load: vi.fn(async () => {
            throw new Error('raw load failure');
          }),
        })}
      />,
    );

    expect(
      await screen.findByText("Couldn't load settings. Reload and try again."),
    ).toBeTruthy();
    expect(screen.getByRole('alert').getAttribute('aria-live')).toBe(
      'assertive',
    );
    expect(screen.queryByText('raw load failure')).toBeNull();
    expect(screen.getByLabelText('Default Ollama model')).toHaveProperty(
      'disabled',
      true,
    );
    expect(
      screen.getByRole('button', { name: 'Save settings' }),
    ).toHaveProperty('disabled', true);
  });

  it('preserves failed unsaved input and allows retry after save failure', async () => {
    const save = vi
      .fn<SettingsApplication['save']>()
      .mockRejectedValueOnce(new Error('raw save failure'))
      .mockResolvedValueOnce({
        defaultModel: 'retry-model',
        snippetPasteMode: 'clipboard-only',
      });
    render(<SettingsView settings={createSettings({ save })} />);
    const input = await screen.findByLabelText('Default Ollama model');
    await waitFor(() => expect(input).toHaveProperty('disabled', false));
    fireEvent.change(input, { target: { value: 'retry-model' } });

    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(
      await screen.findByText("Couldn't save settings. Try again."),
    ).toBeTruthy();
    expect(screen.queryByText('raw save failure')).toBeNull();
    expect(input).toHaveProperty('value', 'retry-model');
    expect(
      screen.getByRole('button', { name: 'Save settings' }),
    ).toHaveProperty('disabled', false);

    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(await screen.findByText('Settings saved.')).toBeTruthy();
    expect(save).toHaveBeenCalledTimes(2);
  });
});

describe('Text Snippet clipboard enablement', () => {
  function permission(
    enabled: boolean,
    granted = true,
  ): ClipboardDeliveryPermission {
    return {
      isEnabled: vi.fn(async () => enabled),
      requestEnable: vi.fn(async () => granted),
    };
  }

  it('shows explanatory disabled state without requesting on load', async () => {
    const clipboardDelivery = permission(false);
    render(
      <SettingsView
        clipboardDelivery={clipboardDelivery}
        settings={createSettings()}
      />,
    );
    expect(await screen.findByText('Text Snippet Clipboard')).toBeTruthy();
    expect(
      screen.getByText(
        /prepare Text Snippets as plain text and safe formatted text/,
      ),
    ).toBeTruthy();
    expect(
      await screen.findByRole('button', { name: 'Enable Text clipboard' }),
    ).toBeTruthy();
    expect(clipboardDelivery.requestEnable).not.toHaveBeenCalled();
  });

  it('requests only after the explicit enable click and reports grant success', async () => {
    const clipboardDelivery = permission(false, true);
    render(
      <SettingsView
        clipboardDelivery={clipboardDelivery}
        settings={createSettings()}
      />,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Enable Text clipboard' }),
    );
    expect(
      await screen.findByText('Text clipboard delivery enabled.'),
    ).toBeTruthy();
    expect(clipboardDelivery.requestEnable).toHaveBeenCalledOnce();
    expect(
      screen.getByText('Text clipboard delivery is enabled.'),
    ).toBeTruthy();
  });

  it('keeps the capability disabled after denial and allows explicit retry', async () => {
    const clipboardDelivery = permission(false, false);
    render(
      <SettingsView
        clipboardDelivery={clipboardDelivery}
        settings={createSettings()}
      />,
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Enable Text clipboard' }),
    );
    expect(
      await screen.findByText('Text clipboard delivery was not enabled.'),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Enable Text clipboard' }),
    ).toBeTruthy();
  });
});

describe('Windows Image Snippets capability', () => {
  function capability(
    status:
      | 'unsupported-platform'
      | 'permission-not-granted'
      | 'host-unavailable'
      | 'host-version-mismatch'
      | 'invalid-host-response'
      | 'ready',
    enabledStatus = status,
  ): WindowsImageClipboardCapability {
    return {
      getStatus: vi.fn(async () => status),
      requestEnable: vi.fn(async () => enabledStatus),
    };
  }

  it.each([
    ['host-unavailable', 'Companion not found'],
    ['host-version-mismatch', 'Companion incompatible'],
    ['invalid-host-response', 'Companion incompatible'],
    ['ready', 'Ready'],
    ['unsupported-platform', 'Available on Windows only'],
  ] as const)('shows status %s as actionable text', async (status, text) => {
    const windowsImageClipboard = capability(status);
    render(
      <SettingsView
        settings={createSettings()}
        windowsImageClipboard={windowsImageClipboard}
      />,
    );
    expect(await screen.findByText('Windows Image Snippets')).toBeTruthy();
    expect(await screen.findByText(text)).toBeTruthy();
    expect(windowsImageClipboard.requestEnable).not.toHaveBeenCalled();
    expect(screen.queryByText(/registry|protocol|com\.ai_support/i)).toBeNull();
  });

  it('does not request permission while loading an ungranted status', async () => {
    const windowsImageClipboard = capability('permission-not-granted');
    render(
      <SettingsView
        settings={createSettings()}
        windowsImageClipboard={windowsImageClipboard}
      />,
    );
    expect(await screen.findByText('Not enabled')).toBeTruthy();
    expect(windowsImageClipboard.getStatus).toHaveBeenCalledOnce();
    expect(windowsImageClipboard.requestEnable).not.toHaveBeenCalled();
  });

  it('requests native permission only after explicit enable and distinguishes host readiness', async () => {
    const windowsImageClipboard = capability(
      'permission-not-granted',
      'host-unavailable',
    );
    render(
      <SettingsView
        settings={createSettings()}
        windowsImageClipboard={windowsImageClipboard}
      />,
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Enable Windows Image Snippets',
      }),
    );
    expect(await screen.findByText('Companion not found')).toBeTruthy();
    expect(windowsImageClipboard.requestEnable).toHaveBeenCalledOnce();
    expect(screen.queryByText('Ready')).toBeNull();
  });

  it('keeps permission disabled after denial and allows another explicit click', async () => {
    const windowsImageClipboard = capability(
      'permission-not-granted',
      'permission-not-granted',
    );
    render(
      <SettingsView
        settings={createSettings()}
        windowsImageClipboard={windowsImageClipboard}
      />,
    );
    fireEvent.click(
      await screen.findByRole('button', {
        name: 'Enable Windows Image Snippets',
      }),
    );
    expect(
      await screen.findByRole('button', {
        name: 'Enable Windows Image Snippets',
      }),
    ).toBeTruthy();
    expect(windowsImageClipboard.requestEnable).toHaveBeenCalledOnce();
  });

  it('replaces a previous unavailable result with Ready after explicit refresh', async () => {
    const getStatus = vi
      .fn<WindowsImageClipboardCapability['getStatus']>()
      .mockResolvedValueOnce('host-unavailable')
      .mockResolvedValueOnce('ready');
    const windowsImageClipboard: WindowsImageClipboardCapability = {
      getStatus,
      requestEnable: vi.fn<WindowsImageClipboardCapability['requestEnable']>(
        async () => 'ready',
      ),
    };
    render(
      <SettingsView
        settings={createSettings()}
        windowsImageClipboard={windowsImageClipboard}
      />,
    );
    expect(await screen.findByText('Companion not found')).toBeTruthy();
    fireEvent.click(
      screen.getByRole('button', { name: 'Check companion again' }),
    );
    expect(await screen.findByText('Ready')).toBeTruthy();
    expect(getStatus).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Companion not found')).toBeNull();
  });
});
