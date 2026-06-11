import { describe, it, expect } from 'vitest';
import {
  calculateLayout,
  generateBatchLayout,
  DEFAULT_LAYOUT_CONFIG,
  BATCH_LAYOUT_MAP,
  type PhotoSize,
} from '@/core/layout-engine';

// Standard photo sizes for testing
const STANDARD_SIZES: PhotoSize[] = [
  { id: '1-inch', name: '一寸', widthMm: 25, heightMm: 35, widthPx: 295, heightPx: 413 },
  { id: '2-inch', name: '二寸', widthMm: 35, heightMm: 49, widthPx: 413, heightPx: 579 },
  { id: 'small-1-inch', name: '小一寸', widthMm: 22, heightMm: 32, widthPx: 260, heightPx: 378 },
  { id: 'large-1-inch', name: '大一寸', widthMm: 33, heightMm: 48, widthPx: 390, heightPx: 567 },
  { id: 'small-2-inch', name: '小二寸', widthMm: 35, heightMm: 45, widthPx: 413, heightPx: 531 },
];

describe('Layout Engine', () => {
  describe('DEFAULT_LAYOUT_CONFIG', () => {
    it('should have correct A4 paper dimensions and DPI', () => {
      expect(DEFAULT_LAYOUT_CONFIG.paperWidth).toBe(210);
      expect(DEFAULT_LAYOUT_CONFIG.paperHeight).toBe(297);
      expect(DEFAULT_LAYOUT_CONFIG.dpi).toBe(300);
      expect(DEFAULT_LAYOUT_CONFIG.gap).toBe(2);
    });
  });

  describe('BATCH_LAYOUT_MAP', () => {
    it('should have entries for all standard sizes', () => {
      expect(BATCH_LAYOUT_MAP['1-inch']).toEqual({ columns: 3, rows: 3 });
      expect(BATCH_LAYOUT_MAP['2-inch']).toEqual({ columns: 2, rows: 3 });
      expect(BATCH_LAYOUT_MAP['small-1-inch']).toEqual({ columns: 3, rows: 3 });
      expect(BATCH_LAYOUT_MAP['large-1-inch']).toEqual({ columns: 2, rows: 3 });
      expect(BATCH_LAYOUT_MAP['small-2-inch']).toEqual({ columns: 2, rows: 3 });
    });
  });

  describe('calculateLayout', () => {
    it('一寸: should return 3×3=9', () => {
      const result = calculateLayout(STANDARD_SIZES[0]);
      expect(result.columns).toBe(3);
      expect(result.rows).toBe(3);
      expect(result.totalPhotos).toBe(9);
    });

    it('二寸: should return 2×3=6', () => {
      const result = calculateLayout(STANDARD_SIZES[1]);
      expect(result.columns).toBe(2);
      expect(result.rows).toBe(3);
      expect(result.totalPhotos).toBe(6);
    });

    it('小一寸: should return 3×3=9', () => {
      const result = calculateLayout(STANDARD_SIZES[2]);
      expect(result.columns).toBe(3);
      expect(result.rows).toBe(3);
      expect(result.totalPhotos).toBe(9);
    });

    it('大一寸: should return 2×3=6', () => {
      const result = calculateLayout(STANDARD_SIZES[3]);
      expect(result.columns).toBe(2);
      expect(result.rows).toBe(3);
      expect(result.totalPhotos).toBe(6);
    });

    it('小二寸: should return 2×3=6', () => {
      const result = calculateLayout(STANDARD_SIZES[4]);
      expect(result.columns).toBe(2);
      expect(result.rows).toBe(3);
      expect(result.totalPhotos).toBe(6);
    });

    it('should dynamically calculate for unknown photo sizes', () => {
      const customSize: PhotoSize = {
        id: 'custom',
        name: '自定义',
        widthMm: 50,
        heightMm: 70,
        widthPx: 591,
        heightPx: 827,
      };
      const result = calculateLayout(customSize);
      // Paper is 2480px wide, photo is 591px, gap ~24px
      // (2480 + 24) / (591 + 24) = 2504 / 615 = 4.07 => columns = 4
      // (3508 + 24) / (827 + 24) = 3532 / 851 = 4.15 => rows = 4
      expect(result.columns).toBeGreaterThanOrEqual(1);
      expect(result.rows).toBeGreaterThanOrEqual(1);
      expect(result.totalPhotos).toBe(result.columns * result.rows);
    });
  });

  describe('generateBatchLayout', () => {
    it('should create a canvas with A4 dimensions (2480×3508)', () => {
      const photoCanvas = document.createElement('canvas');
      photoCanvas.width = 295;
      photoCanvas.height = 413;

      const result = generateBatchLayout(photoCanvas, STANDARD_SIZES[0]);

      expect(result.canvas.width).toBe(2480);
      expect(result.canvas.height).toBe(3508);
    });

    it('should return correct layout metadata for 一寸', () => {
      const photoCanvas = document.createElement('canvas');
      photoCanvas.width = 295;
      photoCanvas.height = 413;

      const result = generateBatchLayout(photoCanvas, STANDARD_SIZES[0]);

      expect(result.columns).toBe(3);
      expect(result.rows).toBe(3);
      expect(result.totalPhotos).toBe(9);
    });

    it('should return correct layout metadata for 二寸', () => {
      const photoCanvas = document.createElement('canvas');
      photoCanvas.width = 413;
      photoCanvas.height = 579;

      const result = generateBatchLayout(photoCanvas, STANDARD_SIZES[1]);

      expect(result.columns).toBe(2);
      expect(result.rows).toBe(3);
      expect(result.totalPhotos).toBe(6);
    });

    it('should ensure grid fits within A4 boundaries for all standard sizes', () => {
      const A4_WIDTH_PX = 2480;
      const A4_HEIGHT_PX = 3508;
      const GAP_PX = Math.round((2 / 25.4) * 300); // ~24px

      for (const size of STANDARD_SIZES) {
        const photoCanvas = document.createElement('canvas');
        photoCanvas.width = size.widthPx;
        photoCanvas.height = size.heightPx;

        const result = generateBatchLayout(photoCanvas, size);

        const gridWidth = result.columns * size.widthPx + (result.columns - 1) * GAP_PX;
        const gridHeight = result.rows * size.heightPx + (result.rows - 1) * GAP_PX;

        expect(gridWidth).toBeLessThanOrEqual(A4_WIDTH_PX);
        expect(gridHeight).toBeLessThanOrEqual(A4_HEIGHT_PX);
      }
    });
  });
});


// Feature: id-photo-tool, Property 11: Batch layout fits within A4 dimensions
import * as fc from 'fast-check';

describe('Layout Engine - Property Tests', () => {
  // **Validates: Requirements 4.5**
  describe('Property 11: Batch layout fits within A4 dimensions', () => {
    const A4_WIDTH_PX = 2480;  // 210mm at 300 DPI
    const A4_HEIGHT_PX = 3508; // 297mm at 300 DPI
    const GAP_PX = Math.round((2 / 25.4) * 300); // 2mm gap ≈ 24px

    const standardSizes: PhotoSize[] = [
      { id: '1-inch', name: '一寸', widthMm: 25, heightMm: 35, widthPx: 295, heightPx: 413 },
      { id: '2-inch', name: '二寸', widthMm: 35, heightMm: 49, widthPx: 413, heightPx: 579 },
      { id: 'small-1-inch', name: '小一寸', widthMm: 22, heightMm: 32, widthPx: 260, heightPx: 378 },
      { id: 'large-1-inch', name: '大一寸', widthMm: 33, heightMm: 48, widthPx: 390, heightPx: 567 },
      { id: 'small-2-inch', name: '小二寸', widthMm: 35, heightMm: 45, widthPx: 413, heightPx: 531 },
    ];

    const expectedCounts: Record<string, number> = {
      '1-inch': 9,        // 一寸 9张
      '2-inch': 6,        // 二寸 6张
      'small-1-inch': 9,  // 小一寸 9张
      'large-1-inch': 6,  // 大一寸 6张
      'small-2-inch': 6,  // 小二寸 6张
    };

    it('columns × photoWidth + (columns-1) × gap ≤ A4 width for any standard size', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...standardSizes),
          (photoSize) => {
            const layout = calculateLayout(photoSize);
            const totalWidth = layout.columns * photoSize.widthPx + (layout.columns - 1) * GAP_PX;
            return totalWidth <= A4_WIDTH_PX;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('rows × photoHeight + (rows-1) × gap ≤ A4 height for any standard size', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...standardSizes),
          (photoSize) => {
            const layout = calculateLayout(photoSize);
            const totalHeight = layout.rows * photoSize.heightPx + (layout.rows - 1) * GAP_PX;
            return totalHeight <= A4_HEIGHT_PX;
          },
        ),
        { numRuns: 100 },
      );
    });

    it('total photo count matches specification for any standard size', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...standardSizes),
          (photoSize) => {
            const layout = calculateLayout(photoSize);
            return layout.totalPhotos === expectedCounts[photoSize.id];
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
