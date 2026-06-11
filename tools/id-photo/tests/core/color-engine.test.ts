import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { colorDistance, detectBackgroundColor, replaceBackground } from '@/core/color-engine';
import type { RGB, BackgroundReplaceOptions } from '@/core/color-engine';

describe('Color Engine', () => {
  describe('colorDistance', () => {
    it('should return 0 for identical colors', () => {
      const color: RGB = { r: 128, g: 64, b: 200 };
      expect(colorDistance(color, color)).toBe(0);
    });

    it('should return max distance (~441.67) for black and white', () => {
      const black: RGB = { r: 0, g: 0, b: 0 };
      const white: RGB = { r: 255, g: 255, b: 255 };
      const dist = colorDistance(black, white);
      expect(dist).toBeCloseTo(441.67, 1);
    });

    it('should be commutative (d(a,b) === d(b,a))', () => {
      const c1: RGB = { r: 100, g: 50, b: 200 };
      const c2: RGB = { r: 30, g: 180, b: 90 };
      expect(colorDistance(c1, c2)).toBeCloseTo(colorDistance(c2, c1));
    });

    it('should calculate correct distance for known values', () => {
      const red: RGB = { r: 255, g: 0, b: 0 };
      const green: RGB = { r: 0, g: 255, b: 0 };
      // sqrt(255^2 + 255^2) = sqrt(130050) ≈ 360.62
      expect(colorDistance(red, green)).toBeCloseTo(360.62, 1);
    });
  });

  describe('detectBackgroundColor', () => {
    it('should detect solid white background', () => {
      // Create a 20x20 all-white image
      const width = 20;
      const height = 20;
      const data = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 255; // A
      }
      const imageData = new ImageData(data, width, height);

      const bgColor = detectBackgroundColor(imageData);
      expect(bgColor.r).toBe(255);
      expect(bgColor.g).toBe(255);
      expect(bgColor.b).toBe(255);
    });

    it('should detect background from corners even with different center', () => {
      // Create a 20x20 image with blue background and a red center
      const width = 20;
      const height = 20;
      const data = new Uint8ClampedArray(width * height * 4);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          // Center area (6-14, 6-14) is red, rest is blue
          if (x >= 6 && x <= 14 && y >= 6 && y <= 14) {
            data[idx] = 255;     // R
            data[idx + 1] = 0;   // G
            data[idx + 2] = 0;   // B
          } else {
            data[idx] = 0;       // R
            data[idx + 1] = 0;   // G
            data[idx + 2] = 255; // B
          }
          data[idx + 3] = 255;   // A
        }
      }
      const imageData = new ImageData(data, width, height);

      const bgColor = detectBackgroundColor(imageData);
      // Should detect blue as the background (from corners)
      expect(bgColor.r).toBe(0);
      expect(bgColor.g).toBe(0);
      expect(bgColor.b).toBe(255);
    });
  });

  describe('replaceBackground', () => {
    it('should replace solid background with target color', () => {
      // Create a 10x10 all-white image
      const width = 10;
      const height = 10;
      const data = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;     // R
        data[i + 1] = 255; // G
        data[i + 2] = 255; // B
        data[i + 3] = 255; // A
      }
      const imageData = new ImageData(data, width, height);

      const options: BackgroundReplaceOptions = {
        targetColor: { r: 255, g: 0, b: 0 },
        tolerance: 30,
      };

      const result = replaceBackground(imageData, options);

      // All pixels should be replaced since the image is solid white
      expect(result.replacedPixelCount).toBe(width * height);
      expect(result.replacedPercentage).toBe(100);

      // Check that pixels are now red
      const resData = result.imageData.data;
      expect(resData[0]).toBe(255); // R
      expect(resData[1]).toBe(0);   // G
      expect(resData[2]).toBe(0);   // B
    });

    it('should not replace foreground pixels far from background color', () => {
      // Create a 10x10 image: white background (corners) with black center
      const width = 10;
      const height = 10;
      const data = new Uint8ClampedArray(width * height * 4);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (x >= 3 && x <= 6 && y >= 3 && y <= 6) {
            // Center: black (far from white background)
            data[idx] = 0;
            data[idx + 1] = 0;
            data[idx + 2] = 0;
          } else {
            // Border: white
            data[idx] = 255;
            data[idx + 1] = 255;
            data[idx + 2] = 255;
          }
          data[idx + 3] = 255;
        }
      }
      const imageData = new ImageData(data, width, height);

      const options: BackgroundReplaceOptions = {
        targetColor: { r: 0, g: 0, b: 255 }, // Blue target
        tolerance: 30,
      };

      const result = replaceBackground(imageData, options);

      // Black center pixels (distance ~441.67 from white) should NOT be replaced at 30% tolerance
      // threshold = 0.3 * 441.67 ≈ 132.5
      // White background pixels (distance 0) should be replaced
      expect(result.replacedPixelCount).toBeGreaterThan(0);
      expect(result.replacedPixelCount).toBeLessThan(width * height);
    });

    it('should replace more pixels with higher tolerance', () => {
      // Create image with gradient-like background
      const width = 10;
      const height = 10;
      const data = new Uint8ClampedArray(width * height * 4);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          // Gradient from white (top-left) to gray
          const value = 255 - Math.floor((x + y) * 10);
          data[idx] = value;
          data[idx + 1] = value;
          data[idx + 2] = value;
          data[idx + 3] = 255;
        }
      }
      const imageData1 = new ImageData(new Uint8ClampedArray(data), width, height);
      const imageData2 = new ImageData(new Uint8ClampedArray(data), width, height);

      const options1: BackgroundReplaceOptions = {
        targetColor: { r: 255, g: 0, b: 0 },
        tolerance: 20,
      };
      const options2: BackgroundReplaceOptions = {
        targetColor: { r: 255, g: 0, b: 0 },
        tolerance: 60,
      };

      const result1 = replaceBackground(imageData1, options1);
      const result2 = replaceBackground(imageData2, options2);

      expect(result2.replacedPixelCount).toBeGreaterThanOrEqual(result1.replacedPixelCount);
    });

    it('should produce a canvas with correct dimensions', () => {
      const width = 15;
      const height = 20;
      const data = new Uint8ClampedArray(width * height * 4).fill(255);
      const imageData = new ImageData(data, width, height);

      const options: BackgroundReplaceOptions = {
        targetColor: { r: 0, g: 0, b: 255 },
        tolerance: 50,
      };

      const result = replaceBackground(imageData, options);
      expect(result.canvas.width).toBe(width);
      expect(result.canvas.height).toBe(height);
    });

    it('should map tolerance 0 with featherRadius 0 to no replacement', () => {
      // All white image
      const width = 10;
      const height = 10;
      const data = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
      // Add one pixel that's slightly off-white
      data[0] = 254;

      const imageData = new ImageData(data, width, height);

      const options: BackgroundReplaceOptions = {
        targetColor: { r: 255, g: 0, b: 0 },
        tolerance: 0,
        featherRadius: 0,
      };

      const result = replaceBackground(imageData, options);
      // With tolerance 0 and featherRadius 0, threshold is 0 and feather range is 0
      // dist < 0 is never true, and dist < 0 + 0 is also never true (for dist >= 0)
      // So nothing should be replaced
      expect(result.replacedPixelCount).toBe(0);
    });
  });
});


// ============================================================================
// Property-Based Tests
// ============================================================================

describe('Color Engine - Property Tests', () => {
  // Feature: id-photo-tool, Property 6: Background replacement with solid background
  // For any image consisting of a solid-color background region and a non-background foreground
  // region where the color distance between background and foreground exceeds the tolerance
  // threshold, replaceBackground SHALL replace all background pixels with the target color
  // while leaving all foreground pixels unchanged.
  // **Validates: Requirements 3.3**
  describe('Property 6: Background replacement with solid background', () => {
    it('should replace all background pixels with target color and leave foreground unchanged', () => {
      fc.assert(
        fc.property(
          // Generate background color
          fc.record({
            r: fc.integer({ min: 0, max: 255 }),
            g: fc.integer({ min: 0, max: 255 }),
            b: fc.integer({ min: 0, max: 255 }),
          }),
          // Generate target color
          fc.record({
            r: fc.integer({ min: 0, max: 255 }),
            g: fc.integer({ min: 0, max: 255 }),
            b: fc.integer({ min: 0, max: 255 }),
          }),
          // Generate tolerance (1-100, avoid 0 which replaces nothing)
          fc.integer({ min: 1, max: 100 }),
          (bgColor, targetColor, tolerance) => {
            const width = 20;
            const height = 20;

            // Calculate threshold for this tolerance
            const MAX_COLOR_DISTANCE = Math.sqrt(255 * 255 * 3); // ~441.67
            const threshold = (tolerance / 100) * MAX_COLOR_DISTANCE;

            // Generate a foreground color that is sufficiently far from the background.
            // We need colorDistance(fgColor, bgColor) > threshold + featherRange (featherRadius=1 => featherRange=10)
            // To guarantee this, create a foreground color that is maximally distant from bgColor.
            const featherRange = 1 * 10; // default featherRadius = 1
            const minRequiredDistance = threshold + featherRange + 1;

            // Create a foreground color that is far from bgColor
            // Strategy: invert each channel and ensure distance exceeds requirement
            const fgColor: RGB = {
              r: bgColor.r <= 127 ? 255 : 0,
              g: bgColor.g <= 127 ? 255 : 0,
              b: bgColor.b <= 127 ? 255 : 0,
            };

            const fgDist = colorDistance(fgColor, bgColor);

            // Skip test cases where the foreground isn't far enough from background
            // (this can happen with very high tolerance values close to 100)
            if (fgDist <= minRequiredDistance) {
              return; // Skip this case - fc.pre would also work but return is cleaner
            }

            // Create image: solid bgColor with a distinct foreground block in center
            // Corners must be bgColor (for detectBackgroundColor to work)
            const data = new Uint8ClampedArray(width * height * 4);
            const foregroundPixels: number[] = []; // indices of foreground pixels
            const backgroundPixels: number[] = []; // indices of background pixels

            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                // Center 8x8 block (6-13, 6-13) is foreground, rest is background
                if (x >= 6 && x <= 13 && y >= 6 && y <= 13) {
                  data[idx] = fgColor.r;
                  data[idx + 1] = fgColor.g;
                  data[idx + 2] = fgColor.b;
                  data[idx + 3] = 255;
                  foregroundPixels.push(idx);
                } else {
                  data[idx] = bgColor.r;
                  data[idx + 1] = bgColor.g;
                  data[idx + 2] = bgColor.b;
                  data[idx + 3] = 255;
                  backgroundPixels.push(idx);
                }
              }
            }

            const imageData = new ImageData(data, width, height);
            const options: BackgroundReplaceOptions = {
              targetColor,
              tolerance,
              featherRadius: 1,
            };

            const result = replaceBackground(imageData, options);
            const resultData = result.imageData.data;

            // All background pixels should be replaced with target color
            for (const idx of backgroundPixels) {
              expect(resultData[idx]).toBe(targetColor.r);
              expect(resultData[idx + 1]).toBe(targetColor.g);
              expect(resultData[idx + 2]).toBe(targetColor.b);
            }

            // All foreground pixels should remain unchanged
            for (const idx of foregroundPixels) {
              expect(resultData[idx]).toBe(fgColor.r);
              expect(resultData[idx + 1]).toBe(fgColor.g);
              expect(resultData[idx + 2]).toBe(fgColor.b);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: id-photo-tool, Property 7: Tolerance monotonicity
  // For any image and any two tolerance values t1 < t2, the number of pixels replaced
  // at tolerance t2 SHALL be greater than or equal to the number of pixels replaced at t1.
  // **Validates: Requirements 3.5**
  describe('Property 7: Tolerance monotonicity', () => {
    it('should replace more or equal pixels with higher tolerance', () => {
      fc.assert(
        fc.property(
          // Generate two distinct tolerances, ensure t1 < t2
          fc.integer({ min: 0, max: 99 }),
          fc.integer({ min: 1, max: 100 }),
          // Generate a background color for the gradient
          fc.record({
            r: fc.integer({ min: 0, max: 255 }),
            g: fc.integer({ min: 0, max: 255 }),
            b: fc.integer({ min: 0, max: 255 }),
          }),
          // Generate target color
          fc.record({
            r: fc.integer({ min: 0, max: 255 }),
            g: fc.integer({ min: 0, max: 255 }),
            b: fc.integer({ min: 0, max: 255 }),
          }),
          (rawT1, rawT2, bgColor, targetColor) => {
            // Ensure t1 < t2
            const t1 = Math.min(rawT1, rawT2);
            const t2 = Math.max(rawT1, rawT2);
            if (t1 === t2) return; // Skip when equal

            const width = 20;
            const height = 20;

            // Create a test image with varied colors:
            // Corners are bgColor (for detectBackgroundColor to detect bgColor)
            // The rest is a gradient of colors at varying distances from bgColor
            const data = new Uint8ClampedArray(width * height * 4);

            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                // Corner regions (5x5 in each corner) are pure bgColor
                const isCorner =
                  (x < 5 && y < 5) ||
                  (x >= width - 5 && y < 5) ||
                  (x < 5 && y >= height - 5) ||
                  (x >= width - 5 && y >= height - 5);

                if (isCorner) {
                  data[idx] = bgColor.r;
                  data[idx + 1] = bgColor.g;
                  data[idx + 2] = bgColor.b;
                } else {
                  // Gradient: vary pixel color based on position
                  // Distance from top-left increases, creating varied distances from bgColor
                  const factor = (x + y) / (width + height - 2); // 0 to 1
                  data[idx] = Math.min(255, Math.max(0, Math.round(bgColor.r + (255 - bgColor.r) * factor)));
                  data[idx + 1] = Math.min(255, Math.max(0, Math.round(bgColor.g + (255 - bgColor.g) * factor)));
                  data[idx + 2] = Math.min(255, Math.max(0, Math.round(bgColor.b + (255 - bgColor.b) * factor)));
                }
                data[idx + 3] = 255;
              }
            }

            // Create two copies of the image data
            const imageData1 = new ImageData(new Uint8ClampedArray(data), width, height);
            const imageData2 = new ImageData(new Uint8ClampedArray(data), width, height);

            const options1: BackgroundReplaceOptions = {
              targetColor,
              tolerance: t1,
              featherRadius: 0, // Use 0 to avoid feather zone counting ambiguity
            };

            const options2: BackgroundReplaceOptions = {
              targetColor,
              tolerance: t2,
              featherRadius: 0,
            };

            const result1 = replaceBackground(imageData1, options1);
            const result2 = replaceBackground(imageData2, options2);

            // Higher tolerance should replace more or equal number of pixels
            expect(result2.replacedPixelCount).toBeGreaterThanOrEqual(result1.replacedPixelCount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
