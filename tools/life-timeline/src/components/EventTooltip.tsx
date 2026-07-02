// src/components/EventTooltip.tsx
// 事件悬停浮层：暗色主题，带发光边框

import { useEffect, useRef, useState } from 'react';
import type { EventNode } from '@/types/event';
import { CATEGORIES } from '@/constants/categories';

interface EventTooltipProps {
  event: EventNode;
  position: { x: number; y: number };
  visible: boolean;
}

export function EventTooltip({ event, position, visible }: EventTooltipProps) {
  const [show, setShow] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      showTimerRef.current = setTimeout(() => {
        setShow(true);
      }, 300);
    } else {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      hideTimerRef.current = setTimeout(() => {
        setShow(false);
      }, 200);
    }

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [visible]);

  if (!show) {
    return null;
  }

  const categoryConfig = CATEGORIES[event.category];

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 8}px`,
        transform: 'translate(-50%, -100%)',
      }}
      role="tooltip"
    >
      <div className="bg-dark-800 rounded-lg shadow-xl border border-gray-700 px-3 py-2 max-w-[200px] glow-border">
        <p className="text-sm font-medium text-gray-100 truncate">{event.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 font-mono">{event.eventDate}</p>
        <div className="flex items-center gap-1 mt-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: categoryConfig.color, boxShadow: `0 0 6px ${categoryConfig.color}60` }}
            aria-hidden="true"
          />
          <span className="text-xs text-gray-400">{categoryConfig.label}</span>
        </div>
      </div>
      {/* Tooltip arrow */}
      <div className="flex justify-center">
        <div className="w-2 h-2 bg-dark-800 border-b border-r border-gray-700 transform rotate-45 -mt-1" />
      </div>
    </div>
  );
}
