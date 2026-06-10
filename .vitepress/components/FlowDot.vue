<script setup lang="ts">
interface FlowDotProps {
  color?: string
  size?: number
  distance?: number
  duration?: number
  direction?: 'ltr' | 'rtl'
}

const props = withDefaults(defineProps<FlowDotProps>(), {
  color: '#00ffaa',
  size: 6,
  distance: 160,
  duration: 2,
  direction: 'ltr'
})

const translateEnd = props.direction === 'rtl' ? -props.distance : props.distance
</script>

<template>
  <span
    class="flow-dot"
    aria-hidden="true"
    :style="{
      width: `${props.size}px`,
      height: `${props.size}px`,
      backgroundColor: props.color,
      '--dot-distance': `${translateEnd}px`,
      '--dot-duration': `${props.duration}s`
    }"
  />
</template>

<style scoped>
.flow-dot {
  display: inline-block;
  border-radius: 50%;
  opacity: 0;
  will-change: transform, opacity;
  animation: dot-move var(--dot-duration, 2s) ease-in-out infinite;
}

@keyframes dot-move {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateX(var(--dot-distance, 160px));
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .flow-dot {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
