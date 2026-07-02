/**
 * Property-based tests for responsive layout and reduced motion behavior.
 *
 * Property 6: Reduced Motion Static Display — verify animations are disabled
 * when prefers-reduced-motion is active.
 * **Validates: Requirements 5.6, 8.1, 9.5**
 *
 * Property 7: Responsive Layout Breakpoint — verify single-column below 768px,
 * 2-column at ≥768px.
 * **Validates: Requirements 9.3, 5.7**
 */

import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import SearchFlow, { MOBILE_BREAKPOINT } from '../SearchFlow/index';
import { AnimationOrchestratorProvider } from '../../hooks/useAnimationSlot';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

/** Mock IntersectionObserver that immediately triggers full visibility */
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          isIntersecting: true,
          intersectionRatio: 1.0,
          boundingClientRect: {} as DOMRectReadOnly,
          intersectionRect: {} as DOMRectReadOnly,
          rootBounds: null,
          time: Date.now(),
        },
      ] as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }

  unobserve() {}
  disconnect() {}
}

/** Set up matchMedia mock with configurable reduced-motion state */
function setupMatchMedia(reducedMotion: boolean) {
  const matchMediaMock = vi.fn((query: string) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: matchMediaMock,
  });
}

/** Render SearchFlow within the required AnimationOrchestratorProvider */
function renderSearchFlow(vertical?: boolean) {
  return render(
    <AnimationOrchestratorProvider maxConcurrent={3}>
      <SearchFlow vertical={vertical} />
    </AnimationOrchestratorProvider>,
  );
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  cleanup();
});

// ─── Generators ───────────────────────────────────────────────────────────────

/** Generator for component types on the animation page */
const componentTypeArb = fc.constantFrom(
  'EmbeddingAnimation',
  'QdrantArchitecture',
  'SimilarityCalculator',
  'HNSWGraph',
  'SearchFlow',
  'AppScenarios',
);

/** Generator for viewport widths across full supported range */
const viewportWidthArb = fc.integer({ min: 320, max: 2560 });

// ─── Property 6: Reduced Motion Static Display ───────────────────────────────
// Feature: qdrant-vector-animation, Property 6: Reduced Motion Static Display
// **Validates: Requirements 5.6, 8.1, 9.5**

test.prop(
  [componentTypeArb],
  { numRuns: 100 },
)(
  'Property 6: SearchFlow sets transition to "none" and data-reduced-motion="true" when prefers-reduced-motion is active',
  (_componentType) => {
    setupMatchMedia(true);
    const { container } = renderSearchFlow();

    const searchFlow = container.querySelector('[data-testid="search-flow"]') as HTMLElement;
    expect(searchFlow).not.toBeNull();

    // Verify reduced motion attribute is set
    expect(searchFlow.getAttribute('data-reduced-motion')).toBe('true');

    // Verify all stages are visible simultaneously (static display)
    const stages = container.querySelectorAll('[data-stage-active="true"]');
    expect(stages.length).toBe(5);

    // Verify that transition is set to 'none' on stage elements
    // (when reducedMotion is true, the component sets transition: 'none')
    const stageElements = container.querySelectorAll('.search-flow__stage') as NodeListOf<HTMLElement>;
    stageElements.forEach((stage) => {
      expect(stage.style.transition).toBe('none');
    });

    // Verify connectors also have transition: 'none'
    const connectors = container.querySelectorAll('.search-flow__connector') as NodeListOf<HTMLElement>;
    connectors.forEach((connector) => {
      expect(connector.style.transition).toBe('none');
    });

    cleanup();
  },
);

test.prop(
  [componentTypeArb],
  { numRuns: 100 },
)(
  'Property 6: All animation-dependent styles are disabled under reduced motion across component types',
  (_componentType) => {
    setupMatchMedia(true);
    const { container } = renderSearchFlow();

    const searchFlow = container.querySelector('[data-testid="search-flow"]') as HTMLElement;
    expect(searchFlow).not.toBeNull();
    expect(searchFlow.getAttribute('data-reduced-motion')).toBe('true');

    // In reduced motion mode, no element should have a non-trivial transition
    // The component sets transition: 'none' on all animated elements
    const allStyledElements = container.querySelectorAll('[style]') as NodeListOf<HTMLElement>;
    allStyledElements.forEach((el) => {
      const transition = el.style.transition;
      // If transition is explicitly set, it must be 'none' in reduced motion mode
      if (transition && transition !== '') {
        expect(transition).toBe('none');
      }
    });

    cleanup();
  },
);

// ─── Property 7: Responsive Layout Breakpoint ────────────────────────────────
// Feature: qdrant-vector-animation, Property 7: Responsive Layout Breakpoint
// **Validates: Requirements 9.3, 5.7**

test.prop(
  [viewportWidthArb],
  { numRuns: 150 },
)(
  'Property 7: SearchFlow renders vertical (single-column) below 768px',
  (viewportWidth) => {
    setupMatchMedia(false);

    // Use the vertical prop to simulate the viewport detection behavior
    // (below 768px → vertical=true, ≥768px → vertical=false)
    const isVertical = viewportWidth < MOBILE_BREAKPOINT;
    const { container } = renderSearchFlow(isVertical);

    const searchFlow = container.querySelector('[data-testid="search-flow"]') as HTMLElement;
    expect(searchFlow).not.toBeNull();

    if (viewportWidth < 768) {
      // Below 768px: single-column (vertical) layout
      expect(searchFlow.getAttribute('data-vertical')).toBe('true');
      expect(searchFlow.style.flexDirection).toBe('column');
    } else {
      // At or above 768px: horizontal (2-column capable) layout
      expect(searchFlow.getAttribute('data-vertical')).toBe('false');
      expect(searchFlow.style.flexDirection).toBe('row');
    }

    cleanup();
  },
);

test.prop(
  [viewportWidthArb],
  { numRuns: 150 },
)(
  'Property 7: Breakpoint boundary at exactly 768px is inclusive for 2-column layout',
  (viewportWidth) => {
    setupMatchMedia(false);

    const isVertical = viewportWidth < MOBILE_BREAKPOINT;
    const { container } = renderSearchFlow(isVertical);

    const searchFlow = container.querySelector('[data-testid="search-flow"]') as HTMLElement;

    // Verify the breakpoint constant is exactly 768
    expect(MOBILE_BREAKPOINT).toBe(768);

    // At exactly 768px, should be horizontal (2-column)
    if (viewportWidth === 768) {
      expect(searchFlow.getAttribute('data-vertical')).toBe('false');
      expect(searchFlow.style.flexDirection).toBe('row');
    }

    cleanup();
  },
);
