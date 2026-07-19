import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  browser: 'chrome',
  manifestVersion: 3,
  targetBrowsers: ['chrome'],
  srcDir: 'src',
  entrypointsDir: 'extension',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
