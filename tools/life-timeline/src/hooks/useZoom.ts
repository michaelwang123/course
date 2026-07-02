// src/hooks/useZoom.ts
// 缩放交互 Hook：鼠标滚轮 + 触摸捏合，年/月/日级别切换

import { useState, useRef, useCallback, useEffect } from 'react';
import type { ZoomLevel } from '@/types/timeline';

const ZOOM_LEVELS: ZoomLevel[] = ['year', 'month', 'day'];
const ZOOM_THROTTLE_MS = 300;

export interface UseZoomReturn {
  zoomLevel: ZoomLevel;
  handleWheel: (e: WheelEvent) => void;
  handlePinch: (scale: number) => void;
  setZoomLevel: (level: ZoomLevel) => void;
}

export function useZoom(onZoomChange?: (level: ZoomLevel) => void): UseZoomReturn {
  const [zoomLevel, setZoomLevelState] = useState<ZoomLevel>('year');
  const lastZoomTimeRef = useRef(0);
  const pinchStartDistanceRef = useRef<number | null>(null);

  const setZoomLevel = useCallback((level: ZoomLevel) => {
    setZoomLevelState(level);
    onZoomChange?.(level);
  }, [onZoomChange]);

  const changeZoomLevel = useCallback((direction: 'in' | 'out') => {
    const now = Date.now();
    if (now - lastZoomTimeRef.current < ZOOM_THROTTLE_MS) {
      return;
    }
    lastZoomTimeRef.current = now;

    setZoomLevelState((current) => {
      const currentIndex = ZOOM_LEVELS.indexOf(current);
      let newIndex: number;

      if (direction === 'in') {
        // Zoom in: year → month → day (scroll down / pinch out)
        newIndex = Math.min(currentIndex + 1, ZOOM_LEVELS.length - 1);
      } else {
        // Zoom out: day → month → year (scroll up / pinch in)
        newIndex = Math.max(currentIndex - 1, 0);
      }

      const newLevel = ZOOM_LEVELS[newIndex];
      if (newLevel !== current) {
        onZoomChange?.(newLevel);
      }
      return newLevel;
    });
  }, [onZoomChange]);

  // Mouse wheel handler: deltaY > 0 means scroll down → zoom in
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.deltaY > 0) {
      changeZoomLevel('in');
    } else if (e.deltaY < 0) {
      changeZoomLevel('out');
    }
  }, [changeZoomLevel]);

  // Touch pinch handler: scale > 1 means pinch out → zoom in
  const handlePinch = useCallback((scale: number) => {
    if (scale > 1.2) {
      changeZoomLevel('in');
    } else if (scale < 0.8) {
      changeZoomLevel('out');
    }
  }, [changeZoomLevel]);

  // Cleanup pinch state reference
  useEffect(() => {
    return () => {
      pinchStartDistanceRef.current = null;
    };
  }, []);

  return {
    zoomLevel,
    handleWheel,
    handlePinch,
    setZoomLevel,
  };
}
