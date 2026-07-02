// src/components/SearchBar.tsx
// 搜索输入框组件：搜索图标 + 输入框 + 清除按钮

import React from 'react';

export interface SearchBarProps {
  keyword: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ keyword, onChange, onClear }) => {
  return (
    <div className="relative flex items-center w-full max-w-md">
      {/* Search icon */}
      <span className="absolute left-3 text-gray-400 pointer-events-none" aria-hidden="true">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
      </span>

      {/* Input */}
      <input
        type="text"
        value={keyword}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索事件..."
        aria-label="搜索事件"
        className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg
                   bg-white focus:outline-none focus:ring-2 focus:ring-amber-400
                   focus:border-amber-400 transition-colors placeholder-gray-400"
      />

      {/* Clear button */}
      {keyword && (
        <button
          type="button"
          onClick={onClear}
          aria-label="清除搜索"
          className="absolute right-3 text-gray-400 hover:text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-amber-400 rounded"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};
