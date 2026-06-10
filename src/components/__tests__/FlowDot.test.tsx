import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FlowDot from '../FlowDot';

describe('FlowDot', () => {
  it('renders with default props and aria-hidden', () => {
    const { container } = render(<FlowDot />);
    const span = container.firstElementChild as HTMLElement;

    expect(span).toBeInTheDocument();
    expect(span.tagName).toBe('SPAN');
    expect(span).toHaveAttribute('aria-hidden', 'true');
    expect(span.style.width).toBe('6px');
    expect(span.style.height).toBe('6px');
    expect(span.style.backgroundColor).toBe('#00ffaa');
    expect(span.style.borderRadius).toBe('50%');
    expect(span.style.getPropertyValue('--dot-distance')).toBe('160px');
    expect(span.style.getPropertyValue('--dot-duration')).toBe('2s');
  });

  it('applies custom props and CSS variables correctly', () => {
    const { container } = render(
      <FlowDot color="#ff0000" size={10} distance={200} duration={3} direction="ltr" />
    );
    const span = container.firstElementChild as HTMLElement;

    expect(span.style.width).toBe('10px');
    expect(span.style.height).toBe('10px');
    expect(span.style.backgroundColor).toBe('#ff0000');
    expect(span.style.getPropertyValue('--dot-distance')).toBe('200px');
    expect(span.style.getPropertyValue('--dot-duration')).toBe('3s');
  });

  it('negates --dot-distance for rtl direction', () => {
    const { container } = render(<FlowDot distance={160} direction="rtl" />);
    const span = container.firstElementChild as HTMLElement;

    expect(span.style.getPropertyValue('--dot-distance')).toBe('-160px');
  });
});
