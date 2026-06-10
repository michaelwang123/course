#!/usr/bin/env node
/**
 * Build Validation Script
 * Verifies the VitePress build output meets project requirements.
 *
 * Checks:
 * 1. .vitepress/dist/index.html exists
 * 2. HTML files contain lang="zh-CN"
 * 3. Each tutorial module's index.html exists in output
 * 4. No orphaned asset references (images referenced in HTML but not in dist)
 *
 * Usage: node scripts/validate-build.js
 * Exit code 0 = all checks pass, 1 = one or more checks failed
 */

const fs = require('fs')
const path = require('path')

const DIST_DIR = path.resolve(__dirname, '..', '.vitepress', 'dist')
const TUTORIAL_MODULES = ['ragflow']

let passed = 0
let failed = 0

function pass(message) {
  console.log(`  ✅ PASS: ${message}`)
  passed++
}

function fail(message) {
  console.log(`  ❌ FAIL: ${message}`)
  failed++
}

/**
 * Check 1: Verify dist/index.html exists
 */
function checkDistExists() {
  console.log('\n[Check 1] Build output exists')
  const indexPath = path.join(DIST_DIR, 'index.html')
  if (fs.existsSync(indexPath)) {
    pass('.vitepress/dist/index.html exists')
  } else {
    fail('.vitepress/dist/index.html not found — did you run "npm run docs:build"?')
  }
}

/**
 * Check 2: Verify HTML files contain lang="zh-CN"
 */
function checkLangAttribute() {
  console.log('\n[Check 2] HTML lang attribute is "zh-CN"')
  const htmlFiles = collectHtmlFiles(DIST_DIR)

  if (htmlFiles.length === 0) {
    fail('No HTML files found in dist directory')
    return
  }

  let allCorrect = true
  const failures = []

  for (const filePath of htmlFiles) {
    const content = fs.readFileSync(filePath, 'utf-8')
    if (!content.includes('lang="zh-CN"')) {
      allCorrect = false
      const relative = path.relative(DIST_DIR, filePath)
      failures.push(relative)
    }
  }

  if (allCorrect) {
    pass(`All ${htmlFiles.length} HTML files contain lang="zh-CN"`)
  } else {
    fail(`Files missing lang="zh-CN": ${failures.join(', ')}`)
  }
}

/**
 * Check 3: Verify each tutorial module's index.html exists
 */
function checkModuleIndexes() {
  console.log('\n[Check 3] Tutorial module index pages exist')

  for (const module of TUTORIAL_MODULES) {
    const modulePath = path.join(DIST_DIR, module, 'index.html')
    if (fs.existsSync(modulePath)) {
      pass(`${module}/index.html exists`)
    } else {
      fail(`${module}/index.html not found`)
    }
  }
}

/**
 * Check 4: No orphaned asset references
 * Scans HTML files for image src references and verifies the assets exist in dist.
 */
function checkOrphanedAssets() {
  console.log('\n[Check 4] No orphaned asset references')
  const htmlFiles = collectHtmlFiles(DIST_DIR)
  const orphaned = []

  // Match src="..." and srcset="..." attributes that reference local files
  const srcRegex = /(?:src|srcset)=["']([^"']+)["']/g

  for (const filePath of htmlFiles) {
    const content = fs.readFileSync(filePath, 'utf-8')
    let match

    while ((match = srcRegex.exec(content)) !== null) {
      const ref = match[1]

      // Skip external URLs, data URIs, and anchors
      if (ref.startsWith('http://') || ref.startsWith('https://') || ref.startsWith('data:') || ref.startsWith('#')) {
        continue
      }

      // Only check image file references
      if (!isImageRef(ref)) {
        continue
      }

      // Resolve the referenced path relative to the HTML file or dist root
      let resolvedPath
      if (ref.startsWith('/')) {
        // Absolute path (relative to site base)
        // Strip the base path prefix if present
        const cleanRef = ref.replace(/^\/[^/]+\//, '/')
        resolvedPath = path.join(DIST_DIR, cleanRef.slice(1))
      } else {
        // Relative path
        resolvedPath = path.resolve(path.dirname(filePath), ref)
      }

      // Strip query string and hash from path
      resolvedPath = resolvedPath.split('?')[0].split('#')[0]

      if (!fs.existsSync(resolvedPath)) {
        const relativeHtml = path.relative(DIST_DIR, filePath)
        orphaned.push({ file: relativeHtml, ref })
      }
    }
  }

  if (orphaned.length === 0) {
    pass('No orphaned image references found')
  } else {
    for (const { file, ref } of orphaned) {
      fail(`Orphaned reference in ${file}: ${ref}`)
    }
  }
}

/**
 * Recursively collect all .html files in a directory
 */
function collectHtmlFiles(dir) {
  const results = []

  if (!fs.existsSync(dir)) {
    return results
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...collectHtmlFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(fullPath)
    }
  }
  return results
}

/**
 * Check if a reference is an image file
 */
function isImageRef(ref) {
  const cleanRef = ref.split('?')[0].split('#')[0]
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico']
  return imageExtensions.some(ext => cleanRef.toLowerCase().endsWith(ext))
}

// --- Main ---
console.log('Build Validation')
console.log('================')
console.log(`Dist directory: ${DIST_DIR}`)

if (!fs.existsSync(DIST_DIR)) {
  console.log('\n❌ FATAL: Dist directory does not exist. Run "npm run docs:build" first.')
  process.exit(1)
}

checkDistExists()
checkLangAttribute()
checkModuleIndexes()
checkOrphanedAssets()

// Summary
console.log('\n================')
console.log(`Results: ${passed} passed, ${failed} failed`)

if (failed > 0) {
  console.log('\n❌ Build validation FAILED')
  process.exit(1)
} else {
  console.log('\n✅ Build validation PASSED')
  process.exit(0)
}
