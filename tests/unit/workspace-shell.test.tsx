// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WorkspaceShell } from '../../src/ui/workspace/WorkspaceShell';

afterEach(cleanup);

describe('M14-P.4 Side Panel shell', () => {
  it('renders the complete provider-neutral Workspace presentation', () => {
    const openOptionsPage = vi.fn(async () => undefined);
    render(<WorkspaceShell openOptionsPage={openOptionsPage} />);

    expect(
      screen.getByRole('heading', { name: 'AI Support Workspace' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Open Settings and Libraries' }),
    ).toBeTruthy();
    expect(screen.getByLabelText('Merchant Context')).toBeTruthy();
    expect(
      screen.getByRole('heading', { name: 'Context Images' }),
    ).toBeTruthy();
    expect(
      screen.getByText('Image attachments are not available yet.'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Guidance / Gist')).toBeTruthy();
    expect(screen.getByLabelText('Model')).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Generate' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(
      screen.getByRole('heading', { name: 'Generated Output' }),
    ).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Save as Snippet' }),
    ).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Copy' })).toHaveProperty(
      'disabled',
      true,
    );
    expect(
      screen.getByRole('textbox', { name: 'Generated Output' }),
    ).toHaveProperty('readOnly', false);
    expect(document.body.textContent).not.toMatch(/Ollama|OpenAI|Anthropic/);
    expect(openOptionsPage).not.toHaveBeenCalled();
  });

  it('provides responsive wrapping hooks without a fixed desktop width', () => {
    render(<WorkspaceShell openOptionsPage={async () => undefined} />);
    const layout = document.querySelector(
      '[data-layout="responsive-side-panel"]',
    );
    const modelActions = document.querySelector(
      '[data-layout="responsive-model-actions"]',
    );
    const outputActions = document.querySelector(
      '[data-layout="responsive-output-actions"]',
    );

    expect(layout?.className).toContain('w-full');
    expect(layout?.className).toContain('min-w-0');
    expect(layout?.className).toContain('overflow-x-hidden');
    expect(layout?.className).not.toMatch(/(?:^|\s)w-\d+/);
    expect(modelActions?.className).toContain('flex-wrap');
    expect(outputActions?.className).toContain('flex-wrap');
  });

  it('keeps AI presentation local and performs no work merely from rendering', () => {
    const openOptionsPage = vi.fn(async () => undefined);
    render(<WorkspaceShell openOptionsPage={openOptionsPage} />);

    expect(openOptionsPage).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Merchant Context')).toHaveProperty(
      'value',
      '',
    );
    expect(screen.getByLabelText('Guidance / Gist')).toHaveProperty(
      'value',
      '',
    );
    expect(
      screen.getByRole('textbox', { name: 'Generated Output' }),
    ).toHaveProperty('value', '');
  });

  it('opens existing Options only after explicit Settings activation', async () => {
    const openOptionsPage = vi.fn(async () => undefined);
    render(<WorkspaceShell openOptionsPage={openOptionsPage} />);
    expect(openOptionsPage).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: 'AI Support Workspace' }),
    ).toBeTruthy();
    const gear = screen.getByRole('button', {
      name: 'Open Settings and Libraries',
    });
    expect(gear.getAttribute('title')).toBe('Open Settings and Libraries');
    fireEvent.click(gear);
    await waitFor(() => expect(openOptionsPage).toHaveBeenCalledOnce());
    expect(screen.getByRole('button', { name: 'Generate' })).toHaveProperty(
      'disabled',
      true,
    );
  });

  it('reports safe failure without automatic navigation or raw errors', async () => {
    const openOptionsPage = vi.fn(async () => {
      throw new Error('raw Chrome failure');
    });
    render(<WorkspaceShell openOptionsPage={openOptionsPage} />);
    expect(openOptionsPage).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole('button', { name: 'Open Settings and Libraries' }),
    );
    expect(
      await screen.findByText("Couldn't open Settings. Try again."),
    ).toBeTruthy();
    expect(screen.queryByText('raw Chrome failure')).toBeNull();
  });
});
