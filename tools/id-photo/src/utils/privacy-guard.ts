/**
 * Privacy Guard — ensures all canvas pixel data is released on page unload.
 *
 * Registers a `beforeunload` event handler that zeroes out canvas dimensions,
 * signaling the browser to free the underlying GPU/RAM pixel buffer.
 * Also revokes any lingering object URLs.
 *
 * Requirements: 8.1, 8.2, 8.4
 */

export interface PrivacyState {
  croppedCanvas: HTMLCanvasElement | null;
  processedCanvas: HTMLCanvasElement | null;
  previewCanvas: HTMLCanvasElement | null;
  originalImage: HTMLImageElement | null;
}

/**
 * Releases a Canvas's underlying pixel buffer by setting width/height to 0.
 */
function releaseCanvasMemory(canvas: HTMLCanvasElement | null): void {
  if (canvas) {
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * Revokes an object URL if the src looks like a blob URL.
 */
function revokeObjectUrl(src: string | undefined | null): void {
  if (src && src.startsWith('blob:')) {
    URL.revokeObjectURL(src);
  }
}

/**
 * Registers a cleanup handler for the `beforeunload` event.
 * Releases canvas pixel buffers and revokes any object URLs.
 *
 * @param getState - Accessor that returns the current references to clean up
 * @returns A cleanup function to remove the event listener
 */
export function registerUnloadCleanup(
  getState: () => PrivacyState
): () => void {
  const handler = () => {
    const state = getState();
    releaseCanvasMemory(state.croppedCanvas);
    releaseCanvasMemory(state.processedCanvas);
    releaseCanvasMemory(state.previewCanvas);
    // Revoke the object URL used by the original image (if loaded via createObjectURL)
    revokeObjectUrl(state.originalImage?.src);
  };

  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}
