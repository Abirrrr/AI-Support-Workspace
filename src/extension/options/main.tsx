import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { KnowledgeLibraryService } from '../../application/knowledge/knowledge-library';
import { SettingsService } from '../../application/settings/settings-service';
import { SnippetLibraryService } from '../../application/snippet/snippet-library';
import { createDatabase } from '../../infrastructure/persistence/database';
import { DexieKnowledgeEntryRepository } from '../../infrastructure/persistence/dexie-knowledge-entry-repository';
import { DexieSettingsRepository } from '../../infrastructure/persistence/dexie-settings-repository';
import { DexieSnippetEntryRepository } from '../../infrastructure/persistence/dexie-snippet-entry-repository';
import { OptionsShell } from '../../ui/options/OptionsShell';
import '../../ui/styles.css';

const root = document.querySelector('#root');

if (!root) {
  throw new Error('Options root element was not found.');
}

const database = createDatabase();
const knowledgeLibrary = new KnowledgeLibraryService(
  new DexieKnowledgeEntryRepository(database),
);
const settings = new SettingsService(new DexieSettingsRepository(database));
const snippetLibrary = new SnippetLibraryService(
  new DexieSnippetEntryRepository(database),
);

createRoot(root).render(
  <StrictMode>
    <OptionsShell
      knowledgeLibrary={knowledgeLibrary}
      settings={settings}
      snippetLibrary={snippetLibrary}
    />
  </StrictMode>,
);
