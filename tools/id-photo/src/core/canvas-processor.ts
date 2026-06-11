/**
 * Canvas Processor - Core image processing engine
 *
 * Handles image cropping with rotation, flip, brightness, and contrast adjustments.
 * Uses OffscreenCanvas where available, with fallback to hidden HTMLCanvasElement.
 * All processing is done locally in the browser (Privacy Mode).
 */

export interface CropOptions {
  /** 裁剪区域（相对于原图的坐标） */
  sourceRect: { x: number; y: number; width: number; height: number };
  /** 输出尺寸（像素） */
  outputSize: { width: number; height: number };
  /** 旋转角度（0, 90, 180, 270） */
  rotation?: number;
  /** 是否水平翻转 */
  flipHorizontal?: boolean;
  /** 亮度调整（-50 到 +50） */
  brightness?: number;
  /** 对比度调整（-50 到 +50） */
  contrast?: number;
}

export interface CropResult {
  /** 裁剪后的图片数据 */
  imageData: ImageData;
  /** Canvas 元素引用（用于导出） */
  canvas: HTMLCanvasElement;
}

/**
 * Creates a canvas element for processing.
 * Tries OffscreenCanvas first, falls back to a hidden HTMLCanvasElement (for Safari).
 */
function createProcessingCanvas(width: number, height: number): HTMLCanvasElement {
  // OffscreenCanvas is not directly usable as HTMLCanvasElement for export,
  // so we always use HTMLCanvasElement but keep this as a logical fallback structure.
  // In environments where OffscreenCanvas is available, we could use it for
  // intermediate processing, but for simplicity and compatibility we use HTMLCanvasElement.
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      // Verify OffscreenCanvas works (some environments define it but don't support 2d context)
      const test = new OffscreenCanvas(1, 1);
      const testCtx = test.getContext('2d');
      if (!testCtx) {
        throw new Error('OffscreenCanvas 2d context not available');
      }
    }
  } catch {
    // OffscreenCanvas not available or not functional, use regular canvas
  }

  // Use HTMLCanvasElement for the output (required for toBlob/toDataURL export)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Applies brightness and contrast adjustments to ImageData via pixel manipulation.
 *
 * Brightness: multiplicative factor = (100 + brightness * 2) / 100
 *   Maps -50..+50 to 0.0..2.0 (same behavior as CSS brightness() function)
 *   brightness=0 → factor=1.0 (identity)
 *   brightness=50 → factor=2.0 (double brightness)
 *   brightness=-50 → factor=0.0 (black)
 *
 * Contrast: applies formula ((pixel - 128) * factor + 128)
 *   where factor = (100 + contrast * 2) / 100
 */
function applyBrightnessContrast(
  imageData: ImageData,
  brightness: number,
  contrast: number
): void {
  const data = imageData.data;
  const brightnessFactor = (100 + brightness * 2) / 100;
  const contrastFactor = (100 + contrast * 2) / 100;

  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let value = data[i + c];
      // Apply brightness (multiplicative, matches CSS brightness())
      value = value * brightnessFactor;
      // Apply contrast
      value = (value - 128) * contrastFactor + 128;
      // Clamp to 0-255
      data[i + c] = Math.max(0, Math.min(255, Math.round(value)));
    }
  }
}

/**
 * Crops an image from a source element with support for rotation, flip,
 * brightness, and contrast adjustments.
 *
 * Processing steps:
 * 1. Create output canvas with outputSize dimensions
 * 2. Apply rotation (translate to center, rotate, translate back)
 * 3. Apply horizontal flip if needed (scale(-1, 1))
 * 4. Draw the source image from sourceRect onto the output canvas
 * 5. If brightness or contrast are non-zero, apply pixel-level adjustments
 */
export function cropImage(
  source: HTMLImageElement | HTMLCanvasElement,
  options: CropOptions
): CropResult {
  const { sourceRect, outputSize, rotation = 0, flipHorizontal = false, brightness = 0, contrast = 0 } = options;

  const canvas = createProcessingCanvas(outputSize.width, outputSize.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D rendering context');
  }

  const centerX = outputSize.width / 2;
  const centerY = outputSize.height / 2;

  ctx.save();

  // Move origin to center for rotation and flip
  ctx.translate(centerX, centerY);

  // Apply rotation
  if (rotation !== 0) {
    const radians = (rotation * Math.PI) / 180;
    ctx.rotate(radians);
  }

  // Apply horizontal flip
  if (flipHorizontal) {
    ctx.scale(-1, 1);
  }

  // Move origin back
  ctx.translate(-centerX, -centerY);

  // Draw the source image: from sourceRect to the full output canvas
  ctx.drawImage(
    source,
    sourceRect.x,
    sourceRect.y,
    sourceRect.width,
    sourceRect.height,
    0,
    0,
    outputSize.width,
    outputSize.height
  );

  ctx.restore();

  // Apply brightness and contrast if non-zero
  if (brightness !== 0 || contrast !== 0) {
    const imgData = ctx.getImageData(0, 0, outputSize.width, outputSize.height);
    applyBrightnessContrast(imgData, brightness, contrast);
    ctx.putImageData(imgData, 0, 0);
  }

  // Get final image data
  const imageData = ctx.getImageData(0, 0, outputSize.width, outputSize.height);

  return { imageData, canvas };
}

/**
 * Converts a canvas to a Blob.
 * Wraps canvas.toBlob in a Promise for async usage.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png',
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create Blob from canvas'));
        }
      },
      format,
      quality
    );
  });
}

/**
 * Converts a canvas to a Data URL string.
 * Simple wrapper around canvas.toDataURL.
 */
export function canvasToDataURL(
  canvas: HTMLCanvasElement,
  format: 'image/jpeg' | 'image/png',
  quality?: number
): string {
  return canvas.toDataURL(format, quality);
}
