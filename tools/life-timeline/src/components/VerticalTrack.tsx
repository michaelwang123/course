// src/components/VerticalTrack.tsx
// 垂直轨道组件（移动端）：事件按时间纵向排列，可交互元素 ≥44×44px

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
  // Sort nodes by eventDate (oldest first, top to bottom)
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
              {/* Dot/marker */}
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
                }}
                aria-hidden="true"
              >
                <span className="text-lg select-none">{categoryConfig.icon}</span>
              </div>

              {/* Connecting vertical line */}
              {!isLast && (
                <div
                  className="w-0.5 flex-1 min-h-[24px] bg-gray-300"
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
                'bg-white shadow-sm border border-gray-200',
                'hover:shadow-md transition-shadow duration-150',
                'mb-4',
                isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : '',
              ].join(' ')}
              onClick={() => onSelectEvent(node.event)}
              aria-label={`${categoryLabel}事件：${node.event.title}，日期：${node.event.eventDate}${node.isFuture ? '（未来事件）' : ''}`}
            >
              {/* Title */}
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {node.event.title}
              </h3>

              {/* Date and category */}
              <div className="flex items-center gap-2 mt-1">
                <time
                  className="text-xs text-gray-500"
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

      {/* Empty state */}
      {sortedNodes.length === 0 && (
        <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
          暂无事件
        </div>
      )}
    </div>
  );
}
