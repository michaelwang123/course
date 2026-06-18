import React from 'react';
import type { BookSourceInfo } from '../types/quote';

export interface FilterPanelProps {
  sources: BookSourceInfo[];
  selectedSources: Set<string>;
  onSelectionChange: (sources: Set<string>) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  sources,
  selectedSources,
  onSelectionChange,
}) => {
  const isAllSelected = selectedSources.size === 0;

  const handleAllClick = () => {
    onSelectionChange(new Set());
  };

  const handleSourceClick = (sourceName: string) => {
    const newSet = new Set(selectedSources);
    if (newSet.has(sourceName)) {
      newSet.delete(sourceName);
      // If removing the last source, go back to "全部" (empty Set)
      if (newSet.size === 0) {
        onSelectionChange(new Set());
        return;
      }
    } else {
      newSet.add(sourceName);
    }
    onSelectionChange(newSet);
  };

  return (
    <nav aria-label="书籍来源筛选" className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={handleAllClick}
        aria-pressed={isAllSelected}
        className={`px-3 py-1.5 rounded-full text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
          isAllSelected
            ? 'bg-amber-700 text-amber-50'
            : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
        }`}
      >
        全部
      </button>
      {sources.map((source) => {
        const isSelected = selectedSources.has(source.name);
        return (
          <button
            key={source.name}
            type="button"
            onClick={() => handleSourceClick(source.name)}
            aria-pressed={isSelected}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 ${
              isSelected
                ? 'bg-amber-700 text-amber-50'
                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
            }`}
          >
            {source.name}
            <span className="ml-1 opacity-70">({source.count})</span>
          </button>
        );
      })}
    </nav>
  );
};
