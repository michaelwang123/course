import { useState, useMemo } from 'react';
import quotesData from '../data/quotes.json';
import type { Quote, BookSourceInfo } from '../types/quote';

const allQuotes: Quote[] = quotesData as Quote[];

export interface UseQuotesReturn {
  allQuotes: Quote[];
  filteredQuotes: Quote[];
  sources: BookSourceInfo[];
  selectedSources: Set<string>;
  setSelectedSources: (sources: Set<string>) => void;
  isLoading: boolean;
}

export function useQuotes(): UseQuotesReturn {
  const [selectedSources, setSelectedSources] = useState<Set<string>>(new Set());

  // 数据为静态 JSON 同步导入，无需异步加载状态
  const isLoading = false;

  const filteredQuotes = useMemo<Quote[]>(() => {
    if (selectedSources.size === 0) {
      return allQuotes;
    }
    return allQuotes.filter((q) => selectedSources.has(q.bookSource));
  }, [selectedSources]);

  const sources = useMemo<BookSourceInfo[]>(() => {
    const countMap = new Map<string, number>();
    for (const q of allQuotes) {
      countMap.set(q.bookSource, (countMap.get(q.bookSource) ?? 0) + 1);
    }
    return Array.from(countMap.entries()).map(([name, count]) => ({ name, count }));
  }, []);

  return {
    allQuotes,
    filteredQuotes,
    sources,
    selectedSources,
    setSelectedSources,
    isLoading,
  };
}
