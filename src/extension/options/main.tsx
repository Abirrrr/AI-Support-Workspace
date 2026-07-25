import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { OptionsShell } from '../../ui/options/OptionsShell';
import '../../ui/styles.css';

const root = document.querySelector('#root');

if (!root) {
  throw new Error('Options root element was not found.');
}

createRoot(root).render(
  <StrictMode>
    <OptionsShell />
  </StrictMode>,
);
