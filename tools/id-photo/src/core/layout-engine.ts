// src/core/layout-engine.ts
// A4 排版计算引擎 - 计算照片在A4纸上的排列方式并生成排版Canvas

export interface PhotoSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  widthPx: number;
  heightPx: number;
}

export interface LayoutConfig {
  /** A4 纸张宽度 (mm) */
  paperWidth: number;
  /** A4 纸张高度 (mm) */
  paperHeight: number;
  /** 输出 DPI */
  dpi: number;
  /** 照片之间的间距 (mm) */
  gap: number;
}

export interface LayoutResult {
  /** 排版后的 Canvas */
  canvas: HTMLCanvasElement;
  /** 每排列数 */
  columns: number;
  /** 排列行数 */
  rows: number;
  /** 排列总数 */
  totalPhotos: number;
}

/** 默认排版配置：A4纸, 300 DPI, 2mm间距 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  paperWidth: 210,
  paperHeight: 297,
  dpi: 300,
  gap: 2,
};

/**
 * 硬编码的批量排版布局映射表
 * 每种标准尺寸在A4纸上的排列方式
 */
export const BATCH_LAYOUT_MAP: Record<string, { columns: number; rows: number }> = {
  '1-inch': { columns: 3, rows: 3 },       // 9张
  '2-inch': { columns: 2, rows: 3 },       // 6张
  'small-1-inch': { columns: 3, rows: 3 }, // 9张
  'large-1-inch': { columns: 2, rows: 3 }, // 6张
  'small-2-inch': { columns: 2, rows: 3 }, // 6张
};

/**
 * 将毫米转换为像素（基于DPI）
 */
function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

/**
 * 合并用户配置与默认配置
 */
function resolveConfig(config?: Partial<LayoutConfig>): LayoutConfig {
  return {
    ...DEFAULT_LAYOUT_CONFIG,
    ...config,
  } as LayoutConfig;
}

/**
 * 计算指定尺寸照片在 A4 纸上的排列方式
 *
 * 优先使用 BATCH_LAYOUT_MAP 中的硬编码值（确保一寸3×3=9, 二寸2×3=6等）。
 * 如果照片尺寸不在映射表中，则动态计算最大排列数。
 */
export function calculateLayout(
  photoSize: PhotoSize,
  config?: Partial<LayoutConfig>,
): { columns: number; rows: number; totalPhotos: number } {
  const resolvedConfig = resolveConfig(config);

  // 优先使用硬编码的布局映射
  const predefinedLayout = BATCH_LAYOUT_MAP[photoSize.id];
  if (predefinedLayout) {
    return {
      columns: predefinedLayout.columns,
      rows: predefinedLayout.rows,
      totalPhotos: predefinedLayout.columns * predefinedLayout.rows,
    };
  }

  // 动态计算：如果尺寸不在映射表中
  const paperWidthPx = mmToPx(resolvedConfig.paperWidth, resolvedConfig.dpi);
  const paperHeightPx = mmToPx(resolvedConfig.paperHeight, resolvedConfig.dpi);
  const gapPx = mmToPx(resolvedConfig.gap, resolvedConfig.dpi);

  const photoWidthPx = photoSize.widthPx;
  const photoHeightPx = photoSize.heightPx;

  // columns = floor((availableWidth + gapPx) / (photoWidthPx + gapPx))
  const columns = Math.floor((paperWidthPx + gapPx) / (photoWidthPx + gapPx));
  // rows = floor((availableHeight + gapPx) / (photoHeightPx + gapPx))
  const rows = Math.floor((paperHeightPx + gapPx) / (photoHeightPx + gapPx));

  return {
    columns: Math.max(1, columns),
    rows: Math.max(1, rows),
    totalPhotos: Math.max(1, columns) * Math.max(1, rows),
  };
}

/**
 * 生成批量排版 Canvas
 *
 * 创建A4尺寸的Canvas（2480×3508 px @ 300 DPI），
 * 将照片按计算的网格排列绘制，并居中在纸面上。
 */
export function generateBatchLayout(
  photoCanvas: HTMLCanvasElement,
  photoSize: PhotoSize,
  config?: Partial<LayoutConfig>,
): LayoutResult {
  const resolvedConfig = resolveConfig(config);

  // A4 纸面像素尺寸
  const paperWidthPx = mmToPx(resolvedConfig.paperWidth, resolvedConfig.dpi);
  const paperHeightPx = mmToPx(resolvedConfig.paperHeight, resolvedConfig.dpi);
  const gapPx = mmToPx(resolvedConfig.gap, resolvedConfig.dpi);

  // 计算排列
  const { columns, rows, totalPhotos } = calculateLayout(photoSize, config);

  // 照片像素尺寸
  const photoWidthPx = photoSize.widthPx;
  const photoHeightPx = photoSize.heightPx;

  // 计算网格总尺寸（包括间距）
  const gridWidth = columns * photoWidthPx + (columns - 1) * gapPx;
  const gridHeight = rows * photoHeightPx + (rows - 1) * gapPx;

  // 居中偏移量
  const offsetX = Math.floor((paperWidthPx - gridWidth) / 2);
  const offsetY = Math.floor((paperHeightPx - gridHeight) / 2);

  // 创建A4 Canvas
  const canvas = document.createElement('canvas');
  canvas.width = paperWidthPx;
  canvas.height = paperHeightPx;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas 2d context');
  }

  // 填充白色背景
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, paperWidthPx, paperHeightPx);

  // 按网格绘制照片
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const x = offsetX + col * (photoWidthPx + gapPx);
      const y = offsetY + row * (photoHeightPx + gapPx);
      ctx.drawImage(photoCanvas, x, y, photoWidthPx, photoHeightPx);
    }
  }

  return {
    canvas,
    columns,
    rows,
    totalPhotos,
  };
}
