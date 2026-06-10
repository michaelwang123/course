/**
 * Build Completeness & URL Path Structure Validation Tests
 *
 * Property 8: 构建完整性 — 验证每个 docs/ 下的 Markdown 文件有对应 HTML 产物
 * Property 9: URL 路径结构映射 — 验证生成页面 URL 遵循正确路径结构
 *
 * **Validates: Requirements 1.6, 2.1, 2.2**
 *
 * NOTE: These tests depend on `build/` existing. Run `npm run build` before executing.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const BUILD_DIR = join(__dirname, '..', '..', 'build');
const DOCS_DIR = join(__dirname, '..', '..', 'docs');

/**
 * Recursively find all Markdown (.md/.mdx) files in a directory.
 * Skips .gitkeep and other non-Markdown files.
 */
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath));
    } else if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Convert a docs/ Markdown path to its expected build/ HTML path.
 *
 * Docusaurus with routeBasePath: '/' outputs directly to build/:
 * - docs/index.md → build/index.html
 * - docs/ragflow/index.mdx → build/ragflow/index.html
 * - docs/ragflow/architecture.mdx → build/ragflow/architecture/index.html
 * - docs/site_build/beta/css-animation-guide.md → build/site_build/beta/css-animation-guide/index.html
 *
 * Rule: index files map to their parent directory's index.html,
 * non-index files get their own directory with index.html inside.
 */
function mdToHtmlPath(mdPath: string): string {
  const rel = relative(DOCS_DIR, mdPath);
  const parts = rel.replace(/\.(md|mdx)$/, '').split(/[\\/]/);
  const filename = parts[parts.length - 1];

  if (filename === 'index') {
    // index files map to directory: docs/ragflow/index.mdx → build/ragflow/index.html
    if (parts.length === 1) {
      // Root index: docs/index.md → build/index.html
      return join(BUILD_DIR, 'index.html');
    }
    return join(BUILD_DIR, ...parts.slice(0, -1), 'index.html');
  }
  // Non-index files get their own directory: docs/ragflow/architecture.mdx → build/ragflow/architecture/index.html
  return join(BUILD_DIR, ...parts, 'index.html');
}

/**
 * Derive the expected URL path from a Markdown source file.
 * Based on Docusaurus routing with baseUrl '/course/' and routeBasePath '/':
 * - docs/index.md → /course/
 * - docs/ragflow/index.mdx → /course/ragflow/
 * - docs/ragflow/architecture.mdx → /course/ragflow/architecture
 * - docs/site_build/todo.md → /course/site_build/todo
 */
function mdToUrlPath(mdPath: string): string {
  const rel = relative(DOCS_DIR, mdPath).replace(/\\/g, '/');
  const parts = rel.replace(/\.(md|mdx)$/, '').split('/');
  const filename = parts[parts.length - 1];

  if (filename === 'index') {
    if (parts.length === 1) {
      return '/course/';
    }
    return `/course/${parts.slice(0, -1).join('/')}/`;
  }
  return `/course/${parts.join('/')}`;
}

describe('Build Completeness (Properties 8 & 9)', () => {
  const mdFiles = findMarkdownFiles(DOCS_DIR);

  /**
   * **Validates: Requirements 1.6, 2.1**
   *
   * Property 8: For every Markdown file in docs/, a corresponding HTML file
   * must exist in the build output at the derived path location.
   */
  it('Property 8: every docs/ markdown has a corresponding HTML output', () => {
    if (!existsSync(BUILD_DIR)) {
      console.warn('SKIPPED: build/ directory not found. Run `npm run build` first.');
      return;
    }

    expect(mdFiles.length).toBeGreaterThan(0);

    const missing: string[] = [];
    for (const md of mdFiles) {
      const htmlPath = mdToHtmlPath(md);
      if (!existsSync(htmlPath)) {
        missing.push(`${relative(DOCS_DIR, md)} → expected: ${relative(BUILD_DIR, htmlPath)}`);
      }
    }
    expect(missing).toEqual([]);
  });

  /**
   * **Validates: Requirements 2.2**
   *
   * Property 9: Generated page URLs follow the correct path structure.
   * - All URLs are prefixed with /course/ (the configured baseUrl)
   * - Index files map to /<base>/<module>/
   * - Non-index files map to /<base>/<module>/<filename>
   */
  it('Property 9: URL paths follow /<base>/<module>/<filename> structure', () => {
    if (!existsSync(BUILD_DIR)) {
      console.warn('SKIPPED: build/ directory not found. Run `npm run build` first.');
      return;
    }

    expect(mdFiles.length).toBeGreaterThan(0);

    for (const md of mdFiles) {
      const urlPath = mdToUrlPath(md);

      // All URLs must start with /course/ (baseUrl)
      expect(urlPath).toMatch(/^\/course\//);

      // Verify the URL structure matches the docs/ source structure
      const relMd = relative(DOCS_DIR, md).replace(/\\/g, '/');
      const parts = relMd.replace(/\.(md|mdx)$/, '').split('/');
      const filename = parts[parts.length - 1];

      if (filename === 'index') {
        // Index files: URL ends with /
        expect(urlPath).toMatch(/\/$/);
      } else {
        // Non-index files: URL ends with the filename (no trailing slash)
        expect(urlPath).toContain(filename);
        expect(urlPath).not.toMatch(/\/$/);
      }

      // Verify the corresponding HTML file exists in build output
      const htmlPath = mdToHtmlPath(md);
      expect(existsSync(htmlPath)).toBe(true);
    }
  });
});
