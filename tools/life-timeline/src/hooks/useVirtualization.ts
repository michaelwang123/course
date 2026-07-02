// src/hooks/useVirtualization.ts
// 虚拟渲染 Hook：性能分级，视口 + 缓冲区节点计算
// 优化：缓存 event→globalPosition 映射，仅在 events/range/zoomLevel 变化时重算
// offset 变化时只做简单减法，不重算所有日期→位置

import { useMemo } from 'react';
import type { EventNode } from '@/types/event';
import type { ViewportState, ZoomLevel, TimelineRange, PerformanceTier } from '@/types/timeline';
import { getPerformanceTier, detectStacking } from '@/lib/virtual-renderer';
import type { VisibleNode } from '@/lib/virtual-renderer';
import { calculateTotalWidth } from '@/lib/position-calculator';
import { parseLocalDate } from '@/lib/date-utils';
import { isFutureEvent } from '@/lib/timeline-range';

const DEFAULT_BUFFER_COUNT = 20;

export interface UseVirtualizationReturn {
  visibleNodes: VisibleNode[];
  totalCount: number;
  performanceTier: PerformanceTier;
}

/**
 * 计算事件在时间轴上的全局位置（不含 offset 偏移）
 * 这个映射仅依赖 events + range + zoomLevel，不随滚动变化
 */
function computeGlobalPositions(
  events: EventNode[],
  range: TimelineRange,
  zoomLevel: ZoomLevel
): Map<string, number> {
  const totalWidth = calculateTotalWidth(range, zoomLevel);
  const startMs = range.start.getTime();
  const endMs = range.end.getTime();
  const rangeMs = endMs - startMs;

  const positions = new Map<string, number>();

  if (rangeMs <= 0) {
    for (const event of events) {
      positions.set(event.id, 0);
    }
    return positions;
  }

  for (const event of events) {
    const date = parseLocalDate(event.eventDate);
    const dateMs = date.getTime();
    const ratio = (dateMs - startMs) / rangeMs;
    const globalPosition = ratio * totalWidth;
    positions.set(event.id, globalPosition);
  }

  return positions;
}

/**
 * 虚拟渲染 Hook
 * 性能分级：
 * - ≤200 events (high tier): 全量渲染，target 60fps
 * - 200-500 events (medium tier): 全量渲染，target 30fps
 * - 500+ events (low tier): 仅渲染视口内及前后各 bufferCount 节点，target 30fps
 *
 * 优化策略：
 * - globalPositions 仅在 events/range/zoomLevel 变化时重新计算（O(n) 但不频繁）
 * - offset 变化时仅做 globalPosition - offset 的简单减法（O(n) 但极轻量）
 * - low tier 下通过预排序的 globalPositions 做二分查找，仅实例化可见子集的 VisibleNode
 */
export function useVirtualization(
  events: EventNode[],
  viewport: ViewportState,
  range: TimelineRange,
  zoomLevel: ZoomLevel,
  bufferCount: number = DEFAULT_BUFFER_COUNT
): UseVirtualizationReturn {
  const performanceTier = useMemo(
    () => getPerformanceTier(events.length),
    [events.length]
  );

  // Cache global positions: only recomputed when events/range/zoomLevel change
  // NOT when offset changes (which happens every frame during drag)
  const globalPositions = useMemo(
    () => computeGlobalPositions(events, range, zoomLevel),
    [events, range, zoomLevel]
  );

  // Pre-compute stacking groups (also stable across offset changes)
  const stacking = useMemo(
    () => detectStacking(events, zoomLevel),
    [events, zoomLevel]
  );

  // Sorted events by global position for efficient viewport filtering in low tier
  const sortedByPosition = useMemo(() => {
    return events
      .map(event => ({ event, globalPos: globalPositions.get(event.id) ?? 0 }))
      .sort((a, b) => a.globalPos - b.globalPos);
  }, [events, globalPositions]);

  // Compute visible nodes — only the offset subtraction + filtering runs per frame
  const visibleNodes = useMemo((): VisibleNode[] => {
    if (events.length === 0) return [];

    const { offset, width } = viewport;

    if (performanceTier === 'low') {
      // Binary search for viewport boundaries in sorted list
      const viewportStart = offset;
      const viewportEnd = offset + width;

      // Find first visible index (leftmost with globalPos >= viewportStart - buffer margin)
      let firstIdx = -1;
      let lastIdx = -1;

      for (let i = 0; i < sortedByPosition.length; i++) {
        const pos = sortedByPosition[i].globalPos;
        if (pos >= viewportStart && pos <= viewportEnd) {
          if (firstIdx === -1) firstIdx = i;
          lastIdx = i;
        }
      }

      if (firstIdx === -1) {
        // No events in viewport — find closest and include buffer around it
        const center = offset + width / 2;
        let closestIdx = 0;
        let closestDist = Math.abs(sortedByPosition[0].globalPos - center);
        for (let i = 1; i < sortedByPosition.length; i++) {
          const dist = Math.abs(sortedByPosition[i].globalPos - center);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        }
        firstIdx = closestIdx;
        lastIdx = closestIdx;
      }

      // Expand by bufferCount
      const startIdx = Math.max(0, firstIdx - bufferCount);
      const endIdx = Math.min(sortedByPosition.length - 1, lastIdx + bufferCount);

      const result: VisibleNode[] = [];
      for (let i = startIdx; i <= endIdx; i++) {
        const { event, globalPos } = sortedByPosition[i];
        const position = globalPos - offset;
        const group = stacking.get(event.eventDate) || [event];
        const stackCount = group.length;
        const stackIndex = group.findIndex(e => e.id === event.id);

        result.push({
          event,
          position,
          isStacked: stackCount > 1,
          stackIndex: stackIndex >= 0 ? stackIndex : 0,
          stackCount,
          isFuture: isFutureEvent(event.eventDate),
        });
      }
      return result;
    }

    // High/medium tier: render all events (just subtract offset from cached global positions)
    return events.map(event => {
      const globalPos = globalPositions.get(event.id) ?? 0;
      const position = globalPos - offset;
      const group = stacking.get(event.eventDate) || [event];
      const stackCount = group.length;
      const stackIndex = group.findIndex(e => e.id === event.id);

      return {
        event,
        position,
        isStacked: stackCount > 1,
        stackIndex: stackIndex >= 0 ? stackIndex : 0,
        stackCount,
        isFuture: isFutureEvent(event.eventDate),
      };
    });
  }, [events, viewport, performanceTier, globalPositions, stacking, sortedByPosition]);

  return {
    visibleNodes,
    totalCount: events.length,
    performanceTier,
  };
}
