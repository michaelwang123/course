<script setup lang="ts">
/**
 * RAGFlow system architecture interactive diagram.
 * Layered layout: User layer (Web UI) → Service layer (API) → Storage layer (ES, MySQL, MinIO, Redis)
 * Uses GlowNode for nodes and FlowLine for connections with directional arrows.
 * Responsive: vertical on mobile (<768px), horizontal on desktop (>=768px).
 */
import { ref } from 'vue'
import GlowNode from './GlowNode.vue'
import FlowLine from './FlowLine.vue'

interface ArchDiagramProps {
  interactive?: boolean
}

const props = withDefaults(defineProps<ArchDiagramProps>(), {
  interactive: true
})

interface NodeDef {
  id: string
  label: string
  layer: 'user' | 'service' | 'storage'
}

interface ConnectionDef {
  from: string
  to: string
}

const nodes: NodeDef[] = [
  { id: 'webui', label: 'Web UI', layer: 'user' },
  { id: 'api', label: 'API Server', layer: 'service' },
  { id: 'es', label: 'Elasticsearch', layer: 'storage' },
  { id: 'mysql', label: 'MySQL', layer: 'storage' },
  { id: 'minio', label: 'MinIO', layer: 'storage' },
  { id: 'redis', label: 'Redis', layer: 'storage' },
]

const connections: ConnectionDef[] = [
  { from: 'webui', to: 'api' },
  { from: 'api', to: 'es' },
  { from: 'api', to: 'mysql' },
  { from: 'api', to: 'minio' },
  { from: 'api', to: 'redis' },
]

const hoveredNode = ref<string | null>(null)

function onNodeEnter(nodeId: string) {
  if (props.interactive) {
    hoveredNode.value = nodeId
  }
}

function onNodeLeave() {
  hoveredNode.value = null
}

function isNodeHighlighted(nodeId: string): boolean {
  if (!hoveredNode.value) return true
  if (nodeId === hoveredNode.value) return true
  return connections.some(
    (c) =>
      (c.from === hoveredNode.value && c.to === nodeId) ||
      (c.to === hoveredNode.value && c.from === nodeId)
  )
}

function isConnectionHighlighted(conn: ConnectionDef): boolean {
  if (!hoveredNode.value) return true
  return conn.from === hoveredNode.value || conn.to === hoveredNode.value
}

function getNodeOpacity(nodeId: string): number {
  if (!hoveredNode.value) return 1
  return isNodeHighlighted(nodeId) ? 1 : 0.3
}

function getConnectionOpacity(conn: ConnectionDef): number {
  if (!hoveredNode.value) return 1
  return isConnectionHighlighted(conn) ? 1 : 0.3
}

const layers = [
  { id: 'user', label: '用户层' },
  { id: 'service', label: '服务层' },
  { id: 'storage', label: '存储层' },
]

function getNodesByLayer(layerId: string): NodeDef[] {
  return nodes.filter((n) => n.layer === layerId)
}

// Get connections going from a layer to the next
function getConnectionsFromLayer(layerId: string): ConnectionDef[] {
  const layerNodeIds = getNodesByLayer(layerId).map((n) => n.id)
  return connections.filter((c) => layerNodeIds.includes(c.from))
}
</script>

<template>
  <div class="arch-diagram" role="img" aria-label="RAGFlow 系统架构图">
    <!-- Desktop Layout (>=768px): horizontal layered -->
    <div class="arch-desktop">
      <template v-for="(layer, layerIdx) in layers" :key="layer.id">
        <div class="arch-layer">
          <div class="arch-layer-label">{{ layer.label }}</div>
          <div class="arch-layer-nodes">
            <div
              v-for="node in getNodesByLayer(layer.id)"
              :key="node.id"
              class="arch-node"
              :style="{ opacity: getNodeOpacity(node.id) }"
              @mouseenter="onNodeEnter(node.id)"
              @mouseleave="onNodeLeave"
            >
              <GlowNode :label="node.label" size="sm" />
            </div>
          </div>
        </div>
        <!-- Connection arrows between layers -->
        <div
          v-if="layerIdx < layers.length - 1"
          class="arch-connectors"
        >
          <div
            v-for="(conn, idx) in getConnectionsFromLayer(layer.id)"
            :key="idx"
            class="arch-connector"
            :style="{ opacity: getConnectionOpacity(conn) }"
          >
            <FlowLine :width="48" :height="3" />
            <span class="arch-arrow" aria-hidden="true">→</span>
          </div>
        </div>
      </template>
    </div>

    <!-- Mobile Layout (<768px): vertical arrangement -->
    <div class="arch-mobile">
      <template v-for="(layer, layerIdx) in layers" :key="layer.id">
        <div class="arch-mobile-layer">
          <div class="arch-layer-label">{{ layer.label }}</div>
          <div class="arch-mobile-nodes">
            <div
              v-for="node in getNodesByLayer(layer.id)"
              :key="node.id"
              class="arch-node"
              :style="{ opacity: getNodeOpacity(node.id) }"
              @mouseenter="onNodeEnter(node.id)"
              @mouseleave="onNodeLeave"
            >
              <GlowNode :label="node.label" size="sm" />
            </div>
          </div>
        </div>
        <!-- Vertical connectors between layers -->
        <div
          v-if="layerIdx < layers.length - 1"
          class="arch-mobile-connectors"
        >
          <div
            v-for="(conn, idx) in getConnectionsFromLayer(layer.id)"
            :key="idx"
            class="arch-mobile-connector"
            :style="{ opacity: getConnectionOpacity(conn) }"
          >
            <FlowLine :width="30" :height="3" />
            <span class="arch-arrow-down" aria-hidden="true">↓</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.arch-diagram {
  width: 100%;
  padding: 1.5rem;
  background: rgba(17, 24, 39, 0.5);
  border: 1px solid rgba(0, 255, 170, 0.15);
  border-radius: 12px;
}

/* Desktop layout: hidden on mobile */
.arch-desktop {
  display: none;
}

@media (min-width: 768px) {
  .arch-desktop {
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: center;
    gap: 0.75rem;
  }
  .arch-mobile {
    display: none;
  }
}

.arch-layer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 80px;
}

.arch-layer-label {
  font-size: 0.7rem;
  color: rgba(0, 255, 170, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  white-space: nowrap;
}

.arch-layer-nodes {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.arch-node {
  transition: opacity 0.3s ease;
  cursor: pointer;
  min-width: 80px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Connectors between layers (desktop) */
.arch-connectors {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding-top: 1.5rem;
}

.arch-connector {
  display: flex;
  align-items: center;
  gap: 0.125rem;
  transition: opacity 0.3s ease;
}

.arch-arrow {
  color: rgba(0, 255, 170, 0.6);
  font-size: 0.875rem;
  line-height: 1;
}

/* Mobile layout */
.arch-mobile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .arch-mobile {
    display: none;
  }
}

.arch-mobile-layer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.arch-mobile-nodes {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
}

.arch-mobile-connectors {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.125rem;
}

.arch-mobile-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: opacity 0.3s ease;
}

.arch-arrow-down {
  color: rgba(0, 255, 170, 0.6);
  font-size: 0.875rem;
  line-height: 1;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .arch-node,
  .arch-connector,
  .arch-mobile-connector {
    transition-duration: 0.01ms !important;
  }
}
</style>
