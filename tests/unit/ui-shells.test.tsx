import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { KnowledgeLibrary } from '../../src/application/knowledge/knowledge-library';
import type { SnippetLibrary } from '../../src/application/snippet/snippet-library';
import { OptionsShell } from '../../src/ui/options/OptionsShell';
import { PopupShell } from '../../src/ui/popup/PopupShell';

const knowledgeLibrary: KnowledgeLibrary = {
  load: async () => [],
  create: async () => {
    throw new Error('Not used by this render test.');
  },
  update: async () => {
    throw new Error('Not used by this render test.');
  },
  delete: async () => false,
};

const snippetLibrary: SnippetLibrary = {
  load: async () => [],
  create: async () => {
    throw new Error('Not used by this render test.');
  },
  update: async () => {
    throw new Error('Not used by this render test.');
  },
  delete: async () => false,
};

describe('extension UI shells', () => {
  it('renders popup navigation to the Workspace and Libraries', () => {
    const markup = renderToStaticMarkup(
      <PopupShell openWorkspace={async () => undefined} />,
    );

    expect(markup).toContain('AI Support Workspace');
    expect(markup).toContain('Open Workspace');
    expect(markup).toContain('<button');
    expect(markup).not.toContain('href="/workspace.html"');
    expect(markup).toContain('Open Libraries');
    expect(markup).toContain('href="/options.html"');
  });

  it('renders the Knowledge Library on the options page without settings', () => {
    const markup = renderToStaticMarkup(
      <OptionsShell
        knowledgeLibrary={knowledgeLibrary}
        snippetLibrary={snippetLibrary}
      />,
    );

    expect(markup).toContain('Knowledge Library');
    expect(markup).toContain('Snippet Library');
    expect(markup).toContain('Loading knowledge');
    expect(markup).not.toContain('Settings');
    expect(markup).not.toContain('<input');
  });
});
