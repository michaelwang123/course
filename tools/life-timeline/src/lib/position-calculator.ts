// src/lib/position-calculator.ts
// 日期→位置映射计算（纯函数）

import type { ZoomLevel, TimelineRange, ViewportState } from '@/types/timeline';

export interface ScaleMark {
  position: number;  // x 坐标（视口内像素位置）
  label: string;     // 显示文本（如 "2020" 或 "3月"）
  type: 'major' | 'minor';  // 主刻度/次刻度
}

/**
 * 计算时间轴的总宽度（像素）
 * 根据缩放级别和时间范围确定：
 * - year: ~100px per year
 * - month: ~80px per month
 * - day: ~40px per day
 */
export function calculateTotalWidth(
  range: TimelineRange,
  zoomLevel: ZoomLevel
): number {
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  const diffMs = endMs - startMs;

  if (diffMs <= 0) {
    return 0;
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffDays = diffMs / MS_PER_DAY;

  switch (zoomLevel) {
    case 'year': {
      // ~100px per year, 1 year ≈ 365.25 days
      const years = diffDays / 365.25;
      return Math.max(1, Math.round(years * 100));
    }
    case 'month': {
      // ~80px per month, 1 month ≈ 30.44 days
      const months = diffDays / 30.44;
      return Math.max(1, Math.round(months * 80));
    }
    case 'day': {
      // ~40px per day
      return Math.max(1, Math.round(diffDays * 40));
    }
  }
}

/**
 * 将日期映射到时间轴上的 x 坐标（像素，相对于视口）
 * 线性插值：date 在 [range.start, range.end] 中的位置 → totalWidth 中的像素位置，再减去 offset
 * 所有日期计算使用浏览器本地时区
 */
export function dateToPosition(
  date: Date,
  range: TimelineRange,
  _viewportWidth: number,
  zoomLevel: ZoomLevel,
  offset: number
): number {
  const totalWidth = calculateTotalWidth(range, zoomLevel);
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  const rangeMs = endMs - startMs;

  if (rangeMs <= 0) {
    return 0;
  }

  const dateMs = date.getTime();
  const ratio = (dateMs - startMs) / rangeMs;
  const globalPosition = ratio * totalWidth;

  return globalPosition - offset;
}

/**
 * 将 x 坐标映射回日期（dateToPosition 的逆运算）
 * 所有日期计算使用浏览器本地时区
 */
export function positionToDate(
  x: number,
  range: TimelineRange,
  _viewportWidth: number,
  zoomLevel: ZoomLevel,
  offset: number
): Date {
  const totalWidth = calculateTotalWidth(range, zoomLevel);
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  const rangeMs = endMs - startMs;

  if (totalWidth <= 0 || rangeMs <= 0) {
    return new Date(startMs);
  }

  const globalPosition = x + offset;
  const ratio = globalPosition / totalWidth;
  const dateMs = startMs + ratio * rangeMs;

  return new Date(dateMs);
}

/**
 * 计算当前视口可见的日期范围
 */
export function getVisibleDateRange(
  viewport: ViewportState,
  range: TimelineRange,
  zoomLevel: ZoomLevel
): { start: Date; end: Date } {
  const visibleStart = positionToDate(0, range, viewport.width, zoomLevel, viewport.offset);
  const visibleEnd = positionToDate(viewport.width, range, viewport.width, zoomLevel, viewport.offset);

  return {
    start: visibleStart,
    end: visibleEnd,
  };
}

/**
 * 计算给定日期应滚动到的偏移量（用于自动定位）
 * 将目标日期居中于视口
 */
export function calculateScrollOffset(
  targetDate: Date,
  range: TimelineRange,
  viewportWidth: number,
  zoomLevel: ZoomLevel
): number {
  const totalWidth = calculateTotalWidth(range, zoomLevel);
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  const rangeMs = endMs - startMs;

  if (rangeMs <= 0) {
    return 0;
  }

  const dateMs = targetDate.getTime();
  const ratio = (dateMs - startMs) / rangeMs;
  const globalPosition = ratio * totalWidth;

  // 居中：将目标日期放在视口中央
  const offset = globalPosition - viewportWidth / 2;

  // 限制在有效范围内
  return clampOffset(offset, totalWidth, viewportWidth);
}

/**
 * 生成刻度标记位置列表
 * 根据缩放级别在可见范围内生成：
 * - year zoom: 每年一个主刻度
 * - month zoom: 每月一个次刻度，每年一月为主刻度
 * - day zoom: 每天一个次刻度，每月1号为主刻度
 */
export function generateScaleMarks(
  visibleRange: { start: Date; end: Date },
  zoomLevel: ZoomLevel,
  range: TimelineRange,
  viewportWidth: number,
  offset: number
): ScaleMark[] {
  const marks: ScaleMark[] = [];

  switch (zoomLevel) {
    case 'year': {
      const startYear = visibleRange.start.getFullYear();
      const endYear = visibleRange.end.getFullYear();

      for (let year = startYear; year <= endYear; year++) {
        const date = new Date(year, 0, 1); // January 1st
        const position = dateToPosition(date, range, viewportWidth, zoomLevel, offset);
        marks.push({
          position,
          label: String(year),
          type: 'major',
        });
      }
      break;
    }
    case 'month': {
      const startYear = visibleRange.start.getFullYear();
      const startMonth = visibleRange.start.getMonth();
      const endYear = visibleRange.end.getFullYear();
      const endMonth = visibleRange.end.getMonth();

      let year = startYear;
      let month = startMonth;

      while (year < endYear || (year === endYear && month <= endMonth)) {
        const date = new Date(year, month, 1);
        const position = dateToPosition(date, range, viewportWidth, zoomLevel, offset);
        const isJanuary = month === 0;

        marks.push({
          position,
          label: isJanuary ? String(year) : `${month + 1}月`,
          type: isJanuary ? 'major' : 'minor',
        });

        month++;
        if (month > 11) {
          month = 0;
          year++;
        }
      }
      break;
    }
    case 'day': {
      const startTime = visibleRange.start.getTime();
      const endTime = visibleRange.end.getTime();
      const MS_PER_DAY = 1000 * 60 * 60 * 24;

      // Start from the beginning of the start date
      const current = new Date(
        visibleRange.start.getFullYear(),
        visibleRange.start.getMonth(),
        visibleRange.start.getDate()
      );

      while (current.getTime() <= endTime) {
        const position = dateToPosition(current, range, viewportWidth, zoomLevel, offset);
        const isFirstOfMonth = current.getDate() === 1;

        marks.push({
          position,
          label: isFirstOfMonth
            ? `${current.getMonth() + 1}月`
            : String(current.getDate()),
          type: isFirstOfMonth ? 'major' : 'minor',
        });

        // Advance to next day
        current.setDate(current.getDate() + 1);

        // Safety: prevent infinite loop if range is huge
        if (current.getTime() - startTime > MS_PER_DAY * 366) {
          break;
        }
      }
      break;
    }
  }

  return marks;
}

/**
 * 限制拖拽偏移量在有效范围内
 * offset ∈ [0, max(0, totalWidth - viewportWidth)]
 */
export function clampOffset(
  offset: number,
  totalWidth: number,
  viewportWidth: number
): number {
  const maxOffset = Math.max(0, totalWidth - viewportWidth);
  return Math.min(Math.max(0, offset), maxOffset);
}
