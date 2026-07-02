// src/hooks/useSearch.ts
// 搜索关键词管理 Hook（300ms 防抖）

import { useState, useEffect, useCallback } from 'react';

export interface UseSearchReturn {
  keyword: string;
  debouncedKeyword: string;
  setKeyword: (value: string) => void;
  clearSearch: () => void;
}

/**
 * 搜索关键词 Hook
 * - keyword: 用户实时输入的原始值
 * - debouncedKeyword: 300ms 防抖后的值，用于触发实际搜索
 * - setKeyword: 更新关键词
 * - clearSearch: 清除关键词（同时重置 keyword 和 debouncedKeyword）
 */
export function useSearch(debounceMs: number = 300): UseSearchReturn {
  const [keyword, setKeywordState] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');

  // 防抖：keyword 变化后，延迟 debounceMs 毫秒更新 debouncedKeyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
    };
  }, [keyword, debounceMs]);

  const setKeyword = useCallback((value: string) => {
    setKeywordState(value);
  }, []);

  const clearSearch = useCallback(() => {
    setKeywordState('');
    setDebouncedKeyword('');
  }, []);

  return {
    keyword,
    debouncedKeyword,
    setKeyword,
    clearSearch,
  };
}
