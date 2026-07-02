// src/components/EventDetailModal.tsx
// 移动端模态框（<768px）：暗色主题事件详情

import { useEffect, useRef } from 'react';
import type { EventNode } from '@/types/event';
import { CATEGORIES } from '@/constants/categories';
import { SENTIMENT_LABELS } from '@/types/event';

interface EventDetailModalProps {
  event: EventNode | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: EventNode) => void;
  onDelete: (event: EventNode) => void;
}

export function EventDetailModal({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: EventDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && modalRef.current) modalRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || !event) return null;

  const categoryConfig = CATEGORIES[event.category];
  const sentimentLabel = SENTIMENT_LABELS[event.sentiment];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

      <div
        ref={modalRef}
        className="relative w-full max-h-[90vh] bg-dark-800 overflow-y-auto rounded-t-2xl sm:rounded-2xl sm:max-w-md sm:mx-4 border border-gray-800"
        role="dialog"
        aria-modal="true"
        aria-label={`事件详情：${event.title}`}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800 sticky top-0 bg-dark-800 z-10">
          <h2 className="text-lg font-semibold text-emerald-300">事件详情</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-dark-600 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label="关闭"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          <h3 className="text-xl font-bold text-gray-100">{event.title}</h3>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-mono">{event.eventDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm text-white font-medium"
              style={{ backgroundColor: categoryConfig.color, boxShadow: `0 0 10px ${categoryConfig.color}40` }}
            >
              <span aria-hidden="true">{categoryConfig.icon}</span>
              {categoryConfig.label}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="font-medium">情感色彩：</span>
            <span className="text-gray-300">{sentimentLabel}</span>
          </div>

          {event.description && (
            <div>
              <p className="text-sm font-medium text-gray-400 mb-1">描述</p>
              <p className="text-sm text-gray-300 whitespace-pre-wrap break-words">{event.description}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-800 flex gap-3 sticky bottom-0 bg-dark-800">
          <button
            type="button"
            onClick={() => onEdit(event)}
            className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors text-sm font-medium min-h-[44px]"
          >
            编辑
          </button>
          <button
            type="button"
            onClick={() => onDelete(event)}
            className="flex-1 px-4 py-2.5 bg-red-500/10 text-red-400 border border-red-800/50 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium min-h-[44px]"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  );
}
