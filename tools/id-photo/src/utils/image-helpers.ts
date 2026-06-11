/**
 * Image helper utilities for loading, naming, and scaling images.
 */

/**
 * Load a File as an HTMLImageElement.
 * Uses URL.createObjectURL for better memory efficiency (avoids base64 encoding overhead).
 * The object URL is NOT revoked here because the img.src still references it.
 * Caller is responsible for revoking via URL.revokeObjectURL(img.src) when done.
 */
export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片加载失败，文件可能已损坏'));
    };

    img.src = url;
  });
}

/**
 * Generate export filename with size specification.
 * Example: "证件照_一寸_25x35mm.jpg"
 */
export function generateExportFilename(
  sizeName: string,
  widthMm: number,
  heightMm: number,
  format: 'jpeg' | 'png'
): string {
  const extension = format === 'jpeg' ? 'jpg' : 'png';
  return `证件照_${sizeName}_${widthMm}x${heightMm}mm.${extension}`;
}

/**
 * Scale an image for preview, keeping the max edge <= maxEdge pixels.
 * Returns a canvas with the scaled image drawn on it.
 * If both dimensions are already <= maxEdge, returns a canvas copy at original size.
 */
export function scaleImageForPreview(
  source: HTMLImageElement | HTMLCanvasElement,
  maxEdge: number = 1200
): HTMLCanvasElement {
  const sourceWidth = source.width;
  const sourceHeight = source.height;

  let targetWidth: number;
  let targetHeight: number;

  if (sourceWidth <= maxEdge && sourceHeight <= maxEdge) {
    // Both dimensions fit; create a canvas copy at original size
    targetWidth = sourceWidth;
    targetHeight = sourceHeight;
  } else {
    // Scale down so the larger edge equals maxEdge
    const scale = maxEdge / Math.max(sourceWidth, sourceHeight);
    targetWidth = Math.round(sourceWidth * scale);
    targetHeight = Math.round(sourceHeight * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('图片处理失败，无法创建 Canvas 上下文');
  }

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  return canvas;
}
