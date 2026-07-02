// src/components/EmptyFilterState.tsx
// 筛选无结果状态：提示"没有匹配的事件" + 清除筛选按钮

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
      <p className="text-lg text-gray-600 mb-4">
        没有匹配的事件
      </p>

      {/* Clear filter button */}
      <button
        type="button"
        onClick={onClearFilter}
        className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium
                   text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200
                   rounded-lg transition-colors
                   focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
      >
        清除筛选
      </button>
    </div>
  );
};
