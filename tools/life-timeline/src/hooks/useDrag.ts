// src/hooks/useDrag.ts
// 拖拽交互 Hook：鼠标拖拽 + 触摸滑动，使用 requestAnimationFrame 平滑更新偏移
// 优化：使用 document 级 mousemove 监听，防止鼠标移出容器时拖拽"卡住"

import { useState, useRef, useCallback, useEffect } from 'react';
import { clampOffset } from '@/lib/position-calculator';

export interface UseDragReturn {
  isDragging: boolean;
  offset: number;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function useDrag(
  totalWidth: number,
  viewportWidth: number,
  onOffsetChange: (offset: number) => void
): UseDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState(0);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const offsetRef = useRef(0);

  // Use refs for stable access in document-level listeners
  const totalWidthRef = useRef(totalWidth);
  const viewportWidthRef = useRef(viewportWidth);
  const onOffsetChangeRef = useRef(onOffsetChange);

  useEffect(() => { totalWidthRef.current = totalWidth; }, [totalWidth]);
  useEffect(() => { viewportWidthRef.current = viewportWidth; }, [viewportWidth]);
  useEffect(() => { onOffsetChangeRef.current = onOffsetChange; }, [onOffsetChange]);

  // Keep offsetRef in sync
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const updateOffset = useCallback((newOffset: number) => {
    const clamped = clampOffset(newOffset, totalWidthRef.current, viewportWidthRef.current);

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setOffset(clamped);
      onOffsetChangeRef.current(clamped);
      rafRef.current = null;
    });
  }, []);

  // Mouse: start drag on container mousedown
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startOffsetRef.current = offsetRef.current;
    e.preventDefault();
  }, []);

  // Document-level mouse move and mouse up (added only during drag)
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = startXRef.current - e.clientX;
      const newOffset = startOffsetRef.current + deltaX;
      updateOffset(newOffset);
    };

    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, updateOffset]);

  // Touch events (stay on container — touch capture works correctly)
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    startOffsetRef.current = offsetRef.current;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const deltaX = startXRef.current - e.touches[0].clientX;
    const newOffset = startOffsetRef.current + deltaX;
    updateOffset(newOffset);
  }, [updateOffset]);

  const onTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return {
    isDragging,
    offset,
    handlers: {
      onMouseDown,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
