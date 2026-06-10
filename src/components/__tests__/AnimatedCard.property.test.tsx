import { test } from '@fast-check/vitest';
import { expect } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';
import { render } from '@testing-library/react';
import AnimatedCard from '../AnimatedCard';

// Feature: react-migration, Property 1: AnimatedCard renders correct element type based on props
// **Validates: Requirements 3.1**
test.prop(
  [fc.string({ minLength: 1, maxLength: 50 }), fc.string({ minLength: 1, maxLength: 100 }), fc.option(fc.webUrl())],
  { numRuns: 100 },
)('AnimatedCard renders <a> when link provided, <div> otherwise', (title, description, link) => {
  const { container } = render(
    <AnimatedCard title={title} description={description} link={link ?? undefined} />
  );
  const element = container.firstElementChild;
  if (link) {
    expect(element?.tagName).toBe('A');
    expect(element?.getAttribute('href')).toBe(link);
  } else {
    expect(element?.tagName).toBe('DIV');
  }
});

test.prop(
  [fc.string({ minLength: 1, maxLength: 50 }), fc.string({ minLength: 1, maxLength: 100 }), fc.nat({ max: 5000 })],
  { numRuns: 100 },
)('AnimatedCard animationDelay matches delay prop', (title, description, delay) => {
  const { container } = render(
    <AnimatedCard title={title} description={description} delay={delay} />
  );
  const element = container.firstElementChild as HTMLElement;
  expect(element.style.animationDelay).toBe(`${delay}ms`);
});
