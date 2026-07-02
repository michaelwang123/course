import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { expect } from 'vitest';
import {
  cosineSimilarity,
  euclideanDistance,
  dotProduct,
} from '../SimilarityCalculator/index';

// Helper: round to 4 decimal places (matching implementation)
function roundTo4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

// Generator for vector components in [-10, 10] with no NaN
const vectorComponentArb = fc.double({ min: -10, max: 10, noNaN: true });
const vector2DArb = fc.tuple(vectorComponentArb, vectorComponentArb) as fc.Arbitrary<[number, number]>;

// Feature: qdrant-vector-animation, Property 1: Similarity Calculation Correctness
// **Validates: Requirements 2.4, 2.6**

test.prop(
  [vector2DArb, vector2DArb],
  { numRuns: 100 },
)('cosineSimilarity matches mathematical definition (4 decimal places)', (a, b) => {
  const result = cosineSimilarity(a, b);

  // Mathematical definition: (A·B) / (|A| × |B|)
  const dot = a[0] * b[0] + a[1] * b[1];
  const magA = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  const magB = Math.sqrt(b[0] * b[0] + b[1] * b[1]);

  if (magA === 0 || magB === 0) {
    expect(result).toBe(0);
  } else {
    const expected = roundTo4(dot / (magA * magB));
    expect(result).toBe(expected);
  }
});

test.prop(
  [vector2DArb, vector2DArb],
  { numRuns: 100 },
)('euclideanDistance matches mathematical definition (4 decimal places)', (a, b) => {
  const result = euclideanDistance(a, b);

  // Mathematical definition: √((a₁-b₁)² + (a₂-b₂)²)
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const expected = roundTo4(Math.sqrt(dx * dx + dy * dy));

  expect(result).toBe(expected);
});

test.prop(
  [vector2DArb, vector2DArb],
  { numRuns: 100 },
)('dotProduct matches mathematical definition (4 decimal places)', (a, b) => {
  const result = dotProduct(a, b);

  // Mathematical definition: a₁×b₁ + a₂×b₂
  const expected = roundTo4(a[0] * b[0] + a[1] * b[1]);

  expect(result).toBe(expected);
});
