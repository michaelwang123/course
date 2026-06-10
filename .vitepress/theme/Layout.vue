<script setup>
import DefaultTheme from 'vitepress/theme'
import { useRouter } from 'vitepress'
import { onMounted } from 'vue'

const { Layout } = DefaultTheme
const router = useRouter()

// View Transitions API integration
router.onBeforeRouteChange = (to) => {
  if (document.startViewTransition) {
    document.startViewTransition(() => {
      // VitePress handles the route change internally
    })
    return false
  }
  return true
}

// Setup Intersection Observer for scroll-triggered animations
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible')
        }
      })
    },
    { threshold: 0.1 }
  )

  // Observe elements with the scroll-reveal class
  document.querySelectorAll('.scroll-reveal').forEach((el) => {
    observer.observe(el)
  })
})
</script>

<template>
  <Layout />
</template>

<style>
/* View Transitions fallback */
.VPContent {
  transition: opacity 0.2s ease;
}
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
}
</style>
