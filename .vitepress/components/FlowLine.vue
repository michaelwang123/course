<script setup lang="ts">
interface FlowLineProps {
  width?: number
  height?: number
  color?: string
  speed?: number
}

const props = withDefaults(defineProps<FlowLineProps>(), {
  width: 200,
  height: 4,
  color: 'rgba(0,255,170,0.4)',
  speed: 1.5
})
</script>

<template>
  <svg
    :width="props.width"
    :height="props.height"
    :viewBox="`0 0 ${props.width} ${props.height}`"
    xmlns="http://www.w3.org/2000/svg"
    class="flow-line"
    aria-hidden="true"
  >
    <line
      x1="0"
      :y1="props.height / 2"
      :x2="props.width"
      :y2="props.height / 2"
      :stroke="props.color"
      :stroke-width="props.height / 2"
      stroke-dasharray="8 6"
      stroke-linecap="round"
      class="flow-line__path"
      :style="{ animationDuration: `${props.speed}s` }"
    />
  </svg>
</template>

<style scoped>
.flow-line__path {
  animation: dash-flow var(--speed, 1.5s) linear infinite;
}

@keyframes dash-flow {
  to {
    stroke-dashoffset: -20;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow-line__path {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
