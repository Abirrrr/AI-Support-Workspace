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
    load: vi.fn(async () => ({ defaultModel: null })),
    save: vi.fn(async (defaultModelInput) => ({
      defaultModel: defaultModelInput.trim() || null,
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

    deferred.resolve({ defaultModel: null });
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
      load: vi.fn(async () => ({ defaultModel: 'qwen2.5:7b' })),
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
      expect(settings.save).toHaveBeenCalledWith('  llama3.2:latest  '),
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

    deferred.resolve({ defaultModel: 'llama3.2:latest' });
    expect(await screen.findByText('Settings saved.')).toBeTruthy();
  });

  it('clears the saved default to null and leaves the input blank', async () => {
    const save = vi.fn(async () => ({ defaultModel: null }));
    const settings = createSettings({
      load: vi.fn(async () => ({ defaultModel: 'qwen2.5:7b' })),
      save,
    });
    render(<SettingsView settings={settings} />);
    const input = await screen.findByDisplayValue('qwen2.5:7b');

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save settings' }));

    await waitFor(() => expect(save).toHaveBeenCalledWith('   '));
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
      .mockResolvedValueOnce({ defaultModel: 'retry-model' });
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
