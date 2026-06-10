import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ScrollReveal from '../ScrollReveal';

describe('ScrollReveal', () => {
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockUnobserve: ReturnType<typeof vi.fn>;
  let observerCallback: IntersectionObserverCallback;

  beforeEach(() => {
    mockObserve = vi.fn();
    mockUnobserve = vi.fn();

    class MockIntersectionObserver implements IntersectionObserver {
      root = null;
      rootMargin = '';
      thresholds = [] as number[];

      constructor(callback: IntersectionObserverCallback) {
        observerCallback = callback;
      }

      observe = mockObserve;
      unobserve = mockUnobserve;
      disconnect = vi.fn();
      takeRecords = () => [] as IntersectionObserverEntry[];
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders children correctly', () => {
    render(
      <ScrollReveal>
        <p>Hello World</p>
      </ScrollReveal>
    );

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('starts with opacity 0 and no animation class before intersection', () => {
    const { container } = render(
      <ScrollReveal>
        <p>Content</p>
      </ScrollReveal>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.opacity).toBe('0');
    expect(wrapper.className).toBe('');
  });

  it('applies animation class when element becomes visible', () => {
    const { container } = render(
      <ScrollReveal animation="fade-in">
        <p>Content</p>
      </ScrollReveal>
    );

    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe('fade-in');
    expect(wrapper.style.opacity).toBe('');
  });

  it('applies custom animation class (scale-in)', () => {
    const { container } = render(
      <ScrollReveal animation="scale-in">
        <p>Content</p>
      </ScrollReveal>
    );

    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe('scale-in');
  });

  it('sets animationDelay when delay prop is provided', () => {
    const { container } = render(
      <ScrollReveal delay={200}>
        <p>Content</p>
      </ScrollReveal>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.animationDelay).toBe('200ms');
  });

  it('does not set animationDelay when delay is 0', () => {
    const { container } = render(
      <ScrollReveal delay={0}>
        <p>Content</p>
      </ScrollReveal>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.animationDelay).toBe('');
  });

  it('unobserves element after becoming visible (one-time trigger)', () => {
    const mockDisconnect = vi.fn();

    class MockIntersectionObserver2 implements IntersectionObserver {
      root = null;
      rootMargin = '';
      thresholds = [] as number[];
      private cb: IntersectionObserverCallback;

      constructor(callback: IntersectionObserverCallback) {
        this.cb = callback;
        observerCallback = callback;
      }

      observe = mockObserve;
      unobserve = mockUnobserve;
      disconnect = mockDisconnect;
      takeRecords = () => [] as IntersectionObserverEntry[];
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver2);

    render(
      <ScrollReveal>
        <p>Content</p>
      </ScrollReveal>
    );

    act(() => {
      observerCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('shows content immediately when IntersectionObserver is unavailable (graceful degradation)', () => {
    // Remove IntersectionObserver to simulate unsupported environment
    vi.stubGlobal('IntersectionObserver', undefined);

    const { container } = render(
      <ScrollReveal animation="fade-in-up">
        <p>Fallback Content</p>
      </ScrollReveal>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toBe('fade-in-up');
    expect(wrapper.style.opacity).toBe('');
    expect(screen.getByText('Fallback Content')).toBeInTheDocument();
  });
});
