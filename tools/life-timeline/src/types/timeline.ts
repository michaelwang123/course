// src/types/timeline.ts
// Timeline state and viewport type definitions

export type ZoomLevel = 'year' | 'month' | 'day';

export interface TimelineRange {
  start: Date;   // 时间轴起始日期
                 // 无事件：今天 - 5年
                 // 单事件：eventDate - 1年
                 // 多事件：最早事件日期
  end: Date;     // 时间轴结束日期
                 // 无事件：今天 + 5年
                 // 单事件：eventDate + 1年
                 // 多事件：max(当前本地日期, 最晚事件日期)
}

export interface ViewportState {
  width: number;    // 视口宽度（px）
  height: number;   // 视口高度（px）
  offset: number;   // 当前滚动偏移量（px）
}

/** 性能目标分级 */
export type PerformanceTier = 'high' | 'medium' | 'low';
// high: ≤200 events, 全量渲染, target 60fps
// medium: 200-500 events, 全量渲染, target 30fps
// low: 500+ events, 虚拟渲染（视口+前后各50节点）, target 30fps

/** 数据查询超时（毫秒） */
export const QUERY_TIMEOUT_MS = 5000;
