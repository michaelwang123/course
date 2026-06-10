import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import FlowLine from '../components/FlowLine.vue'
import GlowNode from '../components/GlowNode.vue'
import AnimatedCard from '../components/AnimatedCard.vue'
import FlowDot from '../components/FlowDot.vue'
import ScrollReveal from '../components/ScrollReveal.vue'
import ArchDiagram from '../components/ArchDiagram.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('FlowLine', FlowLine)
    app.component('GlowNode', GlowNode)
    app.component('AnimatedCard', AnimatedCard)
    app.component('FlowDot', FlowDot)
    app.component('ScrollReveal', ScrollReveal)
    app.component('ArchDiagram', ArchDiagram)
  }
} satisfies Theme
