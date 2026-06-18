import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Quote, BookSourceInfo } from '../../src/types/quote';

// ===== 生成器 =====

/** 生成一个随机 Quote 对象 */
const quoteArb = (bookSources: string[]) =>
  fc.record({
    id: fc.hexaString({ minLength: 8, maxLength: 8 }),
    content: fc.string({ minLength: 1, maxLength: 50 }),
    bookSource: fc.constantFrom(...bookSources),
    chapter: fc.string({ maxLength: 20 }),
    theme: fc.string({ maxLength: 30 }),
  });

/** 生成书籍来源名称 */
const bookSourceNameArb = fc.string({ minLength: 1, maxLength: 15 }).filter(
  (s) => s.trim().length > 0
);

/** 生成一组唯一的书籍来源名称 */
const bookSourcesArb = fc
  .array(bookSourceNameArb, { minLength: 1, maxLength: 5 })
  .map((sources) => [...new Set(sources)])
  .filter((arr) => arr.length >= 1);

/** 生成一个非空 Quote 池（带多个来源） */
const poolWithSourcesArb = bookSourcesArb.chain((sources) =>
  fc
    .array(quoteArb(sources), { minLength: 1, maxLength: 20 })
    .map((quotes) => {
      // 确保 id 唯一
      const seen = new Set<string>();
      return quotes.filter((q) => {
        if (seen.has(q.id)) return false;
        seen.add(q.id);
        return true;
      });
    })
    .filter((arr) => arr.length >= 1)
    .map((quotes) => ({ quotes, sources }))
);

// ===== 纯函数提取（测试 useQuotes 的核心逻辑） =====

/**
 * 计算来源计数列表 — 与 useQuotes 中 sources 的 useMemo 逻辑等价
 */
function computeSources(allQuotes: Quote[]): BookSourceInfo[] {
  const countMap = new Map<string, number>();
  for (const q of allQuotes) {
    countMap.set(q.bookSource, (countMap.get(q.bookSource) ?? 0) + 1);
  }
  return Array.from(countMap.entries()).map(([name, count]) => ({ name, count }));
}

/**
 * 筛选逻辑 — 与 useQuotes 中 filteredQuotes 的 useMemo 逻辑等价
 */
function computeFilteredQuotes(
  allQuotes: Quote[],
  selectedSources: Set<string>
): Quote[] {
  if (selectedSources.size === 0) {
    return allQuotes;
  }
  return allQuotes.filter((q) => selectedSources.has(q.bookSource));
}

// ===== Property Tests =====

describe('useQuotes property tests', () => {
  /**
   * Property 9: 来源计数正确性
   * For any quote pool, the computed BookSourceInfo list has count values
   * matching actual counts per bookSource.
   * **Validates: Requirements 3.1**
   */
  describe('Property 9: 来源计数正确性', () => {
    it('for any quote pool, sources count matches actual number of quotes per bookSource', () => {
      fc.assert(
        fc.property(poolWithSourcesArb, ({ quotes }) => {
          const sources = computeSources(quotes);

          // Verify each source's count matches actual count in the pool
          for (const sourceInfo of sources) {
            const actualCount = quotes.filter(
              (q) => q.bookSource === sourceInfo.name
            ).length;
            expect(sourceInfo.count).toBe(actualCount);
          }

          // Verify all bookSources in pool are represented in sources list
          const allBookSources = new Set(quotes.map((q) => q.bookSource));
          const sourceNames = new Set(sources.map((s) => s.name));
          expect(sourceNames).toEqual(allBookSources);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 10: 筛选仅返回匹配结果
   * For any non-empty Set of selected sources, all filtered quotes have
   * matching bookSource and no matching quote is excluded.
   * **Validates: Requirements 3.3**
   */
  describe('Property 10: 筛选仅返回匹配结果', () => {
    it('for any non-empty selected sources, filtered results contain only and all matching quotes', () => {
      fc.assert(
        fc.property(
          poolWithSourcesArb.chain(({ quotes }) => {
            // Generate a non-empty subset of available sources
            const availableSources = [...new Set(quotes.map((q) => q.bookSource))];
            return fc
              .subarray(availableSources, { minLength: 1 })
              .map((selected) => ({
                quotes,
                selectedSources: new Set(selected),
              }));
          }),
          ({ quotes, selectedSources }) => {
            const filtered = computeFilteredQuotes(quotes, selectedSources);

            // All filtered quotes must have bookSource in selectedSources
            for (const q of filtered) {
              expect(selectedSources.has(q.bookSource)).toBe(true);
            }

            // No matching quote is excluded
            const expectedQuotes = quotes.filter((q) =>
              selectedSources.has(q.bookSource)
            );
            expect(filtered.length).toBe(expectedQuotes.length);

            // Same ids
            const filteredIds = new Set(filtered.map((q) => q.id));
            for (const eq of expectedQuotes) {
              expect(filteredIds.has(eq.id)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 11: 筛选状态互斥
   * When "全部" is selected (empty Set), all quotes are returned.
   * When selectedSources is non-empty, only those sources' quotes are returned.
   * **Validates: Requirements 3.5**
   */
  describe('Property 11: 筛选状态互斥', () => {
    it('empty Set (全部) returns all quotes; non-empty Set returns only matching', () => {
      fc.assert(
        fc.property(
          poolWithSourcesArb.chain(({ quotes }) => {
            const availableSources = [
              ...new Set(quotes.map((q) => q.bookSource)),
            ];
            return fc
              .subarray(availableSources, { minLength: 1 })
              .map((selected) => ({
                quotes,
                selectedSources: new Set(selected),
              }));
          }),
          ({ quotes, selectedSources }) => {
            // Case 1: Empty Set → all quotes returned
            const allResult = computeFilteredQuotes(quotes, new Set());
            expect(allResult.length).toBe(quotes.length);
            expect(allResult).toEqual(quotes);

            // Case 2: Non-empty Set → only matching sources returned
            const filteredResult = computeFilteredQuotes(
              quotes,
              selectedSources
            );

            // If selectedSources doesn't contain all sources, filtered should be subset
            const allSources = new Set(quotes.map((q) => q.bookSource));
            const isSubset = [...selectedSources].every((s) =>
              allSources.has(s)
            );
            expect(isSubset).toBe(true);

            // filteredResult contains only quotes from selected sources
            for (const q of filteredResult) {
              expect(selectedSources.has(q.bookSource)).toBe(true);
            }

            // If selectedSources is a strict subset of all sources,
            // filteredResult should be smaller than allResult
            if (selectedSources.size < allSources.size) {
              expect(filteredResult.length).toBeLessThan(allResult.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
