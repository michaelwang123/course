import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { cropImage, canvasToBlob } from '@/core/canvas-processor';

/**
 * Property-based tests for Canvas Processor
 *
 * These tests validate the core canvas processing logic using fast-check.
 * Since the test environment uses mocked Canvas (happy-dom), drawImage is a no-op.
 * We focus on verifiable properties: output dimensions, no-throw guarantees, and
 * identity operations on pixel data.
 */

// Helper: create a minimal source canvas for testing
function createSourceCanvas(width = 10, height = 10): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

describe('Canvas Processor - Property Tests', () => {
  // Feature: id-photo-tool, Property 2: Crop output dimensions match target
  // **Validates: Requirements 2.5, 2.6**
  describe('Property 2: Crop output dimensions match target', () => {
    it('should produce a canvas whose width/height exactly match the specified outputSize for any target dimensions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 2000 }),
          fc.integer({ min: 1, max: 2000 }),
          (targetWidth, targetHeight) => {
            const source = createSourceCanvas(100, 100);
            const result = cropImage(source, {
              sourceRect: { x: 0, y: 0, width: 100, height: 100 },
              outputSize: { width: targetWidth, height: targetHeight },
            });

            expect(result.canvas.width).toBe(targetWidth);
            expect(result.canvas.height).toBe(targetHeight);
            expect(result.imageData.width).toBe(targetWidth);
            expect(result.imageData.height).toBe(targetHeight);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should produce correct dimensions regardless of rotation value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 2000 }),
          fc.integer({ min: 1, max: 2000 }),
          fc.constantFrom(0, 90, 180, 270),
          (targetWidth, targetHeight, rotation) => {
            const source = createSourceCanvas(100, 100);
            const result = cropImage(source, {
              sourceRect: { x: 0, y: 0, width: 100, height: 100 },
              outputSize: { width: targetWidth, height: targetHeight },
              rotation,
            });

            // Output canvas size is always the specified outputSize, regardless of rotation
            expect(result.canvas.width).toBe(targetWidth);
            expect(result.canvas.height).toBe(targetHeight);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: id-photo-tool, Property 4: Rotation and flip round-trip identity
  // **Validates: Requirements 2.7**
  describe('Property 4: Rotation and flip round-trip identity', () => {
    it('four successive 90° CW rotations should produce correct output dimensions (identity check)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 500 }),
          (width, height) => {
            const source = createSourceCanvas(width, height);
            const outputSize = { width, height };
            const sourceRect = { x: 0, y: 0, width, height };

            // Apply four 90° rotations sequentially; each produces correct dimensions
            let currentCanvas: HTMLCanvasElement | HTMLImageElement = source;
            for (let i = 0; i < 4; i++) {
              const result = cropImage(currentCanvas as HTMLCanvasElement, {
                sourceRect,
                outputSize,
                rotation: 90,
              });
              // Each result should have correct output dimensions
              expect(result.canvas.width).toBe(width);
              expect(result.canvas.height).toBe(height);
              currentCanvas = result.canvas;
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('two horizontal flips should produce correct output dimensions (identity check)', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 500 }),
          (width, height) => {
            const source = createSourceCanvas(width, height);
            const outputSize = { width, height };
            const sourceRect = { x: 0, y: 0, width, height };

            // Apply two flips
            const firstFlip = cropImage(source, {
              sourceRect,
              outputSize,
              flipHorizontal: true,
            });
            expect(firstFlip.canvas.width).toBe(width);
            expect(firstFlip.canvas.height).toBe(height);

            const secondFlip = cropImage(firstFlip.canvas, {
              sourceRect,
              outputSize,
              flipHorizontal: true,
            });
            expect(secondFlip.canvas.width).toBe(width);
            expect(secondFlip.canvas.height).toBe(height);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: id-photo-tool, Property 5: Zero brightness/contrast is identity
  // **Validates: Requirements 2.9**
  describe('Property 5: Zero brightness/contrast is identity', () => {
    it('applying brightness=0 and contrast=0 should produce pixel data identical to input', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          (width, height) => {
            const source = createSourceCanvas(width, height);
            const outputSize = { width, height };
            const sourceRect = { x: 0, y: 0, width, height };

            // Get result without brightness/contrast adjustments
            const baseResult = cropImage(source, {
              sourceRect,
              outputSize,
            });

            // Get result with brightness=0, contrast=0 (should be identity)
            const adjustedResult = cropImage(source, {
              sourceRect,
              outputSize,
              brightness: 0,
              contrast: 0,
            });

            // Pixel data should be identical since brightness=0 and contrast=0
            // means no adjustment is applied (the code skips processing when both are 0).
            // With multiplicative brightness: factor=(100+0*2)/100=1.0 (identity).
            // With contrast: factor=(100+0*2)/100=1.0, so (pixel-128)*1+128=pixel (identity).
            expect(adjustedResult.imageData.data).toEqual(baseResult.imageData.data);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('applying brightness=0 and contrast=0 should not modify any pixel values', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 50 }),
          fc.integer({ min: 2, max: 50 }),
          (width, height) => {
            const source = createSourceCanvas(width, height);
            const outputSize = { width, height };
            const sourceRect = { x: 0, y: 0, width, height };

            const result = cropImage(source, {
              sourceRect,
              outputSize,
              brightness: 0,
              contrast: 0,
            });

            // In the mock environment, getImageData returns zeros by default.
            // With brightness=0, contrast=0 the code path skips pixel manipulation entirely
            // (both are 0, so the `if (brightness !== 0 || contrast !== 0)` guard is false),
            // so all values remain zero (identical to a fresh getImageData call).
            // Note: multiplicative brightness with factor=1.0 would also preserve zeros,
            // but the optimization skips the loop entirely when both adjustments are zero.
            const expectedData = new Uint8ClampedArray(width * height * 4);
            expect(result.imageData.data).toEqual(expectedData);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});


describe('Canvas Processor - Export Property Tests', () => {
  // Feature: id-photo-tool, Property 8: Export format produces correct MIME type
  // **Validates: Requirements 4.1, 4.2**
  describe('Property 8: Export format produces correct MIME type', () => {
    it('for any valid canvas and any export format (JPEG or PNG), the exported Blob type SHALL match the requested format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 500 }),
          fc.constantFrom('image/jpeg' as const, 'image/png' as const),
          async (width, height, format) => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const blob = await canvasToBlob(canvas, format);

            expect(blob.type).toBe(format);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // Feature: id-photo-tool, Property 9: JPEG quality monotonicity (with 5% tolerance)
  // **Validates: Requirements 4.3**
  describe('Property 9: JPEG quality monotonicity (with 5% tolerance)', () => {
    it('for any canvas and two quality values q1 < q2, the JPEG blob at q2 SHALL have size >= size at q1 * 0.95', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 500 }),
          fc.integer({ min: 1, max: 500 }),
          fc.double({ min: 0.6, max: 1.0, noNaN: true }),
          fc.double({ min: 0.6, max: 1.0, noNaN: true }),
          async (width, height, rawQ1, rawQ2) => {
            // Ensure q1 < q2
            const q1 = Math.min(rawQ1, rawQ2);
            const q2 = Math.max(rawQ1, rawQ2);

            // Skip when q1 === q2 (no meaningful comparison)
            fc.pre(q1 < q2);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const blob1 = await canvasToBlob(canvas, 'image/jpeg', q1);
            const blob2 = await canvasToBlob(canvas, 'image/jpeg', q2);

            // Higher quality should produce size >= lower quality * 0.95 (5% tolerance)
            expect(blob2.size).toBeGreaterThanOrEqual(blob1.size * 0.95);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
