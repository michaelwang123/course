// src/lib/event-filter.ts
// 事件搜索与筛选（纯函数）

import type { EventNode, EventCategory, EventSentiment } from '@/types/event';

export interface FilterCriteria {
  keyword: string;                      // 搜索关键词（匹配 title 或 description）
  categories: EventCategory[];          // 选中的分类列表（空数组表示不过滤）
  sentiments: EventSentiment[];         // 选中的情感列表（空数组表示不过滤）
}

export interface FilterResult {
  filteredEvents: EventNode[];          // 过滤后的事件列表
  totalCount: number;                   // 总事件数
  matchedCount: number;                 // 匹配事件数
}

/**
 * 根据筛选条件过滤事件列表
 * - keyword: 大小写不敏感，匹配 title 或 description
 * - categories: 多选，事件分类在选中列表中（空数组表示全选）
 * - sentiments: 多选，情感色彩在选中列表中（空数组表示全选）
 * 多个条件之间为 AND 关系
 *
 * 返回的 filteredEvents 保持原有排序
 */
export function filterEvents(
  events: EventNode[],
  criteria: FilterCriteria
): FilterResult {
  const totalCount = events.length;

  // 如果筛选条件为空，直接返回全部事件
  if (isFilterEmpty(criteria)) {
    return {
      filteredEvents: events,
      totalCount,
      matchedCount: totalCount,
    };
  }

  const filteredEvents = events.filter((event) => {
    // AND 逻辑：所有条件都必须满足
    return (
      matchesKeyword(event, criteria.keyword) &&
      matchesCategories(event, criteria.categories) &&
      matchesSentiments(event, criteria.sentiments)
    );
  });

  return {
    filteredEvents,
    totalCount,
    matchedCount: filteredEvents.length,
  };
}

/**
 * 检查单个事件是否匹配关键词
 * 大小写不敏感匹配 title 或 description
 * 空关键词表示不过滤（全部匹配）
 */
export function matchesKeyword(event: EventNode, keyword: string): boolean {
  // 空关键词表示不按关键词过滤
  if (keyword.trim() === '') {
    return true;
  }

  const lowerKeyword = keyword.toLowerCase();
  const lowerTitle = event.title.toLowerCase();
  const lowerDescription = event.description.toLowerCase();

  return lowerTitle.includes(lowerKeyword) || lowerDescription.includes(lowerKeyword);
}

/**
 * 检查单个事件是否匹配分类筛选
 * 空数组表示全部匹配
 */
export function matchesCategories(event: EventNode, categories: EventCategory[]): boolean {
  // 空数组表示不按分类过滤
  if (categories.length === 0) {
    return true;
  }

  return categories.includes(event.category);
}

/**
 * 检查单个事件是否匹配情感色彩筛选
 * 空数组表示全部匹配
 */
export function matchesSentiments(event: EventNode, sentiments: EventSentiment[]): boolean {
  // 空数组表示不按情感色彩过滤
  if (sentiments.length === 0) {
    return true;
  }

  return sentiments.includes(event.sentiment);
}

/**
 * 判断筛选条件是否为空（未应用任何筛选）
 * true when keyword is empty string AND categories is empty AND sentiments is empty
 */
export function isFilterEmpty(criteria: FilterCriteria): boolean {
  return (
    criteria.keyword.trim() === '' &&
    criteria.categories.length === 0 &&
    criteria.sentiments.length === 0
  );
}
