// src/lib/virtual-renderer.ts
// 虚拟渲染计算（纯函数）

import type { EventNode } from '@/types/event';
import type { ViewportState, ZoomLevel, TimelineRange, PerformanceTier } from '@/types/timeline';
import { dateToPosition } from './position-calculator';
import { isFutureEvent } from './timeline-range';
import { parseLocalDate } from './date-utils';

export interface VisibleNode {
  event: EventNode;
  position: number;   // x 坐标
  isStacked: boolean; // 是否堆叠
  stackIndex: number; // 堆叠索引
  stackCount: number; // 同位置总数
  isFuture: boolean;  // 是否为未来事件（date > 本地今天）
}

/**
 * 根据事件数量确定性能分级
 * - ≤200 → 'high' (全量渲染, target 60fps)
 * - 200-500 → 'medium' (全量渲染, target 30fps)
 * - >500 → 'low' (虚拟渲染, target 30fps)
 */
export function getPerformanceTier(eventCount: number): PerformanceTier {
  if (eventCount <= 200) {
    return 'high';
  }
  if (eventCount <= 500) {
    return 'medium';
  }
  return 'low';
}

/**
 * 检测同日期事件的堆叠关系
 * 同日期事件按 createdAt 倒序排列（最新创建在前）
 */
export function detectStacking(
  events: EventNode[],
  _zoomLevel: ZoomLevel
): Map<string, EventNode[]> {
  const groups = new Map<string, EventNode[]>();

  for (const event of events) {
    const key = event.eventDate;
    const group = groups.get(key);
    if (group) {
      group.push(event);
    } else {
      groups.set(key, [event]);
    }
  }

  // Sort each group by createdAt DESC (most recent first)
  for (const [key, group] of groups) {
    if (group.length > 1) {
      group.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      groups.set(key, group);
    }
  }

  return groups;
}

/**
 * 判断节点是否在可见区域内（含缓冲区）
 */
export function isNodeVisible(
  nodePosition: number,
  viewportStart: number,
  viewportEnd: number,
  buffer: number
): boolean {
  return nodePosition >= viewportStart - buffer && nodePosition <= viewportEnd + buffer;
}

/**
 * 计算当前视口内应渲染的事件节点
 * 包含前后各 bufferCount 个节点的缓冲区
 *
 * 性能分级策略：
 * - ≤200 events (high): 全量渲染（target 60fps）
 * - 200-500 events (medium): 全量渲染（target 30fps）
 * - 500+ events (low): 仅渲染视口内及前后各 bufferCount 个节点（target 30fps）
 */
export function getVisibleNodes(
  events: EventNode[],
  viewport: ViewportState,
  range: TimelineRange,
  zoomLevel: ZoomLevel,
  bufferCount: number
): VisibleNode[] {
  if (events.length === 0) {
    return [];
  }

  const tier = getPerformanceTier(events.length);
  const stacking = detectStacking(events, zoomLevel);

  // Calculate position for each event
  const nodesWithPositions: Array<{ event: EventNode; position: number }> = events.map((event) => {
    const date = parseLocalDate(event.eventDate);
    const position = dateToPosition(date, range, viewport.width, zoomLevel, viewport.offset);
    return { event, position };
  });

  // For 'low' tier, calculate the buffer in pixels based on bufferCount positions
  // We use a pixel buffer derived from the average spacing or a fixed pixel buffer
  let filteredNodes = nodesWithPositions;

  if (tier === 'low') {
    // Sort by position to find viewport-relative nodes
    const sorted = [...nodesWithPositions].sort((a, b) => a.position - b.position);

    // Find nodes within viewport
    const viewportStart = 0;
    const viewportEnd = viewport.width;

    // Find the index range of visible nodes
    let firstVisibleIdx = -1;
    let lastVisibleIdx = -1;

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].position >= viewportStart && sorted[i].position <= viewportEnd) {
        if (firstVisibleIdx === -1) {
          firstVisibleIdx = i;
        }
        lastVisibleIdx = i;
      }
    }

    if (firstVisibleIdx === -1) {
      // No nodes in viewport - find closest nodes and include buffer around them
      // Find the closest node to viewport center
      const center = viewport.width / 2;
      let closestIdx = 0;
      let closestDist = Math.abs(sorted[0].position - center);

      for (let i = 1; i < sorted.length; i++) {
        const dist = Math.abs(sorted[i].position - center);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }

      firstVisibleIdx = closestIdx;
      lastVisibleIdx = closestIdx;
    }

    // Expand by bufferCount on each side
    const startIdx = Math.max(0, firstVisibleIdx - bufferCount);
    const endIdx = Math.min(sorted.length - 1, lastVisibleIdx + bufferCount);

    filteredNodes = sorted.slice(startIdx, endIdx + 1);
  }

  // Build visible nodes with stacking info
  const result: VisibleNode[] = filteredNodes.map(({ event, position }) => {
    const group = stacking.get(event.eventDate) || [event];
    const stackCount = group.length;
    const stackIndex = group.findIndex((e) => e.id === event.id);
    const isStacked = stackCount > 1;

    return {
      event,
      position,
      isStacked,
      stackIndex: stackIndex >= 0 ? stackIndex : 0,
      stackCount,
      isFuture: isFutureEvent(event.eventDate),
    };
  });

  return result;
}
