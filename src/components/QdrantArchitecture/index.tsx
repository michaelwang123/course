import React, { useRef, useState, useEffect, useCallback } from 'react';
import GlowNode from '../GlowNode';
import FlowLine from '../FlowLine';
import { useAnimationSlot } from '../../hooks/useAnimationSlot';

// ─── Architecture Data ───────────────────────────────────────────────────────

interface ArchElement {
  id: string;
  type: 'collection' | 'point' | 'vector' | 'payload';
  label: string;
  tooltip: string;
  level: number; // 0 = Collection, 1 = Points, 2 = Vector/Payload
}

const architectureElements: ArchElement[] = [
  {
    id: 'collection-1',
    type: 'collection',
    label: 'Collection',
    tooltip: 'Qdrant中存储向量数据的基本单元，类似传统数据库的表',
    level: 0,
  },
  {
    id: 'point-1',
    type: 'point',
    label: 'Point 1',
    tooltip: '数据记录，包含向量和附加信息（payload）',
    level: 1,
  },
  {
    id: 'point-2',
    type: 'point',
    label: 'Point 2',
    tooltip: '数据记录，包含向量和附加信息（payload）',
    level: 1,
  },
  {
    id: 'point-3',
    type: 'point',
    label: 'Point 3',
    tooltip: '数据记录，包含向量和附加信息（payload）',
    level: 1,
  },
  {
    id: 'vector-1',
    type: 'vector',
    label: 'Vector',
    tooltip: '高维数值数组，表示数据的语义特征',
    level: 2,
  },
  {
    id: 'vector-2',
    type: 'vector',
    label: 'Vector',
    tooltip: '高维数值数组，表示数据的语义特征',
    level: 2,
  },
  {
    id: 'vector-3',
    type: 'vector',
    label: 'Vector',
    tooltip: '高维数值数组，表示数据的语义特征',
    level: 2,
  },
  {
    id: 'payload-1',
    type: 'payload',
    label: 'Payload',
    tooltip: '附加在向量上的结构化元数据，支持过滤检索',
    level: 2,
  },
  {
    id: 'payload-2',
    type: 'payload',
    label: 'Payload',
    tooltip: '附加在向量上的结构化元数据，支持过滤检索',
    level: 2,
  },
  {
    id: 'payload-3',
    type: 'payload',
    label: 'Payload',
    tooltip: '附加在向量上的结构化元数据，支持过滤检索',
    level: 2,
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function QdrantArchitecture() {
  const { ref, isActive, isInViewport } = useAnimationSlot({ threshold: 0.3 });

  const [visibleLevels, setVisibleLevels] = useState<number[]>([]);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState<string | null>(null);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sequential fade-in animation with 200ms stagger between levels
  useEffect(() => {
    if (!isActive) {
      setVisibleLevels([]);
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    [0, 1, 2].forEach((level) => {
      const timer = setTimeout(() => {
        setVisibleLevels((prev) => [...prev, level]);
      }, level * 200);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [isActive]);

  // ─── Pointer Handlers (hover) ──────────────────────────────────────────────

  const handlePointerEnter = useCallback((elementId: string) => {
    setHoveredElement(elementId);
    // Show tooltip with 100ms delay
    showTimerRef.current = setTimeout(() => {
      setTooltipVisible(elementId);
    }, 100);
  }, []);

  const handlePointerLeave = useCallback(() => {
    // Immediately hide tooltip regardless of pointer position
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    setHoveredElement(null);
    setTooltipVisible(null);
  }, []);

  // ─── Touch Handlers ────────────────────────────────────────────────────────

  const handleTouchStart = useCallback((elementId: string) => {
    // Clear existing dismiss timer
    if (touchDismissRef.current) {
      clearTimeout(touchDismissRef.current);
    }

    setTooltipVisible(elementId);
    setHoveredElement(elementId);

    // Auto-dismiss after 3 seconds
    touchDismissRef.current = setTimeout(() => {
      setTooltipVisible(null);
      setHoveredElement(null);
      touchDismissRef.current = null;
    }, 3000);
  }, []);

  const handleTouchElsewhere = useCallback(() => {
    if (touchDismissRef.current) {
      clearTimeout(touchDismissRef.current);
      touchDismissRef.current = null;
    }
    setTooltipVisible(null);
    setHoveredElement(null);
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (touchDismissRef.current) clearTimeout(touchDismissRef.current);
    };
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  const getGlowStyle = (elementId: string): React.CSSProperties => ({
    boxShadow: hoveredElement === elementId
      ? '0 0 8px rgba(0,255,170,0.8)'
      : '0 0 8px rgba(0,255,170,0.4)',
    transition: 'box-shadow 150ms ease-in-out',
    willChange: 'box-shadow',
  });

  const renderElement = (element: ArchElement) => {
    const isVisible = visibleLevels.includes(element.level);

    return (
      <div
        key={element.id}
        data-testid={`arch-element-${element.id}`}
        data-element-type={element.type}
        className="qdrant-arch-element"
        role="button"
        aria-label={`${element.label} - ${element.tooltip}`}
        tabIndex={0}
        style={{
          position: 'relative',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 300ms ease-in-out, transform 300ms ease-in-out',
          margin: '0.5rem',
          display: 'inline-block',
        }}
        onPointerEnter={() => handlePointerEnter(element.id)}
        onPointerLeave={handlePointerLeave}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTouchStart(element.id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleTouchStart(element.id);
          }
        }}
        onBlur={handlePointerLeave}
      >
        <div style={getGlowStyle(element.id)}>
          <GlowNode label={element.label} size="md" />
        </div>

        {/* Tooltip */}
        {tooltipVisible === element.id && (
          <div
            role="tooltip"
            data-testid={`tooltip-${element.id}`}
            className="qdrant-arch-tooltip"
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: 'var(--color-bg-mute, #1f2937)',
              borderRadius: '6px',
              color: 'var(--color-text, #ffffff)',
              fontSize: '0.75rem',
              whiteSpace: 'nowrap',
              zIndex: 10,
              pointerEvents: 'none',
            }}
          >
            {element.tooltip}
          </div>
        )}
      </div>
    );
  };

  const collection = architectureElements.filter((e) => e.level === 0);
  const points = architectureElements.filter((e) => e.level === 1);
  const details = architectureElements.filter((e) => e.level === 2);

  return (
    <div
      ref={ref}
      className="qdrant-architecture"
      data-testid="qdrant-architecture"
      role="region"
      aria-label="Qdrant 核心架构图"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        padding: '2rem',
      }}
      onClick={handleTouchElsewhere}
    >
      {/* Level 0: Collection */}
      <div
        className="qdrant-arch-level"
        data-testid="arch-level-0"
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        {collection.map(renderElement)}
      </div>

      {/* FlowLine: Collection → Points */}
      {visibleLevels.includes(0) && (
        <FlowLine width={100} height={3} />
      )}

      {/* Level 1: Points */}
      <div
        className="qdrant-arch-level"
        data-testid="arch-level-1"
        style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}
      >
        {points.map(renderElement)}
      </div>

      {/* FlowLine: Points → Vector/Payload */}
      {visibleLevels.includes(1) && (
        <FlowLine width={200} height={3} />
      )}

      {/* Level 2: Vector and Payload */}
      <div
        className="qdrant-arch-level"
        data-testid="arch-level-2"
        style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}
      >
        {details.map(renderElement)}
      </div>
    </div>
  );
}

// Export architecture data for testing
export { architectureElements, type ArchElement };
