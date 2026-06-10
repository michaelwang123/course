import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import GlowNode from '../GlowNode';

const sizeArb = fc.constantFrom('sm', 'md', 'lg') as fc.Arbitrary<'sm' | 'md' | 'lg'>;
const labelArb = fc.string({ minLength: 1, maxLength: 30 });
const iconArb = fc.option(fc.string({ minLength: 1, maxLength: 20 }));

const sizeClassMap: Record<string, string[]> = {
  sm: ['px-2', 'py-1', 'text-xs'],
  md: ['px-4', 'py-2', 'text-sm'],
  lg: ['px-6', 'py-3', 'text-base'],
};

// Feature: react-migration, Property 5: GlowNode size mapping
// **Validates: Requirements 3.5**
test.prop(
  [labelArb, sizeArb, iconArb],
  { numRuns: 100 },
)('GlowNode renders label, correct size classes, and conditional icon', (label, size, icon) => {
  const { container } = render(
    <GlowNode label={label} size={size} icon={icon ?? undefined} />
  );
  const node = container.firstElementChild as HTMLElement;

  // Label rendered
  expect(node.textContent).toContain(label);

  // Size classes
  const expectedClasses = sizeClassMap[size];
  for (const cls of expectedClasses) {
    expect(node.className).toContain(cls);
  }

  // Icon conditional
  const iconEl = container.querySelector('.glow-node__icon');
  if (icon) {
    expect(iconEl).not.toBeNull();
  } else {
    expect(iconEl).toBeNull();
  }
});
