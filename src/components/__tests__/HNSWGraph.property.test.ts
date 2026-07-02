import { test } from '@fast-check/vitest';
import * as fc from 'fast-check';
import { expect } from 'vitest';
import {
  generateLayerNodeCounts,
  desktopConfig,
  mobileConfig,
} from '../HNSWGraph/index';

// Generator for viewport widths across the full supported range
const viewportWidthArb = fc.integer({ min: 320, max: 2560 });

// Feature: qdrant-vector-animation, Property 8: HNSW Graph Layer Constraints
// **Validates: Requirements 4.1**

test.prop(
  [viewportWidthArb, fc.integer()],
  { numRuns: 150 },
)('Layer 2 contains 2-3 nodes for any viewport width', (viewportWidth, seed) => {
  const counts = generateLayerNodeCounts(viewportWidth, seed);
  expect(counts.layer2).toBeGreaterThanOrEqual(2);
  expect(counts.layer2).toBeLessThanOrEqual(3);
});

test.prop(
  [viewportWidthArb, fc.integer()],
  { numRuns: 150 },
)('Layer 1 contains 5-8 nodes for any viewport width', (viewportWidth, seed) => {
  const counts = generateLayerNodeCounts(viewportWidth, seed);
  expect(counts.layer1).toBeGreaterThanOrEqual(5);
  expect(counts.layer1).toBeLessThanOrEqual(8);
});

test.prop(
  [viewportWidthArb, fc.integer()],
  { numRuns: 150 },
)('Layer 0 contains 12-20 nodes on desktop (≥768px) or 8-12 nodes on mobile (<768px)', (viewportWidth, seed) => {
  const counts = generateLayerNodeCounts(viewportWidth, seed);

  if (viewportWidth >= 768) {
    // Desktop: 12-20 nodes
    expect(counts.layer0).toBeGreaterThanOrEqual(12);
    expect(counts.layer0).toBeLessThanOrEqual(20);
  } else {
    // Mobile: 8-12 nodes
    expect(counts.layer0).toBeGreaterThanOrEqual(8);
    expect(counts.layer0).toBeLessThanOrEqual(12);
  }
});

test.prop(
  [viewportWidthArb, fc.integer()],
  { numRuns: 150 },
)('generateLayerNodeCounts respects config boundaries for all layers simultaneously', (viewportWidth, seed) => {
  const counts = generateLayerNodeCounts(viewportWidth, seed);
  const config = viewportWidth < 768 ? mobileConfig : desktopConfig;

  const layer2Config = config.layers.find((l) => l.level === 2)!;
  const layer1Config = config.layers.find((l) => l.level === 1)!;
  const layer0Config = config.layers.find((l) => l.level === 0)!;

  // All layer counts must be within their configured ranges
  expect(counts.layer2).toBeGreaterThanOrEqual(layer2Config.nodeCount.min);
  expect(counts.layer2).toBeLessThanOrEqual(layer2Config.nodeCount.max);
  expect(counts.layer1).toBeGreaterThanOrEqual(layer1Config.nodeCount.min);
  expect(counts.layer1).toBeLessThanOrEqual(layer1Config.nodeCount.max);
  expect(counts.layer0).toBeGreaterThanOrEqual(layer0Config.nodeCount.min);
  expect(counts.layer0).toBeLessThanOrEqual(layer0Config.nodeCount.max);
});
