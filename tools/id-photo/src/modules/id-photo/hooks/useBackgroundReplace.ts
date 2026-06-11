/**
 * useBackgroundReplace — Hook wrapping background replacement logic
 * with loading state and error recovery.
 *
 * Calls replaceBackground from color-engine and dispatches SET_PROCESSED to context.
 * Manages SET_PROCESSING state for UI loading indicators.
 */

import { usePhotoContext } from '../context/PhotoContext';
import { replaceBackground, type BackgroundReplaceOptions, type BackgroundReplaceResult } from '../../../core/color-engine';

export interface UseBackgroundReplaceResult {
  /** Execute background replacement on the provided image data */
  performReplace: (imageData: ImageData, options: BackgroundReplaceOptions) => Promise<BackgroundReplaceResult>;
  /** Reset the background step, clearing the processed canvas */
  resetBackground: () => void;
  /** Whether a background replacement operation is currently in progress */
  isProcessing: boolean;
}

export function useBackgroundReplace(): UseBackgroundReplaceResult {
  const { state, dispatch } = usePhotoContext();

  const performReplace = async (
    imageData: ImageData,
    options: BackgroundReplaceOptions
  ): Promise<BackgroundReplaceResult> => {
    try {
      dispatch({ type: 'SET_PROCESSING', payload: true });
      const result = replaceBackground(imageData, options);
      dispatch({ type: 'SET_PROCESSED', payload: result.canvas });
      return result;
    } catch (error) {
      // Re-throw so callers can display error messages to the user
      throw error;
    } finally {
      dispatch({ type: 'SET_PROCESSING', payload: false });
    }
  };

  const resetBackground = () => {
    dispatch({ type: 'RESET_STEP', payload: 'background' });
  };

  return { performReplace, resetBackground, isProcessing: state.isProcessing };
}
