// tests/hooks/useSearch.test.ts
// useSearch Hook 单元测试 - 防抖行为、清除搜索
// Validates: Requirements 8.2, 8.3, 8.4, 8.5

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';

describe('useSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should have initial state with empty keyword and debouncedKeyword', () => {
    const { result } = renderHook(() => useSearch());

    expect(result.current.keyword).toBe('');
    expect(result.current.debouncedKeyword).toBe('');
  });

  it('should update keyword immediately when setKeyword is called', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setKeyword('hello');
    });

    expect(result.current.keyword).toBe('hello');
    // debouncedKeyword should NOT update yet
    expect(result.current.debouncedKeyword).toBe('');
  });

  it('should update debouncedKeyword after 300ms delay', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setKeyword('test');
    });

    expect(result.current.debouncedKeyword).toBe('');

    // Advance time by 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.debouncedKeyword).toBe('test');
  });

  it('should not update debouncedKeyword before 300ms', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setKeyword('partial');
    });

    // Advance time by 299ms (not enough)
    act(() => {
      vi.advanceTimersByTime(299);
    });

    expect(result.current.debouncedKeyword).toBe('');

    // Advance the remaining 1ms
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(result.current.debouncedKeyword).toBe('partial');
  });

  it('should only propagate the last value after debounce with multiple rapid changes', () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setKeyword('a');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.setKeyword('ab');
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.setKeyword('abc');
    });

    // debouncedKeyword should still be empty
    expect(result.current.debouncedKeyword).toBe('');
    expect(result.current.keyword).toBe('abc');

    // Advance 300ms from the last change
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.debouncedKeyword).toBe('abc');
  });

  it('should reset both keyword and debouncedKeyword immediately when clearSearch is called', () => {
    const { result } = renderHook(() => useSearch());

    // Set and wait for debounce
    act(() => {
      result.current.setKeyword('search term');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.keyword).toBe('search term');
    expect(result.current.debouncedKeyword).toBe('search term');

    // Clear search
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.keyword).toBe('');
    expect(result.current.debouncedKeyword).toBe('');
  });

  it('should support custom debounce delay', () => {
    const { result } = renderHook(() => useSearch(500));

    act(() => {
      result.current.setKeyword('custom');
    });

    // 300ms should NOT be enough for 500ms debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.debouncedKeyword).toBe('');

    // 200ms more (total 500ms) should trigger the update
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.debouncedKeyword).toBe('custom');
  });
});
