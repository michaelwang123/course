import React, { useState, useEffect, useRef } from 'react';

/**
 * Vector point coordinates on a 2D plane for the final visualization.
 * Positions are chosen so that:
 * - Text and Code are semantically similar → close together
 * - Image is dissimilar → farther from both text and code
 *
 * Constraint: euclideanDistance(text, code) < 0.5 × euclideanDistance(text, image)
 */
export interface VectorPoint {
  label: string;
  x: number;
  y: number;
}

/** The 3 vector points used in the final coordinate plane visualization */
export const VECTOR_POINTS: VectorPoint[] = [
  { label: 'text', x: 120, y: 180 },
  { label: 'code', x: 150, y: 200 },
  { label: 'image', x: 320, y: 80 },
];

/** Compute Euclidean distance between two 2D points */
export function euclideanDistance2D(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Example input data for the embedding visualization */
export interface EmbeddingInput {
  type: 'text' | 'image' | 'code';
  label: string;
  content: string;
  vector: number[];
}

/** The 3 example inputs with their corresponding vector representations */
export const EMBEDDING_INPUTS: EmbeddingInput[] = [
  {
    type: 'text',
    label: '文本',
    content: '机器学习是人工智能的核心',
    vector: [0.23, -0.87, 0.45, 0.12, -0.56, 0.91],
  },
  {
    type: 'image',
    label: '图片',
    content: '🖼️ neural-network.png',
    vector: [-0.34, 0.76, -0.21, 0.88, 0.43, -0.67],
  },
  {
    type: 'code',
    label: '代码',
    content: 'model.fit(X_train, y_train)',
    vector: [0.31, -0.79, 0.52, 0.08, -0.48, 0.85],
  },
];

/** Animation phase type */
export type AnimationPhase = 'input' | 'processing' | 'output';

interface EmbeddingAnimationProps {
  /** IntersectionObserver threshold for activation. Default: 0.3 */
  threshold?: number;
}

/**
 * EmbeddingAnimation component.
 * Renders a 3-phase sequential animation showing how text, images, and code
 * are converted into high-dimensional vectors and plotted on a 2D coordinate plane.
 *
 * Phases:
 * 1. Input display (fade-in-up)
 * 2. Processing transformation (pulse-glow)
 * 3. Vector output on 2D plane (dot-move)
 *
 * Uses existing keyframes: fade-in-up, pulse-glow, dot-move
 * Color scheme: emerald/green (#00ffaa)
 */
export default function EmbeddingAnimation({
  threshold = 0.3,
}: EmbeddingAnimationProps) {
  const [phase, setPhase] = useState<AnimationPhase>('input');
  const containerRef = useRef<HTMLDivElement>(null);

  // Phase timing: total 4-8 seconds
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: input (1.5s)
    timers.push(
      setTimeout(() => {
        setPhase('processing');
      }, 1500)
    );

    // Phase 2: processing (2s)
    timers.push(
      setTimeout(() => {
        setPhase('output');
      }, 3500)
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="embedding-animation"
      role="region"
      aria-label="向量嵌入过程动画"
      style={{
        position: 'relative',
        padding: '2rem',
        background: 'var(--color-bg-soft, #111827)',
        borderRadius: '12px',
        border: '1px solid var(--color-bg-mute, #1f2937)',
      }}
    >
      {/* Phase 1: Input display */}
      <div
        className="embedding-inputs"
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {EMBEDDING_INPUTS.map((input, index) => (
          <div
            key={input.type}
            className="embedding-input-card"
            data-input-type={input.type}
            style={{
              flex: '1',
              minWidth: '150px',
              padding: '1rem',
              background: 'var(--color-bg, #030712)',
              borderRadius: '8px',
              border: '1px solid var(--color-bg-mute, #1f2937)',
              animationName: 'fade-in-up',
              animationDuration: '0.6s',
              animationDelay: `${index * 0.2}s`,
              animationFillMode: 'both',
              animationTimingFunction: 'ease-out',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.25rem' }}>
              {input.label}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#e5e7eb', marginBottom: '0.5rem' }}>
              {input.content}
            </div>
            <div
              className="vector-dimensions"
              style={{
                fontSize: '0.7rem',
                color: 'var(--color-brand, #00ffaa)',
                fontFamily: 'monospace',
              }}
            >
              [{input.vector.map((v) => v.toFixed(2)).join(', ')}]
            </div>
          </div>
        ))}
      </div>

      {/* Phase 2: Processing transformation */}
      {(phase === 'processing' || phase === 'output') && (
        <div
          className="embedding-processing"
          aria-hidden="true"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          {EMBEDDING_INPUTS.map((input) => (
            <div
              key={`process-${input.type}`}
              className="processing-node"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--color-bg, #030712)',
                border: '2px solid var(--color-brand, #00ffaa)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animationName: 'pulse-glow',
                animationDuration: '1.5s',
                animationIterationCount: phase === 'processing' ? 'infinite' : '1',
                animationTimingFunction: 'ease-in-out',
                boxShadow: '0 0 8px rgba(0,255,170,0.4)',
                willChange: 'box-shadow',
              }}
            >
              <div
                className="data-flow-dot"
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--color-brand, #00ffaa)',
                  animationName: 'dot-move',
                  animationDuration: '1s',
                  animationIterationCount: phase === 'processing' ? 'infinite' : '1',
                  animationTimingFunction: 'linear',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Phase 3: Vector output - 2D coordinate plane */}
      {phase === 'output' && (
        <div className="embedding-output">
          <svg
            width="400"
            height="300"
            viewBox="0 0 400 300"
            aria-hidden="true"
            style={{ width: '100%', maxWidth: '400px', height: 'auto' }}
          >
            {/* Axes */}
            <line x1="40" y1="260" x2="380" y2="260" stroke="#4b5563" strokeWidth="1" />
            <line x1="40" y1="260" x2="40" y2="20" stroke="#4b5563" strokeWidth="1" />

            {/* Vector points */}
            {VECTOR_POINTS.map((point) => (
              <g key={point.label} className="vector-point" data-point-label={point.label}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="6"
                  fill="var(--color-brand, #00ffaa)"
                  style={{
                    animationName: 'dot-move',
                    animationDuration: '0.8s',
                    animationFillMode: 'both',
                    animationTimingFunction: 'ease-out',
                  }}
                />
                <text
                  x={point.x}
                  y={point.y - 12}
                  textAnchor="middle"
                  fill="#e5e7eb"
                  fontSize="11"
                >
                  {point.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
}
