# Implementation Plan: ID Photo Tool (证件照处理工具)

## Overview

本实现计划将证件照裁剪和更换底色工具分解为渐进式的编码任务。从项目脚手架搭建开始，逐步实现核心引擎、功能模块、UI 组件，最后完成集成联调。所有任务基于 React 18 + TypeScript + Vite 技术栈，使用 Tailwind CSS 样式方案。

## Tasks

- [x] 1. Project scaffolding and core infrastructure
  - [x] 1.1 Initialize Vite + React + TypeScript project
    - Create `tools/id-photo/` directory with `package.json`, `vite.config.ts`, `tsconfig.json`, `postcss.config.js`, `tailwind.config.ts`, `index.html`
    - Install dependencies: react, react-dom, react-router-dom, react-image-crop, jspdf, tailwindcss, postcss, autoprefixer
    - Install dev dependencies: typescript, @types/react, @types/react-dom, vitest, @testing-library/react, happy-dom, fast-check
    - Set up Tailwind CSS with dark mode (class strategy) in `src/styles/index.css`
    - _Requirements: 6.1, 6.4_

  - [x] 1.2 Set up test infrastructure
    - Create `vitest.config.ts` with happy-dom environment, coverage config, and test path aliases
    - Create `tests/setup.ts` with testing-library cleanup and Canvas/ImageData mocks for happy-dom
    - Add test scripts to `package.json`: `"test": "vitest --run"`, `"test:watch": "vitest"`
    - Verify `npx vitest --run` executes without errors (even with no tests yet)
    - _Requirements: (infrastructure, enables all property tests)_

  - [x] 1.3 Set up Vercel deployment configuration
    - Create `vercel.json` with SPA rewrite rules (`"rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]`)
    - Verify `vite.config.ts` produces correct `dist/` output
    - _Requirements: 6.2, 6.3, 6.5_

  - [x] 1.4 Create ToolPlugin interface, registry, and icon components
    - Create `src/plugins/types.ts` with `ToolPlugin` interface (id, name, icon, description, route, component)
    - Create `src/components/icons/CameraIcon.tsx` SVG icon component
    - Create `src/components/icons/index.ts` barrel export
    - Create `src/plugins/registry.ts` with tools array containing the id-photo tool entry using `React.lazy`
    - _Requirements: 5.1, 5.2, 5.6_

  - [x] 1.5 Create App shell with routing and providers
    - Create `src/main.tsx` entry point
    - Create `src/App.tsx` with React Router v6 setup, Suspense wrapper, ThemeProvider
    - Create `src/components/Layout.tsx` with responsive layout (desktop ≥ 1024px, mobile < 768px)
    - Create `src/components/LoadingSpinner.tsx` loading indicator
    - Create `src/hooks/useTheme.ts` with system preference detection and manual toggle
    - Create `src/components/ThemeToggle.tsx` toggle component
    - Create `src/components/PrivacyBadge.tsx` privacy statement badge
    - _Requirements: 7.1, 7.4, 7.5, 7.9, 8.3_

  - [x] 1.6 Create home page with tool cards
    - Create `src/components/ToolCard.tsx` displaying tool name, icon, description
    - Render tool list from registry on the home route
    - Each card links to the tool's route
    - _Requirements: 5.3, 5.4, 5.5_

- [x] 2. Checkpoint - Ensure project builds and renders
  - [x] 2.1 Verify build and dev server
    - Ensure `npm run build` succeeds, `npm run dev` serves the app with home page and tool card visible
    - Ensure `npx vitest --run` executes without errors
    - Ask the user if questions arise.

- [x] 3. Core processing engines
  - [x] 3.1 Implement Canvas Processor (`src/core/canvas-processor.ts`)
    - Implement `cropImage(source, options): CropResult` with rotation, flip, brightness, contrast support
    - Implement `canvasToBlob(canvas, format, quality): Promise<Blob>`
    - Implement `canvasToDataURL(canvas, format, quality): string`
    - Use OffscreenCanvas (with fallback to hidden canvas) for processing
    - Apply brightness/contrast via pixel manipulation on ImageData
    - _Requirements: 2.5, 2.6, 2.7, 2.9, 4.1, 9.1_

  - [x] 3.2 Write property tests for Canvas Processor
    - **Property 2: Crop output dimensions match target**
    - **Property 4: Rotation and flip round-trip identity**
    - **Property 5: Zero brightness/contrast is identity**
    - **Validates: Requirements 2.5, 2.6, 2.7, 2.9**
    - Test file: `tests/core/canvas-processor.test.ts`

  - [x] 3.3 Implement Color Engine (`src/core/color-engine.ts`)
    - Implement `colorDistance(c1, c2): number` using Euclidean distance in RGB space
    - Implement `detectBackgroundColor(imageData): RGB` with edge sampling strategy (4 corners, 5×5 pixel regions, 100 samples total)
    - Implement `replaceBackground(imageData, options): BackgroundReplaceResult` with tolerance-based pixel replacement and edge feathering (1px radius)
    - Map tolerance (0-100) to distance threshold (0-441.67)
    - _Requirements: 3.3, 3.5, 9.2_

  - [x] 3.4 Write property tests for Color Engine
    - **Property 6: Background replacement with solid background**
    - **Property 7: Tolerance monotonicity**
    - **Validates: Requirements 3.3, 3.5**
    - Test file: `tests/core/color-engine.test.ts`

  - [x] 3.5 Implement Layout Engine (`src/core/layout-engine.ts`)
    - Implement `calculateLayout(photoSize, config): { columns, rows, totalPhotos }`
    - Implement `generateBatchLayout(photoCanvas, photoSize, config): LayoutResult`
    - Use 300 DPI for A4 canvas (2480×3508 px), 2mm gap between photos
    - Enforce layout counts: 一寸 3×3=9, 二寸 2×3=6, 小一寸 3×3=9, 大一寸 2×3=6, 小二寸 2×3=6
    - _Requirements: 4.5, 4.6_

  - [x] 3.6 Write property tests for Layout Engine
    - **Property 11: Batch layout fits within A4 dimensions**
    - **Validates: Requirements 4.5**
    - Test file: `tests/core/layout-engine.test.ts`

- [x] 4. File validation and utility layer
  - [x] 4.1 Implement file validators (`src/utils/file-validators.ts`)
    - Implement `validateImageFile(file): ValidationResult`
    - Check MIME type against `['image/jpeg', 'image/png', 'image/webp']`
    - Check file size against 10MB limit
    - Return appropriate error codes: `UNSUPPORTED_FORMAT` or `FILE_TOO_LARGE`
    - _Requirements: 1.1, 1.4, 1.5_

  - [x] 4.2 Write property tests for file validators
    - **Property 1: File validation correctness**
    - **Validates: Requirements 1.1, 1.4, 1.5**
    - Test file: `tests/core/file-validators.test.ts`

  - [x] 4.3 Implement image helpers (`src/utils/image-helpers.ts`)
    - Utility to load File as HTMLImageElement
    - Utility to generate export filename with size specification (e.g., "证件照_一寸_25x35mm")
    - Utility to scale image for preview (max edge 1200px) while preserving aspect ratio
    - _Requirements: 4.4, 9.4_

  - [x] 4.4 Write property test for export filename
    - **Property 10: Export filename contains size specification**
    - **Validates: Requirements 4.4**
    - Test file: `tests/core/photo-exporter.test.ts`

- [x] 5. Checkpoint - Ensure core engines pass all tests
  - [x] 5.1 Run all property tests
    - Run `npx vitest --run` and ensure all property tests and unit tests pass. Ask the user if questions arise.

- [x] 6. ID Photo module state, context, and hooks
  - [x] 6.1 Create photo sizes constants (`src/modules/id-photo/constants/photo-sizes.ts`)
    - Define `STANDARD_SIZES` array with all 5 standard sizes (pixel and mm dimensions)
    - Define `BATCH_LAYOUT_MAP` with columns/rows for each size
    - _Requirements: 2.1_

  - [x] 6.2 Implement PhotoContext and reducer (`src/modules/id-photo/context/PhotoContext.tsx`)
    - Define `PhotoState` interface with currentStep, originalImage, croppedCanvas, processedCanvas, selectedSize, unlockedSteps, isProcessing
    - Implement reducer handling all PhotoAction types: SET_ORIGINAL_IMAGE, SET_CROPPED, SET_PROCESSED, SET_SIZE, SET_STEP, SET_PROCESSING, RESET_STEP, RESET_ALL
    - SET_ORIGINAL_IMAGE should unlock crop, background, and export steps
    - RESET_STEP should restore state to before that step's processing AND release old Canvas (set width/height to 0, nullify reference)
    - RESET_ALL should clear everything, release all Canvas references, and return to upload step
    - _Requirements: 7.2, 7.3, 7.6, 7.7, 9.5_

  - [x] 6.3 Create module hooks (`src/modules/id-photo/hooks/`)
    - Create `useImageState.ts` hook for accessing PhotoContext state and dispatch
    - Create `useCrop.ts` hook wrapping crop logic (calls cropImage, dispatches SET_CROPPED)
    - Create `useBackgroundReplace.ts` hook wrapping background replace logic (calls replaceBackground, dispatches SET_PROCESSED)
    - All hooks should handle loading state (SET_PROCESSING) and error recovery
    - _Requirements: 7.2, 7.3, 7.5_

  - [x] 6.4 Write property tests for PhotoContext
    - **Property 13: Upload unlocks all subsequent steps**
    - **Property 14: Step reset restores prior state**
    - **Validates: Requirements 7.3, 7.6**
    - Test file: `tests/modules/id-photo/photo-context.test.ts`

- [x] 7. ID Photo module UI components
  - [x] 7.1 Implement PhotoUploader component (`src/modules/id-photo/components/PhotoUploader.tsx`)
    - Support file input click-to-select (JPEG, PNG, WebP)
    - Support drag-and-drop with visual drop zone indicator
    - Support clipboard paste (Ctrl+V / Cmd+V)
    - Validate file using `validateImageFile` and display error messages
    - On success, load image and dispatch SET_ORIGINAL_IMAGE via useImageState hook
    - Display image preview on canvas area after upload
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 7.2 Implement StepNavigator component (`src/modules/id-photo/components/StepNavigator.tsx`)
    - Render step tabs: 上传 → 裁剪 → 换底色 → 导出
    - Visually indicate current step, completed steps, and locked steps
    - Allow navigation to any unlocked step
    - _Requirements: 7.2, 7.3_

  - [x] 7.3 Implement ImageCropper — size selection and basic crop (`src/modules/id-photo/components/ImageCropper.tsx`)
    - Integrate `react-image-crop` library with fixed aspect ratio based on selected size
    - Render standard size selector buttons and custom size input fields
    - Show guide lines (rule of thirds + center crosshair) in crop area
    - Support crop box drag-to-move and edge-drag-to-scale (maintaining ratio)
    - Implement confirm crop action using `useCrop` hook
    - Implement reset button for this step
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.8, 7.6_

  - [x] 7.4 Implement ImageCropper — rotation, flip, and adjustments
    - Add rotation buttons (CW 90°, CCW 90°) and horizontal flip button to ImageCropper
    - Add brightness and contrast sliders (range -50 to +50)
    - Pass rotation/flip/brightness/contrast options to `cropImage` via useCrop hook
    - Ensure adjustments are applied to preview in real-time (using scaled image)
    - _Requirements: 2.6, 2.7, 2.9, 9.4_

  - [x] 7.5 Write property test for aspect ratio preservation
    - **Property 3: Aspect ratio preservation on scale**
    - **Validates: Requirements 2.4**
    - Test file: `tests/modules/id-photo/image-cropper.test.ts`

  - [x] 7.6 Implement BackgroundChanger component (`src/modules/id-photo/components/BackgroundChanger.tsx`)
    - Render preset color buttons: white (#FFFFFF), red (#FF0000), blue (#438EDB)
    - Integrate custom color picker (HTML5 `<input type="color">`)
    - Add tolerance slider (0-100, default 30)
    - Call `useBackgroundReplace` hook on color selection
    - Show processing state indicator while running
    - Display detection quality warning when replacedPercentage < 10%
    - Display technical tip about solid backgrounds
    - Implement reset button for this step
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 7.6_

  - [x] 7.7 Implement CompareSlider component (`src/modules/id-photo/components/CompareSlider.tsx`)
    - Implement before/after comparison with draggable split line
    - Provide toggle button to switch between slider view and side-by-side view
    - _Requirements: 3.7_

  - [x] 7.8 Implement PhotoExporter component (`src/modules/id-photo/components/PhotoExporter.tsx`)
    - Format selector (JPEG/PNG radio buttons)
    - JPEG quality slider (60%-100%), shown only when JPEG selected
    - Single photo export with auto-generated filename containing size info
    - Export uses priority chain: processedCanvas > croppedCanvas > originalImage
    - Batch layout export button with preview of A4 arrangement
    - PDF export option (300 DPI) using jsPDF
    - Download triggered via temporary `<a>` element with blob URL, revoke URL after download
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 7.9 Write property tests for export functionality
    - **Property 8: Export format produces correct MIME type**
    - **Property 9: JPEG quality monotonicity (with 5% tolerance)**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Test file: `tests/core/canvas-processor.test.ts`

- [x] 8. Checkpoint - Ensure all components render correctly
  - [x] 8.1 Verify components and workflow
    - Ensure all tests pass and the full workflow (upload → crop → background → export) is functional
    - Verify memory cleanup on RESET_ALL (no leaked canvas references in DevTools Memory snapshot)
    - Ask the user if questions arise.

- [x] 9. Integration, privacy, accessibility, and performance
  - [x] 9.1 Wire module entry
    - Create `src/modules/id-photo/index.tsx` module entry with PhotoContext provider and StepNavigator
    - Ensure all components are connected through context: PhotoUploader, ImageCropper, BackgroundChanger, PhotoExporter
    - Verify state flows correctly through the full workflow
    - _Requirements: 7.2, 7.3_

  - [x] 9.2 Implement privacy protections
    - Verify no network requests are made containing image data (no fetch/XMLHttpRequest for images)
    - Ensure no localStorage/sessionStorage usage for image data
    - On page unload, clean up all object URLs and canvas references
    - _Requirements: 8.1, 8.2, 8.4_

  - [x] 9.3 Implement accessibility (WCAG 2.1 AA)
    - Add proper ARIA labels to all interactive elements
    - Ensure keyboard navigation for all controls (crop box, sliders, buttons)
    - Add focus indicators and skip links
    - Ensure sufficient color contrast in both light and dark themes
    - Add alt text for image previews
    - _Requirements: 7.8_

  - [x] 9.4 Implement preview scaling for performance
    - In PhotoUploader, generate a scaled preview image (max edge 1200px) alongside the original
    - ImageCropper and BackgroundChanger operate on the preview for real-time interaction
    - Export step uses original full-resolution image for final output
    - Verify processing completes within 3s (crop) / 5s (background) on 10MB images
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 9.5 Write integration tests for tool registry rendering
    - **Property 12: Tool registry rendering completeness**
    - **Validates: Requirements 5.3, 5.4**
    - Test file: `tests/modules/id-photo/tool-registry.test.tsx`

  - [x] 9.6 Browser compatibility verification
    - Test build output against target browsers (Chrome, Firefox, Safari, Edge — last 2 major versions)
    - Add `browserslist` config to `package.json`
    - Verify no usage of unsupported APIs (check OffscreenCanvas fallback for Safari)
    - _Requirements: 6.6_

- [x] 10. Final checkpoint - Ensure all tests pass
  - [x] 10.1 Run full test suite and verify build
    - Run full test suite with `npx vitest --run`. Ensure all property tests, unit tests pass.
    - Verify build succeeds with `npm run build`.
    - Verify no console errors in production build.
    - Ask the user if questions arise.

- [x] 11. (Optional) End-to-end tests
  - [x] 11.1 Set up Playwright and write E2E smoke tests
    - Install Playwright and configure `playwright.config.ts`
    - Write E2E test: upload image → crop → export workflow completes without errors
    - Write E2E test: upload → background change → export workflow
    - Write E2E test: verify no network requests containing image data (privacy)
    - Write E2E test: drag-and-drop upload and clipboard paste upload
    - _Requirements: 1.2, 1.3, 8.1, 8.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 2, 5, 8, 10) are validation gates — proceed only after passing
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All image processing uses browser Canvas API — no server-side processing
- The project uses Vitest + fast-check for property-based testing
- Technology stack: React 18, TypeScript, Vite, Tailwind CSS, react-image-crop, jsPDF, React Router v6
- Preview uses scaled images (max 1200px edge) for performance; export uses full resolution
- Memory management: Canvas references are explicitly released on state reset

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["1.6"] },
    { "id": 3, "tasks": ["2.1"] },
    { "id": 4, "tasks": ["3.1", "3.3", "3.5", "4.1", "4.3"] },
    { "id": 5, "tasks": ["3.2", "3.4", "3.6", "4.2", "4.4", "6.1"] },
    { "id": 6, "tasks": ["5.1"] },
    { "id": 7, "tasks": ["6.2"] },
    { "id": 8, "tasks": ["6.3", "6.4"] },
    { "id": 9, "tasks": ["7.1", "7.2", "7.3", "7.8"] },
    { "id": 10, "tasks": ["7.4", "7.6", "7.7"] },
    { "id": 11, "tasks": ["7.5", "7.9"] },
    { "id": 12, "tasks": ["8.1"] },
    { "id": 13, "tasks": ["9.1"] },
    { "id": 14, "tasks": ["9.2", "9.3", "9.4", "9.5", "9.6"] },
    { "id": 15, "tasks": ["10.1"] },
    { "id": 16, "tasks": ["11.1"] }
  ]
}
```
