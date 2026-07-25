import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { PopupShell } from '../../ui/popup/PopupShell';
import '../../ui/styles.css';

const root = document.querySelector('#root');

if (!root) {
  throw new Error('Popup root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <PopupShell />
  </StrictMode>,
);
