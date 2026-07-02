import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useVirtualization } from '@/hooks/useVirtualization';
import type { EventNode } from '@/types/event';
import type { ViewportState, TimelineRange, ZoomLevel } from '@/types/timeline';

// --- Helpers ---

function generateEvents(count: number): EventNode[] {
  const events: EventNode[] = [];
  const baseDate = new Date(2020, 0, 1);
  for (let i = 0; i < count; i++) {
    const date = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    events.push({
      id: `event-${i}`,
      userId: 'user-1',
      title: `Event ${i}`,
      description: '',
      eventDate: `${year}-${month}-${day}`,
      category: 'life',
      sentiment: 'neutral',
      createdAt: new Date(2024, 0, 1, 0, 0, i).toISOString(),
      updatedAt: new Date(2024, 0, 1, 0, 0, i).toISOString(),
    });
  }
  return events;
}

const defaultViewport: ViewportState = { width: 1000, height: 600, offset: 0 };
const defaultRange: TimelineRange = {
  start: new Date(2020, 0, 1),
  end: new Date(2022, 0, 1),
};
const defaultZoom: ZoomLevel = 'year';

describe('useVirtualization', () => {
  describe('Empty events', () => {
    it('returns empty visibleNodes, totalCount=0, performanceTier=high', () => {
      const { result } = renderHook(() =>
        useVirtualization([], defaultViewport, defaultRange, defaultZoom)
      );

      expect(result.current.visibleNodes).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.performanceTier).toBe('high');
    });
  });

  describe('Performance tier classification', () => {
    it('returns high tier for ≤200 events', () => {
      const events = generateEvents(200);
      const { result } = renderHook(() =>
        useVirtualization(events, defaultViewport, defaultRange, defaultZoom)
      );

      expect(result.current.performanceTier).toBe('high');
      // High tier: all events rendered
      expect(result.current.visibleNodes.length).toBe(events.length);
    });

    it('returns medium tier for 201-500 events', () => {
      const events = generateEvents(300);
      const range: TimelineRange = {
        start: new Date(2020, 0, 1),
        end: new Date(2025, 0, 1),
      };
      const { result } = renderHook(() =>
        useVirtualization(events, defaultViewport, range, defaultZoom)
      );

      expect(result.current.performanceTier).toBe('medium');
      // Medium tier: all events rendered
      expect(result.current.visibleNodes.length).toBe(events.length);
    });

    it('returns low tier for >500 events with virtual rendering', () => {
      const events = generateEvents(600);
      // Use month zoom to produce a wider total width (5 years × 12 months × 80px = ~4800px)
      // With viewport width=1000 and offset=2000, many events will be outside viewport
      const range: TimelineRange = {
        start: new Date(2020, 0, 1),
        end: new Date(2025, 0, 1),
      };
      const viewport: ViewportState = { width: 1000, height: 600, offset: 2000 };
      const { result } = renderHook(() =>
        useVirtualization(events, viewport, range, 'month')
      );

      expect(result.current.performanceTier).toBe('low');
      // Low tier with offset: virtual rendering should filter some nodes out
      expect(result.current.visibleNodes.length).toBeLessThan(events.length);
    });
  });

  describe('totalCount always equals events.length', () => {
    it('totalCount matches events.length for high tier', () => {
      const events = generateEvents(50);
      const { result } = renderHook(() =>
        useVirtualization(events, defaultViewport, defaultRange, defaultZoom)
      );

      expect(result.current.totalCount).toBe(50);
    });

    it('totalCount matches events.length for medium tier', () => {
      const events = generateEvents(350);
      const range: TimelineRange = {
        start: new Date(2020, 0, 1),
        end: new Date(2025, 0, 1),
      };
      const { result } = renderHook(() =>
        useVirtualization(events, defaultViewport, range, defaultZoom)
      );

      expect(result.current.totalCount).toBe(350);
    });

    it('totalCount matches events.length for low tier', () => {
      const events = generateEvents(600);
      const range: TimelineRange = {
        start: new Date(2020, 0, 1),
        end: new Date(2025, 0, 1),
      };
      const { result } = renderHook(() =>
        useVirtualization(events, defaultViewport, range, defaultZoom)
      );

      expect(result.current.totalCount).toBe(600);
    });
  });

  describe('Buffer count affects visible nodes in low tier', () => {
    it('larger bufferCount produces more visible nodes', () => {
      const events = generateEvents(600);
      const range: TimelineRange = {
        start: new Date(2020, 0, 1),
        end: new Date(2025, 0, 1),
      };

      const { result: resultSmall } = renderHook(() =>
        useVirtualization(events, defaultViewport, range, defaultZoom, 10)
      );

      const { result: resultLarge } = renderHook(() =>
        useVirtualization(events, defaultViewport, range, defaultZoom, 50)
      );

      // Both should be low tier
      expect(resultSmall.current.performanceTier).toBe('low');
      expect(resultLarge.current.performanceTier).toBe('low');

      // Larger buffer should produce more (or equal) visible nodes
      expect(resultLarge.current.visibleNodes.length).toBeGreaterThanOrEqual(
        resultSmall.current.visibleNodes.length
      );
    });

    it('bufferCount does not affect high/medium tier rendering', () => {
      const events = generateEvents(100);
      const { result: result1 } = renderHook(() =>
        useVirtualization(events, defaultViewport, defaultRange, defaultZoom, 5)
      );
      const { result: result2 } = renderHook(() =>
        useVirtualization(events, defaultViewport, defaultRange, defaultZoom, 50)
      );

      // High tier renders all regardless of buffer
      expect(result1.current.visibleNodes.length).toBe(events.length);
      expect(result2.current.visibleNodes.length).toBe(events.length);
    });
  });

  describe('Zoom level changes produce different positions', () => {
    it('different zoom levels produce different position values', () => {
      const events = generateEvents(10);
      const range: TimelineRange = {
        start: new Date(2020, 0, 1),
        end: new Date(2021, 0, 1),
      };

      const { result: yearResult } = renderHook(() =>
        useVirtualization(events, defaultViewport, range, 'year')
      );
      const { result: monthResult } = renderHook(() =>
        useVirtualization(events, defaultViewport, range, 'month')
      );

      // Both should render all nodes (high tier)
      expect(yearResult.current.visibleNodes.length).toBe(10);
      expect(monthResult.current.visibleNodes.length).toBe(10);

      // Positions should differ between zoom levels
      const yearPositions = yearResult.current.visibleNodes.map((n) => n.position);
      const monthPositions = monthResult.current.visibleNodes.map((n) => n.position);

      // At least some positions should differ (different zoom = different pixel mapping)
      const hasDifference = yearPositions.some(
        (pos, idx) => pos !== monthPositions[idx]
      );
      expect(hasDifference).toBe(true);
    });
  });
});
