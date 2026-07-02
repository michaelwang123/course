// src/components/Toast.tsx
// Toast 消息组件：支持单条显示（向后兼容）+ 队列容器（多条堆叠）

import { useEffect, useState, memo } from 'react';
import type { ToastItem } from '@/hooks/useToast';

// --- Single Toast (backward compatible) ---

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

const TYPE_STYLES: Record<ToastProps['type'], string> = {
  success: 'bg-green-50 border-green-300 text-green-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
};

const TYPE_ICONS: Record<ToastProps['type'], string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export function Toast({ message, type, onClose, duration = 5000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-center gap-2 px-4 py-3
        border rounded-lg shadow-lg max-w-sm
        motion-safe:animate-[slideIn_0.3s_ease-out]
        ${TYPE_STYLES[type]}
      `}
    >
      <span className="text-lg leading-none" aria-hidden="true">
        {TYPE_ICONS[type]}
      </span>
      <span className="text-sm flex-1">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose();
        }}
        className="ml-2 text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="关闭提示"
      >
        ✕
      </button>
    </div>
  );
}

// --- Toast Queue Container ---

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  duration?: number;
}

/** Single toast item within the queue, with auto-dismiss */
const QueuedToast = memo(function QueuedToast({
  toast,
  onDismiss,
  duration = 5000,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss, duration]);

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        flex items-center gap-2 px-4 py-3
        border rounded-lg shadow-lg max-w-sm w-full
        motion-safe:animate-[slideIn_0.3s_ease-out]
        ${TYPE_STYLES[toast.type]}
      `}
    >
      <span className="text-lg leading-none" aria-hidden="true">
        {TYPE_ICONS[toast.type]}
      </span>
      <span className="text-sm flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="关闭提示"
      >
        ✕
      </button>
    </div>
  );
});

/**
 * Toast 队列容器：渲染多条 toast 消息，从上往下堆叠
 */
export function ToastContainer({ toasts, onDismiss, duration = 5000 }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
      {toasts.map(toast => (
        <QueuedToast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          duration={duration}
        />
      ))}
    </div>
  );
}
