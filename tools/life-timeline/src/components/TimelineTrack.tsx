// src/components/TimelineTrack.tsx
// 水平轨道：集成拖拽/缩放/虚拟渲染，连续线条/路径连接相邻标记点

import { useRef, useCallback, useMemo } from 'react';
import type { EventNode } from '@/types/event';
import type { ZoomLevel } from '@/types/timeline';
import type { VisibleNode } from '@/lib/virtual-renderer';
import type { ScaleMark } from '@/lib/position-calculator';
import { EventMarker } from './EventMarker';

interface TimelineTrackProps {
  visibleNodes: VisibleNode[];
  scaleMarks: ScaleMark[];
  isDragging: boolean;
  dragHandlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
  zoomLevel: ZoomLevel;
  totalWidth: number;
  offset: number;
  focusedIndex: number | null;
  prefersReducedMotion: boolean;
  onEventClick: (event: EventNode) => void;
  onEventHover: (event: EventNode, entering: boolean, position?: { x: number; y: number }) => void;
}

export function TimelineTrack({
  visibleNodes,
  isDragging,
  dragHandlers,
  totalWidth,
  offset,
  focusedIndex,
  prefersReducedMotion,
  onEventClick,
  onEventHover,
}: TimelineTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Handle hover with position for tooltip
  const handleMarkerHover = useCallback(
    (event: EventNode, entering: boolean) => {
      if (entering && trackRef.current) {
        const node = visibleNodes.find((n) => n.event.id === event.id);
        if (node) {
          const trackRect = trackRef.current.getBoundingClientRect();
          const x = node.position + trackRect.left;
          const y = trackRect.top + trackRect.height / 2 - 22;
          onEventHover(event, true, { x, y });
        }
      } else {
        onEventHover(event, false);
      }
    },
    [visibleNodes, onEventHover]
  );

  // Memoize sorted nodes and connecting path to avoid recomputation on every render
  const { sortedNodes, connectingPath } = useMemo(() => {
    const sorted = [...visibleNodes].sort((a, b) => a.position - b.position);
    const path = sorted.length >= 2
      ? sorted
          .map((node, index) => {
            const x = node.position;
            const y = 0;
            if (index === 0) return `M ${x} ${y}`;
            return `L ${x} ${y}`;
          })
          .join(' ')
      : '';
    return { sortedNodes: sorted, connectingPath: path };
  }, [visibleNodes]);

  return (
    <div
      ref={trackRef}
      className={[
        'relative flex-1 overflow-hidden select-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
      ].join(' ')}
      style={{ willChange: isDragging ? 'transform' : 'auto' }}
      {...dragHandlers}
    >
      {/* Inner container translated by offset */}
      <div
        className="relative h-full"
        style={{
          width: `${totalWidth}px`,
          transform: `translateX(-${offset}px)`,
          transition: prefersReducedMotion ? 'none' : undefined,
        }}
      >
        {/* Connecting line/path between adjacent markers */}
        {sortedNodes.length >= 2 && (
          <svg
            className="absolute top-1/2 left-0 w-full pointer-events-none"
            style={{
              height: '2px',
              transform: 'translateY(-50%)',
              overflow: 'visible',
            }}
            aria-hidden="true"
          >
            <path
              d={connectingPath}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-gray-300"
            />
          </svg>
        )}

        {/* Horizontal center line spanning full track width */}
        <div
          className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -translate-y-1/2"
          aria-hidden="true"
        />

        {/* Event markers */}
        {visibleNodes.map((node, index) => (
          <EventMarker
            key={node.event.id}
            event={node.event}
            position={node.position}
            isStacked={node.isStacked}
            stackCount={node.stackCount}
            isFuture={node.isFuture}
            isFocused={focusedIndex === index}
            onClick={() => onEventClick(node.event)}
            onHover={(entering) => handleMarkerHover(node.event, entering)}
          />
        ))}
      </div>
    </div>
  );
}
