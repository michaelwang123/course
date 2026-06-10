import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { expect } from 'vitest';
import FlowDot from '../FlowDot';

const directionArb = fc.constantFrom('ltr', 'rtl') as fc.Arbitrary<'ltr' | 'rtl'>;
// Generate valid hex color strings with non-zero components to avoid happy-dom normalization quirks
const colorArb = fc.tuple(
  fc.integer({ min: 1, max: 255 }),
  fc.integer({ min: 1, max: 255 }),
  fc.integer({ min: 1, max: 255 }),
).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
const sizeArb = fc.integer({ min: 1, max: 100 });
const distanceArb = fc.integer({ min: 1, max: 500 });
const durationArb = fc.integer({ min: 1, max: 10 });

// Feature: react-migration, Property 3: FlowDot size and direction properties
// **Validates: Requirements 3.3**
test.prop(
  [colorArb, sizeArb, distanceArb, durationArb, directionArb],
  { numRuns: 100 },
)('FlowDot renders with correct size, color, and CSS variables', (color, size, distance, duration, direction) => {
  cleanup();
  const { container } = render(
    <FlowDot color={color} size={size} distance={distance} duration={duration} direction={direction} />
  );
  const span = container.firstElementChild as HTMLElement;

  expect(span.style.width).toBe(`${size}px`);
  expect(span.style.height).toBe(`${size}px`);
  expect(span.style.backgroundColor).toBe(color);

  const expectedDistance = direction === 'rtl' ? -distance : distance;
  expect(span.style.getPropertyValue('--dot-distance')).toBe(`${expectedDistance}px`);
  expect(span.style.getPropertyValue('--dot-duration')).toBe(`${duration}s`);
});
