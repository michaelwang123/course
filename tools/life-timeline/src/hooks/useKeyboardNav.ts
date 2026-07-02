// src/hooks/useKeyboardNav.ts
// 键盘导航 Hook：Left/Right 移动时间轴、Tab 循环节点焦点、Enter 打开详情、Escape 关闭

import { useState, useCallback, useEffect } from 'react';
import type { EventNode } from '@/types/event';
import type { VisibleNode } from '@/lib/virtual-renderer';

export interface UseKeyboardNavReturn {
  focusedIndex: number | null;
  setFocusedIndex: (index: number | null) => void;
  handleKeyDown: (e: KeyboardEvent) => void;
}

/**
 * 键盘导航 Hook
 * - ArrowLeft: 调用 onMoveTimeline('left')（向前移动时间轴）
 * - ArrowRight: 调用 onMoveTimeline('right')（向后移动时间轴）
 * - Tab: 循环 focusedIndex（正向），Shift+Tab 反向循环
 * - Enter / Space: 调用 onSelectEvent(visibleNodes[focusedIndex].event)（打开详情）
 * - Escape: 调用 onClose()（关闭详情面板/模态框）
 *
 * @param visibleNodes - 当前可见的事件节点列表
 * @param onSelectEvent - 选中事件回调（打开详情）
 * @param onMoveTimeline - 移动时间轴回调
 * @param onClose - 关闭面板/模态框回调
 */
export function useKeyboardNav(
  visibleNodes: VisibleNode[],
  onSelectEvent: (event: EventNode) => void,
  onMoveTimeline: (direction: 'left' | 'right') => void,
  onClose: () => void
): UseKeyboardNavReturn {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Reset focusedIndex when visibleNodes changes
  useEffect(() => {
    setFocusedIndex(null);
  }, [visibleNodes]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip keyboard navigation when a form input/textarea/select is focused
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        (activeEl as HTMLElement).isContentEditable
      )) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft': {
          e.preventDefault();
          onMoveTimeline('left');
          break;
        }
        case 'ArrowRight': {
          e.preventDefault();
          onMoveTimeline('right');
          break;
        }
        case 'Tab': {
          if (visibleNodes.length === 0) {
            return;
          }
          e.preventDefault();

          if (e.shiftKey) {
            // Shift+Tab: cycle backward
            setFocusedIndex((prev) => {
              if (prev === null || prev <= 0) {
                return visibleNodes.length - 1;
              }
              return prev - 1;
            });
          } else {
            // Tab: cycle forward
            setFocusedIndex((prev) => {
              if (prev === null || prev >= visibleNodes.length - 1) {
                return 0;
              }
              return prev + 1;
            });
          }
          break;
        }
        case 'Enter':
        case ' ': {
          if (focusedIndex !== null && focusedIndex < visibleNodes.length) {
            e.preventDefault();
            onSelectEvent(visibleNodes[focusedIndex].event);
          }
          break;
        }
        case 'Escape': {
          e.preventDefault();
          onClose();
          break;
        }
        default:
          break;
      }
    },
    [visibleNodes, focusedIndex, onSelectEvent, onMoveTimeline, onClose]
  );

  // Attach keydown listener to document
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
  };
}
