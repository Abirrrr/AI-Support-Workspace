import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { OptionsShell } from '../../src/ui/options/OptionsShell';
import { PopupShell } from '../../src/ui/popup/PopupShell';

describe('extension UI shells', () => {
  it('renders the popup runtime status', () => {
    const markup = renderToStaticMarkup(<PopupShell />);

    expect(markup).toContain('AI Support Workspace');
    expect(markup).toContain('Extension shell is operational.');
  });

  it('renders the static options-page status without settings controls', () => {
    const markup = renderToStaticMarkup(<OptionsShell />);

    expect(markup).toContain('The options page shell is operational.');
    expect(markup).not.toContain('<input');
    expect(markup).not.toContain('<button');
  });
});
