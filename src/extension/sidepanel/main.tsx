import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { OutputWorkflow } from '../../application/output/output-workflow';
import { PromptBuilder } from '../../application/prompt/prompt-builder';
import { RetrievalEngine } from '../../application/retrieval/retrieval-engine';
import { SettingsService } from '../../application/settings/settings-service';
import { OllamaProvider } from '../../infrastructure/generation/ollama-provider';
import { createDatabase } from '../../infrastructure/persistence/database';
import { DexieKnowledgeEntryRepository } from '../../infrastructure/persistence/dexie-knowledge-entry-repository';
import { DexieSettingsRepository } from '../../infrastructure/persistence/dexie-settings-repository';
import { DexieSnippetEntryRepository } from '../../infrastructure/persistence/dexie-snippet-entry-repository';
import { OutputWorkspaceView } from '../../ui/workspace/OutputWorkspaceView';
import { createChromeWorkspaceCaptureSource } from '../keyboard-shortcut/sidepanel-capture-source';
import { loadWorkspaceSettings } from './settings-bootstrap';
import '../../ui/styles.css';

const root = document.querySelector('#root');

if (!root) {
  throw new Error('Side Panel root element was not found.');
}

const sidePanelRoot = root;

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
const settings = new SettingsService(new DexieSettingsRepository(database));

async function mountSidePanel() {
  const workspaceSettings = await loadWorkspaceSettings(settings);
  const captureSource = createChromeWorkspaceCaptureSource();

  createRoot(sidePanelRoot).render(
    <StrictMode>
      <OutputWorkspaceView
        captureSource={captureSource}
        initialModel={workspaceSettings.initialModel}
        outputWorkflow={outputWorkflow}
        settingsLoadFailureMessage={workspaceSettings.loadFailureMessage}
      />
    </StrictMode>,
  );
}

void mountSidePanel();
