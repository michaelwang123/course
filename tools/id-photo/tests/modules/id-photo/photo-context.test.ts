import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { photoReducer, initialState, type PhotoAction } from '@/modules/id-photo/context/PhotoContext';

// Feature: id-photo-tool, Property 13: Upload unlocks all subsequent steps
describe('PhotoContext - Property Tests', () => {
  // **Validates: Requirements 7.3, 7.6**

  describe('Property 13: Upload unlocks all subsequent steps', () => {
    // For any valid image uploaded (SET_ORIGINAL_IMAGE action), the resulting
    // state's unlockedSteps SHALL contain 'crop', 'background', and 'export'.

    const fileInfoArb = fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }).map((s) => s.replace(/[<>:"/\\|?*]/g, '_') + '.jpg'),
      type: fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
      size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
    });

    it('SET_ORIGINAL_IMAGE action unlocks crop, background, and export steps', () => {
      fc.assert(
        fc.property(fileInfoArb, (fileInfo) => {
          // Create a mock HTMLImageElement
          const image = document.createElement('img');

          const action: PhotoAction = {
            type: 'SET_ORIGINAL_IMAGE',
            payload: { image, file: fileInfo },
          };

          const newState = photoReducer(initialState, action);

          // Verify all subsequent steps are unlocked
          expect(newState.unlockedSteps.has('crop')).toBe(true);
          expect(newState.unlockedSteps.has('background')).toBe(true);
          expect(newState.unlockedSteps.has('export')).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it('SET_ORIGINAL_IMAGE preserves the upload step in unlockedSteps', () => {
      fc.assert(
        fc.property(fileInfoArb, (fileInfo) => {
          const image = document.createElement('img');

          const action: PhotoAction = {
            type: 'SET_ORIGINAL_IMAGE',
            payload: { image, file: fileInfo },
          };

          const newState = photoReducer(initialState, action);

          // Upload step should still be unlocked
          expect(newState.unlockedSteps.has('upload')).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it('SET_ORIGINAL_IMAGE stores the image and file info correctly', () => {
      fc.assert(
        fc.property(fileInfoArb, (fileInfo) => {
          const image = document.createElement('img');

          const action: PhotoAction = {
            type: 'SET_ORIGINAL_IMAGE',
            payload: { image, file: fileInfo },
          };

          const newState = photoReducer(initialState, action);

          expect(newState.originalImage).toBe(image);
          expect(newState.originalFile).toEqual(fileInfo);
        }),
        { numRuns: 100 },
      );
    });
  });

  describe('Property 14: Step reset restores prior state', () => {
    // For any step (crop, background), dispatching RESET_STEP shall restore
    // state to before that step's processing.

    it('RESET_STEP(crop) after SET_CROPPED nullifies croppedCanvas and processedCanvas', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 2000 }),
          fc.integer({ min: 10, max: 2000 }),
          (width, height) => {
            // Start with an image uploaded
            const image = document.createElement('img');
            const uploadAction: PhotoAction = {
              type: 'SET_ORIGINAL_IMAGE',
              payload: { image, file: { name: 'test.jpg', type: 'image/jpeg', size: 1000 } },
            };
            let state = photoReducer(initialState, uploadAction);

            // Simulate crop by creating a canvas
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = width;
            croppedCanvas.height = height;

            const cropAction: PhotoAction = { type: 'SET_CROPPED', payload: croppedCanvas };
            state = photoReducer(state, cropAction);

            // Also set a processed canvas (downstream of crop)
            const processedCanvas = document.createElement('canvas');
            processedCanvas.width = width;
            processedCanvas.height = height;

            const processAction: PhotoAction = { type: 'SET_PROCESSED', payload: processedCanvas };
            state = photoReducer(state, processAction);

            // Now reset the crop step
            const resetAction: PhotoAction = { type: 'RESET_STEP', payload: 'crop' };
            const resetState = photoReducer(state, resetAction);

            // Both croppedCanvas and processedCanvas should be null
            expect(resetState.croppedCanvas).toBeNull();
            expect(resetState.processedCanvas).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });

    it('RESET_STEP(background) after SET_PROCESSED nullifies processedCanvas but preserves croppedCanvas', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 2000 }),
          fc.integer({ min: 10, max: 2000 }),
          (width, height) => {
            // Start with an image uploaded
            const image = document.createElement('img');
            const uploadAction: PhotoAction = {
              type: 'SET_ORIGINAL_IMAGE',
              payload: { image, file: { name: 'photo.png', type: 'image/png', size: 5000 } },
            };
            let state = photoReducer(initialState, uploadAction);

            // Simulate crop
            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = width;
            croppedCanvas.height = height;

            const cropAction: PhotoAction = { type: 'SET_CROPPED', payload: croppedCanvas };
            state = photoReducer(state, cropAction);

            // Simulate background processing
            const processedCanvas = document.createElement('canvas');
            processedCanvas.width = width;
            processedCanvas.height = height;

            const processAction: PhotoAction = { type: 'SET_PROCESSED', payload: processedCanvas };
            state = photoReducer(state, processAction);

            // Now reset the background step
            const resetAction: PhotoAction = { type: 'RESET_STEP', payload: 'background' };
            const resetState = photoReducer(state, resetAction);

            // processedCanvas should be null, croppedCanvas should be unchanged
            expect(resetState.processedCanvas).toBeNull();
            expect(resetState.croppedCanvas).toBe(croppedCanvas);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('RESET_STEP(background) does not affect originalImage or unlockedSteps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 2000 }),
          fc.integer({ min: 10, max: 2000 }),
          (width, height) => {
            const image = document.createElement('img');
            const uploadAction: PhotoAction = {
              type: 'SET_ORIGINAL_IMAGE',
              payload: { image, file: { name: 'img.webp', type: 'image/webp', size: 2000 } },
            };
            let state = photoReducer(initialState, uploadAction);

            const processedCanvas = document.createElement('canvas');
            processedCanvas.width = width;
            processedCanvas.height = height;

            const processAction: PhotoAction = { type: 'SET_PROCESSED', payload: processedCanvas };
            state = photoReducer(state, processAction);

            const resetAction: PhotoAction = { type: 'RESET_STEP', payload: 'background' };
            const resetState = photoReducer(state, resetAction);

            // Original image and unlocked steps remain intact
            expect(resetState.originalImage).toBe(image);
            expect(resetState.unlockedSteps.has('crop')).toBe(true);
            expect(resetState.unlockedSteps.has('background')).toBe(true);
            expect(resetState.unlockedSteps.has('export')).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it('RESET_STEP(crop) does not affect originalImage or unlockedSteps', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 10, max: 2000 }),
          fc.integer({ min: 10, max: 2000 }),
          (width, height) => {
            const image = document.createElement('img');
            const uploadAction: PhotoAction = {
              type: 'SET_ORIGINAL_IMAGE',
              payload: { image, file: { name: 'pic.jpg', type: 'image/jpeg', size: 3000 } },
            };
            let state = photoReducer(initialState, uploadAction);

            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = width;
            croppedCanvas.height = height;

            const cropAction: PhotoAction = { type: 'SET_CROPPED', payload: croppedCanvas };
            state = photoReducer(state, cropAction);

            const resetAction: PhotoAction = { type: 'RESET_STEP', payload: 'crop' };
            const resetState = photoReducer(state, resetAction);

            // Original image and unlocked steps remain intact
            expect(resetState.originalImage).toBe(image);
            expect(resetState.unlockedSteps.has('crop')).toBe(true);
            expect(resetState.unlockedSteps.has('background')).toBe(true);
            expect(resetState.unlockedSteps.has('export')).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
