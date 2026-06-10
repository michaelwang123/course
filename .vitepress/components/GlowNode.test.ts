import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GlowNode from './GlowNode.vue'

describe('GlowNode.vue', () => {
  it('renders the label text', () => {
    const wrapper = mount(GlowNode, {
      props: { label: 'API Server' }
    })
    expect(wrapper.text()).toContain('API Server')
  })

  it('applies animate-pulse-glow class', () => {
    const wrapper = mount(GlowNode, {
      props: { label: 'Test Node' }
    })
    const node = wrapper.find('.glow-node')
    expect(node.classes()).toContain('animate-pulse-glow')
  })

  it('applies default md size classes', () => {
    const wrapper = mount(GlowNode, {
      props: { label: 'Test' }
    })
    const node = wrapper.find('.glow-node')
    expect(node.classes()).toContain('px-4')
    expect(node.classes()).toContain('py-2')
    expect(node.classes()).toContain('text-sm')
  })

  it('applies sm size classes', () => {
    const wrapper = mount(GlowNode, {
      props: { label: 'Small', size: 'sm' }
    })
    const node = wrapper.find('.glow-node')
    expect(node.classes()).toContain('px-2')
    expect(node.classes()).toContain('py-1')
    expect(node.classes()).toContain('text-xs')
  })

  it('applies lg size classes', () => {
    const wrapper = mount(GlowNode, {
      props: { label: 'Large', size: 'lg' }
    })
    const node = wrapper.find('.glow-node')
    expect(node.classes()).toContain('px-6')
    expect(node.classes()).toContain('py-3')
    expect(node.classes()).toContain('text-base')
  })

  it('renders icon element when icon prop is provided', () => {
    const wrapper = mount(GlowNode, {
      props: { label: 'With Icon', icon: 'icon-database' }
    })
    const icon = wrapper.find('.icon-database')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('aria-hidden')).toBe('true')
  })

  it('does not render icon element when icon prop is not provided', () => {
    const wrapper = mount(GlowNode, {
      props: { label: 'No Icon' }
    })
    const spans = wrapper.findAll('span')
    // Only the label span should exist
    expect(spans.length).toBe(1)
    expect(spans[0].text()).toBe('No Icon')
  })

  it('has dark background and rounded-full shape', () => {
    const wrapper = mount(GlowNode, {
      props: { label: 'Style Test' }
    })
    const node = wrapper.find('.glow-node')
    expect(node.classes()).toContain('rounded-full')
    expect(node.classes()).toContain('bg-gray-900')
  })

  it('has primary border color', () => {
    const wrapper = mount(GlowNode, {
      props: { label: 'Border Test' }
    })
    const node = wrapper.find('.glow-node')
    expect(node.classes()).toContain('border')
    expect(node.classes()).toContain('border-primary/40')
  })
})
