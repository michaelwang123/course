// src/hooks/useToast.ts
// Toast 队列管理 Hook：支持多条消息堆叠显示，自动过期

import { useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export interface UseToastReturn {
  toasts: ToastItem[];
  showToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

/** Maximum number of visible toasts at once */
const MAX_VISIBLE_TOASTS = 5;

/**
 * Toast 队列管理 Hook
 * - 支持同时显示多条 toast（最多 MAX_VISIBLE_TOASTS 条）
 * - 新 toast 追加到队列末尾
 * - 超出上限时自动移除最早的 toast
 * - 通过 dismissToast 手动移除单条
 */
export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idCounter = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${++idCounter.current}`;
    const newToast: ToastItem = { id, message, type };

    setToasts(prev => {
      const updated = [...prev, newToast];
      // Trim to max visible
      if (updated.length > MAX_VISIBLE_TOASTS) {
        return updated.slice(updated.length - MAX_VISIBLE_TOASTS);
      }
      return updated;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}
