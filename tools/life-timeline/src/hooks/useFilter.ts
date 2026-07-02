// src/hooks/useFilter.ts
// 事件筛选管理 Hook（分类/情感多选 + 关键词搜索）

import { useState, useMemo, useCallback } from 'react';
import type { EventNode, EventCategory, EventSentiment } from '@/types/event';
import { filterEvents, type FilterCriteria } from '@/lib/event-filter';

export interface UseFilterReturn {
  criteria: FilterCriteria;
  filteredEvents: EventNode[];
  matchedCount: number;
  totalCount: number;
  isFiltering: boolean;
  setCategories: (categories: EventCategory[]) => void;
  setSentiments: (sentiments: EventSentiment[]) => void;
  setKeyword: (keyword: string) => void;
  clearAll: () => void;
}

/**
 * 事件筛选 Hook
 * - criteria: 当前筛选条件（keyword, categories, sentiments）
 * - filteredEvents: 经过筛选后的事件列表
 * - matchedCount: 匹配事件数量
 * - totalCount: 总事件数量
 * - isFiltering: 是否有任何筛选条件生效
 * - setCategories: 设置分类筛选（多选）
 * - setSentiments: 设置情感筛选（多选）
 * - setKeyword: 设置搜索关键词
 * - clearAll: 清除所有筛选条件
 */
export function useFilter(events: EventNode[]): UseFilterReturn {
  const [keyword, setKeywordState] = useState('');
  const [categories, setCategoriesState] = useState<EventCategory[]>([]);
  const [sentiments, setSentimentsState] = useState<EventSentiment[]>([]);

  const criteria: FilterCriteria = useMemo(() => ({
    keyword,
    categories,
    sentiments,
  }), [keyword, categories, sentiments]);

  // 使用 useMemo 缓存过滤结果，仅当 events 或 criteria 变化时重新计算
  const filterResult = useMemo(() => {
    return filterEvents(events, criteria);
  }, [events, criteria]);

  const isFiltering = useMemo(() => {
    return keyword.trim() !== '' || categories.length > 0 || sentiments.length > 0;
  }, [keyword, categories, sentiments]);

  const setCategories = useCallback((value: EventCategory[]) => {
    setCategoriesState(value);
  }, []);

  const setSentiments = useCallback((value: EventSentiment[]) => {
    setSentimentsState(value);
  }, []);

  const setKeyword = useCallback((value: string) => {
    setKeywordState(value);
  }, []);

  const clearAll = useCallback(() => {
    setKeywordState('');
    setCategoriesState([]);
    setSentimentsState([]);
  }, []);

  return {
    criteria,
    filteredEvents: filterResult.filteredEvents,
    matchedCount: filterResult.matchedCount,
    totalCount: filterResult.totalCount,
    isFiltering,
    setCategories,
    setSentiments,
    setKeyword,
    clearAll,
  };
}
