import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FlowLine from '../FlowLine';

describe('FlowLine', () => {
  it('renders SVG with default width/height and line with correct dasharray', () => {
    const { container } = render(<FlowLine />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('width')).toBe('200');
    expect(svg!.getAttribute('height')).toBe('4');
    expect(svg!.getAttribute('aria-hidden')).toBe('true');

    const line = svg!.querySelector('line');
    expect(line).not.toBeNull();
    expect(line!.getAttribute('x1')).toBe('0');
    expect(line!.getAttribute('y1')).toBe('2');
    expect(line!.getAttribute('x2')).toBe('200');
    expect(line!.getAttribute('y2')).toBe('2');
    expect(line!.getAttribute('stroke')).toBe('rgba(0,255,170,0.4)');
    expect(line!.getAttribute('stroke-width')).toBe('4');
    expect(line!.getAttribute('stroke-dasharray')).toBe('8 6');
    expect(line!.getAttribute('stroke-linecap')).toBe('round');
  });

  it('applies custom width, height, color, and speed props', () => {
    const { container } = render(
      <FlowLine width={300} height={6} color="red" speed={2} />
    );

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('width')).toBe('300');
    expect(svg!.getAttribute('height')).toBe('6');

    const line = svg!.querySelector('line');
    expect(line).not.toBeNull();
    expect(line!.getAttribute('y1')).toBe('3');
    expect(line!.getAttribute('x2')).toBe('300');
    expect(line!.getAttribute('y2')).toBe('3');
    expect(line!.getAttribute('stroke')).toBe('red');
    expect(line!.getAttribute('stroke-width')).toBe('6');
    expect(line!.getAttribute('stroke-dasharray')).toBe('8 6');

    const style = line!.getAttribute('style');
    expect(style).toContain('dash-flow');
    expect(style).toContain('2s');
  });

  it('sets aria-hidden="true" on the SVG element', () => {
    const { container } = render(<FlowLine />);

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });
});
