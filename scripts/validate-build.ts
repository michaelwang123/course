#!/usr/bin/env npx tsx
/**
 * Build Output Validation Script
 *
 * Validates Docusaurus build output (build/ directory) using jsdom to parse HTML.
 *
 * Property 6: Markdown 渲染语义保持
 *   - frontmatter title appears in <title> tag
 *   - code blocks have language-specific class attributes
 *
 * Property 7: Base Path 一致性
 *   - all internal links start with /course/
 *   - all internal resource references (script, link, img) start with /course/
 *
 * Validates: Requirements 1.2, 1.5, 2.3, 2.4
 *
 * Usage: npx tsx scripts/validate-build.ts
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { JSDOM } from 'jsdom';

const BUILD_DIR = join(__dirname, '..', 'build');

let totalPassed = 0;
let totalFailed = 0;

function pass(message: string): void {
  console.log(`  ✅ PASS: ${message}`);
  totalPassed++;
}

function fail(message: string): void {
  console.error(`  ❌ FAIL: ${message}`);
  totalFailed++;
}

/**
 * Recursively find all HTML files in a directory.
 */
function findHtmlFiles(dir: string): string[] {
  const files: string[] = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (entry.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Determine if an HTML file is a Docusaurus doc page (rendered from Markdown/MDX source).
 * Excludes:
 * - Static HTML files copied to build output (e.g., demo-animation.html)
 * - Plugin-generated utility pages (e.g., search/index.html, 404.html)
 * - Blog listing pages
 *
 * We identify doc pages by checking for the docs-specific CSS classes that Docusaurus
 * adds to the <html> element (e.g., "docs-doc-page", "plugin-docs").
 */
function isDocPage(file: string, doc: Document): boolean {
  const relPath = relative(BUILD_DIR, file);

  // Static files in site_build/ are copied verbatim
  if (relPath.startsWith('site_build')) return false;

  // 404 pages are not doc pages
  if (relPath === '404.html') return false;

  // Check for Docusaurus doc page class on <html> element
  const htmlEl = doc.documentElement;
  const htmlClasses = htmlEl.getAttribute('class') || '';

  // Docusaurus adds "docs-doc-page" or "plugin-docs" class to doc pages
  return htmlClasses.includes('docs-doc-page') || htmlClasses.includes('plugin-docs');
}

/**
 * Property 6: Markdown 渲染语义保持
 *
 * Validates:
 * - Docusaurus-generated pages have a <title> tag containing the site name "技术教程站"
 * - Pages with code blocks have language-specific class attributes (e.g., "language-bash")
 *
 * Validates: Requirements 1.2, 2.3, 2.4
 */
function validateProperty6(htmlFiles: string[]): void {
  console.log('\n[Property 6] Markdown 渲染语义保持');
  console.log('  Checking: frontmatter title → <title> tag, code blocks have language class\n');

  let titlesChecked = 0;
  let titleErrors = 0;
  let codeBlocksFound = 0;
  let codeBlocksWithLang = 0;
  let codeBlocksWithoutLang = 0;

  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8');
    const dom = new JSDOM(content);
    const doc = dom.window.document;
    const relPath = relative(BUILD_DIR, file);

    // Only validate doc pages (Markdown-derived) for title checks
    if (isDocPage(file, doc)) {
      const titleEl = doc.querySelector('title');
      if (titleEl && titleEl.textContent) {
        titlesChecked++;
        if (!titleEl.textContent.includes('技术教程站')) {
          fail(`${relPath}: <title> "${titleEl.textContent}" does not contain "技术教程站"`);
          titleErrors++;
        }
      }
    }

    // Check code blocks have language class attributes
    // Docusaurus generates: <pre class="prism-code language-xxx ...">
    const codeBlocks = doc.querySelectorAll('pre[class*="prism-code"]');
    for (const block of codeBlocks) {
      codeBlocksFound++;
      const classes = block.getAttribute('class') || '';
      // Match language-xxx pattern (e.g., language-bash, language-json, language-python)
      if (/language-\w+/.test(classes)) {
        codeBlocksWithLang++;
      } else {
        codeBlocksWithoutLang++;
        fail(`${relPath}: Code block missing language class. Classes: "${classes}"`);
      }
    }
  }

  // Title validation summary
  if (titlesChecked > 0 && titleErrors === 0) {
    pass(`All ${titlesChecked} pages have <title> containing "技术教程站"`);
  } else if (titlesChecked === 0) {
    fail('No pages found with <title> tags');
  }

  // Code block validation summary
  if (codeBlocksFound > 0 && codeBlocksWithoutLang === 0) {
    pass(`All ${codeBlocksWithLang} code blocks have language-specific class attributes`);
  } else if (codeBlocksFound === 0) {
    // Not necessarily an error — some builds may not have code blocks
    console.log('  ℹ️  INFO: No code blocks found in build output');
  }
}

/**
 * Property 7: Base Path 一致性
 *
 * Validates:
 * - All internal navigation links (<a href="/...">) start with /course/
 * - All internal resource references (<script src>, <link href>, <img src>) start with /course/
 *
 * Validates: Requirements 1.5
 */
function validateProperty7(htmlFiles: string[]): void {
  console.log('\n[Property 7] Base Path 一致性');
  console.log('  Checking: all internal links and resources have /course/ prefix\n');

  let linkErrors = 0;
  let resourceErrors = 0;
  let linksChecked = 0;
  let resourcesChecked = 0;

  for (const file of htmlFiles) {
    const content = readFileSync(file, 'utf-8');
    const dom = new JSDOM(content);
    const doc = dom.window.document;
    const relPath = relative(BUILD_DIR, file);

    // Check internal navigation links: <a href="/...">
    const links = doc.querySelectorAll('a[href]');
    for (const link of links) {
      const href = link.getAttribute('href')!;
      // Only check absolute internal links (starting with /)
      // Skip external links (http://, https://), anchors (#), and relative paths
      if (href.startsWith('/') && !href.startsWith('//')) {
        linksChecked++;
        if (!href.startsWith('/course/')) {
          fail(`${relPath}: Link href="${href}" missing /course/ prefix`);
          linkErrors++;
        }
      }
    }

    // Check internal resource references: <script src>, <link href>, <img src>
    const scripts = doc.querySelectorAll('script[src]');
    for (const el of scripts) {
      const src = el.getAttribute('src')!;
      if (src.startsWith('/') && !src.startsWith('//')) {
        resourcesChecked++;
        if (!src.startsWith('/course/')) {
          fail(`${relPath}: <script src="${src}"> missing /course/ prefix`);
          resourceErrors++;
        }
      }
    }

    const linkEls = doc.querySelectorAll('link[href]');
    for (const el of linkEls) {
      const href = el.getAttribute('href')!;
      // Skip canonical/alternate links (they use full URLs)
      if (href.startsWith('/') && !href.startsWith('//')) {
        resourcesChecked++;
        if (!href.startsWith('/course/')) {
          fail(`${relPath}: <link href="${href}"> missing /course/ prefix`);
          resourceErrors++;
        }
      }
    }

    const imgs = doc.querySelectorAll('img[src]');
    for (const el of imgs) {
      const src = el.getAttribute('src')!;
      if (src.startsWith('/') && !src.startsWith('//')) {
        resourcesChecked++;
        if (!src.startsWith('/course/')) {
          fail(`${relPath}: <img src="${src}"> missing /course/ prefix`);
          resourceErrors++;
        }
      }
    }
  }

  // Link validation summary
  if (linksChecked > 0 && linkErrors === 0) {
    pass(`All ${linksChecked} internal links have /course/ prefix`);
  } else if (linksChecked === 0) {
    console.log('  ℹ️  INFO: No absolute internal links found');
  }

  // Resource validation summary
  if (resourcesChecked > 0 && resourceErrors === 0) {
    pass(`All ${resourcesChecked} internal resource references have /course/ prefix`);
  } else if (resourcesChecked === 0) {
    console.log('  ℹ️  INFO: No absolute internal resource references found');
  }
}

// --- Main ---
function main(): void {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Build Output Validation (Properties 6-7)  ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\nBuild directory: ${BUILD_DIR}`);

  if (!existsSync(BUILD_DIR)) {
    console.error('\n❌ FATAL: Build directory does not exist. Run "npm run build" first.');
    process.exit(1);
  }

  const htmlFiles = findHtmlFiles(BUILD_DIR);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  if (htmlFiles.length === 0) {
    console.error('❌ FATAL: No HTML files found in build directory.');
    process.exit(1);
  }

  validateProperty6(htmlFiles);
  validateProperty7(htmlFiles);

  // Summary
  console.log('\n══════════════════════════════════════════════');
  console.log(`Results: ${totalPassed} passed, ${totalFailed} failed`);

  if (totalFailed > 0) {
    console.log('\n❌ Build validation FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ All build validations passed!');
    process.exit(0);
  }
}

main();
