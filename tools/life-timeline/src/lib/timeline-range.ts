// src/lib/timeline-range.ts
// 时间轴范围计算（纯函数）

import type { EventNode } from '@/types/event';
import type { TimelineRange } from '@/types/timeline';
import { getLocalToday, parseLocalDate, addYears } from './date-utils';

/**
 * 根据事件列表计算时间轴范围
 * 规则：
 * - 无事件：默认范围（今天 ±5 年）
 * - 仅 1 个事件：以该事件日期为中心 ±1 年
 * - 多个事件：[最早事件日期, max(当前本地日期, 最晚事件日期)]
 *
 * 所有日期判断使用浏览器本地时区
 */
export function calculateTimelineRange(events: EventNode[]): TimelineRange {
  const today = getLocalToday();

  if (events.length === 0) {
    // 无事件：今天 ±5 年
    return {
      start: parseLocalDate(addYears(today, -5)),
      end: parseLocalDate(addYears(today, 5)),
    };
  }

  if (events.length === 1) {
    // 仅 1 个事件：以该事件日期为中心 ±1 年
    const eventDate = events[0].eventDate;
    return {
      start: parseLocalDate(addYears(eventDate, -1)),
      end: parseLocalDate(addYears(eventDate, 1)),
    };
  }

  // 多个事件：[最早事件日期 - 1年, max(当前本地日期, 最晚事件日期) + 1年]
  const sortedDates = events
    .map((e) => e.eventDate)
    .sort();

  const earliest = sortedDates[0];
  const latest = sortedDates[sortedDates.length - 1];

  const latestDate = parseLocalDate(latest);
  const todayDate = parseLocalDate(today);

  const endDate = latestDate.getTime() >= todayDate.getTime() ? latestDate : todayDate;

  return {
    start: parseLocalDate(addYears(earliest, -1)),
    end: new Date(endDate.getTime() + 365.25 * 24 * 60 * 60 * 1000), // +1 year
  };
}

/**
 * 判断事件是否为未来事件（eventDate > 当前本地日期）
 * 使用浏览器本地时区进行日期比较
 */
export function isFutureEvent(eventDate: string): boolean {
  const today = getLocalToday();
  const eventDateObj = parseLocalDate(eventDate);
  const todayObj = parseLocalDate(today);
  return eventDateObj.getTime() > todayObj.getTime();
}

/**
 * 同日期事件排序：按 createdAt 倒序（最新创建在前）
 */
export function sortSameDateEvents(events: EventNode[]): EventNode[] {
  return [...events].sort((a, b) => {
    // 按 createdAt 倒序（最新创建在前）
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
