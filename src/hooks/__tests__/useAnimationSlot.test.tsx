import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AnimationOrchestratorProvider,
  useAnimationSlot,
} from '../useAnimationSlot';

// Test component that exposes hook state
function TestSlot({
  options,
  onState,
}: {
  options?: Parameters<typeof useAnimationSlot>[0];
  onState?: (result: ReturnType<typeof useAnimationSlot>) => void;
}) {
  const result = useAnimationSlot(options);
  onState?.(result);
  return <div ref={result.ref} data-testid="slot" data-state={result.state} />;
}

describe('useAnimationSlot', () => {
  let observerCallback: IntersectionObserverCallback;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockDisconnect = vi.fn();

    class MockIntersectionObserver implements IntersectionObserver {
      root = null;
      rootMargin = '';
      thresholds = [] as number[];

      constructor(
        callback: IntersectionObserverCallback,
        _options?: IntersectionObserverInit,
      ) {
        observerCallback = callback;
      }

      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = mockDisconnect;
      takeRecords = () => [] as IntersectionObserverEntry[];
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('starts in idle state', () => {
    let state: string = '';
    render(
      <AnimationOrchestratorProvider>
        <TestSlot onState={(r) => (state = r.state)} />
      </AnimationOrchestratorProvider>,
    );
    expect(state).toBe('idle');
  });

  it('returns isActive: false and isInViewport: true when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    let result: ReturnType<typeof useAnimationSlot> | null = null;
    render(
      <AnimationOrchestratorProvider>
        <TestSlot onState={(r) => (result = r)} />
      </AnimationOrchestratorProvider>,
    );

    expect(result!.isActive).toBe(false);
    expect(result!.isInViewport).toBe(true);
    expect(result!.state).toBe('idle');
  });

  it('transitions to active when element enters viewport with sufficient ratio', () => {
    let result: ReturnType<typeof useAnimationSlot> | null = null;
    render(
      <AnimationOrchestratorProvider>
        <TestSlot onState={(r) => (result = r)} />
      </AnimationOrchestratorProvider>,
    );

    // Simulate intersection with ratio >= threshold (0.1)
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 0.5,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(result!.state).toBe('active');
    expect(result!.isActive).toBe(true);
  });

  it('transitions to preloading when element enters rootMargin zone but below threshold', () => {
    let result: ReturnType<typeof useAnimationSlot> | null = null;
    render(
      <AnimationOrchestratorProvider>
        <TestSlot onState={(r) => (result = r)} />
      </AnimationOrchestratorProvider>,
    );

    // Simulate intersection in rootMargin zone but below threshold
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 0.05, // below default 0.1 threshold
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(result!.state).toBe('preloading');
    expect(result!.isActive).toBe(false);
  });

  it('enforces max 3 concurrent active animations', () => {
    const results: Array<ReturnType<typeof useAnimationSlot> | null> = [
      null,
      null,
      null,
      null,
    ];
    const callbacks: IntersectionObserverCallback[] = [];

    class MultiMockObserver implements IntersectionObserver {
      root = null;
      rootMargin = '';
      thresholds = [] as number[];

      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback);
      }

      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = () => [] as IntersectionObserverEntry[];
    }

    vi.stubGlobal('IntersectionObserver', MultiMockObserver);

    render(
      <AnimationOrchestratorProvider maxConcurrent={3}>
        <TestSlot onState={(r) => (results[0] = r)} />
        <TestSlot onState={(r) => (results[1] = r)} />
        <TestSlot onState={(r) => (results[2] = r)} />
        <TestSlot onState={(r) => (results[3] = r)} />
      </AnimationOrchestratorProvider>,
    );

    // Activate first 3
    for (let i = 0; i < 3; i++) {
      act(() => {
        callbacks[i](
          [
            {
              isIntersecting: true,
              intersectionRatio: 0.5,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        );
      });
    }

    expect(results[0]!.state).toBe('active');
    expect(results[1]!.state).toBe('active');
    expect(results[2]!.state).toBe('active');

    // 4th should be waiting
    act(() => {
      callbacks[3](
        [
          {
            isIntersecting: true,
            intersectionRatio: 0.5,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(results[3]!.state).toBe('waiting');
    expect(results[3]!.isActive).toBe(false);
  });

  it('starts grace period when active element exits viewport', () => {
    vi.useFakeTimers();
    let result: ReturnType<typeof useAnimationSlot> | null = null;

    render(
      <AnimationOrchestratorProvider>
        <TestSlot onState={(r) => (result = r)} />
      </AnimationOrchestratorProvider>,
    );

    // Enter viewport
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 0.5,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });
    expect(result!.state).toBe('active');

    // Exit viewport
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: false,
            intersectionRatio: 0,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });
    expect(result!.state).toBe('grace-period');

    // After 2 seconds, should transition to idle
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result!.state).toBe('idle');
  });

  it('reactivates when re-entering viewport during grace period', () => {
    vi.useFakeTimers();
    let result: ReturnType<typeof useAnimationSlot> | null = null;

    render(
      <AnimationOrchestratorProvider>
        <TestSlot onState={(r) => (result = r)} />
      </AnimationOrchestratorProvider>,
    );

    // Enter viewport
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 0.5,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });
    expect(result!.state).toBe('active');

    // Exit viewport
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: false,
            intersectionRatio: 0,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });
    expect(result!.state).toBe('grace-period');

    // Re-enter before 2s
    act(() => {
      vi.advanceTimersByTime(500);
    });
    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 0.5,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });
    expect(result!.state).toBe('active');

    // Should NOT transition to idle after remaining time
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result!.state).toBe('active');
  });

  it('cleans up observer on unmount (React Strict Mode safety)', () => {
    const { unmount } = render(
      <AnimationOrchestratorProvider>
        <TestSlot />
      </AnimationOrchestratorProvider>,
    );

    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('transitions waiting to idle when element exits viewport', () => {
    const callbacks: IntersectionObserverCallback[] = [];

    class MultiMockObserver implements IntersectionObserver {
      root = null;
      rootMargin = '';
      thresholds = [] as number[];

      constructor(callback: IntersectionObserverCallback) {
        callbacks.push(callback);
      }

      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = () => [] as IntersectionObserverEntry[];
    }

    vi.stubGlobal('IntersectionObserver', MultiMockObserver);

    const results: Array<ReturnType<typeof useAnimationSlot> | null> = [
      null,
      null,
      null,
      null,
    ];

    render(
      <AnimationOrchestratorProvider maxConcurrent={3}>
        <TestSlot onState={(r) => (results[0] = r)} />
        <TestSlot onState={(r) => (results[1] = r)} />
        <TestSlot onState={(r) => (results[2] = r)} />
        <TestSlot onState={(r) => (results[3] = r)} />
      </AnimationOrchestratorProvider>,
    );

    // Fill all 3 slots
    for (let i = 0; i < 3; i++) {
      act(() => {
        callbacks[i](
          [
            {
              isIntersecting: true,
              intersectionRatio: 0.5,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        );
      });
    }

    // 4th enters viewport — waiting
    act(() => {
      callbacks[3](
        [
          {
            isIntersecting: true,
            intersectionRatio: 0.5,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });
    expect(results[3]!.state).toBe('waiting');

    // 4th exits viewport — should go back to idle
    act(() => {
      callbacks[3](
        [
          {
            isIntersecting: false,
            intersectionRatio: 0,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });
    expect(results[3]!.state).toBe('idle');
  });
});
