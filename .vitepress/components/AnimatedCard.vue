<script setup lang="ts">
interface AnimatedCardProps {
  title: string
  description: string
  icon?: string
  link?: string
  delay?: number
}

const props = withDefaults(defineProps<AnimatedCardProps>(), {
  delay: 0
})
</script>

<template>
  <component
    :is="props.link ? 'a' : 'div'"
    :href="props.link"
    class="animated-card"
    :style="{ animationDelay: `${props.delay}ms` }"
  >
    <span v-if="props.icon" class="animated-card__icon">{{ props.icon }}</span>
    <h3 class="animated-card__title">{{ props.title }}</h3>
    <p class="animated-card__description">{{ props.description }}</p>
  </component>
</template>

<style scoped>
.animated-card {
  display: block;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #1f2937;
  background: #111827;
  text-decoration: none;
  opacity: 0;
  animation: fade-in-up 0.8s ease-out forwards;
  transition: transform 250ms ease, opacity 250ms ease;
  will-change: transform, opacity;
}

.animated-card:hover {
  transform: translateY(-4px);
  border-color: #00ffaa;
  background: linear-gradient(135deg, #111827 0%, rgba(0, 255, 170, 0.05) 100%);
}

.animated-card__icon {
  display: inline-block;
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}

.animated-card__title {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #ffffff;
}

.animated-card__description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #9ca3af;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animated-card {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    opacity: 1;
  }
}
</style>
