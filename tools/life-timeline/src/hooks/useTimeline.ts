// src/hooks/useTimeline.ts
// 时间轴状态聚合 Hook：组合拖拽、缩放、虚拟渲染，提供统一的时间轴状态接口
// 优化：暴露 adjustOffset 支持键盘导航滚动

import { useMemo, useCallback, useState, useRef } from 'react';
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

/**
 * 时间轴状态聚合 Hook
 * 组合 useDrag, useZoom, useVirtualization，提供统一的时间轴状态和操作接口
 *
 * @param events - 事件列表（已过滤后）
 * @param containerWidth - 容器宽度（px）
 */
export function useTimeline(
  events: EventNode[],
  containerWidth: number
): UseTimelineReturn {
  // Programmatic offset override (set by scrollToDate / adjustOffset)
  const [programmaticOffset, setProgrammaticOffset] = useState<number | null>(null);
  const programmaticOffsetRef = useRef<number | null>(null);

  // 计算时间轴范围
  const timelineRange: TimelineRange = useMemo(
    () => calculateTimelineRange(events),
    [events]
  );

  // 缩放 Hook
  const { zoomLevel, setZoomLevel } = useZoom();

  // 计算时间轴总宽度
  const totalWidth = useMemo(
    () => calculateTotalWidth(timelineRange, zoomLevel),
    [timelineRange, zoomLevel]
  );

  // 偏移量变更回调（拖拽时清除程序化偏移）
  const handleOffsetChange = useCallback(() => {
    if (programmaticOffsetRef.current !== null) {
      programmaticOffsetRef.current = null;
      setProgrammaticOffset(null);
    }
  }, []);

  // 拖拽 Hook
  const { isDragging, offset: dragOffset, handlers: dragHandlers } = useDrag(
    totalWidth,
    containerWidth,
    handleOffsetChange
  );

  // 实际使用的偏移量：优先使用程序化偏移，否则使用拖拽偏移
  const offset = programmaticOffset !== null ? programmaticOffset : dragOffset;

  // 构建视口状态用于虚拟渲染
  const viewport = useMemo(
    () => ({
      width: containerWidth,
      height: 0,
      offset,
    }),
    [containerWidth, offset]
  );

  // 虚拟渲染 Hook
  const { visibleNodes, performanceTier } = useVirtualization(
    events,
    viewport,
    timelineRange,
    zoomLevel
  );

  // 计算可见日期范围和刻度标记
  const scaleMarks: ScaleMark[] = useMemo(() => {
    if (containerWidth <= 0) {
      return [];
    }

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

  // 滚动到指定日期（将该日期居中于视口）
  const scrollToDate = useCallback(
    (dateStr: string) => {
      const targetDate = new Date(dateStr);
      if (isNaN(targetDate.getTime())) {
        return;
      }

      const targetOffset = calculateScrollOffset(
        targetDate,
        timelineRange,
        containerWidth,
        zoomLevel
      );

      const clamped = clampOffset(targetOffset, totalWidth, containerWidth);
      programmaticOffsetRef.current = clamped;
      setProgrammaticOffset(clamped);
    },
    [timelineRange, containerWidth, zoomLevel, totalWidth]
  );

  // 调整偏移量（用于键盘导航：ArrowLeft/Right 移动 10% 视口宽度）
  const adjustOffset = useCallback(
    (delta: number) => {
      const currentOffset = programmaticOffsetRef.current ?? dragOffset;
      const newOffset = currentOffset + delta;
      const clamped = clampOffset(newOffset, totalWidth, containerWidth);
      programmaticOffsetRef.current = clamped;
      setProgrammaticOffset(clamped);
    },
    [dragOffset, totalWidth, containerWidth]
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
