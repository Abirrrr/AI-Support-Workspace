/** @type {import('lint-staged').Configuration} */
export default {
  '*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}': [
    'eslint --fix --max-warnings=0',
    'prettier --write',
  ],
  '*.{css,json,jsonc,yaml,yml}': 'prettier --write',
};
