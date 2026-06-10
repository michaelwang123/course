<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface ScrollRevealProps {
  animation?: 'fade-in-up' | 'fade-in' | 'scale-in'
  delay?: number
  threshold?: number
}

const props = withDefaults(defineProps<ScrollRevealProps>(), {
  animation: 'fade-in-up',
  delay: 0,
  threshold: 0.1
})

const containerRef = ref<HTMLElement | null>(null)
const isVisible = ref(false)

let observer: IntersectionObserver | null = null

onMounted(() => {
  // Graceful degradation: if IntersectionObserver is unavailable (SSR or old browser), show immediately
  if (typeof IntersectionObserver === 'undefined') {
    isVisible.value = true
    return
  }

  const el = containerRef.value
  if (!el) {
    isVisible.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          isVisible.value = true
          // One-time trigger: unobserve after animation is triggered
          observer?.unobserve(entry.target)
        }
      }
    },
    { threshold: props.threshold }
  )

  observer.observe(el)
})

onUnmounted(() => {
  if (observer && containerRef.value) {
    observer.unobserve(containerRef.value)
  }
  observer = null
})
</script>

<template>
  <div
    ref="containerRef"
    class="scroll-reveal"
    :class="[
      `scroll-reveal--${props.animation}`,
      { 'scroll-reveal--visible': isVisible }
    ]"
    :style="{ transitionDelay: `${props.delay}ms`, animationDelay: `${props.delay}ms` }"
  >
    <slot />
  </div>
</template>

<style scoped>
.scroll-reveal {
  will-change: transform, opacity;
}

/* fade-in-up: start 20px below with opacity 0 */
.scroll-reveal--fade-in-up {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 700ms ease-out, transform 700ms ease-out;
}

.scroll-reveal--fade-in-up.scroll-reveal--visible {
  opacity: 1;
  transform: translateY(0);
}

/* fade-in: just opacity */
.scroll-reveal--fade-in {
  opacity: 0;
  transition: opacity 700ms ease-out;
}

.scroll-reveal--fade-in.scroll-reveal--visible {
  opacity: 1;
}

/* scale-in: scale from slightly smaller */
.scroll-reveal--scale-in {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 700ms ease-out, transform 700ms ease-out;
}

.scroll-reveal--scale-in.scroll-reveal--visible {
  opacity: 1;
  transform: scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .scroll-reveal {
    opacity: 1 !important;
    transform: none !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
