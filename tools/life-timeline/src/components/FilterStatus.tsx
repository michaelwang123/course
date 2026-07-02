// src/components/FilterStatus.tsx
// 筛选状态栏：事件统计 + 微妙动效

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
    <div className="flex items-center gap-3 text-xs" aria-live="polite">
      {/* Pulsing dot indicator */}
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>

      {isFiltering ? (
        <span className="text-gray-400">
          显示 <strong className="text-emerald-300 font-mono">{matchedCount}</strong>
          <span className="text-gray-600 mx-1">/</span>
          <span className="text-gray-500 font-mono">{totalCount}</span> 个事件
          <button
            type="button"
            onClick={onClearAll}
            className="ml-3 text-emerald-400/70 hover:text-emerald-300 transition-colors underline underline-offset-2"
          >
            清除
          </button>
        </span>
      ) : (
        <span className="text-gray-500">
          共 <strong className="text-emerald-300/80 font-mono">{totalCount}</strong> 个事件
        </span>
      )}
    </div>
  );
};
