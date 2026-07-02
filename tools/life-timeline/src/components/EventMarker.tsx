// src/components/EventMarker.tsx
// 事件标记点组件：暗色主题，带发光效果

import { memo } from 'react';
import type { EventNode } from '@/types/event';
import { CATEGORIES } from '@/constants/categories';
import { CATEGORY_LABELS } from '@/types/event';

interface EventMarkerProps {
  event: EventNode;
  position: number;
  isStacked: boolean;
  stackCount: number;
  isFuture: boolean;
  isFocused: boolean;
  onClick: () => void;
  onHover: (entering: boolean) => void;
}

export const EventMarker = memo(function EventMarker({
  event,
  position,
  isStacked,
  stackCount,
  isFuture,
  isFocused,
  onClick,
  onHover,
}: EventMarkerProps) {
  const categoryConfig = CATEGORIES[event.category];
  const categoryLabel = CATEGORY_LABELS[event.category];

  return (
    <button
      type="button"
      className={[
        'absolute flex items-center justify-center',
        'min-w-[44px] min-h-[44px] w-11 h-11',
        'rounded-full cursor-pointer',
        'transition-all duration-200',
        'hover:scale-110 hover:z-10',
        isFuture ? 'border-2 border-dashed opacity-70' : 'border-2 border-solid',
        isFocused ? 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-dark-900' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: `${position}px`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: categoryConfig.color,
        borderColor: isFuture ? categoryConfig.color : 'transparent',
        boxShadow: `0 0 12px ${categoryConfig.color}60, 0 0 4px ${categoryConfig.color}30`,
      }}
      onClick={onClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      aria-label={`${categoryLabel}事件：${event.title}，日期：${event.eventDate}${isFuture ? '（未来事件）' : ''}${isStacked && stackCount > 1 ? `，同日共 ${stackCount} 个事件` : ''}`}
    >
      {/* Category icon */}
      <span className="text-lg select-none" aria-hidden="true">
        {categoryConfig.icon}
      </span>

      {/* Stack count badge */}
      {isStacked && stackCount > 1 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-xs font-bold shadow-lg"
          aria-hidden="true"
        >
          {stackCount}
        </span>
      )}
    </button>
  );
});
