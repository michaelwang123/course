// src/components/EmptyFilterState.tsx
// 筛选无结果状态：暗色主题

import React from 'react';

export interface EmptyFilterStateProps {
  onClearFilter: () => void;
}

export const EmptyFilterState: React.FC<EmptyFilterStateProps> = ({ onClearFilter }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="text-5xl mb-4" aria-hidden="true">
        🔍
      </div>

      {/* Message */}
      <p className="text-lg text-gray-400 mb-4">
        没有匹配的事件
      </p>

      {/* Clear filter button */}
      <button
        type="button"
        onClick={onClearFilter}
        className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium
                   text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-700/50
                   rounded-lg transition-colors
                   focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-dark-900"
      >
        清除筛选
      </button>
    </div>
  );
};
