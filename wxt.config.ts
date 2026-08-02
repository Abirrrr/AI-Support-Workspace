import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  browser: 'chrome',
  manifestVersion: 3,
  targetBrowsers: ['chrome'],
  srcDir: 'src',
  entrypointsDir: 'extension',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    commands: {
      'capture-selection-to-workspace': {
        description: 'Capture selected text in AI Support Workspace',
        suggested_key: {
          default: 'Ctrl+Shift+Space',
          mac: 'Command+Shift+Space',
        },
      },
    },
    description: 'Chrome extension runtime shell for AI Support Workspace.',
    host_permissions: ['http://localhost/*'],
    name: 'AI Support Workspace',
    permissions: ['sidePanel', 'activeTab', 'scripting'],
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
