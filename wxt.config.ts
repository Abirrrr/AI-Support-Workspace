import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';
import nativeDevelopment from './config/native-clipboard-companion.development.json';

export default defineConfig({
  browser: 'chrome',
  manifestVersion: 3,
  targetBrowsers: ['chrome'],
  srcDir: 'src',
  entrypointsDir: 'extension',
  modules: ['@wxt-dev/module-react'],
  manifest: ({ mode }) => ({
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
    host_permissions: ['http://*/*', 'https://*/*'],
    name: 'AI Support Workspace',
    permissions: ['sidePanel', 'activeTab', 'scripting'],
    optional_permissions: ['clipboardWrite', 'offscreen', 'nativeMessaging'],
    ...(mode === 'native-dev' ? { key: nativeDevelopment.manifestKey } : {}),
  }),
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
