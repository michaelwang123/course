import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuotes } from '../../src/hooks/useQuotes';

vi.mock('../../src/data/quotes.json', () => ({
  default: [
    { id: 'q1', content: '道可道非常道', bookSource: '道德经', chapter: '第1章', theme: '道' },
    { id: 'q2', content: '己所不欲勿施于人', bookSource: '论语', chapter: '卫灵公', theme: '仁' },
    { id: 'q3', content: '上善若水', bookSource: '道德经', chapter: '第8章', theme: '善' },
    { id: 'q4', content: '逍遥游', bookSource: '庄子', chapter: '逍遥游', theme: '自由' },
  ],
}));

const allTestQuotes = [
  { id: 'q1', content: '道可道非常道', bookSource: '道德经', chapter: '第1章', theme: '道' },
  { id: 'q2', content: '己所不欲勿施于人', bookSource: '论语', chapter: '卫灵公', theme: '仁' },
  { id: 'q3', content: '上善若水', bookSource: '道德经', chapter: '第8章', theme: '善' },
  { id: 'q4', content: '逍遥游', bookSource: '庄子', chapter: '逍遥游', theme: '自由' },
];

describe('useQuotes', () => {
  // 默认全选：selectedSources 为空 Set，返回全部 quotes
  it('returns all quotes when no filter is applied (default state)', () => {
    const { result } = renderHook(() => useQuotes());

    expect(result.current.selectedSources.size).toBe(0);
    expect(result.current.filteredQuotes).toEqual(allTestQuotes);
    expect(result.current.allQuotes).toEqual(allTestQuotes);
  });

  // sources 列表包含所有 bookSource 及其计数
  it('computes sources with correct counts', () => {
    const { result } = renderHook(() => useQuotes());

    const sources = result.current.sources;
    expect(sources).toHaveLength(3); // 道德经, 论语, 庄子

    const daodejing = sources.find((s) => s.name === '道德经');
    expect(daodejing).toBeDefined();
    expect(daodejing!.count).toBe(2);

    const lunyu = sources.find((s) => s.name === '论语');
    expect(lunyu).toBeDefined();
    expect(lunyu!.count).toBe(1);

    const zhuangzi = sources.find((s) => s.name === '庄子');
    expect(zhuangzi).toBeDefined();
    expect(zhuangzi!.count).toBe(1);
  });

  // 筛选切换：选中特定来源后只返回该来源的金句
  it('filters quotes by selected sources', () => {
    const { result } = renderHook(() => useQuotes());

    act(() => {
      result.current.setSelectedSources(new Set(['道德经']));
    });

    expect(result.current.filteredQuotes).toHaveLength(2);
    expect(result.current.filteredQuotes.every((q) => q.bookSource === '道德经')).toBe(true);
  });

  // 多选筛选
  it('supports multi-select filtering', () => {
    const { result } = renderHook(() => useQuotes());

    act(() => {
      result.current.setSelectedSources(new Set(['道德经', '庄子']));
    });

    expect(result.current.filteredQuotes).toHaveLength(3);
    expect(
      result.current.filteredQuotes.every(
        (q) => q.bookSource === '道德经' || q.bookSource === '庄子'
      )
    ).toBe(true);
  });

  // 空结果：筛选一个不存在的来源
  it('returns empty array when filtering by non-existent source', () => {
    const { result } = renderHook(() => useQuotes());

    act(() => {
      result.current.setSelectedSources(new Set(['不存在的书']));
    });

    expect(result.current.filteredQuotes).toHaveLength(0);
  });

  // Set 操作：清空 selectedSources 恢复全部
  it('restores all quotes when selectedSources is cleared', () => {
    const { result } = renderHook(() => useQuotes());

    act(() => {
      result.current.setSelectedSources(new Set(['论语']));
    });
    expect(result.current.filteredQuotes).toHaveLength(1);

    act(() => {
      result.current.setSelectedSources(new Set());
    });
    expect(result.current.filteredQuotes).toEqual(allTestQuotes);
  });

  // isLoading 初始后变为 false
  it('sets isLoading to false after initial render', () => {
    const { result } = renderHook(() => useQuotes());
    // After the useEffect runs, isLoading should be false
    expect(result.current.isLoading).toBe(false);
  });
});
