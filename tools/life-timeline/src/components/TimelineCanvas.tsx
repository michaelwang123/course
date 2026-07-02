// src/components/TimelineCanvas.tsx
// 时间轴画布容器：测量视口宽度、选择水平/垂直布局（768px 阈值）
// 优化：使用 VerticalTrack 替代 inline fallback，实现键盘滚动

import { useRef, useState, useEffect, useCallback } from 'react';
import type { EventNode } from '@/types/event';
import { useTimeline } from '@/hooks/useTimeline';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { TimelineTrack } from './TimelineTrack';
import { VerticalTrack } from './VerticalTrack';
import { EventTooltip } from './EventTooltip';
import { EventDetailPanel } from './EventDetailPanel';
import { EventDetailModal } from './EventDetailModal';

interface TimelineCanvasProps {
  events: EventNode[];
  onSelectEvent: (event: EventNode) => void;
  onEditEvent: (event: EventNode) => void;
  onDeleteEvent: (event: EventNode) => void;
}

const BREAKPOINT = 768;
/** Keyboard scroll step: 10% of viewport width */
const KEYBOARD_SCROLL_FACTOR = 0.1;

export function TimelineCanvas({
  events,
  onSelectEvent,
  onEditEvent,
  onDeleteEvent,
}: TimelineCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Tooltip state
  const [tooltipEvent, setTooltipEvent] = useState<EventNode | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Detail panel/modal state
  const [selectedEvent, setSelectedEvent] = useState<EventNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Measure container width via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(container);
    setContainerWidth(container.getBoundingClientRect().width);

    return () => { observer.disconnect(); };
  }, []);

  const isHorizontal = containerWidth >= BREAKPOINT;
  const prefersReducedMotion = useReducedMotion();

  // Timeline hook (now exposes adjustOffset for keyboard scrolling)
  const {
    offset,
    zoomLevel,
    totalWidth,
    visibleNodes,
    scaleMarks,
    isDragging,
    dragHandlers,
    scrollToDate,
    adjustOffset,
  } = useTimeline(events, containerWidth);

  // Scroll to most recent event on mount (within 1 second)
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (hasScrolledRef.current || events.length === 0 || containerWidth === 0) return;

    const timer = setTimeout(() => {
      const today = new Date();
      let closestEvent = events[0];
      let closestDiff = Math.abs(new Date(events[0].eventDate).getTime() - today.getTime());

      for (let i = 1; i < events.length; i++) {
        const diff = Math.abs(new Date(events[i].eventDate).getTime() - today.getTime());
        if (diff < closestDiff) {
          closestDiff = diff;
          closestEvent = events[i];
        }
      }

      scrollToDate(closestEvent.eventDate);
      hasScrolledRef.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, [events, containerWidth, scrollToDate]);

  // Close detail panel/modal
  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedEvent(null);
  }, []);

  // Open detail panel/modal on event select
  const handleEventSelect = useCallback((event: EventNode) => {
    setSelectedEvent(event);
    setDetailOpen(true);
    onSelectEvent(event);
  }, [onSelectEvent]);

  // Keyboard scrolling: move offset by 10% of viewport per key press
  const handleMoveTimeline = useCallback((direction: 'left' | 'right') => {
    const step = containerWidth * KEYBOARD_SCROLL_FACTOR;
    const delta = direction === 'right' ? step : -step;
    adjustOffset(delta);
  }, [containerWidth, adjustOffset]);

  // Keyboard navigation
  const { focusedIndex } = useKeyboardNav(
    visibleNodes,
    handleEventSelect,
    handleMoveTimeline,
    handleCloseDetail
  );

  // Tooltip handlers
  const handleMarkerHover = useCallback((event: EventNode, entering: boolean, position?: { x: number; y: number }) => {
    if (entering && position) {
      setTooltipEvent(event);
      setTooltipPosition(position);
      setTooltipVisible(true);
    } else {
      setTooltipVisible(false);
    }
  }, []);

  const isVertical = !isHorizontal;

  return (
    <div
      ref={containerRef}
      className="relative w-full flex-1 min-h-0"
      role="region"
      aria-label="时间轴"
    >
      {containerWidth > 0 && (
        <>
          {isHorizontal ? (
            <div className="relative w-full h-full flex flex-col">
              <TimelineTrack
                visibleNodes={visibleNodes}
                scaleMarks={scaleMarks}
                isDragging={isDragging}
                dragHandlers={dragHandlers}
                zoomLevel={zoomLevel}
                totalWidth={totalWidth}
                offset={offset}
                focusedIndex={focusedIndex}
                prefersReducedMotion={prefersReducedMotion}
                onEventClick={handleEventSelect}
                onEventHover={handleMarkerHover}
              />
            </div>
          ) : (
            <VerticalTrack
              visibleNodes={visibleNodes}
              focusedIndex={focusedIndex}
              onSelectEvent={handleEventSelect}
            />
          )}

          {/* Tooltip */}
          {tooltipEvent && (
            <EventTooltip
              event={tooltipEvent}
              position={tooltipPosition}
              visible={tooltipVisible}
            />
          )}

          {/* Desktop: Detail Panel */}
          {isHorizontal && (
            <EventDetailPanel
              event={selectedEvent}
              isOpen={detailOpen}
              onClose={handleCloseDetail}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
            />
          )}

          {/* Mobile: Detail Modal */}
          {isVertical && (
            <EventDetailModal
              event={selectedEvent}
              isOpen={detailOpen}
              onClose={handleCloseDetail}
              onEdit={onEditEvent}
              onDelete={onDeleteEvent}
            />
          )}
        </>
      )}
    </div>
  );
}
