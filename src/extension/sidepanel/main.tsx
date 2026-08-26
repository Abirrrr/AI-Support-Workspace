import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { createOpenOptionsPage } from './open-options-page';
import { WorkspaceShell } from '../../ui/workspace/WorkspaceShell';
import '../../ui/styles.css';

const root = document.querySelector('#root');

if (!root) {
  throw new Error('Side Panel root element was not found.');
}

const sidePanelRoot = root;

const openOptionsPage = createOpenOptionsPage(
  (
    globalThis as typeof globalThis & {
      chrome?: { runtime?: { openOptionsPage(): Promise<void> } };
    }
  ).chrome?.runtime,
);

createRoot(sidePanelRoot).render(
  <StrictMode>
    <WorkspaceShell openOptionsPage={openOptionsPage} />
  </StrictMode>,
);
