// Feature: id-photo-tool, Property 1: File validation correctness
// **Validates: Requirements 1.1, 1.4, 1.5**

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateImageFile,
  SUPPORTED_FORMATS,
  MAX_FILE_SIZE,
} from '@/utils/file-validators';

/**
 * Helper to create a mock File object with given type and size.
 */
function createMockFile(type: string, size: number): File {
  // Create a minimal File-like object with the required properties
  const buffer = new ArrayBuffer(size > 0 ? 1 : 0); // We don't need actual data, just the size property
  const file = new File([buffer], 'test-image.jpg', { type });
  // Override the size property since File constructor won't let us set arbitrary sizes easily
  Object.defineProperty(file, 'size', { value: size, writable: false });
  return file;
}

describe('Property 1: File validation correctness', () => {
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
  const invalidMimeTypes = [
    'text/plain',
    'application/pdf',
    'image/gif',
    'image/bmp',
    'image/svg+xml',
    'application/json',
    'video/mp4',
    'audio/mpeg',
    'application/octet-stream',
    'text/html',
  ];

  it('should return valid: true for files with supported MIME type AND size ≤ 10MB', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validMimeTypes),
        fc.integer({ min: 1, max: MAX_FILE_SIZE }),
        (mimeType, size) => {
          const file = createMockFile(mimeType, size);
          const result = validateImageFile(file);

          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
          expect(result.message).toBeUndefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return valid: false with UNSUPPORTED_FORMAT for invalid MIME types', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...invalidMimeTypes),
        fc.integer({ min: 1, max: MAX_FILE_SIZE }),
        (mimeType, size) => {
          const file = createMockFile(mimeType, size);
          const result = validateImageFile(file);

          expect(result.valid).toBe(false);
          expect(result.error).toBe('UNSUPPORTED_FORMAT');
          expect(result.message).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return valid: false with FILE_TOO_LARGE for valid types but size > 10MB', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validMimeTypes),
        fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 5 }),
        (mimeType, size) => {
          const file = createMockFile(mimeType, size);
          const result = validateImageFile(file);

          expect(result.valid).toBe(false);
          expect(result.error).toBe('FILE_TOO_LARGE');
          expect(result.message).toBeDefined();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should return UNSUPPORTED_FORMAT (not FILE_TOO_LARGE) when both type is invalid AND size exceeds limit', () => {
    // Format check takes priority over size check per implementation
    fc.assert(
      fc.property(
        fc.constantFrom(...invalidMimeTypes),
        fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 5 }),
        (mimeType, size) => {
          const file = createMockFile(mimeType, size);
          const result = validateImageFile(file);

          expect(result.valid).toBe(false);
          expect(result.error).toBe('UNSUPPORTED_FORMAT');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should accept exactly the boundary size (10MB) as valid', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validMimeTypes),
        (mimeType) => {
          const file = createMockFile(mimeType, MAX_FILE_SIZE);
          const result = validateImageFile(file);

          expect(result.valid).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should reject size exactly 1 byte over the limit', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...validMimeTypes),
        (mimeType) => {
          const file = createMockFile(mimeType, MAX_FILE_SIZE + 1);
          const result = validateImageFile(file);

          expect(result.valid).toBe(false);
          expect(result.error).toBe('FILE_TOO_LARGE');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should validate that SUPPORTED_FORMATS matches expected types', () => {
    expect(SUPPORTED_FORMATS).toEqual(['image/jpeg', 'image/png', 'image/webp']);
    expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
  });
});
