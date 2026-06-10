import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.vitepress/dist', '.vitepress/cache'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['.vitepress/components/**/*.vue', '.vitepress/theme/**/*.{ts,vue}'],
      exclude: ['node_modules', '.vitepress/dist', '.vitepress/cache'],
    },
  },
})
