import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite plugin that replaces unused jsPDF optional dependencies with empty stubs.
 * 
 * jsPDF internally uses `import("html2canvas")` and `import("dompurify")` for its
 * `pdf.html()` method. Since we only use `pdf.addImage()` with data URLs, these
 * 220KB+ libraries are never actually loaded at runtime.
 * 
 * This plugin intercepts Rollup's resolution of these modules and provides empty
 * implementations, eliminating them from the build output entirely.
 */
function excludeUnusedJspdfDeps(): Plugin {
  const STUB_MODULES = new Set(['html2canvas', 'dompurify']);
  const STUB_PREFIX = '\0stub-empty:';
  
  return {
    name: 'exclude-unused-jspdf-deps',
    enforce: 'pre',
    resolveId(source, importer) {
      // Only intercept when imported from within jspdf
      if (STUB_MODULES.has(source) && importer && importer.includes('jspdf')) {
        return { id: `${STUB_PREFIX}${source}`, moduleSideEffects: false };
      }
      return null;
    },
    load(id) {
      if (id.startsWith(STUB_PREFIX)) {
        // Return a stub that provides the expected default export shape
        // These are never actually called in our code path (pdf.addImage doesn't need them)
        return `export default function() { throw new Error("${id.slice(STUB_PREFIX.length)} is not available - pdf.html() is not supported in this build"); }`;
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [excludeUnusedJspdfDeps(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    // Target last 2 major versions of Chrome, Firefox, Safari, Edge
    target: ['chrome120', 'firefox120', 'safari17', 'edge120'],
  },
});
