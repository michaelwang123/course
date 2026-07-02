// src/components/VerticalTrack.tsx
// 垂直轨道组件（移动端）：暗色主题

import type { EventNode } from '@/types/event';
import type { VisibleNode } from '@/lib/virtual-renderer';
import { CATEGORIES } from '@/constants/categories';
import { CATEGORY_LABELS } from '@/types/event';

interface VerticalTrackProps {
  visibleNodes: VisibleNode[];
  focusedIndex: number | null;
  onSelectEvent: (event: EventNode) => void;
}

export function VerticalTrack({
  visibleNodes,
  focusedIndex,
  onSelectEvent,
}: VerticalTrackProps) {
  const sortedNodes = [...visibleNodes].sort((a, b) => {
    return a.event.eventDate.localeCompare(b.event.eventDate);
  });

  return (
    <div
      className="relative w-full overflow-y-auto px-4 py-6"
      role="list"
      aria-label="事件时间线"
    >
      {sortedNodes.map((node, index) => {
        const isFocused = focusedIndex !== null && focusedIndex === visibleNodes.indexOf(node);
        const categoryConfig = CATEGORIES[node.event.category];
        const categoryLabel = CATEGORY_LABELS[node.event.category];
        const isLast = index === sortedNodes.length - 1;

        return (
          <div
            key={node.event.id}
            className="relative flex items-start gap-3"
            role="listitem"
          >
            {/* Left vertical line + dot */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={[
                  'flex items-center justify-center',
                  'min-w-[44px] min-h-[44px] w-11 h-11',
                  'rounded-full flex-shrink-0',
                  node.isFuture ? 'border-2 border-dashed' : 'border-2 border-solid border-transparent',
                ].join(' ')}
                style={{
                  backgroundColor: categoryConfig.color,
                  borderColor: node.isFuture ? categoryConfig.color : 'transparent',
                  boxShadow: `0 0 10px ${categoryConfig.color}50`,
                }}
                aria-hidden="true"
              >
                <span className="text-lg select-none">{categoryConfig.icon}</span>
              </div>

              {!isLast && (
                <div
                  className="w-0.5 flex-1 min-h-[24px] bg-gray-700"
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Event card */}
            <button
              type="button"
              className={[
                'flex-1 text-left p-3 rounded-lg',
                'min-h-[44px] min-w-[44px]',
                'bg-dark-800 border border-gray-800',
                'hover:border-emerald-700/50 hover:shadow-lg hover:shadow-emerald-900/10 transition-all duration-150',
                'mb-4',
                isFocused ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-dark-900' : '',
              ].join(' ')}
              onClick={() => onSelectEvent(node.event)}
              aria-label={`${categoryLabel}事件：${node.event.title}，日期：${node.event.eventDate}${node.isFuture ? '（未来事件）' : ''}`}
            >
              <h3 className="text-sm font-medium text-gray-100 truncate">
                {node.event.title}
              </h3>

              <div className="flex items-center gap-2 mt-1">
                <time
                  className="text-xs text-gray-500 font-mono"
                  dateTime={node.event.eventDate}
                >
                  {node.event.eventDate}
                </time>
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: categoryConfig.color }}
                >
                  {categoryLabel}
                </span>
              </div>
            </button>
          </div>
        );
      })}

      {sortedNodes.length === 0 && (
        <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
          暂无事件
        </div>
      )}
    </div>
  );
}
