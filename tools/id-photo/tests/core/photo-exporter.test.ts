import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateExportFilename } from '@/utils/image-helpers';

// Feature: id-photo-tool, Property 10: Export filename contains size specification

// Standard sizes matching the design spec
const STANDARD_SIZES = [
  { name: '一寸', w: 25, h: 35 },
  { name: '二寸', w: 35, h: 49 },
  { name: '小一寸', w: 22, h: 32 },
  { name: '大一寸', w: 33, h: 48 },
  { name: '小二寸', w: 35, h: 45 },
];

describe('Photo Exporter - Property Tests', () => {
  // **Validates: Requirements 4.4**
  it('Property 10: Export filename contains size specification', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...STANDARD_SIZES),
        fc.constantFrom('jpeg' as const, 'png' as const),
        (size, format) => {
          const filename = generateExportFilename(size.name, size.w, size.h, format);

          // Verify the filename contains the size name
          expect(filename).toContain(size.name);

          // Verify the filename contains the dimension string
          expect(filename).toContain(`${size.w}x${size.h}mm`);

          // Verify the extension is correct (.jpg for jpeg, .png for png)
          const expectedExtension = format === 'jpeg' ? '.jpg' : '.png';
          expect(filename).toMatch(new RegExp(`\\${expectedExtension}$`));
        }
      ),
      { numRuns: 100 }
    );
  });
});
