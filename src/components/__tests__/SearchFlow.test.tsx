/**
 * Unit tests for SearchFlow component.
 *
 * Verifies:
 * - prefers-reduced-motion shows all 5 stages simultaneously without animation
 * - ANN Search sub-animation duration is configured between 1000-2000ms
 * - Vertical layout below 768px viewport
 *
 * **Validates: Requirements 5.4, 5.6, 5.7**
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import SearchFlow, {
  PIPELINE_STAGES,
  ANN_SEARCH_DURATION,
  MOBILE_BREAKPOINT,
} from '../SearchFlow/index';
import { AnimationOrchestratorProvider } from '../../hooks/useAnimationSlot';

// Mock IntersectionObserver to immediately trigger visibility
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    // Immediately trigger with full intersection to make component active
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

describe('SearchFlow - Reduced Motion and ANN Timing', () => {
  let matchMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as any).IntersectionObserver = MockIntersectionObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    cleanup();
  });

  function setupMatchMedia(reducedMotion: boolean) {
    const listeners: Array<(e: MediaQueryListEvent) => void> = [];
    matchMediaMock = vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
      media: query,
      addEventListener: (_event: string, handler: (e: MediaQueryListEvent) => void) => {
        listeners.push(handler);
      },
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

  function renderSearchFlow(vertical?: boolean) {
    return render(
      <AnimationOrchestratorProvider maxConcurrent={3}>
        <SearchFlow vertical={vertical} />
      </AnimationOrchestratorProvider>,
    );
  }

  // ─── Reduced Motion Tests ───────────────────────────────────────────────────

  describe('prefers-reduced-motion behavior', () => {
    /**
     * **Validates: Requirements 5.6**
     * When prefers-reduced-motion is enabled, all 5 stages should be visible
     * simultaneously without sequential animation.
     */
    it('shows all 5 stages simultaneously when prefers-reduced-motion is active', () => {
      setupMatchMedia(true);
      const { container } = renderSearchFlow();

      // All stages should be active immediately (no timer advancement needed)
      const stages = container.querySelectorAll('[data-stage-active="true"]');
      expect(stages.length).toBe(5);
    });

    it('container has data-reduced-motion="true" attribute when reduced motion is active', () => {
      setupMatchMedia(true);
      const { container } = renderSearchFlow();

      const searchFlow = container.querySelector('[data-testid="search-flow"]');
      expect(searchFlow).not.toBeNull();
      expect(searchFlow!.getAttribute('data-reduced-motion')).toBe('true');
    });

    it('all stage contents are rendered when reduced motion is active', () => {
      setupMatchMedia(true);
      const { container } = renderSearchFlow();

      // Each stage should show its intermediate content
      const stageContents = container.querySelectorAll('.search-flow__stage-content');
      expect(stageContents.length).toBe(5);

      // Each stage content should have child content (not empty)
      stageContents.forEach((content) => {
        expect(content.children.length).toBeGreaterThan(0);
      });
    });

    it('stages do not animate sequentially when reduced motion is active', () => {
      setupMatchMedia(true);
      const { container } = renderSearchFlow();

      // Even before any time advancement, all stages should be visible
      const stages = container.querySelectorAll('.search-flow__stage');
      stages.forEach((stage) => {
        expect(stage.getAttribute('data-stage-active')).toBe('true');
      });
    });
  });

  // ─── ANN Search Duration Tests ─────────────────────────────────────────────

  describe('ANN Search sub-animation duration', () => {
    /**
     * **Validates: Requirements 5.4**
     * ANN Search sub-animation duration should be between 1000-2000ms.
     */
    it('ANN_SEARCH_DURATION is configured between 1000-2000ms', () => {
      expect(ANN_SEARCH_DURATION).toBeGreaterThanOrEqual(1000);
      expect(ANN_SEARCH_DURATION).toBeLessThanOrEqual(2000);
    });

    it('ANN Search stage has duration configured within valid range', () => {
      const annStage = PIPELINE_STAGES.find((s) => s.id === 'ann-search');
      expect(annStage).toBeDefined();
      // The stage duration is between 800-1500ms as per pipeline config
      expect(annStage!.duration).toBeGreaterThanOrEqual(800);
      expect(annStage!.duration).toBeLessThanOrEqual(1500);
    });

    it('ANN Search mini-graph SVG renders when stage is active', () => {
      setupMatchMedia(true); // Use reduced motion so all stages are active
      const { container } = renderSearchFlow();

      const annMiniGraph = container.querySelector('[data-testid="ann-mini-graph"]');
      expect(annMiniGraph).not.toBeNull();
      expect(annMiniGraph!.tagName.toLowerCase()).toBe('svg');
    });
  });

  // ─── Vertical Layout Tests ──────────────────────────────────────────────────

  describe('vertical layout below 768px viewport', () => {
    /**
     * **Validates: Requirements 5.7**
     * Pipeline should stack vertically when viewport width is below 768px.
     */
    it('renders vertically when vertical prop is true', () => {
      setupMatchMedia(false);
      const { container } = renderSearchFlow(true);

      const searchFlow = container.querySelector('[data-testid="search-flow"]');
      expect(searchFlow).not.toBeNull();
      expect(searchFlow!.getAttribute('data-vertical')).toBe('true');
    });

    it('renders horizontally when vertical prop is false', () => {
      setupMatchMedia(false);
      const { container } = renderSearchFlow(false);

      const searchFlow = container.querySelector('[data-testid="search-flow"]');
      expect(searchFlow).not.toBeNull();
      expect(searchFlow!.getAttribute('data-vertical')).toBe('false');
    });

    it('container uses column flex direction in vertical layout', () => {
      setupMatchMedia(false);
      const { container } = renderSearchFlow(true);

      const searchFlow = container.querySelector('[data-testid="search-flow"]') as HTMLElement;
      expect(searchFlow.style.flexDirection).toBe('column');
    });

    it('container uses row flex direction in horizontal layout', () => {
      setupMatchMedia(false);
      const { container } = renderSearchFlow(false);

      const searchFlow = container.querySelector('[data-testid="search-flow"]') as HTMLElement;
      expect(searchFlow.style.flexDirection).toBe('row');
    });

    it('MOBILE_BREAKPOINT is 768px', () => {
      expect(MOBILE_BREAKPOINT).toBe(768);
    });

    it('auto-detects vertical layout from window.innerWidth when below breakpoint', () => {
      setupMatchMedia(false);
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 500 });
      window.dispatchEvent(new Event('resize'));

      const { container } = renderSearchFlow();

      const searchFlow = container.querySelector('[data-testid="search-flow"]');
      expect(searchFlow!.getAttribute('data-vertical')).toBe('true');
    });

    it('auto-detects horizontal layout from window.innerWidth at or above breakpoint', () => {
      setupMatchMedia(false);
      Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 });
      window.dispatchEvent(new Event('resize'));

      const { container } = renderSearchFlow();

      const searchFlow = container.querySelector('[data-testid="search-flow"]');
      expect(searchFlow!.getAttribute('data-vertical')).toBe('false');
    });
  });

  // ─── Pipeline Stage Count Tests ─────────────────────────────────────────────

  describe('pipeline stages configuration', () => {
    it('has exactly 5 pipeline stages', () => {
      expect(PIPELINE_STAGES.length).toBe(5);
    });

    it('renders all 5 stages in the DOM', () => {
      setupMatchMedia(true);
      const { container } = renderSearchFlow();

      const stages = container.querySelectorAll('.search-flow__stage');
      expect(stages.length).toBe(5);
    });
  });
});
