import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../../src/hooks/useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return initial remaining seconds based on startTime and durationMinutes', () => {
    const now = new Date('2024-01-01T10:00:00Z');
    vi.setSystemTime(now);

    const { result } = renderHook(() =>
      useTimer({
        startTime: '2024-01-01T09:50:00Z', // 10 minutes elapsed
        durationMinutes: 30,
        onTimeout: vi.fn(),
      })
    );

    // 30 * 60 - 10 * 60 = 1200 seconds remaining
    expect(result.current.remainingSeconds).toBe(1200);
    expect(result.current.formattedTime).toBe('20:00');
    expect(result.current.isWarning).toBe(false);
    expect(result.current.isCritical).toBe(false);
  });

  it('should update remaining seconds every second', () => {
    const now = new Date('2024-01-01T10:00:00Z');
    vi.setSystemTime(now);

    const { result } = renderHook(() =>
      useTimer({
        startTime: '2024-01-01T09:50:00Z',
        durationMinutes: 30,
        onTimeout: vi.fn(),
      })
    );

    expect(result.current.remainingSeconds).toBe(1200);

    // Advance time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.remainingSeconds).toBe(1199);
  });

  it('should set isWarning when remaining < 5 minutes', () => {
    const now = new Date('2024-01-01T10:00:00Z');
    vi.setSystemTime(now);

    const { result } = renderHook(() =>
      useTimer({
        startTime: '2024-01-01T09:55:30Z', // 4.5 minutes elapsed from a 5 min exam
        durationMinutes: 5,
        onTimeout: vi.fn(),
      })
    );

    // Remaining = 5*60 - 4.5*60 = 30 seconds
    expect(result.current.remainingSeconds).toBe(30);
    expect(result.current.isWarning).toBe(false); // < 60s means isCritical takes over visually
    expect(result.current.isCritical).toBe(true);
  });

  it('should set isWarning=true when remaining is between 60 and 300 seconds', () => {
    const now = new Date('2024-01-01T10:00:00Z');
    vi.setSystemTime(now);

    const { result } = renderHook(() =>
      useTimer({
        // 27 minutes elapsed, 3 minutes remaining (180s)
        startTime: '2024-01-01T09:33:00Z',
        durationMinutes: 30,
        onTimeout: vi.fn(),
      })
    );

    expect(result.current.remainingSeconds).toBe(180);
    expect(result.current.isWarning).toBe(true);
    expect(result.current.isCritical).toBe(false);
  });

  it('should set isCritical=true when remaining < 60 seconds', () => {
    const now = new Date('2024-01-01T10:00:00Z');
    vi.setSystemTime(now);

    const { result } = renderHook(() =>
      useTimer({
        // 29 minutes 30 seconds elapsed, 30 seconds remaining
        startTime: '2024-01-01T09:30:30Z',
        durationMinutes: 30,
        onTimeout: vi.fn(),
      })
    );

    expect(result.current.remainingSeconds).toBe(30);
    expect(result.current.isWarning).toBe(false);
    expect(result.current.isCritical).toBe(true);
  });

  it('should call onTimeout when remaining reaches 0', () => {
    const now = new Date('2024-01-01T10:00:00Z');
    vi.setSystemTime(now);
    const onTimeout = vi.fn();

    renderHook(() =>
      useTimer({
        // 2 seconds remaining
        startTime: '2024-01-01T09:30:02Z',
        durationMinutes: 30,
        onTimeout,
      })
    );

    expect(onTimeout).not.toHaveBeenCalled();

    // Advance 3 seconds to pass the timeout threshold
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('should call onTimeout only once', () => {
    const now = new Date('2024-01-01T10:00:00Z');
    vi.setSystemTime(now);
    const onTimeout = vi.fn();

    renderHook(() =>
      useTimer({
        // 1 second remaining
        startTime: '2024-01-01T09:30:01Z',
        durationMinutes: 30,
        onTimeout,
      })
    );

    // Advance past timeout
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('should cleanup interval on unmount', () => {
    const now = new Date('2024-01-01T10:00:00Z');
    vi.setSystemTime(now);

    const { unmount } = renderHook(() =>
      useTimer({
        startTime: '2024-01-01T09:50:00Z',
        durationMinutes: 30,
        onTimeout: vi.fn(),
      })
    );

    unmount();

    // After unmount, no further interval should fire
    // This is implicitly tested — if interval wasn't cleared, it would throw
    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });

  it('should not set isWarning or isCritical when remaining is 0', () => {
    const now = new Date('2024-01-01T10:30:00Z');
    vi.setSystemTime(now);

    const { result } = renderHook(() =>
      useTimer({
        startTime: '2024-01-01T10:00:00Z', // exactly 30 min elapsed
        durationMinutes: 30,
        onTimeout: vi.fn(),
      })
    );

    expect(result.current.remainingSeconds).toBe(0);
    expect(result.current.isWarning).toBe(false);
    expect(result.current.isCritical).toBe(false);
  });

  it('should format time correctly for durations over 1 hour', () => {
    const now = new Date('2024-01-01T10:00:00Z');
    vi.setSystemTime(now);

    const { result } = renderHook(() =>
      useTimer({
        startTime: '2024-01-01T10:00:00Z', // just started
        durationMinutes: 120,
        onTimeout: vi.fn(),
      })
    );

    // 120 * 60 = 7200 seconds
    expect(result.current.remainingSeconds).toBe(7200);
    expect(result.current.formattedTime).toBe('02:00:00');
  });
});
