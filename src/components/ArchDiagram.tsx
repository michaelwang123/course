import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// === Public Types (exported for consumers) ===

export interface NodeDef {
  id: string;
  label: string;
  layer: string;
}

export interface ConnectionDef {
  from: string;
  to: string;
}

export interface LayerDef {
  key: string;
  label: string;
}

export interface ArchDiagramProps {
  /** Whether hover interactions are enabled. Default: true */
  interactive?: boolean;
  /** Node definitions. Default: RAGFlow architecture nodes */
  nodes?: NodeDef[];
  /** Connection definitions. Default: RAGFlow connections */
  connections?: ConnectionDef[];
  /** Layer definitions (order determines layout). Default: RAGFlow layers */
  layers?: LayerDef[];
  /** Accessible label for the diagram. Default: "RAGFlow 系统架构图" */
  ariaLabel?: string;
}

// === Default Data (RAGFlow architecture) ===

const defaultNodes: NodeDef[] = [
  { id: 'webui', label: 'Web UI', layer: 'user' },
  { id: 'api', label: 'API Server', layer: 'service' },
  { id: 'es', label: 'Elasticsearch', layer: 'storage' },
  { id: 'mysql', label: 'MySQL', layer: 'storage' },
  { id: 'minio', label: 'MinIO', layer: 'storage' },
  { id: 'redis', label: 'Redis', layer: 'storage' },
];

const defaultConnections: ConnectionDef[] = [
  { from: 'webui', to: 'api' },
  { from: 'api', to: 'es' },
  { from: 'api', to: 'mysql' },
  { from: 'api', to: 'minio' },
  { from: 'api', to: 'redis' },
];

const defaultLayers: LayerDef[] = [
  { key: 'user', label: '用户层' },
  { key: 'service', label: '服务层' },
  { key: 'storage', label: '存储层' },
];

// === Helper: build adjacency map ===

function buildAdjacencyMap(
  nodeList: NodeDef[],
  connList: ConnectionDef[],
): Record<string, Set<string>> {
  const map: Record<string, Set<string>> = {};
  for (const node of nodeList) {
    map[node.id] = new Set([node.id]);
  }
  for (const conn of connList) {
    map[conn.from]?.add(conn.to);
    map[conn.to]?.add(conn.from);
  }
  return map;
}

// === SVG Connection Line Coordinates ===

interface LineCoords {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export default function ArchDiagram({
  interactive = true,
  nodes = defaultNodes,
  connections = defaultConnections,
  layers = defaultLayers,
  ariaLabel = 'RAGFlow 系统架构图',
}: ArchDiagramProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [lineCoords, setLineCoords] = useState<Record<string, LineCoords>>({});

  // Build adjacency map (memoized on data changes)
  const adjacencyMap = useMemo(
    () => buildAdjacencyMap(nodes, connections),
    [nodes, connections],
  );

  const connectedSet = useMemo<Set<string> | null>(
    () => (hoveredNodeId ? adjacencyMap[hoveredNodeId] ?? null : null),
    [hoveredNodeId, adjacencyMap],
  );

  const getNodeOpacity = useCallback(
    (nodeId: string): number => {
      if (!interactive || !connectedSet) return 1;
      return connectedSet.has(nodeId) ? 1 : 0.3;
    },
    [interactive, connectedSet],
  );

  const getConnectionOpacity = useCallback(
    (conn: ConnectionDef): number => {
      if (!interactive || !hoveredNodeId) return 1;
      return (conn.from === hoveredNodeId || conn.to === hoveredNodeId) ? 1 : 0.3;
    },
    [interactive, hoveredNodeId],
  );

  const handleMouseEnter = useCallback(
    (nodeId: string) => { if (interactive) setHoveredNodeId(nodeId); },
    [interactive],
  );

  const handleMouseLeave = useCallback(
    () => { if (interactive) setHoveredNodeId(null); },
    [interactive],
  );

  // Measure node positions and compute SVG line coordinates
  useEffect(() => {
    function updateLines() {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newCoords: Record<string, LineCoords> = {};

      for (const conn of connections) {
        const fromEl = nodeRefs.current[conn.from];
        const toEl = nodeRefs.current[conn.to];
        if (!fromEl || !toEl) continue;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        newCoords[`${conn.from}-${conn.to}`] = {
          x1: fromRect.left + fromRect.width / 2 - containerRect.left,
          y1: fromRect.top + fromRect.height / 2 - containerRect.top,
          x2: toRect.left + toRect.width / 2 - containerRect.left,
          y2: toRect.top + toRect.height / 2 - containerRect.top,
        };
      }

      setLineCoords(newCoords);
    }

    // Initial measurement after layout
    const timer = setTimeout(updateLines, 50);

    // Re-measure on resize
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateLines)
      : null;
    if (observer && containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [connections, nodes, layers]);

  // Determine if we have computed coordinates (SSR/test env may not have DOM measurements)
  const hasCoords = Object.keys(lineCoords).length > 0;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className="arch-diagram"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '2rem',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '1.5rem',
        width: '100%',
        position: 'relative',
      }}
    >
      {layers.map((layer) => {
        const layerNodes = nodes.filter((n) => n.layer === layer.key);
        return (
          <div
            key={layer.key}
            className="arch-diagram__layer"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              flex: 1,
            }}
          >
            <span
              className="arch-diagram__layer-label"
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-text-muted, #9ca3af)',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              {layer.label}
            </span>
            {layerNodes.map((node) => (
              <span
                key={node.id}
                ref={(el) => { nodeRefs.current[node.id] = el; }}
                data-node-id={node.id}
                className="arch-diagram__node"
                onMouseEnter={() => handleMouseEnter(node.id)}
                onMouseLeave={handleMouseLeave}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  boxShadow: '0 0 8px rgba(0,255,170,0.4)',
                  border: '1px solid rgba(0,255,170,0.3)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text, #ffffff)',
                  background: 'var(--color-bg-soft, #111827)',
                  opacity: getNodeOpacity(node.id),
                  transition: 'opacity 300ms ease',
                  cursor: interactive ? 'pointer' : 'default',
                }}
              >
                {node.label}
              </span>
            ))}
          </div>
        );
      })}

      {/* SVG connections — rendered when DOM measurements are available */}
      {hasCoords && (
        <svg
          className="arch-diagram__svg-connections"
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            overflow: 'visible',
          }}
        >
          {connections.map((conn) => {
            const coords = lineCoords[`${conn.from}-${conn.to}`];
            if (!coords) return null;
            return (
              <line
                key={`${conn.from}-${conn.to}`}
                data-from={conn.from}
                data-to={conn.to}
                className="arch-diagram__connection"
                x1={coords.x1}
                y1={coords.y1}
                x2={coords.x2}
                y2={coords.y2}
                stroke="rgba(0,255,170,0.4)"
                strokeWidth="2"
                strokeDasharray="8 6"
                strokeLinecap="round"
                style={{
                  opacity: getConnectionOpacity(conn),
                  transition: 'opacity 300ms ease',
                }}
              />
            );
          })}
        </svg>
      )}

      {/* Fallback: text-based connections for environments without layout (SSR, tests) */}
      {!hasCoords && (
        <div className="arch-diagram__connections-list" aria-hidden="true">
          {connections.map((conn) => (
            <span
              key={`${conn.from}-${conn.to}`}
              data-from={conn.from}
              data-to={conn.to}
              className="arch-diagram__connection"
              style={{
                opacity: getConnectionOpacity(conn),
                transition: 'opacity 300ms ease',
                fontSize: '0.7rem',
                color: 'var(--color-brand, #00ffaa)',
                whiteSpace: 'nowrap',
              }}
            >
              {(nodes.find((n) => n.id === conn.from)?.label ?? conn.from)} →{' '}
              {(nodes.find((n) => n.id === conn.to)?.label ?? conn.to)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
