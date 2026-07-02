// src/components/FilterStatus.tsx
// 筛选状态显示：暗色主题

import React from 'react';

export interface FilterStatusProps {
  matchedCount: number;
  totalCount: number;
  isFiltering: boolean;
  onClearAll: () => void;
}

export const FilterStatus: React.FC<FilterStatusProps> = ({
  matchedCount,
  totalCount,
  isFiltering,
  onClearAll,
}) => {
  if (totalCount === 0 && !isFiltering) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm text-gray-400" aria-live="polite">
      {isFiltering ? (
        <>
          <span>
            显示 <strong className="text-emerald-300">{matchedCount}</strong>/{totalCount} 个事件
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-emerald-400 hover:text-emerald-300 underline
                       focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded"
          >
            清除筛选
          </button>
        </>
      ) : (
        <span>共 <strong className="text-emerald-300">{totalCount}</strong> 个事件</span>
      )}
    </div>
  );
};
