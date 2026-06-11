/**
 * useCrop — Hook wrapping crop logic with loading state and error recovery.
 *
 * Calls cropImage from canvas-processor and dispatches SET_CROPPED to context.
 * Manages SET_PROCESSING state for UI loading indicators.
 */

import { usePhotoContext } from '../context/PhotoContext';
import { cropImage, type CropOptions } from '../../../core/canvas-processor';

export interface UseCropResult {
  /** Execute a crop operation on the provided source element */
  performCrop: (source: HTMLImageElement | HTMLCanvasElement, options: CropOptions) => Promise<void>;
  /** Reset the crop step, clearing cropped and downstream canvases */
  resetCrop: () => void;
  /** Whether a crop operation is currently in progress */
  isProcessing: boolean;
}

export function useCrop(): UseCropResult {
  const { state, dispatch } = usePhotoContext();

  const performCrop = async (
    source: HTMLImageElement | HTMLCanvasElement,
    options: CropOptions
  ): Promise<void> => {
    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      const result = cropImage(source, options);
      dispatch({ type: 'SET_CROPPED', payload: result.canvas });
    } catch (error) {
      // Re-throw so callers can display error messages to the user
      throw error;
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };

  const resetCrop = () => {
    dispatch({ type: 'RESET_STEP', payload: 'crop' });
  };

  return { performCrop, resetCrop, isProcessing: state.isProcessing };
}
