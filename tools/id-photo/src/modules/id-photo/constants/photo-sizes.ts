import type { PhotoSize } from '../../../core/layout-engine';
// Re-export BATCH_LAYOUT_MAP from layout-engine to avoid duplication
export { BATCH_LAYOUT_MAP } from '../../../core/layout-engine';

export const STANDARD_SIZES: PhotoSize[] = [
  { id: '1-inch', name: '一寸', widthMm: 25, heightMm: 35, widthPx: 295, heightPx: 413 },
  { id: '2-inch', name: '二寸', widthMm: 35, heightMm: 49, widthPx: 413, heightPx: 579 },
  { id: 'small-1-inch', name: '小一寸', widthMm: 22, heightMm: 32, widthPx: 260, heightPx: 378 },
  { id: 'large-1-inch', name: '大一寸', widthMm: 33, heightMm: 48, widthPx: 390, heightPx: 567 },
  { id: 'small-2-inch', name: '小二寸', widthMm: 35, heightMm: 45, widthPx: 413, heightPx: 531 },
];
