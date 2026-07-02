// src/components/EventMarker.tsx
// 事件标记点组件：分类颜色+图标、堆叠数量角标、未来事件虚线边框、键盘焦点环

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
        'transition-transform duration-150',
        'hover:scale-110',
        isFuture ? 'border-2 border-dashed' : 'border-2 border-solid',
        isFocused ? 'ring-2 ring-blue-500 ring-offset-2' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: `${position}px`,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: categoryConfig.color,
        borderColor: isFuture ? categoryConfig.color : 'transparent',
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
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-gray-800 text-white text-xs font-bold"
          aria-hidden="true"
        >
          {stackCount}
        </span>
      )}
    </button>
  );
});
