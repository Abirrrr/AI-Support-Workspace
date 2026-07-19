import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    clearMocks: true,
    environment: 'node',
    include: ['tests/{integration,unit}/**/*.{test,spec}.{ts,tsx}'],
    passWithNoTests: true,
    restoreMocks: true,
  },
});
