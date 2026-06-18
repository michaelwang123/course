import type { Quote } from '../types/quote';

/**
 * 将金句格式化为可复制的文本
 * 格式：【{content}】—— 《{bookSource}》
 * bookSource 由解析规则保证必存在
 */
export function formatQuoteForCopy(quote: Quote): string {
  return `【${quote.content}】—— 《${quote.bookSource}》`;
}
