import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react';
import { expect } from 'vitest';
import FlowLine from '../FlowLine';

const widthArb = fc.integer({ min: 10, max: 1000 });
const heightArb = fc.integer({ min: 1, max: 20 });
const colorArb = fc.constantFrom('red', 'blue', 'rgba(0,255,170,0.4)', '#00ffaa');
const speedArb = fc.float({ min: Math.fround(0.1), max: 10, noNaN: true });

// Feature: react-migration, Property 4: FlowLine SVG attributes correctness
// **Validates: Requirements 3.4**
test.prop(
  [widthArb, heightArb, colorArb, speedArb],
  { numRuns: 100 },
)('FlowLine renders SVG with correct attributes for any valid props', (width, height, color, speed) => {
  const { container } = render(
    <FlowLine width={width} height={height} color={color} speed={speed} />
  );

  const svg = container.querySelector('svg');
  expect(svg).not.toBeNull();
  expect(svg!.getAttribute('width')).toBe(String(width));
  expect(svg!.getAttribute('height')).toBe(String(height));
  expect(svg!.getAttribute('aria-hidden')).toBe('true');

  const line = svg!.querySelector('line');
  expect(line).not.toBeNull();
  expect(line!.getAttribute('stroke')).toBe(color);
  expect(line!.getAttribute('stroke-width')).toBe(String(height));
  expect(line!.getAttribute('stroke-dasharray')).toBe('8 6');
  expect(line!.getAttribute('y1')).toBe(String(height / 2));
  expect(line!.getAttribute('x2')).toBe(String(width));
});
