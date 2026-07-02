// src/components/FilterStatus.tsx
// 筛选状态显示：匹配数量 + 清除筛选快捷按钮

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
    <div className="flex items-center gap-2 text-sm text-gray-600" aria-live="polite">
      {isFiltering ? (
        <>
          <span>
            显示 <strong className="text-gray-800">{matchedCount}</strong>/{totalCount} 个事件
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="text-amber-600 hover:text-amber-800 underline
                       focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
          >
            清除筛选
          </button>
        </>
      ) : (
        <span>共 {totalCount} 个事件</span>
      )}
    </div>
  );
};
