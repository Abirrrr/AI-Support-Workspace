// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PopupShell } from '../../src/ui/popup/PopupShell';

afterEach(() => {
  cleanup();
});

describe('PopupShell', () => {
  it('opens the Workspace through its injected Side Panel action', async () => {
    const openWorkspace = vi.fn(async () => undefined);

    render(<PopupShell openWorkspace={openWorkspace} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Workspace' }));

    await waitFor(() => expect(openWorkspace).toHaveBeenCalledOnce());
    expect(screen.getByRole('link', { name: 'Open Libraries' })).toHaveProperty(
      'pathname',
      '/options.html',
    );
  });

  it('shows safe feedback after a Side Panel open failure', async () => {
    const openWorkspace = vi.fn(async () => {
      throw new Error('raw Chrome failure');
    });

    render(<PopupShell openWorkspace={openWorkspace} />);
    fireEvent.click(screen.getByRole('button', { name: 'Open Workspace' }));

    expect(
      await screen.findByText('Could not open Workspace. Try again.'),
    ).toBeTruthy();
    expect(screen.queryByText('raw Chrome failure')).toBeNull();
    expect(screen.getByRole('link', { name: 'Open Libraries' })).toHaveProperty(
      'pathname',
      '/options.html',
    );
  });
});
