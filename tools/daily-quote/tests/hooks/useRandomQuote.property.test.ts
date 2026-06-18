import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { renderHook, act } from '@testing-library/react';
import { useRandomQuote } from '../../src/hooks/useRandomQuote';
import type { Quote } from '../../src/types/quote';

// ===== 生成器 =====

/** 生成一个随机 Quote 对象 */
const quoteArb: fc.Arbitrary<Quote> = fc.record({
  id: fc.hexaString({ minLength: 8, maxLength: 8 }),
  content: fc.string({ minLength: 1, maxLength: 50 }),
  bookSource: fc.string({ minLength: 1, maxLength: 20 }),
  chapter: fc.string({ maxLength: 20 }),
  theme: fc.string({ maxLength: 30 }),
});

/** 生成一个非空 Quote 数组（至少 1 个，且 id 唯一） */
const nonEmptyPoolArb: fc.Arbitrary<Quote[]> = fc
  .array(quoteArb, { minLength: 1, maxLength: 10 })
  .map((quotes) => {
    const seen = new Set<string>();
    return quotes.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  })
  .filter((arr) => arr.length >= 1);

/** 生成包含至少 2 个 Quote 的数组（id 唯一） */
const poolWith2PlusArb: fc.Arbitrary<Quote[]> = fc
  .array(quoteArb, { minLength: 2, maxLength: 10 })
  .map((quotes) => {
    const seen = new Set<string>();
    return quotes.filter((q) => {
      if (seen.has(q.id)) return false;
      seen.add(q.id);
      return true;
    });
  })
  .filter((arr) => arr.length >= 2);

// ===== Property Tests =====

describe('useRandomQuote property tests', () => {
  /**
   * Property 7: 随机选取池成员性
   * For any non-empty quote pool, the randomly selected quote SHALL always be
   * a member of that pool (its id exists in the pool).
   * **Validates: Requirements 2.1**
   */
  describe('Property 7: 随机选取池成员性', () => {
    it('for any non-empty pool, currentQuote is always a member of the pool', () => {
      fc.assert(
        fc.property(nonEmptyPoolArb, (pool: Quote[]) => {
          const { result, unmount } = renderHook(() => useRandomQuote(pool));

          const { currentQuote } = result.current;
          expect(currentQuote).not.toBeNull();
          const ids = pool.map((q) => q.id);
          expect(ids).toContain(currentQuote!.id);

          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: 换一句不重复
   * For any quote pool containing 2 or more quotes and any current quote from
   * that pool, calling nextQuote() returns a quote with a different id than
   * the current quote.
   * **Validates: Requirements 2.3**
   */
  describe('Property 8: 换一句不重复', () => {
    it('for any pool with 2+ quotes, calling nextQuote returns a different quote', () => {
      fc.assert(
        fc.property(poolWith2PlusArb, (pool: Quote[]) => {
          const { result, unmount } = renderHook(() => useRandomQuote(pool));

          const beforeId = result.current.currentQuote!.id;

          act(() => {
            result.current.nextQuote();
          });

          const afterId = result.current.currentQuote!.id;
          expect(afterId).not.toBe(beforeId);

          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });
});
