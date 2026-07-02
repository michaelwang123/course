// src/components/FilterPanel.tsx
// 筛选面板：分类多选 + 情感多选 + 清除筛选按钮

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
    <div className="flex flex-col gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Category section */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">分类</legend>
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
                className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full
                           border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400
                           ${isSelected
                             ? 'border-transparent text-white'
                             : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                           }`}
                style={isSelected ? { backgroundColor: config.color } : undefined}
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
        <legend className="text-sm font-medium text-gray-700 mb-2">情感</legend>
        <div className="flex flex-wrap gap-2" role="group" aria-label="情感色彩筛选">
          {ALL_SENTIMENTS.map((sent) => {
            const isSelected = sentiments.includes(sent);
            return (
              <button
                key={sent}
                type="button"
                onClick={() => toggleSentiment(sent)}
                aria-pressed={isSelected}
                className={`inline-flex items-center px-3 py-1.5 text-sm rounded-full
                           border transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400
                           ${isSelected
                             ? 'border-amber-500 bg-amber-100 text-amber-800'
                             : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
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
          className="self-start text-sm text-amber-600 hover:text-amber-800
                     underline focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
        >
          清除筛选
        </button>
      )}
    </div>
  );
};
