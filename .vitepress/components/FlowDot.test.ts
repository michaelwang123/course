import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FlowDot from './FlowDot.vue'

describe('FlowDot.vue', () => {
  it('renders a span element with flow-dot class', () => {
    const wrapper = mount(FlowDot)
    const dot = wrapper.find('.flow-dot')
    expect(dot.exists()).toBe(true)
    expect(dot.element.tagName).toBe('SPAN')
  })

  it('applies default size as width and height', () => {
    const wrapper = mount(FlowDot)
    const dot = wrapper.find('.flow-dot')
    expect(dot.element.style.width).toBe('6px')
    expect(dot.element.style.height).toBe('6px')
  })

  it('applies default color as background', () => {
    const wrapper = mount(FlowDot)
    const dot = wrapper.find('.flow-dot')
    expect(dot.element.style.backgroundColor).toBe('#00ffaa')
  })

  it('accepts custom color and size props', () => {
    const wrapper = mount(FlowDot, {
      props: { color: '#ff0000', size: 10 }
    })
    const dot = wrapper.find('.flow-dot')
    expect(dot.element.style.backgroundColor).toBe('#ff0000')
    expect(dot.element.style.width).toBe('10px')
    expect(dot.element.style.height).toBe('10px')
  })

  it('sets CSS variable for distance (ltr default)', () => {
    const wrapper = mount(FlowDot, {
      props: { distance: 200 }
    })
    const dot = wrapper.find('.flow-dot')
    expect(dot.element.style.getPropertyValue('--dot-distance')).toBe('200px')
  })

  it('sets negative distance CSS variable for rtl direction', () => {
    const wrapper = mount(FlowDot, {
      props: { distance: 160, direction: 'rtl' }
    })
    const dot = wrapper.find('.flow-dot')
    expect(dot.element.style.getPropertyValue('--dot-distance')).toBe('-160px')
  })

  it('sets CSS variable for duration', () => {
    const wrapper = mount(FlowDot, {
      props: { duration: 3 }
    })
    const dot = wrapper.find('.flow-dot')
    expect(dot.element.style.getPropertyValue('--dot-duration')).toBe('3s')
  })

  it('has aria-hidden for accessibility', () => {
    const wrapper = mount(FlowDot)
    const dot = wrapper.find('.flow-dot')
    expect(dot.attributes('aria-hidden')).toBe('true')
  })

  it('renders as a circular element (border-radius applied via CSS class)', () => {
    const wrapper = mount(FlowDot)
    const dot = wrapper.find('.flow-dot')
    expect(dot.classes()).toContain('flow-dot')
  })
})
