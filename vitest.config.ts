import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['scripts/**/*.test.mjs', 'app/**/*.test.{ts,tsx,js,mjs}', 'packages/**/*.test.{ts,tsx,js,mjs}'],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
    passWithNoTests: false,
    clearMocks: true,
  },
});
