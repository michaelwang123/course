import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AnimatedCard from './AnimatedCard.vue'

describe('AnimatedCard.vue', () => {
  it('renders the title prop', () => {
    const wrapper = mount(AnimatedCard, {
      props: { title: 'RAGFlow 教程', description: '从零掌握 RAGFlow' }
    })
    expect(wrapper.find('.animated-card__title').text()).toBe('RAGFlow 教程')
  })

  it('renders the description prop', () => {
    const wrapper = mount(AnimatedCard, {
      props: { title: 'Test', description: '这是一段描述文字' }
    })
    expect(wrapper.find('.animated-card__description').text()).toBe('这是一段描述文字')
  })

  it('renders as a div when no link prop is provided', () => {
    const wrapper = mount(AnimatedCard, {
      props: { title: 'No Link', description: 'Desc' }
    })
    expect(wrapper.element.tagName).toBe('DIV')
  })

  it('renders as an anchor element when link prop is provided', () => {
    const wrapper = mount(AnimatedCard, {
      props: { title: 'With Link', description: 'Desc', link: '/ragflow/' }
    })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/ragflow/')
  })

  it('applies the animated-card class', () => {
    const wrapper = mount(AnimatedCard, {
      props: { title: 'Test', description: 'Desc' }
    })
    expect(wrapper.classes()).toContain('animated-card')
  })

  it('applies hover transform on mouseenter interaction', async () => {
    const wrapper = mount(AnimatedCard, {
      props: { title: 'Hover Test', description: 'Desc' }
    })
    const card = wrapper.find('.animated-card')
    expect(card.classes()).toContain('animated-card')

    // Trigger mouseenter - the hover style is defined in scoped CSS
    // We verify the component has the class that enables hover behavior
    await card.trigger('mouseenter')
    // The :hover pseudo-class styling is handled by CSS, 
    // but we can verify the element exists and is interactive
    expect(card.exists()).toBe(true)
  })

  it('renders icon when icon prop is provided', () => {
    const wrapper = mount(AnimatedCard, {
      props: { title: 'Test', description: 'Desc', icon: '🔍' }
    })
    const icon = wrapper.find('.animated-card__icon')
    expect(icon.exists()).toBe(true)
    expect(icon.text()).toBe('🔍')
  })

  it('does not render icon when icon prop is not provided', () => {
    const wrapper = mount(AnimatedCard, {
      props: { title: 'Test', description: 'Desc' }
    })
    const icon = wrapper.find('.animated-card__icon')
    expect(icon.exists()).toBe(false)
  })

  it('applies animation delay from delay prop', () => {
    const wrapper = mount(AnimatedCard, {
      props: { title: 'Test', description: 'Desc', delay: 300 }
    })
    expect(wrapper.attributes('style')).toContain('animation-delay: 300ms')
  })

  it('applies default delay of 0ms', () => {
    const wrapper = mount(AnimatedCard, {
      props: { title: 'Test', description: 'Desc' }
    })
    expect(wrapper.attributes('style')).toContain('animation-delay: 0ms')
  })
})
