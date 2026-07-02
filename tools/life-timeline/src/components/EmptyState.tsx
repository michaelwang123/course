// src/components/EmptyState.tsx
// 空状态引导：暗色主题，带脉冲发光效果

import React from 'react';

export interface EmptyStateProps {
  onAddEvent: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddEvent }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Illustration with glow */}
      <div className="text-6xl mb-4 animate-pulse-glow rounded-full p-4" aria-hidden="true">
        🌟
      </div>

      {/* Heading */}
      <h2 className="text-xl font-semibold text-gray-200 mb-2">
        记录你的第一个人生时刻
      </h2>

      {/* Description */}
      <p className="text-sm text-gray-500 mb-6 max-w-xs">
        在时光线上标记你的重要经历，回顾属于你的人生旅程
      </p>

      {/* Add event button */}
      <button
        type="button"
        onClick={onAddEvent}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium
                   text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg
                   shadow-lg shadow-emerald-900/30 transition-all hover:-translate-y-0.5
                   focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-dark-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        添加事件
      </button>
    </div>
  );
};
