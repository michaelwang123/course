import React from 'react';
import type { Quote } from '../types/quote';

interface QuoteDisplayProps {
  quote: Quote | null;
  animationPhase: 'idle' | 'fade-out' | 'fade-in';
}

const QuoteDisplay: React.FC<QuoteDisplayProps> = React.memo(({ quote, animationPhase }) => {
  if (!quote) {
    return null;
  }

  // 两阶段动画：fade-out → 内容替换 → fade-in → idle
  const opacityClass = animationPhase === 'fade-out' ? 'opacity-0' : 'opacity-100';

  return (
    <div
      className={`text-center transition-opacity duration-200 ${opacityClass}`}
      style={{ fontFamily: '"Noto Serif SC", "Songti SC", "SimSun", serif' }}
    >
      {/* 装饰性中式引号 - 左 */}
      <span
        aria-hidden="true"
        className="block text-4xl text-amber-800/30 mb-2 select-none"
      >
        「
      </span>

      {/* 金句内容 */}
      <p className="text-xl md:text-2xl leading-relaxed break-words px-4">
        {quote.content}
      </p>

      {/* 装饰性中式引号 - 右 */}
      <span
        aria-hidden="true"
        className="block text-4xl text-amber-800/30 mt-2 select-none"
      >
        」
      </span>

      {/* 书籍来源 */}
      <p className="text-sm text-stone-600 mt-4">
        —— 《{quote.bookSource}》
      </p>

      {/* 章节（非空时展示） */}
      {quote.chapter && (
        <p className="text-sm text-stone-500 mt-1">
          {quote.chapter}
        </p>
      )}

      {/* 主题（非空时展示） */}
      {quote.theme && (
        <p className="text-sm text-stone-500 mt-1 italic">
          {quote.theme}
        </p>
      )}
    </div>
  );
});

QuoteDisplay.displayName = 'QuoteDisplay';

export default QuoteDisplay;
