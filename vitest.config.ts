import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
      '@main': path.resolve(__dirname, './electron'),
      '@database': path.resolve(__dirname, './database'),
      '@renderer': path.resolve(__dirname, './src')
    }
  }
});
