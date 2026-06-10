import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@site': path.resolve(__dirname),
      '@site/src': path.resolve(__dirname, 'src'),
      '@theme/Layout': path.resolve(__dirname, 'src/__mocks__/theme/Layout.tsx'),
      '@docusaurus/useBaseUrl': path.resolve(__dirname, 'src/__mocks__/@docusaurus/useBaseUrl.ts'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'build', '.docusaurus', '.vitepress'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      exclude: ['node_modules', 'build', '.docusaurus', '.vitepress'],
    },
  },
});
