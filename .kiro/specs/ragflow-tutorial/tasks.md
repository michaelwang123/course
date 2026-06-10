# Implementation Plan: RAGFlow 中文教程站点

## Overview

本实现计划基于 VitePress + Tailwind CSS + Vue 3 技术栈，构建一个支持多教程模块的中文教程静态站点。实现按照项目基础配置 → 测试基础设施 → 主题系统 → 动画组件 → 内容编写 → 部署配置 → 验证的顺序推进，确保每一步都可验证且无孤立代码。

## Tasks

- [x] 1. Set up project structure and core configuration
  - Initialize the project with VitePress, Tailwind CSS, and PostCSS
  - Create directory structure following the design document layout
  - _Requirements: 1.1, 1.2, 1.5, 2.1, 10.4, 10.5_

  - [x] 1.1 Create package.json, .gitignore, and install dependencies
    - Create `package.json` with project name, scripts (`docs:dev`, `docs:build`, `docs:preview`, `test`, `test:build`), and `engines: { "node": ">=18" }`
    - Create `.gitignore` excluding: `node_modules/`, `.vitepress/dist/`, `.vitepress/cache/`, `*.local`
    - Install dependencies: `vitepress`, `tailwindcss`, `postcss`, `autoprefixer`
    - Install dev dependencies: `vitest`, `@vue/test-utils`, `happy-dom`
    - Create the project directory structure: `.vitepress/theme/`, `.vitepress/components/`, `ragflow/`, `ragflow/assets/`, `.github/workflows/`, `scripts/`
    - _Requirements: 1.1, 1.2, 1.5, 10.4, 10.5_

  - [x] 1.2 Create VitePress configuration file
    - Create `.vitepress/config.mts` with full configuration
    - Configure `title`, `description`, `lang: 'zh-CN'`, `base: '/<repository-name>/'`
    - Configure `themeConfig.nav` with homepage and RAGFlow module entries
    - Configure `themeConfig.sidebar` with RAGFlow chapter navigation
    - Configure local search with Chinese translations
    - Configure `outline`, `docFooter`, dark mode labels
    - Set `ignoreDeadLinks: false` for build-time dead link detection
    - Add Vite rollupOptions `onwarn` to escalate unresolved imports to errors
    - _Requirements: 1.1, 1.6, 1.7, 2.2, 2.3, 2.5, 7.4, 8.1, 8.2, 8.4, 8.5, 8.6_

  - [x] 1.3 Create Tailwind CSS and PostCSS configuration
    - Create `tailwind.config.js` with content paths, darkMode: 'class', custom colors (`primary: '#00ffaa'`), and all animation keyframes (`dash-flow`, `pulse-glow`, `dot-move`, `fade-in-up`, `shimmer`)
    - Create `postcss.config.js` with tailwindcss and autoprefixer plugins
    - _Requirements: 1.2, 9.1, 9.6_

  - [x] 1.4 Configure Vitest for Vue component testing
    - Create `vitest.config.ts` with Vue plugin, happy-dom environment
    - Configure test file patterns (`**/*.test.ts`) and coverage settings
    - Verify `npm run test` command executes without error (no tests yet is OK)
    - _Requirements: 1.3_

- [x] 2. Implement theme system and global styles
  - Create the custom VitePress theme with dark mode, CSS variables, and layout enhancements
  - NOTE: Theme entry file registers components via dynamic imports to avoid build errors before components exist
  - _Requirements: 8.6, 8.7, 9.1, 9.7_

  - [x] 2.1 Create theme entry file with lazy component registration
    - Create `.vitepress/theme/index.ts` that imports and extends the default VitePress theme
    - Register custom Vue components using `defineAsyncComponent(() => import(...))` pattern to prevent build failure when component files don't yet exist
    - Import `./style.css`
    - _Requirements: 1.3, 9.5_

  - [x] 2.2 Create global stylesheet
    - Create `.vitepress/theme/style.css` with Tailwind directives (`@tailwind base/components/utilities`)
    - Define CSS custom properties for VitePress brand colors (`--vp-c-brand-1/2/3`)
    - Define dark mode background variables (`--vp-c-bg`, `--vp-c-bg-soft`, `--vp-c-bg-mute`)
    - Add navbar backdrop-filter glassmorphism styles
    - Add code block shimmer effect styles
    - Add `@media (prefers-reduced-motion: reduce)` rule to disable animations
    - _Requirements: 8.7, 9.1, 9.7, 9.8_

  - [x] 2.3 Create custom Layout component
    - Create `.vitepress/theme/Layout.vue` extending default VitePress layout
    - Integrate Intersection Observer for scroll-triggered animations
    - Add View Transitions API support: intercept router.onBeforeRouteChange, call document.startViewTransition() if available, fallback to CSS opacity transition
    - _Requirements: 9.4, 9.9_

- [x] 3. Build Vue animation components
  - Create reusable animation components in `.vitepress/components/`
  - Each component follows the interface defined in the design document
  - _Requirements: 1.3, 9.2, 9.3, 9.4, 9.5_

  - [x] 3.1 Create FlowLine.vue component
    - Implement SVG dashed line flow animation with configurable `width`, `height`, `color`, `speed` props
    - Use `stroke-dasharray` and `@keyframes` for animation
    - Only animate `stroke-dashoffset` (GPU-friendly)
    - _Requirements: 9.2, 9.5, 9.6_

  - [x] 3.2 Create GlowNode.vue component
    - Implement pulsing glow node with `label`, `icon`, `size` props
    - Apply `animate-pulse-glow` Tailwind animation class
    - Use `box-shadow` animation for glow effect
    - _Requirements: 9.5_

  - [x] 3.3 Create AnimatedCard.vue component
    - Implement hover-interactive card with `title`, `description`, `icon`, `link`, `delay` props
    - Apply `translateY` lift, border highlight, and gradient background on hover
    - Transition duration 200-300ms, only animate `transform` and `opacity`
    - _Requirements: 9.3, 9.5, 9.6_

  - [x] 3.4 Create FlowDot.vue component
    - Implement moving particle animation with `color`, `size`, `distance`, `duration`, `direction` props
    - Use `translateX` keyframes for particle movement
    - Animate opacity for appear/disappear effect
    - Only animate `transform` and `opacity`
    - _Requirements: 9.2, 9.5, 9.6_

  - [x] 3.5 Create ScrollReveal.vue component
    - Implement scroll-triggered fade-in container with `animation`, `delay`, `threshold` props
    - Use Intersection Observer to detect element entering viewport
    - Apply `fade-in-up` animation: translate from 20px below, duration 600-800ms
    - Degrade gracefully if Intersection Observer is unavailable (show content immediately)
    - _Requirements: 9.4, 9.5, 9.6_

  - [x] 3.6 Create ArchDiagram.vue component
    - Implement RAGFlow system architecture interactive SVG diagram
    - Use layered layout: User layer (Web UI) → Service layer (API) → Storage layer (ES, MySQL, MinIO, Redis)
    - Each node rendered with GlowNode (80x40px), connections rendered with FlowLine + directional arrows
    - Mobile (<768px): vertical node arrangement; Desktop: horizontal layered layout
    - Support `interactive` prop: hover highlights node + connected edges, dims others to opacity 0.3
    - _Requirements: 3.2, 3.3, 9.5_

  - [x] 3.7 Update theme entry to use direct component imports
    - Replace `defineAsyncComponent` with direct static imports now that all components exist
    - Verify `npm run docs:build` compiles all components successfully
    - _Requirements: 1.3, 9.5_

- [x] 4. Checkpoint - Core infrastructure verification
  - Run `npm run docs:build` and confirm exit code 0 with no errors
  - Run `npm run test` and confirm Vitest executes (0 failures)
  - Verify all 6 Vue components compile without type errors
  - Ask the user if questions arise.

- [x] 5. Create site homepage and RAGFlow tutorial landing
  - Write the site entry point and RAGFlow module index pages
  - _Requirements: 2.4, 3.1_

  - [x] 5.1 Create site homepage (index.md)
    - Create root `index.md` with VitePress `layout: home` frontmatter
    - Configure Hero section with site name "技术教程站" and tagline
    - Add features list with RAGFlow module (title, details ≤100 chars, link, icon)
    - Integrate FlowLine and FlowDot components in Hero area for RAG data flow visualization
    - Use AnimatedCard components for feature showcase section
    - _Requirements: 2.4, 9.2_

  - [x] 5.2 Create RAGFlow tutorial index page (ragflow/index.md)
    - Create `ragflow/index.md` as tutorial landing page
    - Include module introduction, learning objectives, chapter overview
    - Link to all sub-chapters (architecture, installation, quickstart, advanced)
    - _Requirements: 2.1, 3.1_

- [x] 6. Write RAGFlow tutorial content - Architecture and Installation
  - Create the first two content chapters with technical accuracy
  - Reference source: https://ragflow.io/docs for content verification
  - _Requirements: 3.1-3.5, 4.1-4.5_

  - [x] 6.1 Write architecture overview (ragflow/architecture.md)
    - Describe data flow and interaction between all system components
    - Use ArchDiagram.vue component for interactive architecture visualization
    - Document each core component (Web UI, API, Elasticsearch/Infinity, MySQL, MinIO, Redis) with ≥2 sentences each covering purpose and data types
    - Document each core capability (DeepDoc, template chunking, citation tracing, multi-source support, Agentic workflow) with ≥2 sentences each covering functionality and user value
    - Map capabilities to components (which components implement which capabilities)
    - Use GlowNode components for key component highlights
    - Cross-check all technical claims against RAGFlow official documentation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.2 Write installation guide (ragflow/installation.md)
    - Provide complete Docker Compose deployment steps (get config, set env vars, start services, verify status)
    - List hardware requirements (CPU ≥4 cores, RAM ≥16GB, Disk ≥50GB, Docker ≥24.0.0, supported OS)
    - Provide environment check command examples (CPU, memory, disk, Docker version)
    - Document ≥3 troubleshooting scenarios (port conflict, insufficient resources, image pull failure) with error descriptions and solutions
    - Provide post-deployment verification steps (process status check + browser UI access)
    - Cross-check all commands and versions against RAGFlow official documentation
    - All images stored in `ragflow/assets/` as WebP, with `loading="lazy"` attribute
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.3_

- [x] 7. Write RAGFlow tutorial content - Quickstart and Advanced
  - Create the remaining two content chapters
  - Reference source: https://ragflow.io/docs for content verification
  - _Requirements: 5.1-5.5, 6.1-6.4_

  - [x] 7.1 Write quickstart guide (ragflow/quickstart.md)
    - List prerequisites (RAGFlow deployed + accessible, LLM configured)
    - Document end-to-end RAG flow: create knowledge base → upload document → configure chunking → associate LLM → start conversation
    - For each step: provide expected result description for self-verification
    - For each step: include screenshot placeholder or annotated UI element descriptions
    - Document local LLM (Ollama) integration: service address, model name, connection verification
    - Provide common error troubleshooting (LLM connection failure, document parsing failure)
    - All screenshots stored in `ragflow/assets/` as WebP (≤200KB each), with `loading="lazy"` attribute
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.3_

  - [x] 7.2 Write advanced features (ragflow/advanced.md)
    - Document Agentic workflow configuration with ≥1 complete build example (component selection, parameter config, run verification)
    - Provide HTTP API usage with ≥3 interface examples (request + response format) covering dataset management, document upload, and conversation
    - Describe ≥3 chunking strategies (general, resume, table, etc.) with document type, parameters, selection advice
    - Document MCP support with ≥1 scenario description and configuration steps
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8. Checkpoint - Content and build verification
  - Run `npm run docs:build` and verify all pages generate correctly (exit code 0)
  - Verify all internal links resolve (no dead links — ensured by `ignoreDeadLinks: false`)
  - Verify HTML output has `lang="zh-CN"` attribute
  - Verify mobile responsiveness: open preview in Chrome DevTools Device Mode (375px width), confirm no horizontal scroll and all interactive elements are clickable
  - Ask the user if questions arise.

- [x] 9. Configure GitHub Actions deployment pipeline
  - Set up automated CI/CD for GitHub Pages deployment
  - _Requirements: 7.1-7.5_

  - [x] 9.1 Create GitHub Actions workflow file
    - Create `.github/workflows/deploy.yml` with trigger on push to `main`
    - Configure build job: checkout, setup Node.js 20, npm ci, npm run docs:build
    - Configure upload-pages-artifact with `.vitepress/dist` path
    - Configure deploy job with github-pages environment
    - Set permissions: `contents: read`, `pages: write`, `id-token: write`
    - Set concurrency group to prevent parallel deployments
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [x] 10. Set up build validation and component tests
  - Write validation scripts and component unit tests
  - _Requirements: 1.7, 10.1, 10.2_

  - [x] 10.1 Write build validation script
    - Create `scripts/validate-build.js` that verifies:
      - `.vitepress/dist/index.html` exists
      - HTML files contain `lang="zh-CN"`
      - Each tutorial module's `index.html` exists in output
      - No orphaned asset references
    - _Requirements: 1.5, 1.6, 1.7_

  - [x] 10.2 Write component unit tests
    - Test `FlowLine.vue`: renders SVG with correct `stroke-dasharray` attribute
    - Test `GlowNode.vue`: renders label text, applies `animate-pulse-glow` class
    - Test `AnimatedCard.vue`: renders title/description, applies hover class on interaction
    - Test `ScrollReveal.vue`: initial opacity 0, becomes 1 after intersection
    - Test `FlowDot.vue`: renders with correct size and color props
    - _Requirements: 9.5_

- [x] 11. Final checkpoint - Full verification
  - Run `npm run docs:build` successfully (exit code 0)
  - Run `npm run test` and verify all tests pass
  - Run `npm run test:build` for build validation (if 10.1 implemented)
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 4, 8, 11) serve as blocking barriers in the dependency graph
- The design explicitly states PBT (property-based testing) is not applicable for this project — all tests are example-based
- Components use `defineAsyncComponent` in wave 2 to avoid import errors; switched to static imports in task 3.7 after all components exist
- The multi-module architecture allows future tutorials (e.g., Ollama) to be added by creating a new directory and adding a nav/sidebar entry in config.mts — see design doc "模块扩展指南" section for step-by-step checklist
- Content accuracy should be verified against https://ragflow.io/docs as the authoritative reference
- Task 9.2 (previously "configure base path") has been merged into Task 1.2 — base path is set during initial VitePress configuration

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"], "description": "Project scaffold" },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4"], "description": "Config files + test runner" },
    { "id": 2, "tasks": ["2.1", "2.2"], "description": "Theme system (lazy component refs)" },
    { "id": 3, "tasks": ["2.3", "3.1", "3.2", "3.3", "3.4", "3.5"], "description": "Layout + animation components" },
    { "id": 4, "tasks": ["3.6", "3.7"], "description": "ArchDiagram + switch to static imports" },
    { "id": 5, "tasks": ["Checkpoint-4"], "description": "Infrastructure verification barrier" },
    { "id": 6, "tasks": ["5.1", "5.2"], "description": "Homepage + tutorial landing" },
    { "id": 7, "tasks": ["6.1", "6.2"], "description": "Content: architecture + installation" },
    { "id": 8, "tasks": ["7.1", "7.2"], "description": "Content: quickstart + advanced" },
    { "id": 9, "tasks": ["Checkpoint-8"], "description": "Content verification barrier" },
    { "id": 10, "tasks": ["9.1", "10.1", "10.2"], "description": "Deployment + tests" },
    { "id": 11, "tasks": ["Checkpoint-11"], "description": "Final verification barrier" }
  ]
}
```
