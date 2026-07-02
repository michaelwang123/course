import React, { useState, useEffect, useRef, useMemo } from 'react';
import FlowLine from '../FlowLine';
import FlowDot from '../FlowDot';
import { useAnimationSlot } from '../../hooks/useAnimationSlot';

// ─── Exported Constants & Data ───────────────────────────────────────────────

/** Pipeline stage definition */
export interface PipelineStage {
  id: string;
  label: string;
  duration: number; // ms, between 800-1500
}

/** The 5 pipeline stages with configured durations */
export const PIPELINE_STAGES: PipelineStage[] = [
  { id: 'query', label: 'User Query', duration: 800 },
  { id: 'embedding', label: 'Embedding Model', duration: 1000 },
  { id: 'vector', label: 'Vector', duration: 800 },
  { id: 'ann-search', label: 'ANN Search', duration: 1500 },
  { id: 'results', label: 'Ranked Results', duration: 1000 },
];

/** ANN Search sub-animation duration in ms (between 1000-2000ms) */
export const ANN_SEARCH_DURATION = 1500;

/** Minimum number of nodes in the ANN mini-graph */
export const ANN_MIN_NODES = 3;

/** HNSW mini-animation node data */
export interface MiniGraphNode {
  id: string;
  x: number;
  y: number;
  visited: boolean;
}

/** Default mini-graph nodes for ANN Search visualization (≥3 nodes) */
export const MINI_GRAPH_NODES: MiniGraphNode[] = [
  { id: 'n1', x: 20, y: 15, visited: false },
  { id: 'n2', x: 50, y: 35, visited: false },
  { id: 'n3', x: 80, y: 20, visited: false },
  { id: 'n4', x: 65, y: 55, visited: false },
];

/** Ranked result items shown at the final stage */
export const RANKED_RESULTS = [
  { rank: 1, label: 'ML基础教程', score: 0.95 },
  { rank: 2, label: '深度学习入门', score: 0.87 },
  { rank: 3, label: '神经网络概述', score: 0.82 },
];

/** Breakpoint for vertical layout */
export const MOBILE_BREAKPOINT = 768;

// ─── Component Props ─────────────────────────────────────────────────────────

interface SearchFlowProps {
  /** Override layout direction. Auto-detected from viewport if not provided. */
  vertical?: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** Stage content for User Query */
function QueryContent() {
  return (
    <div style={{ fontSize: '0.75rem', color: 'var(--color-brand, #00ffaa)', fontFamily: 'monospace' }}>
      "什么是机器学习"
    </div>
  );
}

/** Stage content for Embedding Model */
function EmbeddingContent() {
  return (
    <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>
      BERT / text-embedding
    </div>
  );
}

/** Stage content for Vector */
function VectorContent() {
  return (
    <div style={{ fontSize: '0.7rem', color: 'var(--color-brand, #00ffaa)', fontFamily: 'monospace' }}>
      [0.12, -0.34, 0.56, …]
    </div>
  );
}

/** Mini HNSW traversal animation for ANN Search stage */
function AnnSearchContent({ isActive }: { isActive: boolean }) {
  const [visitedIndex, setVisitedIndex] = useState(-1);

  useEffect(() => {
    if (!isActive) {
      setVisitedIndex(-1);
      return;
    }

    const stepDuration = ANN_SEARCH_DURATION / MINI_GRAPH_NODES.length;
    const timers: ReturnType<typeof setTimeout>[] = [];

    MINI_GRAPH_NODES.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setVisitedIndex(i);
        }, stepDuration * (i + 1))
      );
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isActive]);

  return (
    <svg
      width="100"
      height="70"
      viewBox="0 0 100 70"
      aria-hidden="true"
      style={{ display: 'block', margin: '0 auto' }}
      data-testid="ann-mini-graph"
    >
      {/* Edges */}
      <line x1="20" y1="15" x2="50" y2="35" stroke="#4b5563" strokeWidth="1" />
      <line x1="50" y1="35" x2="80" y2="20" stroke="#4b5563" strokeWidth="1" />
      <line x1="50" y1="35" x2="65" y2="55" stroke="#4b5563" strokeWidth="1" />

      {/* Traversal edges — highlighted when visited */}
      {visitedIndex >= 1 && (
        <line
          x1={MINI_GRAPH_NODES[0].x}
          y1={MINI_GRAPH_NODES[0].y}
          x2={MINI_GRAPH_NODES[1].x}
          y2={MINI_GRAPH_NODES[1].y}
          stroke="var(--color-brand, #00ffaa)"
          strokeWidth="2"
          strokeDasharray="4 3"
          style={{ animation: 'dash-flow 1s linear infinite' }}
        />
      )}
      {visitedIndex >= 2 && (
        <line
          x1={MINI_GRAPH_NODES[1].x}
          y1={MINI_GRAPH_NODES[1].y}
          x2={MINI_GRAPH_NODES[2].x}
          y2={MINI_GRAPH_NODES[2].y}
          stroke="var(--color-brand, #00ffaa)"
          strokeWidth="2"
          strokeDasharray="4 3"
          style={{ animation: 'dash-flow 1s linear infinite' }}
        />
      )}
      {visitedIndex >= 3 && (
        <line
          x1={MINI_GRAPH_NODES[1].x}
          y1={MINI_GRAPH_NODES[1].y}
          x2={MINI_GRAPH_NODES[3].x}
          y2={MINI_GRAPH_NODES[3].y}
          stroke="var(--color-brand, #00ffaa)"
          strokeWidth="2"
          strokeDasharray="4 3"
          style={{ animation: 'dash-flow 1s linear infinite' }}
        />
      )}

      {/* Nodes */}
      {MINI_GRAPH_NODES.map((node, i) => (
        <circle
          key={node.id}
          cx={node.x}
          cy={node.y}
          r="6"
          fill={i <= visitedIndex ? 'var(--color-brand, #00ffaa)' : 'var(--color-bg-mute, #1f2937)'}
          stroke={i <= visitedIndex ? 'var(--color-brand, #00ffaa)' : '#4b5563'}
          strokeWidth="1.5"
          style={
            i <= visitedIndex
              ? { animation: 'pulse-glow 1s ease-in-out infinite', willChange: 'box-shadow' }
              : undefined
          }
        />
      ))}
    </svg>
  );
}

/** Stage content for Ranked Results */
function ResultsContent() {
  return (
    <div style={{ fontSize: '0.65rem', lineHeight: 1.6 }}>
      {RANKED_RESULTS.map((r) => (
        <div key={r.rank} style={{ color: '#e5e7eb' }}>
          <span style={{ color: 'var(--color-brand, #00ffaa)', marginRight: '4px' }}>#{r.rank}</span>
          {r.label}
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

/**
 * SearchFlow component.
 * Renders a 5-stage pipeline animation for vector search:
 * User Query → Embedding Model → Vector → ANN Search → Ranked Results
 *
 * - Uses FlowLine and FlowDot for inter-stage connections
 * - Animates sequential data flow (800-1500ms per stage)
 * - Handles prefers-reduced-motion: shows all stages simultaneously
 * - Stacks vertically below 768px viewport width
 * - Uses useAnimationSlot with 0.1 threshold
 */
export default function SearchFlow({ vertical: verticalProp }: SearchFlowProps) {
  const { ref, isActive } = useAnimationSlot({ threshold: 0.1 });
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [isVertical, setIsVertical] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const animationTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Detect viewport width for vertical layout
  useEffect(() => {
    if (verticalProp !== undefined) {
      setIsVertical(verticalProp);
      return;
    }
    if (typeof window === 'undefined') return;

    const checkWidth = () => setIsVertical(window.innerWidth < MOBILE_BREAKPOINT);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [verticalProp]);

  // Sequential animation logic
  useEffect(() => {
    // Clear any existing timers
    animationTimers.current.forEach(clearTimeout);
    animationTimers.current = [];

    if (reducedMotion) {
      // Show all stages simultaneously without animation
      setActiveStageIndex(PIPELINE_STAGES.length - 1);
      return;
    }

    if (!isActive) {
      setActiveStageIndex(-1);
      return;
    }

    // Animate stages sequentially
    let cumulativeDelay = 0;
    PIPELINE_STAGES.forEach((stage, index) => {
      const timer = setTimeout(() => {
        setActiveStageIndex(index);
      }, cumulativeDelay);
      animationTimers.current.push(timer);
      cumulativeDelay += stage.duration;
    });

    return () => {
      animationTimers.current.forEach(clearTimeout);
      animationTimers.current = [];
    };
  }, [isActive, reducedMotion]);

  // Determine which stages are visible
  const isStageVisible = (index: number): boolean => {
    if (reducedMotion) return true;
    return index <= activeStageIndex;
  };

  const isStageActive = (index: number): boolean => {
    if (reducedMotion) return true;
    return index === activeStageIndex;
  };

  // Render stage intermediate content
  const renderStageContent = (stageId: string, active: boolean) => {
    if (!active && !reducedMotion) return null;

    switch (stageId) {
      case 'query':
        return <QueryContent />;
      case 'embedding':
        return <EmbeddingContent />;
      case 'vector':
        return <VectorContent />;
      case 'ann-search':
        return <AnnSearchContent isActive={active} />;
      case 'results':
        return <ResultsContent />;
      default:
        return null;
    }
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: isVertical ? 'column' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isVertical ? '0.5rem' : '0.25rem',
    padding: '2rem 1rem',
    background: 'var(--color-bg-soft, #111827)',
    borderRadius: '12px',
    border: '1px solid var(--color-bg-mute, #1f2937)',
    overflow: 'hidden',
  };

  const stageStyle = (visible: boolean, active: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: isVertical ? '160px' : '120px',
    minHeight: '80px',
    padding: '0.75rem',
    background: active
      ? 'rgba(0, 255, 170, 0.05)'
      : 'var(--color-bg, #030712)',
    border: active
      ? '1.5px solid var(--color-brand, #00ffaa)'
      : '1px solid var(--color-bg-mute, #1f2937)',
    borderRadius: '10px',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : (isVertical ? 'translateY(10px)' : 'translateX(-10px)'),
    transition: reducedMotion ? 'none' : 'opacity 0.3s ease, transform 0.3s ease, border-color 0.3s ease',
  });

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#e5e7eb',
    marginBottom: '0.4rem',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className="search-flow"
      data-testid="search-flow"
      data-vertical={isVertical}
      data-reduced-motion={reducedMotion}
      role="region"
      aria-label="向量检索全流程动画"
      style={containerStyle}
    >
      {PIPELINE_STAGES.map((stage, index) => (
        <React.Fragment key={stage.id}>
          {/* Stage node */}
          <div
            className="search-flow__stage"
            data-stage-id={stage.id}
            data-stage-active={isStageActive(index)}
            style={stageStyle(isStageVisible(index), isStageActive(index))}
          >
            <div style={labelStyle}>{stage.label}</div>
            <div className="search-flow__stage-content">
              {renderStageContent(stage.id, isStageActive(index))}
            </div>
          </div>

          {/* Connector between stages (not after the last one) */}
          {index < PIPELINE_STAGES.length - 1 && (
            <div
              className="search-flow__connector"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isStageVisible(index) ? 1 : 0,
                transition: reducedMotion ? 'none' : 'opacity 0.3s ease',
                transform: isVertical ? 'rotate(90deg)' : undefined,
              }}
            >
              <FlowLine
                width={isVertical ? 30 : 40}
                height={3}
                color="rgba(0,255,170,0.4)"
                speed={1.5}
              />
              <FlowDot
                color="#00ffaa"
                size={5}
                distance={isVertical ? 25 : 35}
                duration={1.5}
                direction="ltr"
              />
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
