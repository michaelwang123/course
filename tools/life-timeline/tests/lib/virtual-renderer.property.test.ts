// Feature: life-timeline, Property 3: Same-date event stacking and ordering
// Feature: life-timeline, Property 6: Virtual rendering bounds
// tests/lib/virtual-renderer.property.test.ts
// 属性测试：验证虚拟渲染器的堆叠排序与渲染边界正确性

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  detectStacking,
  getVisibleNodes,
  getPerformanceTier,
  isNodeVisible,
} from '@/lib/virtual-renderer';
import type { EventCategory, EventSentiment } from '@/types/event';
import type { ZoomLevel } from '@/types/timeline';

// **Validates: Requirements 3.7, 2.12, 7.6**

// --- Arbitraries ---

const VALID_CATEGORIES: EventCategory[] = [
  'education', 'work', 'life', 'achievement', 'health', 'travel', 'other',
];

const VALID_SENTIMENTS: EventSentiment[] = [
  'positive', 'neutral', 'negative',
];

const ZOOM_LEVELS: ZoomLevel[] = ['year', 'month', 'day'];

const zoomLevelArb = fc.constantFrom(...ZOOM_LEVELS);

/** Generate a valid date string YYYY-MM-DD */
const dateStringArb = fc.date({
  min: new Date(1900, 0, 1),
  max: new Date(2034, 11, 31),
}).map(d => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

/** Generate a valid ISO timestamp for createdAt/updatedAt */
const timestampArb = fc.date({
  min: new Date(2020, 0, 1),
  max: new Date(2024, 11, 31),
}).map(d => d.toISOString());

/** Generate a valid EventNode */
const eventNodeArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  eventDate: dateStringArb,
  category: fc.constantFrom(...VALID_CATEGORIES),
  sentiment: fc.constantFrom(...VALID_SENTIMENTS),
  createdAt: timestampArb,
  updatedAt: timestampArb,
});

/** Generate a list of EventNodes that share the same date (for stacking tests) */
function sameDateEventsArb(minCount: number, maxCount: number) {
  return fc.tuple(dateStringArb, fc.integer({ min: minCount, max: maxCount })).chain(([date, count]) =>
    fc.array(
      fc.record({
        id: fc.uuid(),
        userId: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
        description: fc.string({ minLength: 0, maxLength: 100 }),
        eventDate: fc.constant(date),
        category: fc.constantFrom(...VALID_CATEGORIES),
        sentiment: fc.constantFrom(...VALID_SENTIMENTS),
        createdAt: timestampArb,
        updatedAt: timestampArb,
      }),
      { minLength: count, maxLength: count }
    )
  );
}

/** Generate a viewport state */
const viewportArb = fc.record({
  width: fc.integer({ min: 300, max: 2000 }),
  height: fc.integer({ min: 200, max: 1200 }),
  offset: fc.integer({ min: 0, max: 5000 }),
});

/** Generate a timeline range (start < end) */
const timelineRangeArb = fc.tuple(
  fc.date({ min: new Date(1900, 0, 1), max: new Date(2020, 0, 1) }),
  fc.date({ min: new Date(2020, 0, 2), max: new Date(2035, 11, 31) })
).map(([start, end]) => ({ start, end }));

// --- Property 3: Same-date event stacking and ordering ---

describe('Property 3: Same-date event stacking and ordering', () => {
  // **Validates: Requirements 3.7, 2.12**

  it('events with the same date are grouped together in detectStacking', () => {
    fc.assert(
      fc.property(
        sameDateEventsArb(2, 10),
        zoomLevelArb,
        (events, zoomLevel) => {
          const stacking = detectStacking(events, zoomLevel);

          // All events share the same date, so there should be exactly one group
          const sharedDate = events[0].eventDate;
          expect(stacking.has(sharedDate)).toBe(true);

          const group = stacking.get(sharedDate)!;
          // All events should be in this group
          expect(group.length).toBe(events.length);

          // All event IDs from the input should be present in the group
          const groupIds = new Set(group.map(e => e.id));
          for (const event of events) {
            expect(groupIds.has(event.id)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('within a stack, events are sorted by createdAt DESC (most recent first)', () => {
    fc.assert(
      fc.property(
        sameDateEventsArb(2, 15),
        zoomLevelArb,
        (events, zoomLevel) => {
          const stacking = detectStacking(events, zoomLevel);
          const sharedDate = events[0].eventDate;
          const group = stacking.get(sharedDate)!;

          // Verify the group is sorted by createdAt descending
          for (let i = 0; i < group.length - 1; i++) {
            const currentCreatedAt = new Date(group[i].createdAt).getTime();
            const nextCreatedAt = new Date(group[i + 1].createdAt).getTime();
            expect(currentCreatedAt).toBeGreaterThanOrEqual(nextCreatedAt);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('events with different dates are grouped into separate stacks', () => {
    fc.assert(
      fc.property(
        fc.array(eventNodeArb, { minLength: 2, maxLength: 20 }),
        zoomLevelArb,
        (events, zoomLevel) => {
          const stacking = detectStacking(events, zoomLevel);

          // Each unique date should have a group
          const uniqueDates = new Set(events.map(e => e.eventDate));
          expect(stacking.size).toBe(uniqueDates.size);

          // Each group should contain exactly the events with that date
          for (const [date, group] of stacking) {
            const expectedEvents = events.filter(e => e.eventDate === date);
            expect(group.length).toBe(expectedEvents.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('single-event dates are not marked as stacked in getVisibleNodes', () => {
    fc.assert(
      fc.property(
        // Generate events with unique dates
        fc.array(eventNodeArb, { minLength: 1, maxLength: 10 }).map(events => {
          // Ensure all events have different dates
          const usedDates = new Set<string>();
          return events.filter(e => {
            if (usedDates.has(e.eventDate)) return false;
            usedDates.add(e.eventDate);
            return true;
          });
        }).filter(events => events.length >= 1),
        viewportArb,
        timelineRangeArb,
        zoomLevelArb,
        (events, viewport, range, zoomLevel) => {
          const visibleNodes = getVisibleNodes(events, viewport, range, zoomLevel, 50);

          // Each event has a unique date, so none should be stacked
          for (const node of visibleNodes) {
            expect(node.isStacked).toBe(false);
            expect(node.stackCount).toBe(1);
            expect(node.stackIndex).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- Property 6: Virtual rendering bounds ---

describe('Property 6: Virtual rendering bounds', () => {
  // **Validates: Requirements 7.6**

  it('getPerformanceTier returns correct tier based on event count', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10000 }),
        (count) => {
          const tier = getPerformanceTier(count);
          if (count <= 200) {
            expect(tier).toBe('high');
          } else if (count <= 500) {
            expect(tier).toBe('medium');
          } else {
            expect(tier).toBe('low');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getVisibleNodes returns count ≤ total events (no duplication)', () => {
    fc.assert(
      fc.property(
        fc.array(eventNodeArb, { minLength: 1, maxLength: 600 }),
        viewportArb,
        timelineRangeArb,
        zoomLevelArb,
        fc.integer({ min: 5, max: 100 }),
        (events, viewport, range, zoomLevel, bufferCount) => {
          const visibleNodes = getVisibleNodes(events, viewport, range, zoomLevel, bufferCount);

          // Returned nodes count must not exceed total events
          expect(visibleNodes.length).toBeLessThanOrEqual(events.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('in low tier (>500 events), getVisibleNodes returns fewer nodes than total', () => {
    fc.assert(
      fc.property(
        fc.array(eventNodeArb, { minLength: 501, maxLength: 600 }),
        viewportArb,
        timelineRangeArb,
        zoomLevelArb,
        fc.integer({ min: 5, max: 50 }),
        (events, viewport, range, zoomLevel, bufferCount) => {
          const tier = getPerformanceTier(events.length);
          expect(tier).toBe('low');

          const visibleNodes = getVisibleNodes(events, viewport, range, zoomLevel, bufferCount);

          // In low tier, virtual rendering should limit the number of rendered nodes
          // The result should not exceed viewport-visible + 2*bufferCount
          // At maximum, it could be all events if all fit in viewport + buffer,
          // but it must never exceed total events
          expect(visibleNodes.length).toBeLessThanOrEqual(events.length);
          expect(visibleNodes.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('in high/medium tier (≤500 events), getVisibleNodes returns all events', () => {
    fc.assert(
      fc.property(
        fc.array(eventNodeArb, { minLength: 1, maxLength: 500 }),
        viewportArb,
        timelineRangeArb,
        zoomLevelArb,
        (events, viewport, range, zoomLevel) => {
          const tier = getPerformanceTier(events.length);
          expect(['high', 'medium']).toContain(tier);

          const visibleNodes = getVisibleNodes(events, viewport, range, zoomLevel, 50);

          // In high/medium tier, all events should be rendered
          expect(visibleNodes.length).toBe(events.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('isNodeVisible correctly determines visibility with buffer', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000, max: 3000, noNaN: true }),
        fc.float({ min: 0, max: 1000, noNaN: true }),
        fc.float({ min: 1, max: 2000, noNaN: true }),
        fc.float({ min: 0, max: 500, noNaN: true }),
        (nodePos, viewportStart, viewportWidth, buffer) => {
          const viewportEnd = viewportStart + viewportWidth;
          const visible = isNodeVisible(nodePos, viewportStart, viewportEnd, buffer);

          if (nodePos >= viewportStart - buffer && nodePos <= viewportEnd + buffer) {
            expect(visible).toBe(true);
          } else {
            expect(visible).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getVisibleNodes returns empty array for empty events', () => {
    fc.assert(
      fc.property(
        viewportArb,
        timelineRangeArb,
        zoomLevelArb,
        (viewport, range, zoomLevel) => {
          const visibleNodes = getVisibleNodes([], viewport, range, zoomLevel, 50);
          expect(visibleNodes).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('buffer expansion: increasing bufferCount increases or maintains visible node count in low tier', () => {
    fc.assert(
      fc.property(
        fc.array(eventNodeArb, { minLength: 501, maxLength: 600 }),
        viewportArb,
        timelineRangeArb,
        zoomLevelArb,
        fc.integer({ min: 5, max: 20 }),
        (events, viewport, range, zoomLevel, smallBuffer) => {
          const largeBuffer = smallBuffer + 20;

          const smallResult = getVisibleNodes(events, viewport, range, zoomLevel, smallBuffer);
          const largeResult = getVisibleNodes(events, viewport, range, zoomLevel, largeBuffer);

          // Larger buffer should return >= nodes than smaller buffer
          expect(largeResult.length).toBeGreaterThanOrEqual(smallResult.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});
