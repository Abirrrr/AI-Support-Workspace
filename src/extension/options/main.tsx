import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { KnowledgeLibraryService } from '../../application/knowledge/knowledge-library';
import { createDatabase } from '../../infrastructure/persistence/database';
import { DexieKnowledgeEntryRepository } from '../../infrastructure/persistence/dexie-knowledge-entry-repository';
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

createRoot(root).render(
  <StrictMode>
    <OptionsShell knowledgeLibrary={knowledgeLibrary} />
  </StrictMode>,
);
