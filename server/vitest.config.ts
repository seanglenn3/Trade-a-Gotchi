import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@trade-a-gotchi/engine': path.resolve(__dirname, '../packages/engine/src/index.ts'),
    },
  },
});
