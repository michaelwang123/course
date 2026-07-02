// src/hooks/useDrag.ts
// 拖拽交互 Hook：鼠标拖拽 + 触摸滑动 + 外部设置 offset

import { useState, useRef, useCallback, useEffect } from 'react';
import { clampOffset } from '@/lib/position-calculator';

export interface UseDragReturn {
  isDragging: boolean;
  offset: number;
  setOffset: (value: number) => void;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function useDrag(
  totalWidth: number,
  viewportWidth: number
): UseDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffsetState] = useState(0);

  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startOffsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const offsetRef = useRef(0);

  const totalWidthRef = useRef(totalWidth);
  const viewportWidthRef = useRef(viewportWidth);

  useEffect(() => { totalWidthRef.current = totalWidth; }, [totalWidth]);
  useEffect(() => { viewportWidthRef.current = viewportWidth; }, [viewportWidth]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  // Public setter for external callers (scrollToDate, adjustOffset)
  const setOffset = useCallback((value: number) => {
    const clamped = clampOffset(value, totalWidthRef.current, viewportWidthRef.current);
    setOffsetState(clamped);
    offsetRef.current = clamped;
  }, []);

  const updateOffset = useCallback((newOffset: number) => {
    const clamped = clampOffset(newOffset, totalWidthRef.current, viewportWidthRef.current);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      setOffsetState(clamped);
      offsetRef.current = clamped;
      rafRef.current = null;
    });
  }, []);

  // Mouse drag
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX;
    startOffsetRef.current = offsetRef.current;
    e.preventDefault();
  }, []);

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

  // Touch events
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

  // Cleanup
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return {
    isDragging,
    offset,
    setOffset,
    handlers: {
      onMouseDown,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
  };
}
