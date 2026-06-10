import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FlowLine from './FlowLine.vue'

describe('FlowLine.vue', () => {
  it('renders an SVG element with correct default dimensions', () => {
    const wrapper = mount(FlowLine)
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
    expect(svg.attributes('width')).toBe('200')
    expect(svg.attributes('height')).toBe('4')
  })

  it('renders a line with stroke-dasharray attribute', () => {
    const wrapper = mount(FlowLine)
    const line = wrapper.find('line')
    expect(line.exists()).toBe(true)
    expect(line.attributes('stroke-dasharray')).toBe('8 6')
  })

  it('applies the default color as stroke', () => {
    const wrapper = mount(FlowLine)
    const line = wrapper.find('line')
    expect(line.attributes('stroke')).toBe('rgba(0,255,170,0.4)')
  })

  it('accepts custom props', () => {
    const wrapper = mount(FlowLine, {
      props: {
        width: 300,
        height: 6,
        color: '#ff0000',
        speed: 2
      }
    })
    const svg = wrapper.find('svg')
    expect(svg.attributes('width')).toBe('300')
    expect(svg.attributes('height')).toBe('6')

    const line = wrapper.find('line')
    expect(line.attributes('stroke')).toBe('#ff0000')
    expect(line.element.style.animationDuration).toBe('2s')
  })

  it('uses configurable speed for animation duration', () => {
    const wrapper = mount(FlowLine, {
      props: { speed: 3 }
    })
    const line = wrapper.find('line')
    expect(line.element.style.animationDuration).toBe('3s')
  })

  it('has aria-hidden for accessibility', () => {
    const wrapper = mount(FlowLine)
    const svg = wrapper.find('svg')
    expect(svg.attributes('aria-hidden')).toBe('true')
  })

  it('applies the flow-line__path class for animation', () => {
    const wrapper = mount(FlowLine)
    const line = wrapper.find('line')
    expect(line.classes()).toContain('flow-line__path')
  })
})
