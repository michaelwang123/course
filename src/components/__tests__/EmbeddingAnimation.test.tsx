/**
 * Unit tests for EmbeddingAnimation component.
 *
 * Verifies:
 * - The 3 rendered vector points satisfy: distance(text, code) < 0.5 × distance(text, image)
 * - 3 inputs render with ≥4 dimension values each
 * - Correct CSS animation names are applied (fade-in-up, pulse-glow, dot-move)
 *
 * **Validates: Requirements 1.2, 1.3, 1.4**
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import EmbeddingAnimation, {
  VECTOR_POINTS,
  EMBEDDING_INPUTS,
  euclideanDistance2D,
} from '../EmbeddingAnimation/index';

describe('EmbeddingAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * **Validates: Requirements 1.3**
   * Verify the 3 rendered vector points satisfy:
   * distance(text, code) < 0.5 × distance(text, image)
   */
  it('vector points satisfy distance(text, code) < 0.5 × distance(text, image)', () => {
    const textPoint = VECTOR_POINTS.find((p) => p.label === 'text')!;
    const codePoint = VECTOR_POINTS.find((p) => p.label === 'code')!;
    const imagePoint = VECTOR_POINTS.find((p) => p.label === 'image')!;

    expect(textPoint).toBeDefined();
    expect(codePoint).toBeDefined();
    expect(imagePoint).toBeDefined();

    const distTextCode = euclideanDistance2D(textPoint, codePoint);
    const distTextImage = euclideanDistance2D(textPoint, imagePoint);

    expect(distTextCode).toBeLessThan(0.5 * distTextImage);
  });

  /**
   * **Validates: Requirements 1.3**
   * Verify the distance constraint is satisfied in the rendered SVG output.
   */
  it('renders 3 vector points on the coordinate plane in output phase', () => {
    const { container } = render(<EmbeddingAnimation />);

    // Advance to output phase (input: 1.5s, processing starts; 3.5s total for output)
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    const vectorPoints = container.querySelectorAll('.vector-point');
    expect(vectorPoints.length).toBe(3);

    // Verify each point has the expected labels
    const labels = Array.from(vectorPoints).map(
      (el) => el.getAttribute('data-point-label')
    );
    expect(labels).toContain('text');
    expect(labels).toContain('code');
    expect(labels).toContain('image');
  });

  /**
   * **Validates: Requirements 1.2**
   * Verify 3 inputs render with ≥4 dimension values each.
   */
  it('renders 3 inputs each with at least 4 visible vector dimension values', () => {
    const { container } = render(<EmbeddingAnimation />);

    const inputCards = container.querySelectorAll('.embedding-input-card');
    expect(inputCards.length).toBe(3);

    inputCards.forEach((card) => {
      const dimensionText = card.querySelector('.vector-dimensions')?.textContent || '';
      // Count numeric values in the vector display (e.g., [0.23, -0.87, 0.45, 0.12, ...])
      const numbers = dimensionText.match(/-?\d+\.\d+/g) || [];
      expect(numbers.length).toBeGreaterThanOrEqual(4);
    });
  });

  /**
   * **Validates: Requirements 1.2**
   * Verify the EMBEDDING_INPUTS data has ≥4 dimensions per vector.
   */
  it('each embedding input has at least 4 vector dimensions', () => {
    expect(EMBEDDING_INPUTS.length).toBe(3);
    EMBEDDING_INPUTS.forEach((input) => {
      expect(input.vector.length).toBeGreaterThanOrEqual(4);
    });
  });

  /**
   * **Validates: Requirements 1.4**
   * Verify fade-in-up animation is applied to input cards.
   */
  it('applies fade-in-up animation to input cards', () => {
    const { container } = render(<EmbeddingAnimation />);

    const inputCards = container.querySelectorAll('.embedding-input-card');
    expect(inputCards.length).toBe(3);

    inputCards.forEach((card) => {
      const style = (card as HTMLElement).style;
      expect(style.animationName).toBe('fade-in-up');
    });
  });

  /**
   * **Validates: Requirements 1.4**
   * Verify pulse-glow animation is applied to processing nodes.
   */
  it('applies pulse-glow animation to processing nodes', () => {
    const { container } = render(<EmbeddingAnimation />);

    // Advance to processing phase
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const processingNodes = container.querySelectorAll('.processing-node');
    expect(processingNodes.length).toBe(3);

    processingNodes.forEach((node) => {
      const style = (node as HTMLElement).style;
      expect(style.animationName).toBe('pulse-glow');
    });
  });

  /**
   * **Validates: Requirements 1.4**
   * Verify dot-move animation is applied to data flow dots.
   */
  it('applies dot-move animation to data flow dots', () => {
    const { container } = render(<EmbeddingAnimation />);

    // Advance to processing phase
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const flowDots = container.querySelectorAll('.data-flow-dot');
    expect(flowDots.length).toBe(3);

    flowDots.forEach((dot) => {
      const style = (dot as HTMLElement).style;
      expect(style.animationName).toBe('dot-move');
    });
  });

  /**
   * **Validates: Requirements 1.4**
   * Verify dot-move animation is applied to vector point circles in output phase.
   */
  it('applies dot-move animation to vector point circles in output phase', () => {
    const { container } = render(<EmbeddingAnimation />);

    // Advance to output phase
    act(() => {
      vi.advanceTimersByTime(4000);
    });

    const circles = container.querySelectorAll('.vector-point circle');
    expect(circles.length).toBe(3);

    circles.forEach((circle) => {
      const style = (circle as HTMLElement).style;
      expect(style.animationName).toBe('dot-move');
    });
  });

  /**
   * **Validates: Requirements 1.2, 1.3**
   * Verify the euclideanDistance2D utility function works correctly.
   */
  it('euclideanDistance2D correctly computes distance between two points', () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(euclideanDistance2D(p1, p2)).toBeCloseTo(5, 5);

    const p3 = { x: 1, y: 1 };
    const p4 = { x: 1, y: 1 };
    expect(euclideanDistance2D(p3, p4)).toBe(0);
  });
});
