// src/hooks/useSearchFilter.ts
// 组合搜索+筛选 Hook：将 useSearch 的防抖逻辑与 useFilter 的过滤逻辑合并
// 消除 TimelinePage 中手动 useEffect 同步的需要

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { EventNode, EventCategory, EventSentiment } from '@/types/event';
import { filterEvents, type FilterCriteria } from '@/lib/event-filter';

export interface UseSearchFilterReturn {
  /** 用户实时输入的搜索关键词（用于绑定 input value） */
  keyword: string;
  /** 当前筛选条件（防抖后的 keyword + categories + sentiments） */
  criteria: FilterCriteria;
  /** 经过筛选后的事件列表 */
  filteredEvents: EventNode[];
  /** 匹配事件数量 */
  matchedCount: number;
  /** 总事件数量 */
  totalCount: number;
  /** 是否有任何筛选条件生效 */
  isFiltering: boolean;
  /** 设置搜索关键词（实时更新 input，防抖后触发筛选） */
  setKeyword: (value: string) => void;
  /** 设置分类筛选（多选） */
  setCategories: (categories: EventCategory[]) => void;
  /** 设置情感筛选（多选） */
  setSentiments: (sentiments: EventSentiment[]) => void;
  /** 清除所有筛选条件（搜索 + 分类 + 情感） */
  clearAll: () => void;
}

/**
 * 组合搜索与筛选 Hook
 *
 * 将 useSearch 的 300ms 防抖 + useFilter 的事件过滤合并为单一 hook。
 * 搜索关键词变化后 300ms 自动触发过滤，无需外部 useEffect 桥接。
 *
 * @param events - 原始事件列表
 * @param debounceMs - 搜索防抖延迟（默认 300ms）
 */
export function useSearchFilter(
  events: EventNode[],
  debounceMs: number = 300
): UseSearchFilterReturn {
  // Search keyword state
  const [keyword, setKeywordState] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // Filter state
  const [categories, setCategoriesState] = useState<EventCategory[]>([]);
  const [sentiments, setSentimentsState] = useState<EventSentiment[]>([]);

  // Debounce keyword changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [keyword, debounceMs]);

  // Build filter criteria from debounced keyword + category/sentiment selections
  const criteria: FilterCriteria = useMemo(() => ({
    keyword: debouncedKeyword,
    categories,
    sentiments,
  }), [debouncedKeyword, categories, sentiments]);

  // Compute filtered events
  const filterResult = useMemo(() => {
    return filterEvents(events, criteria);
  }, [events, criteria]);

  // Determine if any filter is active
  const isFiltering = useMemo(() => {
    return debouncedKeyword.trim() !== '' || categories.length > 0 || sentiments.length > 0;
  }, [debouncedKeyword, categories, sentiments]);

  // Setters
  const setKeyword = useCallback((value: string) => {
    setKeywordState(value);
  }, []);

  const setCategories = useCallback((value: EventCategory[]) => {
    setCategoriesState(value);
  }, []);

  const setSentiments = useCallback((value: EventSentiment[]) => {
    setSentimentsState(value);
  }, []);

  const clearAll = useCallback(() => {
    setKeywordState('');
    setDebouncedKeyword('');
    setCategoriesState([]);
    setSentimentsState([]);
  }, []);

  return {
    keyword,
    criteria,
    filteredEvents: filterResult.filteredEvents,
    matchedCount: filterResult.matchedCount,
    totalCount: filterResult.totalCount,
    isFiltering,
    setKeyword,
    setCategories,
    setSentiments,
    clearAll,
  };
}
