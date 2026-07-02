// src/hooks/useTimeline.ts
// 时间轴状态聚合 Hook：组合拖拽、缩放、虚拟渲染

import { useMemo, useCallback, useRef } from 'react';
import type { EventNode } from '@/types/event';
import type { ZoomLevel, TimelineRange, PerformanceTier } from '@/types/timeline';
import type { VisibleNode } from '@/lib/virtual-renderer';
import type { ScaleMark } from '@/lib/position-calculator';
import { calculateTimelineRange } from '@/lib/timeline-range';
import {
  calculateTotalWidth,
  generateScaleMarks,
  getVisibleDateRange,
  calculateScrollOffset,
  clampOffset,
} from '@/lib/position-calculator';
import { useDrag } from './useDrag';
import { useZoom } from './useZoom';
import { useVirtualization } from './useVirtualization';

export interface UseTimelineReturn {
  offset: number;
  zoomLevel: ZoomLevel;
  totalWidth: number;
  visibleNodes: VisibleNode[];
  scaleMarks: ScaleMark[];
  timelineRange: TimelineRange;
  isDragging: boolean;
  performanceTier: PerformanceTier;
  scrollToDate: (dateStr: string) => void;
  adjustOffset: (delta: number) => void;
  setZoomLevel: (level: ZoomLevel) => void;
  dragHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function useTimeline(
  events: EventNode[],
  containerWidth: number
): UseTimelineReturn {
  // 计算时间轴范围
  const timelineRange: TimelineRange = useMemo(
    () => calculateTimelineRange(events),
    [events]
  );

  // 缩放
  const { zoomLevel, setZoomLevel } = useZoom();

  // 计算时间轴总宽度 (ensure at least 2x viewport for scroll room)
  const totalWidth = useMemo(
    () => Math.max(calculateTotalWidth(timelineRange, zoomLevel), containerWidth * 2),
    [timelineRange, zoomLevel, containerWidth]
  );

  // 拖拽 — single source of truth for offset
  const { isDragging, offset, setOffset, handlers: dragHandlers } = useDrag(
    totalWidth,
    containerWidth
  );

  // Ref to track current offset for scrollToDate/adjustOffset
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  // 构建视口状态用于虚拟渲染
  const viewport = useMemo(
    () => ({
      width: containerWidth,
      height: 0,
      offset,
    }),
    [containerWidth, offset]
  );

  // 虚拟渲染
  const { visibleNodes, performanceTier } = useVirtualization(
    events,
    viewport,
    timelineRange,
    zoomLevel
  );

  // 计算可见日期范围和刻度标记
  const scaleMarks: ScaleMark[] = useMemo(() => {
    if (containerWidth <= 0) return [];

    const visibleRange = getVisibleDateRange(
      { width: containerWidth, height: 0, offset },
      timelineRange,
      zoomLevel
    );

    return generateScaleMarks(
      visibleRange,
      zoomLevel,
      timelineRange,
      containerWidth,
      offset
    );
  }, [containerWidth, offset, timelineRange, zoomLevel]);

  // 滚动到指定日期
  const scrollToDate = useCallback(
    (dateStr: string) => {
      const targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) return;

      const targetOffset = calculateScrollOffset(
        targetDate,
        timelineRange,
        containerWidth,
        zoomLevel
      );

      const clamped = clampOffset(targetOffset, totalWidth, containerWidth);
      setOffset(clamped);
    },
    [timelineRange, containerWidth, zoomLevel, totalWidth, setOffset]
  );

  // 调整偏移量（键盘导航）
  const adjustOffset = useCallback(
    (delta: number) => {
      const newOffset = offsetRef.current + delta;
      const clamped = clampOffset(newOffset, totalWidth, containerWidth);
      setOffset(clamped);
    },
    [totalWidth, containerWidth, setOffset]
  );

  return {
    offset,
    zoomLevel,
    totalWidth,
    visibleNodes,
    scaleMarks,
    timelineRange,
    isDragging,
    performanceTier,
    scrollToDate,
    adjustOffset,
    setZoomLevel,
    dragHandlers,
  };
}
