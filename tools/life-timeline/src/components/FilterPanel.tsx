// src/components/FilterPanel.tsx
// 筛选面板：暗色主题，发光按钮 + 动态交互

import React from 'react';
import type { EventCategory, EventSentiment } from '@/types/event';
import { SENTIMENT_LABELS } from '@/types/event';
import { CATEGORIES } from '@/constants/categories';

export interface FilterPanelProps {
  categories: EventCategory[];
  sentiments: EventSentiment[];
  onCategoriesChange: (cats: EventCategory[]) => void;
  onSentimentsChange: (sents: EventSentiment[]) => void;
  onClearAll: () => void;
}

const ALL_CATEGORIES = Object.keys(CATEGORIES) as EventCategory[];
const ALL_SENTIMENTS = Object.keys(SENTIMENT_LABELS) as EventSentiment[];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  sentiments,
  onCategoriesChange,
  onSentimentsChange,
  onClearAll,
}) => {
  const toggleCategory = (cat: EventCategory) => {
    if (categories.includes(cat)) {
      onCategoriesChange(categories.filter((c) => c !== cat));
    } else {
      onCategoriesChange([...categories, cat]);
    }
  };

  const toggleSentiment = (sent: EventSentiment) => {
    if (sentiments.includes(sent)) {
      onSentimentsChange(sentiments.filter((s) => s !== sent));
    } else {
      onSentimentsChange([...sentiments, sent]);
    }
  };

  const hasAnyFilter = categories.length > 0 || sentiments.length > 0;

  return (
    <div className="flex flex-col gap-3 p-4 bg-dark-800/50 border border-gray-800/60 rounded-xl backdrop-blur-sm">
      {/* Category section */}
      <fieldset>
        <legend className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">分类</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="事件分类筛选">
          {ALL_CATEGORIES.map((cat) => {
            const config = CATEGORIES[cat];
            const isSelected = categories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                aria-pressed={isSelected}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full
                           border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50
                           ${isSelected
                             ? 'border-transparent text-white scale-105'
                             : 'border-gray-700/60 text-gray-400 bg-dark-700/50 hover:bg-dark-600 hover:text-gray-200 hover:border-gray-600'
                           }`}
                style={isSelected ? {
                  backgroundColor: config.color,
                  boxShadow: `0 0 14px ${config.color}50, 0 2px 8px ${config.color}30`,
                } : undefined}
              >
                <span aria-hidden="true">{config.icon}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Sentiment section */}
      <fieldset>
        <legend className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">情感</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="情感色彩筛选">
          {ALL_SENTIMENTS.map((sent) => {
            const isSelected = sentiments.includes(sent);
            return (
              <button
                key={sent}
                type="button"
                onClick={() => toggleSentiment(sent)}
                aria-pressed={isSelected}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full
                           border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50
                           ${isSelected
                             ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 shadow-sm shadow-emerald-500/20 scale-105'
                             : 'border-gray-700/60 text-gray-400 bg-dark-700/50 hover:bg-dark-600 hover:text-gray-200 hover:border-gray-600'
                           }`}
              >
                {SENTIMENT_LABELS[sent]}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Clear all button */}
      {hasAnyFilter && (
        <button
          type="button"
          onClick={onClearAll}
          className="self-start text-xs text-emerald-400/80 hover:text-emerald-300
                     underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded transition-colors"
        >
          清除全部筛选
        </button>
      )}
    </div>
  );
};
