/**
 * Color Engine - 颜色距离计算与背景替换
 *
 * 基于 RGB 空间欧几里得距离的背景检测与替换引擎。
 * 所有处理在浏览器本地完成，不涉及任何网络传输。
 */

export interface RGB {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

export interface RGBA extends RGB {
  a: number; // 0-255
}

export interface BackgroundReplaceOptions {
  /** 目标替换颜色 */
  targetColor: RGB;
  /** 颜色容差（0-100），默认 30 */
  tolerance: number;
  /** 边缘羽化像素数，默认 1 */
  featherRadius?: number;
}

export interface BackgroundReplaceResult {
  /** 处理后的图片数据 */
  imageData: ImageData;
  /** 处理后的 Canvas */
  canvas: HTMLCanvasElement;
  /** 被替换的像素数量 */
  replacedPixelCount: number;
  /** 替换像素占总像素的百分比 */
  replacedPercentage: number;
}

/** RGB 颜色距离最大值: sqrt(255² + 255² + 255²) ≈ 441.67 */
const MAX_COLOR_DISTANCE = Math.sqrt(255 * 255 * 3);

/** RGB 颜色距离平方最大值: 255² × 3 = 195075 (exported for testing) */
export const MAX_COLOR_DISTANCE_SQ = 255 * 255 * 3;

/**
 * 计算两个颜色之间的欧几里得距离（RGB空间）
 * 距离范围: 0 ~ 441.67 (sqrt(255² × 3))
 */
export function colorDistance(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * 计算两个颜色之间的欧几里得距离的平方（避免 sqrt 开销）
 * 用于热循环中的距离比较，比 colorDistance 快约 30%
 * 距离范围: 0 ~ 195075 (255² × 3)
 */
export function colorDistanceSq(c1: RGB, c2: RGB): number {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return dr * dr + dg * dg + db * db;
}

/**
 * 从图片边缘采样推测背景颜色
 * 策略：采样四角各 5×5 像素区域（共 100 像素），取出现频率最高的颜色组
 *
 * 算法：
 * 1. 采集四角 5×5 = 25 像素/角，共 100 像素
 * 2. 将颜色聚类：距离 < 10 的归为同一组
 * 3. 返回最大组的平均颜色
 */
export function detectBackgroundColor(imageData: ImageData): RGB {
  const { data, width, height } = imageData;
  const samples: RGB[] = [];

  // Helper to get pixel color at (x, y)
  const getPixel = (x: number, y: number): RGB => {
    const idx = (y * width + x) * 4;
    return { r: data[idx], g: data[idx + 1], b: data[idx + 2] };
  };

  // Sample 4 corner regions, each 5×5 pixels
  const corners = [
    { startX: 0, startY: 0 },                           // Top-left
    { startX: width - 5, startY: 0 },                   // Top-right
    { startX: 0, startY: height - 5 },                  // Bottom-left
    { startX: width - 5, startY: height - 5 },          // Bottom-right
  ];

  for (const corner of corners) {
    for (let dy = 0; dy < 5; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        const x = Math.max(0, Math.min(width - 1, corner.startX + dx));
        const y = Math.max(0, Math.min(height - 1, corner.startY + dy));
        samples.push(getPixel(x, y));
      }
    }
  }

  // Cluster colors: group samples where distance < 10
  const groups: { colors: RGB[]; center: RGB }[] = [];

  for (const sample of samples) {
    let foundGroup = false;
    for (const group of groups) {
      if (colorDistance(sample, group.center) < 10) {
        group.colors.push(sample);
        // Update center as running average
        const n = group.colors.length;
        group.center = {
          r: Math.round(group.colors.reduce((sum, c) => sum + c.r, 0) / n),
          g: Math.round(group.colors.reduce((sum, c) => sum + c.g, 0) / n),
          b: Math.round(group.colors.reduce((sum, c) => sum + c.b, 0) / n),
        };
        foundGroup = true;
        break;
      }
    }
    if (!foundGroup) {
      groups.push({ colors: [sample], center: { ...sample } });
    }
  }

  // Find the largest group and return its center
  let largestGroup = groups[0];
  for (const group of groups) {
    if (group.colors.length > largestGroup.colors.length) {
      largestGroup = group;
    }
  }

  return largestGroup.center;
}

/**
 * 替换图片背景颜色
 *
 * 算法：
 * 1. 检测背景颜色 (detectBackgroundColor)
 * 2. 计算距离阈值: threshold = (tolerance / 100) * 441.67
 * 3. 遍历所有像素，计算与背景色的距离（使用平方距离避免 sqrt 开销）
 * 4. distSq < thresholdSq: 完全替换为目标颜色
 * 5. thresholdSq <= distSq < featherThresholdSq: alpha 混合（羽化）
 * 6. distSq >= featherThresholdSq: 保持不变
 */
export function replaceBackground(
  imageData: ImageData,
  options: BackgroundReplaceOptions
): BackgroundReplaceResult {
  const { targetColor, tolerance, featherRadius = 1 } = options;
  const threshold = (tolerance / 100) * MAX_COLOR_DISTANCE;
  const thresholdSq = threshold * threshold;
  const featherRange = featherRadius * 10;
  const featherThreshold = threshold + featherRange;
  const featherThresholdSq = featherThreshold * featherThreshold;

  // Detect background color from the image
  const bgColor = detectBackgroundColor(imageData);

  // Clone imageData so we don't mutate the original
  const width = imageData.width;
  const height = imageData.height;
  const newData = new Uint8ClampedArray(imageData.data);
  const totalPixels = width * height;
  let replacedPixelCount = 0;

  // Cache background color components for inner loop performance
  const bgR = bgColor.r;
  const bgG = bgColor.g;
  const bgB = bgColor.b;
  const tR = targetColor.r;
  const tG = targetColor.g;
  const tB = targetColor.b;

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const pr = newData[idx];
    const pg = newData[idx + 1];
    const pb = newData[idx + 2];

    const dr = pr - bgR;
    const dg = pg - bgG;
    const db = pb - bgB;
    const distSq = dr * dr + dg * dg + db * db;

    if (distSq < thresholdSq) {
      // Full replacement
      newData[idx] = tR;
      newData[idx + 1] = tG;
      newData[idx + 2] = tB;
      replacedPixelCount++;
    } else if (distSq < featherThresholdSq) {
      // Feather zone: alpha blend between target and original
      // Need actual distance for smooth blending
      const dist = Math.sqrt(distSq);
      const blendFactor = 1 - (dist - threshold) / featherRange;
      newData[idx] = Math.round(tR * blendFactor + pr * (1 - blendFactor));
      newData[idx + 1] = Math.round(tG * blendFactor + pg * (1 - blendFactor));
      newData[idx + 2] = Math.round(tB * blendFactor + pb * (1 - blendFactor));
      replacedPixelCount++;
    }
    // else: keep original pixel unchanged
  }

  // Create result ImageData
  const resultImageData = new ImageData(newData, width, height);

  // Create a new canvas with the result
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.putImageData(resultImageData, 0, 0);
  }

  return {
    imageData: resultImageData,
    canvas,
    replacedPixelCount,
    replacedPercentage: (replacedPixelCount / totalPixels) * 100,
  };
}
