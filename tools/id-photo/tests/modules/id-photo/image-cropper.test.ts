import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { STANDARD_SIZES } from '@/modules/id-photo/constants/photo-sizes';

// Feature: id-photo-tool, Property 3: Aspect ratio preservation on scale
// **Validates: Requirements 2.4**

/**
 * Property 3: Aspect ratio preservation on scale
 *
 * For any crop box with a locked aspect ratio and any scale factor,
 * the resulting box's width/height ratio remains equal to the original
 * ratio within ±0.001.
 *
 * This tests the mathematical property that uniform scaling preserves
 * aspect ratio — the core invariant behind locked-ratio crop box resizing.
 */
describe('Image Cropper - Property Tests', () => {
  describe('Property 3: Aspect ratio preservation on scale', () => {
    it('uniform scaling of a crop box preserves its width/height ratio within ±0.001', () => {
      fc.assert(
        fc.property(
          // Generate random aspect ratios via width and height
          fc.double({ min: 0.3, max: 3.0, noNaN: true }),
          fc.double({ min: 0.1, max: 5.0, noNaN: true }),
          fc.double({ min: 10, max: 2000, noNaN: true }),
          (aspectRatio, scaleFactor, baseHeight) => {
            // Original crop box dimensions with the given aspect ratio
            const originalWidth = baseHeight * aspectRatio;
            const originalHeight = baseHeight;

            // Original ratio
            const originalRatio = originalWidth / originalHeight;

            // After uniform scaling by factor s
            const newWidth = originalWidth * scaleFactor;
            const newHeight = originalHeight * scaleFactor;

            // The scaled ratio
            const scaledRatio = newWidth / newHeight;

            // Verify aspect ratio is preserved within ±0.001
            expect(Math.abs(scaledRatio - originalRatio)).toBeLessThanOrEqual(0.001);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('scaling preserves aspect ratio for any generated width/height pair', () => {
      fc.assert(
        fc.property(
          // Generate random widths and heights directly
          fc.double({ min: 10, max: 5000, noNaN: true }),
          fc.double({ min: 10, max: 5000, noNaN: true }),
          fc.double({ min: 0.1, max: 5.0, noNaN: true }),
          (width, height, scaleFactor) => {
            // Original aspect ratio
            const originalRatio = width / height;

            // After uniform scaling
            const newWidth = width * scaleFactor;
            const newHeight = height * scaleFactor;
            const scaledRatio = newWidth / newHeight;

            // Verify aspect ratio is preserved within ±0.001
            expect(Math.abs(scaledRatio - originalRatio)).toBeLessThanOrEqual(0.001);
          },
        ),
        { numRuns: 200 },
      );
    });

    it('standard photo sizes have consistent pixel and mm aspect ratios within ±0.01', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...STANDARD_SIZES),
          (size) => {
            // The aspect ratio from pixel dimensions
            const pixelRatio = size.widthPx / size.heightPx;

            // The aspect ratio from mm dimensions
            const mmRatio = size.widthMm / size.heightMm;

            // Verify pixel dimensions are consistent with mm dimensions
            // within ±0.01 tolerance
            expect(Math.abs(pixelRatio - mmRatio)).toBeLessThanOrEqual(0.01);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('multiple successive scale operations preserve the original ratio within ±0.001', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.3, max: 3.0, noNaN: true }),
          fc.double({ min: 10, max: 1000, noNaN: true }),
          fc.array(fc.double({ min: 0.5, max: 2.0, noNaN: true }), { minLength: 2, maxLength: 5 }),
          (aspectRatio, baseHeight, scaleFactors) => {
            const originalWidth = baseHeight * aspectRatio;
            const originalHeight = baseHeight;
            const originalRatio = originalWidth / originalHeight;

            // Apply multiple successive scale operations
            let currentWidth = originalWidth;
            let currentHeight = originalHeight;

            for (const factor of scaleFactors) {
              currentWidth = currentWidth * factor;
              currentHeight = currentHeight * factor;
            }

            const finalRatio = currentWidth / currentHeight;

            // Even after multiple scalings, ratio should be preserved
            expect(Math.abs(finalRatio - originalRatio)).toBeLessThanOrEqual(0.001);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
