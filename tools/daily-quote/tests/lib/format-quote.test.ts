import { describe, it, expect } from 'vitest';
import { formatQuoteForCopy } from '../../src/lib/format-quote';
import type { Quote } from '../../src/types/quote';

describe('formatQuoteForCopy', () => {
  it('格式化包含中文引号的金句', () => {
    const quote: Quote = {
      id: 'abc12345',
      content: '子曰："学而不思则罔，思而不学则殆"',
      bookSource: '论语',
      chapter: '为政篇',
      theme: '学习方法',
    };

    expect(formatQuoteForCopy(quote)).toBe(
      '【子曰："学而不思则罔，思而不学则殆"】—— 《论语》'
    );
  });

  it('格式化包含书名号的金句', () => {
    const quote: Quote = {
      id: 'def67890',
      content: '《道德经》有云：上善若水',
      bookSource: '道德经',
      chapter: '第八章',
      theme: '品德修养',
    };

    expect(formatQuoteForCopy(quote)).toBe(
      '【《道德经》有云：上善若水】—— 《道德经》'
    );
  });

  it('格式化包含英文引号和特殊标点的金句', () => {
    const quote: Quote = {
      id: 'ghi11111',
      content: "Life is what happens when you're busy making other plans",
      bookSource: '人类简史',
      chapter: '',
      theme: '',
    };

    expect(formatQuoteForCopy(quote)).toBe(
      "【Life is what happens when you're busy making other plans】—— 《人类简史》"
    );
  });

  it('chapter 为空时不影响输出格式', () => {
    const quote: Quote = {
      id: 'jkl22222',
      content: '知行合一',
      bookSource: '传习录',
      chapter: '',
      theme: '心学核心',
    };

    expect(formatQuoteForCopy(quote)).toBe('【知行合一】—— 《传习录》');
  });

  it('theme 为空时不影响输出格式', () => {
    const quote: Quote = {
      id: 'mno33333',
      content: '天地不仁，以万物为刍狗',
      bookSource: '道德经',
      chapter: '第五章',
      theme: '',
    };

    expect(formatQuoteForCopy(quote)).toBe(
      '【天地不仁，以万物为刍狗】—— 《道德经》'
    );
  });

  it('chapter 和 theme 同时为空时不影响输出格式', () => {
    const quote: Quote = {
      id: 'pqr44444',
      content: '吾日三省吾身',
      bookSource: '论语',
      chapter: '',
      theme: '',
    };

    expect(formatQuoteForCopy(quote)).toBe('【吾日三省吾身】—— 《论语》');
  });
});
