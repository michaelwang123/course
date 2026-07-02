import React, { useState, useEffect, useMemo } from 'react';
import { useAnimationSlot } from '../../hooks/useAnimationSlot';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GraphNode {
  id: string;
  layer: number;       // 0, 1, or 2
  x: number;           // SVG x position
  y: number;           // SVG y position
  isEntryPoint: boolean;
  isTarget: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  layer: number;
  isCrossLayer: boolean;
}

export interface HNSWLayerConfig {
  level: number;
  nodeCount: { min: number; max: number };
  label: string;
}

export interface HNSWConfig {
  layers: HNSWLayerConfig[];
}

// ─── Layer Configurations ────────────────────────────────────────────────────

export const desktopConfig: HNSWConfig = {
  layers: [
    { level: 2, nodeCount: { min: 2, max: 3 }, label: 'Layer 2 — 粗导航层' },
    { level: 1, nodeCount: { min: 5, max: 8 }, label: 'Layer 1 — 细导航层' },
    { level: 0, nodeCount: { min: 12, max: 20 }, label: 'Layer 0 — 数据层' },
  ],
};

export const mobileConfig: HNSWConfig = {
  layers: [
    { level: 2, nodeCount: { min: 2, max: 3 }, label: 'Layer 2 — 粗导航层' },
    { level: 1, nodeCount: { min: 5, max: 8 }, label: 'Layer 1 — 细导航层' },
    { level: 0, nodeCount: { min: 8, max: 12 }, label: 'Layer 0 — 数据层' },
  ],
};

// ─── Graph Generation ────────────────────────────────────────────────────────

/**
 * Generates a deterministic node count for a layer given a seed.
 * The count is clamped between min and max (inclusive).
 */
export function getNodeCount(min: number, max: number, seed?: number): number {
  if (seed !== undefined) {
    // Deterministic for testing: use seed to pick a value in range
    const range = max - min + 1;
    return min + (Math.abs(seed) % range);
  }
  // Random for production
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates layer data (node counts) based on viewport width.
 * Exported for testability — this is the core logic for Property 8 tests.
 */
export function generateLayerNodeCounts(viewportWidth: number, seed?: number): {
  layer2: number;
  layer1: number;
  layer0: number;
} {
  const config = viewportWidth < 768 ? mobileConfig : desktopConfig;
  const layer2Config = config.layers.find((l) => l.level === 2)!;
  const layer1Config = config.layers.find((l) => l.level === 1)!;
  const layer0Config = config.layers.find((l) => l.level === 0)!;

  return {
    layer2: getNodeCount(layer2Config.nodeCount.min, layer2Config.nodeCount.max, seed !== undefined ? seed : undefined),
    layer1: getNodeCount(layer1Config.nodeCount.min, layer1Config.nodeCount.max, seed !== undefined ? seed + 1 : undefined),
    layer0: getNodeCount(layer0Config.nodeCount.min, layer0Config.nodeCount.max, seed !== undefined ? seed + 2 : undefined),
  };
}

/**
 * Generates graph nodes positioned within the SVG canvas.
 * Nodes are distributed horizontally within each layer band.
 */
export function generateGraphNodes(
  layer2Count: number,
  layer1Count: number,
  layer0Count: number,
  svgWidth: number,
  svgHeight: number,
): GraphNode[] {
  const nodes: GraphNode[] = [];
  const padding = 40;
  const usableWidth = svgWidth - padding * 2;

  // Layer vertical positions (top to bottom: Layer 2, Layer 1, Layer 0)
  const layerY = {
    2: svgHeight * 0.15,
    1: svgHeight * 0.45,
    0: svgHeight * 0.78,
  };

  // Generate nodes for each layer
  const generateLayerNodes = (count: number, layer: number) => {
    const y = layerY[layer as 0 | 1 | 2];
    const spacing = usableWidth / (count + 1);
    for (let i = 0; i < count; i++) {
      const x = padding + spacing * (i + 1);
      nodes.push({
        id: `L${layer}-N${i}`,
        layer,
        x,
        y: y + (Math.sin(i * 1.3) * 10), // slight vertical variation
        isEntryPoint: layer === 2 && i === 0,
        isTarget: layer === 0 && i === Math.floor(count / 2),
      });
    }
  };

  generateLayerNodes(layer2Count, 2);
  generateLayerNodes(layer1Count, 1);
  generateLayerNodes(layer0Count, 0);

  return nodes;
}

/**
 * Generates edges connecting nodes within layers and across adjacent layers.
 */
export function generateGraphEdges(nodes: GraphNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const layers = [2, 1, 0];

  for (const layer of layers) {
    const layerNodes = nodes.filter((n) => n.layer === layer);

    // Within-layer edges: connect each node to its neighbors
    for (let i = 0; i < layerNodes.length - 1; i++) {
      edges.push({
        from: layerNodes[i].id,
        to: layerNodes[i + 1].id,
        layer,
        isCrossLayer: false,
      });
      // Add some skip connections for realism
      if (i + 2 < layerNodes.length && i % 2 === 0) {
        edges.push({
          from: layerNodes[i].id,
          to: layerNodes[i + 2].id,
          layer,
          isCrossLayer: false,
        });
      }
    }
  }

  // Cross-layer edges: connect some nodes between adjacent layers
  for (const upperLayer of [2, 1]) {
    const lowerLayer = upperLayer - 1;
    const upperNodes = nodes.filter((n) => n.layer === upperLayer);
    const lowerNodes = nodes.filter((n) => n.layer === lowerLayer);

    for (const upperNode of upperNodes) {
      // Each upper node connects to 1-2 lower layer nodes
      const connectCount = Math.min(2, lowerNodes.length);
      // Find closest lower nodes by x position
      const sorted = [...lowerNodes].sort(
        (a, b) => Math.abs(a.x - upperNode.x) - Math.abs(b.x - upperNode.x)
      );
      for (let i = 0; i < connectCount; i++) {
        edges.push({
          from: upperNode.id,
          to: sorted[i].id,
          layer: upperLayer,
          isCrossLayer: true,
        });
      }
    }
  }

  return edges;
}

// ─── Hook: Viewport Width Detection ─────────────────────────────────────────

function useViewportWidth(): number {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

// ─── Component ───────────────────────────────────────────────────────────────

interface HNSWGraphProps {
  /** Whether to use mobile-optimized node counts. Auto-detected if not provided. */
  mobile?: boolean;
}

export default function HNSWGraph({ mobile }: HNSWGraphProps) {
  const { ref, isActive, isInViewport } = useAnimationSlot({ threshold: 0.2 });
  const viewportWidth = useViewportWidth();

  const isMobile = mobile !== undefined ? mobile : viewportWidth < 768;
  const svgWidth = isMobile ? 360 : 600;
  const svgHeight = isMobile ? 320 : 400;

  // Generate graph data (memoized based on mobile state)
  const { nodes, edges } = useMemo(() => {
    const counts = generateLayerNodeCounts(isMobile ? 600 : 1024);
    const graphNodes = generateGraphNodes(
      counts.layer2,
      counts.layer1,
      counts.layer0,
      svgWidth,
      svgHeight,
    );
    const graphEdges = generateGraphEdges(graphNodes);
    return { nodes: graphNodes, edges: graphEdges };
  }, [isMobile, svgWidth, svgHeight]);

  // Track visited nodes (for search traversal animation — implemented in 6.1b)
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set());

  // Layer labels and Y positions for rendering
  const config = isMobile ? mobileConfig : desktopConfig;
  const layerLabels = config.layers;

  return (
    <div
      ref={ref}
      className="hnsw-graph"
      data-testid="hnsw-graph"
      role="region"
      aria-label="HNSW 索引结构图"
      style={{
        position: 'relative',
        padding: '1.5rem',
        background: 'var(--color-bg-soft, #111827)',
        borderRadius: '12px',
        border: '1px solid var(--color-bg-mute, #1f2937)',
      }}
    >
      {/* Layer Labels */}
      <div
        className="hnsw-graph-labels"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        {layerLabels.map((layer) => (
          <span
            key={layer.level}
            className="hnsw-layer-label"
            data-testid={`hnsw-label-layer-${layer.level}`}
            style={{
              fontSize: '0.75rem',
              color: '#9ca3af',
              fontFamily: 'monospace',
            }}
          >
            {layer.label}
          </span>
        ))}
      </div>

      {/* SVG Graph */}
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        aria-hidden="true"
        data-testid="hnsw-svg"
        style={{ width: '100%', maxWidth: `${svgWidth}px`, height: 'auto' }}
      >
        {/* Layer separator lines */}
        {[0.3, 0.62].map((ratio, i) => (
          <line
            key={`separator-${i}`}
            x1="0"
            y1={svgHeight * ratio}
            x2={svgWidth}
            y2={svgHeight * ratio}
            stroke="#374151"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
        ))}

        {/* Edges (paths) */}
        {edges.map((edge) => {
          const fromNode = nodes.find((n) => n.id === edge.from);
          const toNode = nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;

          const isVisited =
            visitedNodes.has(edge.from) && visitedNodes.has(edge.to);

          return (
            <path
              key={`${edge.from}-${edge.to}`}
              className="hnsw-edge"
              data-testid={`hnsw-edge-${edge.from}-${edge.to}`}
              d={
                edge.isCrossLayer
                  ? `M ${fromNode.x} ${fromNode.y} C ${fromNode.x} ${(fromNode.y + toNode.y) / 2}, ${toNode.x} ${(fromNode.y + toNode.y) / 2}, ${toNode.x} ${toNode.y}`
                  : `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`
              }
              fill="none"
              stroke={isVisited ? '#00ffaa' : '#374151'}
              strokeWidth={isVisited ? 2 : 1}
              strokeDasharray={isVisited ? '8 4' : 'none'}
              style={
                isVisited
                  ? {
                      animationName: 'dash-flow',
                      animationDuration: '1s',
                      animationIterationCount: 'infinite',
                      animationTimingFunction: 'linear',
                    }
                  : undefined
              }
            />
          );
        })}

        {/* Nodes (circles) */}
        {nodes.map((node) => {
          const isVisited = visitedNodes.has(node.id);

          return (
            <circle
              key={node.id}
              className="hnsw-node"
              data-testid={`hnsw-node-${node.id}`}
              data-layer={node.layer}
              cx={node.x}
              cy={node.y}
              r={node.isEntryPoint || node.isTarget ? 7 : 5}
              fill={isVisited ? '#00ffaa' : 'var(--color-bg, #030712)'}
              stroke={isVisited ? '#00ffaa' : '#374151'}
              strokeWidth={isVisited ? 2 : 1.5}
              style={
                isVisited
                  ? {
                      animationName: 'pulse-glow',
                      animationDuration: '1.5s',
                      animationIterationCount: 'infinite',
                      animationTimingFunction: 'ease-in-out',
                      willChange: 'box-shadow',
                    }
                  : undefined
              }
            />
          );
        })}

        {/* Entry point indicator */}
        {nodes
          .filter((n) => n.isEntryPoint)
          .map((node) => (
            <text
              key={`entry-${node.id}`}
              x={node.x}
              y={node.y - 14}
              textAnchor="middle"
              fill="#00ffaa"
              fontSize="9"
              fontFamily="monospace"
            >
              entry
            </text>
          ))}

        {/* Target node indicator */}
        {nodes
          .filter((n) => n.isTarget)
          .map((node) => (
            <text
              key={`target-${node.id}`}
              x={node.x}
              y={node.y + 18}
              textAnchor="middle"
              fill="#f59e0b"
              fontSize="9"
              fontFamily="monospace"
            >
              target
            </text>
          ))}
      </svg>
    </div>
  );
}
