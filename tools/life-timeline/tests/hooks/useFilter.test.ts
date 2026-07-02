// tests/hooks/useFilter.test.ts
// useFilter Hook 单元测试 - 组合筛选、清除筛选
// Validates: Requirements 8.2, 8.3, 8.4, 8.5

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilter } from '@/hooks/useFilter';
import type { EventNode } from '@/types/event';

// Mock event data with different categories, sentiments, and titles
const mockEvents: EventNode[] = [
  {
    id: '1',
    userId: 'user-1',
    title: '大学毕业',
    description: '四年大学生活结束',
    eventDate: '2020-06-30',
    category: 'education',
    sentiment: 'positive',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user-1',
    title: '入职新公司',
    description: '开始第一份工作',
    eventDate: '2020-09-01',
    category: 'work',
    sentiment: 'positive',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: '3',
    userId: 'user-1',
    title: '生病住院',
    description: '身体不适需要治疗',
    eventDate: '2021-03-15',
    category: 'health',
    sentiment: 'negative',
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '4',
    userId: 'user-1',
    title: '日本旅行',
    description: '和朋友一起去东京旅游',
    eventDate: '2022-05-10',
    category: 'travel',
    sentiment: 'positive',
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
  {
    id: '5',
    userId: 'user-1',
    title: '搬新家',
    description: '搬到新的公寓生活',
    eventDate: '2023-01-20',
    category: 'life',
    sentiment: 'neutral',
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z',
  },
];

describe('useFilter', () => {
  it('should return all events when no filtering is active', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    expect(result.current.filteredEvents).toEqual(mockEvents);
    expect(result.current.matchedCount).toBe(5);
    expect(result.current.totalCount).toBe(5);
    expect(result.current.isFiltering).toBe(false);
  });

  it('should filter events by categories', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    act(() => {
      result.current.setCategories(['education']);
    });

    expect(result.current.filteredEvents).toHaveLength(1);
    expect(result.current.filteredEvents[0].title).toBe('大学毕业');
    expect(result.current.isFiltering).toBe(true);
  });

  it('should filter events by multiple categories', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    act(() => {
      result.current.setCategories(['education', 'work']);
    });

    expect(result.current.filteredEvents).toHaveLength(2);
    expect(result.current.filteredEvents.map(e => e.category)).toEqual(['education', 'work']);
  });

  it('should filter events by sentiments', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    act(() => {
      result.current.setSentiments(['negative']);
    });

    expect(result.current.filteredEvents).toHaveLength(1);
    expect(result.current.filteredEvents[0].title).toBe('生病住院');
    expect(result.current.isFiltering).toBe(true);
  });

  it('should filter events by keyword (case-insensitive, matches title)', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    act(() => {
      result.current.setKeyword('毕业');
    });

    expect(result.current.filteredEvents).toHaveLength(1);
    expect(result.current.filteredEvents[0].title).toBe('大学毕业');
    expect(result.current.isFiltering).toBe(true);
  });

  it('should filter events by keyword matching description', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    act(() => {
      result.current.setKeyword('东京');
    });

    expect(result.current.filteredEvents).toHaveLength(1);
    expect(result.current.filteredEvents[0].title).toBe('日本旅行');
  });

  it('should apply combined filters with AND logic (category + sentiment + keyword)', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    // Set category to positive events only
    act(() => {
      result.current.setSentiments(['positive']);
    });

    // Should have 3 positive events
    expect(result.current.filteredEvents).toHaveLength(3);

    // Add category filter
    act(() => {
      result.current.setCategories(['work']);
    });

    // Should be narrowed to 1 (work + positive)
    expect(result.current.filteredEvents).toHaveLength(1);
    expect(result.current.filteredEvents[0].title).toBe('入职新公司');

    // Add keyword filter
    act(() => {
      result.current.setKeyword('第一');
    });

    // Should still match (title/description contains "第一")
    expect(result.current.filteredEvents).toHaveLength(1);
    expect(result.current.filteredEvents[0].title).toBe('入职新公司');
  });

  it('should return no results when combined filters exclude all events', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    act(() => {
      result.current.setCategories(['education']);
      result.current.setSentiments(['negative']);
    });

    // No education event with negative sentiment
    expect(result.current.filteredEvents).toHaveLength(0);
    expect(result.current.matchedCount).toBe(0);
  });

  it('should reset all criteria and show all events when clearAll is called', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    // Apply filters
    act(() => {
      result.current.setCategories(['education']);
      result.current.setSentiments(['positive']);
      result.current.setKeyword('毕业');
    });

    expect(result.current.isFiltering).toBe(true);

    // Clear all
    act(() => {
      result.current.clearAll();
    });

    expect(result.current.filteredEvents).toEqual(mockEvents);
    expect(result.current.matchedCount).toBe(5);
    expect(result.current.totalCount).toBe(5);
    expect(result.current.isFiltering).toBe(false);
  });

  it('should have correct matchedCount and totalCount', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    expect(result.current.totalCount).toBe(5);
    expect(result.current.matchedCount).toBe(5);

    act(() => {
      result.current.setCategories(['travel', 'life']);
    });

    expect(result.current.totalCount).toBe(5);
    expect(result.current.matchedCount).toBe(2);
  });

  it('should set isFiltering to false when no criteria is active', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    expect(result.current.isFiltering).toBe(false);

    act(() => {
      result.current.setKeyword('test');
    });
    expect(result.current.isFiltering).toBe(true);

    act(() => {
      result.current.setKeyword('');
    });
    expect(result.current.isFiltering).toBe(false);
  });

  it('should set isFiltering to true when any criteria is active', () => {
    const { result } = renderHook(() => useFilter(mockEvents));

    act(() => {
      result.current.setCategories(['education']);
    });
    expect(result.current.isFiltering).toBe(true);

    act(() => {
      result.current.setCategories([]);
    });
    expect(result.current.isFiltering).toBe(false);

    act(() => {
      result.current.setSentiments(['positive']);
    });
    expect(result.current.isFiltering).toBe(true);
  });

  it('should return empty filteredEvents for an empty events array', () => {
    const { result } = renderHook(() => useFilter([]));

    expect(result.current.filteredEvents).toEqual([]);
    expect(result.current.matchedCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.isFiltering).toBe(false);
  });

  it('should return empty filteredEvents when filtering an empty array with criteria', () => {
    const { result } = renderHook(() => useFilter([]));

    act(() => {
      result.current.setKeyword('test');
      result.current.setCategories(['education']);
    });

    expect(result.current.filteredEvents).toEqual([]);
    expect(result.current.matchedCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
  });
});
