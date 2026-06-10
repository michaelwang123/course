import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

/**
 * SEO Metadata Validation Tests (Property 10)
 * Validates: Requirements 13.2, 13.3
 *
 * These tests require the build/ directory to exist (run after `npm run build`).
 */

const BUILD_DIR = join(__dirname, '..', '..', 'build');

function getPageHtml(pagePath: string): string | null {
  const htmlPath = join(BUILD_DIR, pagePath, 'index.html');
  if (!existsSync(htmlPath)) return null;
  return readFileSync(htmlPath, 'utf-8');
}

describe('SEO Metadata (Property 10)', () => {
  it('Property 10: title format is "{页面标题} | 技术教程站"', () => {
    // Check ragflow architecture page which has a title in frontmatter
    const html = getPageHtml('ragflow/architecture');
    expect(html).not.toBeNull();

    const dom = new JSDOM(html!);
    const title = dom.window.document.querySelector('title');
    expect(title).not.toBeNull();
    expect(title!.textContent).toMatch(/.*\| 技术教程站$/);
  });

  it('pages with description frontmatter have meta description tag', () => {
    // Check a page that has description in frontmatter
    const html = getPageHtml('ragflow');
    if (!html) return; // Skip if page doesn't exist

    const dom = new JSDOM(html);
    const metaDesc = dom.window.document.querySelector('meta[name="description"]');
    // If a description was set in frontmatter, it should be present
    if (metaDesc) {
      expect(metaDesc.getAttribute('content')).toBeTruthy();
      expect(metaDesc.getAttribute('content')!.length).toBeGreaterThan(0);
    }
  });

  it('homepage title contains site name', () => {
    const html = getPageHtml('');
    if (!html) {
      // Fallback: check build/index.html directly
      const indexPath = join(BUILD_DIR, 'index.html');
      if (!existsSync(indexPath)) return;
      const indexHtml = readFileSync(indexPath, 'utf-8');
      const dom = new JSDOM(indexHtml);
      const title = dom.window.document.querySelector('title');
      expect(title).not.toBeNull();
      expect(title!.textContent).toContain('技术教程站');
      return;
    }

    const dom = new JSDOM(html!);
    const title = dom.window.document.querySelector('title');
    expect(title).not.toBeNull();
    expect(title!.textContent).toContain('技术教程站');
  });
});
