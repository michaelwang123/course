import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ScrollReveal from './ScrollReveal.vue'

// Mock IntersectionObserver
let observeCallback: IntersectionObserverCallback | null = null
let mockObserve: ReturnType<typeof vi.fn>
let mockUnobserve: ReturnType<typeof vi.fn>
let mockDisconnect: ReturnType<typeof vi.fn>
let constructorOptions: IntersectionObserverInit | undefined

function setupIntersectionObserverMock() {
  mockObserve = vi.fn()
  mockUnobserve = vi.fn()
  mockDisconnect = vi.fn()

  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      observeCallback = callback
      constructorOptions = options
    }
    observe = mockObserve
    unobserve = mockUnobserve
    disconnect = mockDisconnect
    root = null
    rootMargin = ''
    thresholds: number[] = []
    takeRecords() { return [] }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
}

function triggerIntersection(target: Element, isIntersecting: boolean) {
  if (observeCallback) {
    observeCallback(
      [{ isIntersecting, target } as unknown as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
  }
}

describe('ScrollReveal.vue', () => {
  beforeEach(() => {
    setupIntersectionObserverMock()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    observeCallback = null
  })

  it('renders slot content', () => {
    const wrapper = mount(ScrollReveal, {
      slots: { default: '<p>Hello World</p>' }
    })
    expect(wrapper.find('p').text()).toBe('Hello World')
  })

  it('starts with opacity 0 (hidden state) by default', () => {
    const wrapper = mount(ScrollReveal)
    const el = wrapper.find('.scroll-reveal')
    expect(el.classes()).toContain('scroll-reveal--fade-in-up')
    expect(el.classes()).not.toContain('scroll-reveal--visible')
  })

  it('becomes visible when intersection is triggered', async () => {
    const wrapper = mount(ScrollReveal)
    const el = wrapper.find('.scroll-reveal').element

    triggerIntersection(el, true)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.scroll-reveal').classes()).toContain('scroll-reveal--visible')
  })

  it('unobserves element after becoming visible (one-time trigger)', () => {
    const wrapper = mount(ScrollReveal)
    const el = wrapper.find('.scroll-reveal').element

    triggerIntersection(el, true)

    expect(mockUnobserve).toHaveBeenCalledWith(el)
  })

  it('does not become visible when element is not intersecting', async () => {
    const wrapper = mount(ScrollReveal)
    const el = wrapper.find('.scroll-reveal').element

    triggerIntersection(el, false)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.scroll-reveal').classes()).not.toContain('scroll-reveal--visible')
  })

  it('applies correct animation class for fade-in-up (default)', () => {
    const wrapper = mount(ScrollReveal)
    expect(wrapper.find('.scroll-reveal').classes()).toContain('scroll-reveal--fade-in-up')
  })

  it('applies correct animation class for fade-in', () => {
    const wrapper = mount(ScrollReveal, { props: { animation: 'fade-in' } })
    expect(wrapper.find('.scroll-reveal').classes()).toContain('scroll-reveal--fade-in')
  })

  it('applies correct animation class for scale-in', () => {
    const wrapper = mount(ScrollReveal, { props: { animation: 'scale-in' } })
    expect(wrapper.find('.scroll-reveal').classes()).toContain('scroll-reveal--scale-in')
  })

  it('applies delay as inline style', () => {
    const wrapper = mount(ScrollReveal, { props: { delay: 200 } })
    const el = wrapper.find('.scroll-reveal')
    expect(el.attributes('style')).toContain('transition-delay: 200ms')
    expect(el.attributes('style')).toContain('animation-delay: 200ms')
  })

  it('passes threshold to IntersectionObserver', () => {
    mount(ScrollReveal, { props: { threshold: 0.5 } })
    expect(constructorOptions).toEqual({ threshold: 0.5 })
  })

  it('shows content immediately when IntersectionObserver is unavailable', async () => {
    // Remove IntersectionObserver to simulate unsupported environment
    vi.stubGlobal('IntersectionObserver', undefined)

    const wrapper = mount(ScrollReveal)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.scroll-reveal').classes()).toContain('scroll-reveal--visible')
  })

  it('observes the container element on mount', () => {
    mount(ScrollReveal)
    expect(mockObserve).toHaveBeenCalled()
  })
})
