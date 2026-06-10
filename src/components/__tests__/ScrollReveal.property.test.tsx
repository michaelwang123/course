import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react';
import { vi, beforeEach, afterEach, expect } from 'vitest';
import ScrollReveal from '../ScrollReveal';

/**
 * Validates: Requirements 3.2
 * Feature: react-migration, Property 2: ScrollReveal animation class mapping
 *
 * For any valid animation prop value and delay value, the ScrollReveal component
 * SHALL render with a CSS class corresponding to the animation type and
 * animationDelay matching the delay prop.
 */

// Remove IntersectionObserver to trigger graceful degradation (immediate visible)
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const animationArb = fc.constantFrom('fade-in-up', 'fade-in', 'scale-in') as fc.Arbitrary<'fade-in-up' | 'fade-in' | 'scale-in'>;

test.prop(
  [animationArb, fc.nat({ max: 5000 })],
  { numRuns: 100 },
)('ScrollReveal applies correct animation class and delay', (animation, delay) => {
  const { container } = render(
    <ScrollReveal animation={animation} delay={delay}>
      <p>Content</p>
    </ScrollReveal>
  );
  const wrapper = container.firstElementChild as HTMLElement;

  // Animation class should match the animation prop
  expect(wrapper.className).toBe(animation);

  // animationDelay should be set when delay > 0
  if (delay > 0) {
    expect(wrapper.style.animationDelay).toBe(`${delay}ms`);
  } else {
    expect(wrapper.style.animationDelay).toBe('');
  }
});
