import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { OutputWorkflow } from '../../application/output/output-workflow';
import { PromptBuilder } from '../../application/prompt/prompt-builder';
import { RetrievalEngine } from '../../application/retrieval/retrieval-engine';
import { OllamaProvider } from '../../infrastructure/generation/ollama-provider';
import { createDatabase } from '../../infrastructure/persistence/database';
import { DexieKnowledgeEntryRepository } from '../../infrastructure/persistence/dexie-knowledge-entry-repository';
import { DexieSnippetEntryRepository } from '../../infrastructure/persistence/dexie-snippet-entry-repository';
import { OutputWorkspaceView } from '../../ui/workspace/OutputWorkspaceView';
import '../../ui/styles.css';

const root = document.querySelector('#root');

if (!root) {
  throw new Error('Side Panel root element was not found.');
}

const database = createDatabase();
const knowledgeRepository = new DexieKnowledgeEntryRepository(database);
const snippetRepository = new DexieSnippetEntryRepository(database);
const retrievalEngine = new RetrievalEngine(
  knowledgeRepository,
  snippetRepository,
);
const promptBuilder = new PromptBuilder();
const generationProvider = new OllamaProvider();
const outputWorkflow = new OutputWorkflow(
  retrievalEngine,
  promptBuilder,
  generationProvider,
);

createRoot(root).render(
  <StrictMode>
    <OutputWorkspaceView outputWorkflow={outputWorkflow} />
  </StrictMode>,
);
