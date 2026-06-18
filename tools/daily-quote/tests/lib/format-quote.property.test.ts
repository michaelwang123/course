import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { formatQuoteForCopy } from '../../src/lib/format-quote';
import type { Quote } from '../../src/types/quote';

// Feature: daily-quote, Property 12: 复制文本格式

describe('formatQuoteForCopy - Property Tests', () => {
  /**
   * Property 12: 复制文本格式
   * For any Quote (bookSource always non-empty), formatQuoteForCopy SHALL equal
   * `【{content}】—— 《{bookSource}》`
   *
   * **Validates: Requirements 4.2**
   */
  it('Property 12: formatted copy text matches expected pattern', () => {
    const quoteArb: fc.Arbitrary<Quote> = fc.record({
      id: fc.hexaString({ minLength: 8, maxLength: 8 }),
      content: fc.string({ minLength: 1 }),
      bookSource: fc.string({ minLength: 1 }),
      chapter: fc.string(),
      theme: fc.string(),
    });

    fc.assert(
      fc.property(quoteArb, (quote) => {
        const result = formatQuoteForCopy(quote);
        const expected = `【${quote.content}】—— 《${quote.bookSource}》`;
        expect(result).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});
