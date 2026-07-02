// src/components/TimelineTrack.tsx
// 水平轨道：拖拽滚动 + 动态流动线 + 年份刻度内嵌

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

/** Left/right padding (px) so edge events aren't clipped */
const TRACK_PADDING = 60;

export function TimelineTrack({
  visibleNodes,
  scaleMarks,
  isDragging,
  dragHandlers,
  totalWidth,
  offset,
  focusedIndex,
  onEventClick,
  onEventHover,
}: TimelineTrackProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMarkerHover = useCallback(
    (event: EventNode, entering: boolean) => {
      if (entering && trackRef.current) {
        const node = visibleNodes.find((n) => n.event.id === event.id);
        if (node) {
          const trackRect = trackRef.current.getBoundingClientRect();
          // node.position is global, subtract offset to get viewport-relative for tooltip
          const x = node.position - offset + trackRect.left;
          const y = trackRect.top + trackRect.height / 2 - 22;
          onEventHover(event, true, { x, y });
        }
      } else {
        onEventHover(event, false);
      }
    },
    [visibleNodes, offset, onEventHover]
  );

  const { sortedNodes, connectingPath } = useMemo(() => {
    const sorted = [...visibleNodes].sort((a, b) => a.position - b.position);
    const path = sorted.length >= 2
      ? sorted
          .map((node, index) => {
            const x = node.position + TRACK_PADDING;
            const y = 0;
            if (index === 0) return `M ${x} ${y}`;
            return `L ${x} ${y}`;
          })
          .join(' ')
      : '';
    return { sortedNodes: sorted, connectingPath: path };
  }, [visibleNodes]);

  const innerWidth = totalWidth + TRACK_PADDING * 2;

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
      {/* Scrolling inner container */}
      <div
        className="relative h-full"
        style={{
          width: `${innerWidth}px`,
          transform: `translateX(${-offset}px)`,
        }}
      >
        {/* Animated flowing dash line */}
        <svg
          className="absolute top-1/2 left-0 w-full pointer-events-none -translate-y-1/2"
          style={{ height: '4px', overflow: 'visible' }}
          aria-hidden="true"
        >
          <line
            x1={TRACK_PADDING} y1="2" x2={innerWidth - TRACK_PADDING} y2="2"
            stroke="rgba(52, 211, 153, 0.12)"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            className="animate-dash-flow"
          />
        </svg>

        {/* Solid glow center line */}
        <div
          className="absolute top-1/2 -translate-y-1/2"
          style={{
            left: `${TRACK_PADDING}px`,
            right: `${TRACK_PADDING}px`,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.35) 10%, rgba(52,211,153,0.35) 90%, transparent)',
            boxShadow: '0 0 6px rgba(52,211,153,0.2)',
          }}
          aria-hidden="true"
        />

        {/* Connecting path between events */}
        {sortedNodes.length >= 2 && (
          <svg
            className="absolute top-1/2 left-0 w-full pointer-events-none -translate-y-1/2"
            style={{ height: '4px', overflow: 'visible' }}
            aria-hidden="true"
          >
            <path
              d={connectingPath}
              fill="none"
              stroke="rgba(52, 211, 153, 0.5)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}

        {/* Year scale marks (integrated into the track) */}
        {scaleMarks.map((mark, index) => {
          const x = mark.position + TRACK_PADDING + offset; // scaleMarks are viewport-relative, convert to global
          return (
            <div
              key={`scale-${mark.label}-${index}`}
              className="absolute bottom-2 flex flex-col items-center pointer-events-none"
              style={{ left: `${x}px`, transform: 'translateX(-50%)' }}
            >
              <div className={mark.type === 'major' ? 'w-px h-5 bg-emerald-600/60' : 'w-px h-3 bg-gray-700/60'} />
              <span className={
                mark.type === 'major'
                  ? 'text-[11px] font-semibold text-emerald-400/80 mt-0.5 whitespace-nowrap'
                  : 'text-[9px] text-gray-600 mt-0.5 whitespace-nowrap'
              }>
                {mark.label}
              </span>
            </div>
          );
        })}

        {/* Event markers (global positions + padding) */}
        {visibleNodes.map((node, index) => (
          <EventMarker
            key={node.event.id}
            event={node.event}
            position={node.position + TRACK_PADDING}
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
