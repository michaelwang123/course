// src/components/EventDetailPanel.tsx
// 桌面侧面板（≥768px）：事件详情、关闭按钮、编辑/删除操作

import { useEffect, useRef } from 'react';
import type { EventNode } from '@/types/event';
import { CATEGORIES } from '@/constants/categories';
import { SENTIMENT_LABELS } from '@/types/event';

interface EventDetailPanelProps {
  event: EventNode | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: EventNode) => void;
  onDelete: (event: EventNode) => void;
}

export function EventDetailPanel({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: EventDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus panel when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !event) {
    return null;
  }

  const categoryConfig = CATEGORIES[event.category];
  const sentimentLabel = SENTIMENT_LABELS[event.sentiment];

  return (
    <div
      ref={panelRef}
      className={[
        'fixed top-0 right-0 h-full w-80 bg-white shadow-xl border-l border-gray-200',
        'z-40 overflow-y-auto',
        'motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-in-out',
        isOpen
          ? 'motion-safe:translate-x-0 translate-x-0'
          : 'motion-safe:translate-x-full translate-x-full',
      ].join(' ')}
      tabIndex={-1}
      role="complementary"
      aria-label="事件详情面板"
    >
      {/* Header with close button */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">事件详情</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="关闭详情面板"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{event.eventDate}</span>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm text-white font-medium"
            style={{ backgroundColor: categoryConfig.color }}
          >
            <span aria-hidden="true">{categoryConfig.icon}</span>
            {categoryConfig.label}
          </span>
        </div>

        {/* Sentiment */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">情感色彩：</span>
          <span>{sentimentLabel}</span>
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">描述</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">
              {event.description}
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-gray-100 flex gap-3">
        <button
          type="button"
          onClick={() => onEdit(event)}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
        >
          编辑
        </button>
        <button
          type="button"
          onClick={() => onDelete(event)}
          className="flex-1 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
        >
          删除
        </button>
      </div>
    </div>
  );
}
