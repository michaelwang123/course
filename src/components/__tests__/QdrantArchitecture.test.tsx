import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import QdrantArchitecture, { architectureElements } from '../QdrantArchitecture/index';
import { AnimationOrchestratorProvider } from '../../hooks/useAnimationSlot';

/**
 * Property 2: Tooltip Content Constraint and Hover/Tooltip State Transitions
 *
 * Example-based tests covering all element types (Collection, Point, Vector, Payload):
 * - Tooltip content is non-empty and ≤ 80 characters
 * - On pointer-capable devices, hovering shows tooltip (with 100ms delay)
 * - Moving pointer away immediately hides tooltip regardless of tooltip area entry
 *
 * **Validates: Requirements 3.4, 3.5**
 */

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

describe('QdrantArchitecture - Tooltip Behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set up IntersectionObserver mock
    (globalThis as any).IntersectionObserver = MockIntersectionObserver;
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  function renderComponent() {
    return render(
      <AnimationOrchestratorProvider maxConcurrent={3}>
        <QdrantArchitecture />
      </AnimationOrchestratorProvider>,
    );
  }

  // ─── Tooltip Content Constraint ──────────────────────────────────────────

  describe('Tooltip content constraints (all 4 element types)', () => {
    const elementTypes = ['collection', 'point', 'vector', 'payload'] as const;

    elementTypes.forEach((type) => {
      it(`${type} tooltip content is non-empty and ≤ 80 characters`, () => {
        const elements = architectureElements.filter((e) => e.type === type);
        expect(elements.length).toBeGreaterThan(0);

        elements.forEach((element) => {
          expect(element.tooltip.length).toBeGreaterThan(0);
          expect(element.tooltip.length).toBeLessThanOrEqual(80);
        });
      });
    });
  });

  // ─── Hover/Tooltip State Transitions ─────────────────────────────────────

  describe('Hover shows tooltip after 100ms for each element type', () => {
    it('Collection element: pointer enter shows tooltip, pointer leave hides immediately', () => {
      renderComponent();

      // Wait for sequential fade-in (level 0 = 0ms delay)
      act(() => { vi.advanceTimersByTime(50); });

      const collectionEl = screen.getByTestId('arch-element-collection-1');

      // Pointer enter
      fireEvent.pointerEnter(collectionEl);

      // Tooltip should NOT be visible immediately (100ms show delay)
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Advance past 100ms show delay
      act(() => { vi.advanceTimersByTime(100); });

      // Tooltip should now be visible
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip.textContent).toBe('Qdrant中存储向量数据的基本单元，类似传统数据库的表');

      // Pointer leave — tooltip should hide immediately
      fireEvent.pointerLeave(collectionEl);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('Point element: pointer enter shows tooltip, pointer leave hides immediately', () => {
      renderComponent();

      // Wait for sequential fade-in (level 1 = 200ms delay)
      act(() => { vi.advanceTimersByTime(250); });

      const pointEl = screen.getByTestId('arch-element-point-1');

      // Pointer enter
      fireEvent.pointerEnter(pointEl);
      act(() => { vi.advanceTimersByTime(100); });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip.textContent).toBe('数据记录，包含向量和附加信息（payload）');

      // Pointer leave — immediate hide
      fireEvent.pointerLeave(pointEl);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('Vector element: pointer enter shows tooltip, pointer leave hides immediately', () => {
      renderComponent();

      // Wait for sequential fade-in (level 2 = 400ms delay)
      act(() => { vi.advanceTimersByTime(450); });

      const vectorEl = screen.getByTestId('arch-element-vector-1');

      // Pointer enter
      fireEvent.pointerEnter(vectorEl);
      act(() => { vi.advanceTimersByTime(100); });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip.textContent).toBe('高维数值数组，表示数据的语义特征');

      // Pointer leave — immediate hide
      fireEvent.pointerLeave(vectorEl);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('Payload element: pointer enter shows tooltip, pointer leave hides immediately', () => {
      renderComponent();

      // Wait for sequential fade-in (level 2 = 400ms delay)
      act(() => { vi.advanceTimersByTime(450); });

      const payloadEl = screen.getByTestId('arch-element-payload-1');

      // Pointer enter
      fireEvent.pointerEnter(payloadEl);
      act(() => { vi.advanceTimersByTime(100); });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip.textContent).toBe('附加在向量上的结构化元数据，支持过滤检索');

      // Pointer leave — immediate hide
      fireEvent.pointerLeave(payloadEl);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  // ─── Immediate Hide on Pointer Leave (even if pointer enters tooltip area) ─

  describe('Immediate tooltip hide on pointer leave, even with tooltip area entry', () => {
    it('tooltip has pointerEvents: none preventing interaction', () => {
      renderComponent();
      act(() => { vi.advanceTimersByTime(50); });

      const collectionEl = screen.getByTestId('arch-element-collection-1');

      // Show tooltip
      fireEvent.pointerEnter(collectionEl);
      act(() => { vi.advanceTimersByTime(100); });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();

      // Verify tooltip has pointer-events: none (prevents entering tooltip area)
      expect(tooltip.style.pointerEvents).toBe('none');
    });

    it('pointer leave during 100ms show delay cancels tooltip display', () => {
      renderComponent();
      act(() => { vi.advanceTimersByTime(50); });

      const collectionEl = screen.getByTestId('arch-element-collection-1');

      // Pointer enter then leave quickly (before 100ms)
      fireEvent.pointerEnter(collectionEl);
      act(() => { vi.advanceTimersByTime(50); });

      // Leave before tooltip shows
      fireEvent.pointerLeave(collectionEl);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Even after waiting more time, tooltip should not appear
      act(() => { vi.advanceTimersByTime(100); });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('rapidly entering and leaving multiple elements hides tooltip immediately each time', () => {
      renderComponent();
      act(() => { vi.advanceTimersByTime(450); });

      const pointEl = screen.getByTestId('arch-element-point-1');
      const vectorEl = screen.getByTestId('arch-element-vector-1');

      // Enter first element, wait for tooltip
      fireEvent.pointerEnter(pointEl);
      act(() => { vi.advanceTimersByTime(100); });
      expect(screen.getByRole('tooltip').textContent).toBe(
        '数据记录，包含向量和附加信息（payload）',
      );

      // Leave first element — immediate hide
      fireEvent.pointerLeave(pointEl);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

      // Enter second element
      fireEvent.pointerEnter(vectorEl);
      act(() => { vi.advanceTimersByTime(100); });
      expect(screen.getByRole('tooltip').textContent).toBe(
        '高维数值数组，表示数据的语义特征',
      );

      // Leave second element — immediate hide
      fireEvent.pointerLeave(vectorEl);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });

  // ─── Glow Intensity ────────────────────────────────────────────────────────

  describe('Glow intensity changes on hover', () => {
    it('element has default glow (opacity 0.4) and increases to 0.8 on hover', () => {
      renderComponent();
      act(() => { vi.advanceTimersByTime(50); });

      const collectionEl = screen.getByTestId('arch-element-collection-1');
      const glowDiv = collectionEl.querySelector('div');

      // Default glow
      expect(glowDiv!.style.boxShadow).toContain('0.4');

      // Hover
      fireEvent.pointerEnter(collectionEl);
      expect(glowDiv!.style.boxShadow).toContain('0.8');

      // Leave — restore
      fireEvent.pointerLeave(collectionEl);
      expect(glowDiv!.style.boxShadow).toContain('0.4');
    });
  });

  // ─── Touch Fallback ────────────────────────────────────────────────────────

  describe('Touch fallback: tap to show, auto-dismiss after 3s', () => {
    it('touch shows tooltip and auto-dismisses after 3 seconds', () => {
      renderComponent();
      act(() => { vi.advanceTimersByTime(50); });

      const collectionEl = screen.getByTestId('arch-element-collection-1');

      // Tap (touchStart)
      fireEvent.touchStart(collectionEl);

      // Tooltip should be visible immediately on touch (no 100ms delay)
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();

      // Auto-dismiss after 3 seconds
      act(() => { vi.advanceTimersByTime(3000); });
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });

    it('tap elsewhere dismisses tooltip before 3s timeout', () => {
      renderComponent();
      act(() => { vi.advanceTimersByTime(50); });

      const collectionEl = screen.getByTestId('arch-element-collection-1');
      const container = screen.getByTestId('qdrant-architecture');

      // Tap element to show tooltip
      fireEvent.touchStart(collectionEl);
      expect(screen.getByRole('tooltip')).toBeInTheDocument();

      // Tap elsewhere to dismiss
      fireEvent.click(container);
      expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    });
  });
});
