import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ArchDiagram from './ArchDiagram.vue'

describe('ArchDiagram.vue', () => {
  it('renders the diagram container with correct accessibility attributes', () => {
    const wrapper = mount(ArchDiagram)
    const diagram = wrapper.find('.arch-diagram')
    expect(diagram.exists()).toBe(true)
    expect(diagram.attributes('role')).toBe('img')
    expect(diagram.attributes('aria-label')).toBe('RAGFlow 系统架构图')
  })

  it('renders all architecture nodes', () => {
    const wrapper = mount(ArchDiagram)
    const nodeLabels = ['Web UI', 'API Server', 'Elasticsearch', 'MySQL', 'MinIO', 'Redis']
    for (const label of nodeLabels) {
      expect(wrapper.text()).toContain(label)
    }
  })

  it('renders all three layer labels', () => {
    const wrapper = mount(ArchDiagram)
    expect(wrapper.text()).toContain('用户层')
    expect(wrapper.text()).toContain('服务层')
    expect(wrapper.text()).toContain('存储层')
  })

  it('renders both desktop and mobile layout containers', () => {
    const wrapper = mount(ArchDiagram)
    expect(wrapper.find('.arch-desktop').exists()).toBe(true)
    expect(wrapper.find('.arch-mobile').exists()).toBe(true)
  })

  it('renders GlowNode components for each node', () => {
    const wrapper = mount(ArchDiagram)
    // GlowNode renders with class .glow-node
    const glowNodes = wrapper.findAll('.glow-node')
    // 6 nodes in desktop + 6 nodes in mobile = 12 (both layouts rendered in test env)
    expect(glowNodes.length).toBe(12)
  })

  it('renders FlowLine components for connections', () => {
    const wrapper = mount(ArchDiagram)
    // FlowLine renders as svg.flow-line
    const flowLines = wrapper.findAll('.flow-line')
    expect(flowLines.length).toBeGreaterThan(0)
  })

  it('renders directional arrows', () => {
    const wrapper = mount(ArchDiagram)
    const arrows = wrapper.findAll('.arch-arrow')
    // Desktop: 5 connections across 2 connector groups
    expect(arrows.length).toBeGreaterThan(0)
    expect(arrows[0].text()).toBe('→')
  })

  it('dims non-connected nodes on hover when interactive is true', async () => {
    const wrapper = mount(ArchDiagram, {
      props: { interactive: true }
    })
    // Get nodes from the mobile layout (always rendered in test env without CSS)
    const mobileNodes = wrapper.find('.arch-mobile').findAll('.arch-node')
    // First node is Web UI
    await mobileNodes[0].trigger('mouseenter')

    // Web UI (index 0) should stay at full opacity
    expect(mobileNodes[0].attributes('style')).toContain('opacity: 1')
    // API Server (index 1) should stay highlighted (connected to Web UI)
    expect(mobileNodes[1].attributes('style')).toContain('opacity: 1')
    // Storage nodes (not directly connected to Web UI) should be dimmed
    expect(mobileNodes[2].attributes('style')).toContain('opacity: 0.3')
    expect(mobileNodes[3].attributes('style')).toContain('opacity: 0.3')
    expect(mobileNodes[4].attributes('style')).toContain('opacity: 0.3')
    expect(mobileNodes[5].attributes('style')).toContain('opacity: 0.3')
  })

  it('does not dim nodes on hover when interactive is false', async () => {
    const wrapper = mount(ArchDiagram, {
      props: { interactive: false }
    })
    const mobileNodes = wrapper.find('.arch-mobile').findAll('.arch-node')
    await mobileNodes[0].trigger('mouseenter')

    // All nodes should remain at full opacity
    for (const node of mobileNodes) {
      expect(node.attributes('style')).toContain('opacity: 1')
    }
  })

  it('restores all nodes to full opacity on mouse leave', async () => {
    const wrapper = mount(ArchDiagram, {
      props: { interactive: true }
    })
    const mobileNodes = wrapper.find('.arch-mobile').findAll('.arch-node')

    // Hover on Web UI
    await mobileNodes[0].trigger('mouseenter')
    // Storage nodes should be dimmed
    expect(mobileNodes[2].attributes('style')).toContain('opacity: 0.3')

    // Leave
    await mobileNodes[0].trigger('mouseleave')
    // All nodes should restore to full opacity
    for (const node of mobileNodes) {
      expect(node.attributes('style')).toContain('opacity: 1')
    }
  })

  it('highlights all connected nodes when hovering API Server', async () => {
    const wrapper = mount(ArchDiagram, {
      props: { interactive: true }
    })
    const mobileNodes = wrapper.find('.arch-mobile').findAll('.arch-node')

    // API Server is the second node (index 1)
    await mobileNodes[1].trigger('mouseenter')

    // API Server connects to Web UI and all storage nodes
    // So ALL nodes should be highlighted
    for (const node of mobileNodes) {
      expect(node.attributes('style')).toContain('opacity: 1')
    }
  })

  it('dims connections for non-related edges on hover', async () => {
    const wrapper = mount(ArchDiagram, {
      props: { interactive: true }
    })
    const mobileNodes = wrapper.find('.arch-mobile').findAll('.arch-node')
    const mobileConnectors = wrapper.find('.arch-mobile').findAll('.arch-mobile-connector')

    // Hover on Web UI - only webui→api connection should stay highlighted
    await mobileNodes[0].trigger('mouseenter')

    // First connector (webui→api) should be highlighted
    expect(mobileConnectors[0].attributes('style')).toContain('opacity: 1')
    // Remaining connectors (api→storage) should be dimmed since hover is on webui
    if (mobileConnectors.length > 1) {
      expect(mobileConnectors[1].attributes('style')).toContain('opacity: 0.3')
    }
  })

  it('defaults interactive prop to true', async () => {
    const wrapper = mount(ArchDiagram)
    const mobileNodes = wrapper.find('.arch-mobile').findAll('.arch-node')
    expect(mobileNodes.length).toBe(6)

    // Interactive behavior should work by default
    await mobileNodes[0].trigger('mouseenter')
    // Storage node should be dimmed (proving interactive is active)
    expect(mobileNodes[2].attributes('style')).toContain('opacity: 0.3')
  })
})
