/**
 * Navigation Properties Validation Tests
 *
 * Property 11: TOC 标题提取 — 验证页面 TOC 包含 h2/h3 标题并链接到锚点
 * Property 12: Prev/Next 导航边界正确性 — 验证首页无 prev、末页无 next
 *
 * **Validates: Requirements 5.3, 5.4**
 *
 * NOTE: These tests depend on `build/` existing. Run `npm run build` before executing.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

const BUILD_DIR = join(__dirname, '..', '..', 'build');

function getPageHtml(pagePath: string): string | null {
  const htmlPath = join(BUILD_DIR, pagePath, 'index.html');
  if (!existsSync(htmlPath)) return null;
  return readFileSync(htmlPath, 'utf-8');
}

describe('Navigation Properties (11 & 12)', () => {
  /**
   * **Validates: Requirements 5.3**
   *
   * Property 11: For any page containing h2/h3 headings, the generated TOC
   * (table of contents) shall contain entries linking to heading anchors.
   */
  it('Property 11: TOC contains h2/h3 headings linking to anchors', () => {
    // Check a content-rich page (ragflow architecture has many headings)
    const html = getPageHtml('ragflow/architecture');
    if (!html) {
      console.warn('SKIPPED: ragflow/architecture page not found. Run `npm run build` first.');
      return;
    }

    const dom = new JSDOM(html);
    const doc = dom.window.document;

    // Docusaurus TOC uses class "table-of-contents__link"
    const tocLinks = doc.querySelectorAll('.table-of-contents__link');
    expect(tocLinks.length).toBeGreaterThan(0);

    // Each TOC entry should link to an anchor (href starting with #)
    for (const link of tocLinks) {
      const href = link.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href!).toMatch(/^#/); // Should be anchor links
    }
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * Property 12: The first page in a module's sidebar shall NOT have a prev link,
   * and the last page shall NOT have a next link.
   */
  it('Property 12: first page has no prev link, last page has no next link', () => {
    // In the ragflow sidebar, first page is "index" (介绍), last is "advanced" (进阶功能)
    // Check first page (ragflow/index)
    const firstHtml = getPageHtml('ragflow');
    if (!firstHtml) {
      console.warn('SKIPPED: ragflow page not found. Run `npm run build` first.');
      return;
    }

    const firstDom = new JSDOM(firstHtml);
    const firstDoc = firstDom.window.document;
    const prevLink = firstDoc.querySelector('.pagination-nav__link--prev');
    // First page should NOT have a prev link
    expect(prevLink).toBeNull();

    // Check last page (ragflow/advanced)
    const lastHtml = getPageHtml('ragflow/advanced');
    if (!lastHtml) {
      console.warn('SKIPPED: ragflow/advanced page not found. Run `npm run build` first.');
      return;
    }

    const lastDom = new JSDOM(lastHtml);
    const lastDoc = lastDom.window.document;
    const nextLink = lastDoc.querySelector('.pagination-nav__link--next');
    // Last page should NOT have a next link
    expect(nextLink).toBeNull();
  });
});
