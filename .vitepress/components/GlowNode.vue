<script setup lang="ts">
interface GlowNodeProps {
  label: string
  icon?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<GlowNodeProps>(), {
  size: 'md'
})

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}
</script>

<template>
  <div
    class="glow-node inline-flex items-center gap-2 rounded-full border border-primary/40 bg-gray-900 text-white animate-pulse-glow"
    :class="sizeClasses[props.size]"
  >
    <span v-if="props.icon" :class="props.icon" aria-hidden="true"></span>
    <span>{{ props.label }}</span>
  </div>
</template>

<style scoped>
.glow-node {
  box-shadow: 0 0 8px rgba(0, 255, 170, 0.3), 0 0 16px rgba(0, 255, 170, 0.1);
}

@media (prefers-reduced-motion: reduce) {
  .glow-node {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
