import { describe, it, expect } from 'vitest';
import { test as fcTest } from '@fast-check/vitest';
import fc from 'fast-check';
import { formatTime, calculateRemainingSeconds } from '../../src/lib/timerUtils';

describe('formatTime', () => {
  it('formats 0 seconds as 00:00', () => {
    expect(formatTime(0)).toBe('00:00');
  });

  it('formats seconds < 60 as 00:SS', () => {
    expect(formatTime(5)).toBe('00:05');
    expect(formatTime(59)).toBe('00:59');
  });

  it('formats minutes and seconds as MM:SS', () => {
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(90)).toBe('01:30');
    expect(formatTime(600)).toBe('10:00');
    expect(formatTime(3599)).toBe('59:59');
  });

  it('formats >= 3600 seconds as HH:MM:SS', () => {
    expect(formatTime(3600)).toBe('01:00:00');
    expect(formatTime(3661)).toBe('01:01:01');
    expect(formatTime(7200)).toBe('02:00:00');
    expect(formatTime(36000)).toBe('10:00:00');
  });
});

describe('calculateRemainingSeconds', () => {
  it('returns full duration when no time has elapsed', () => {
    const now = new Date('2024-01-01T10:00:00Z');
    const startTime = '2024-01-01T10:00:00Z';
    expect(calculateRemainingSeconds(startTime, 30, now)).toBe(1800);
  });

  it('returns correct remaining time mid-exam', () => {
    const startTime = '2024-01-01T10:00:00Z';
    const now = new Date('2024-01-01T10:10:00Z'); // 10 minutes elapsed
    expect(calculateRemainingSeconds(startTime, 30, now)).toBe(1200); // 20 minutes remaining
  });

  it('returns 0 when time has expired', () => {
    const startTime = '2024-01-01T10:00:00Z';
    const now = new Date('2024-01-01T10:31:00Z'); // 31 minutes elapsed, 30 min exam
    expect(calculateRemainingSeconds(startTime, 30, now)).toBe(0);
  });

  it('returns 0 when exactly at duration', () => {
    const startTime = '2024-01-01T10:00:00Z';
    const now = new Date('2024-01-01T10:30:00Z'); // exactly 30 minutes
    expect(calculateRemainingSeconds(startTime, 30, now)).toBe(0);
  });

  it('never returns negative values', () => {
    const startTime = '2024-01-01T10:00:00Z';
    const now = new Date('2024-01-01T12:00:00Z'); // 2 hours later, way past 30 min exam
    expect(calculateRemainingSeconds(startTime, 30, now)).toBe(0);
  });
});

/**
 * Property 5: Remaining time calculation is correct
 *
 * For any ISO 8601 startTime, positive durationMinutes, and reference time `now`,
 * calculateRemainingSeconds(startTime, durationMinutes, now) SHALL return
 * max(0, durationMinutes * 60 - elapsedSeconds) where elapsedSeconds is
 * the difference between now and startTime in seconds.
 *
 * **Validates: Requirements 5.1, 5.7**
 */
describe('Property 5: Remaining time calculation is correct', () => {
  fcTest.prop(
    [
      fc.tuple(
        // Generate a start time as a Date (within a reasonable range)
        fc.date({ min: new Date('2020-01-01T00:00:00Z'), max: new Date('2030-01-01T00:00:00Z') }),
        // Generate durationMinutes as integer 5-120
        fc.integer({ min: 5, max: 120 }),
        // Generate elapsed factor (0 to 2x duration) as a float multiplier
        fc.float({ min: 0, max: 1, noNaN: true }),
      ),
    ],
    { numRuns: 100 }
  )(
    'calculateRemainingSeconds equals max(0, durationMinutes*60 - elapsedSeconds)',
    ([startTime, durationMinutes, elapsedFactor]) => {
      // Create `now` as 0 to 2*duration minutes after startTime
      const maxElapsedMs = durationMinutes * 2 * 60 * 1000;
      const elapsedMs = Math.floor(elapsedFactor * maxElapsedMs);
      const now = new Date(startTime.getTime() + elapsedMs);

      const result = calculateRemainingSeconds(
        startTime.toISOString(),
        durationMinutes,
        now
      );

      const elapsedSeconds = Math.floor(
        (now.getTime() - startTime.getTime()) / 1000
      );
      const expected = Math.max(0, durationMinutes * 60 - elapsedSeconds);

      expect(result).toBe(expected);
    }
  );

  fcTest.prop(
    [
      fc.tuple(
        fc.date({ min: new Date('2020-01-01T00:00:00Z'), max: new Date('2030-01-01T00:00:00Z') }),
        fc.integer({ min: 5, max: 120 }),
        fc.float({ min: 0, max: 1, noNaN: true }),
      ),
    ],
    { numRuns: 100 }
  )(
    'result is always >= 0 (never negative)',
    ([startTime, durationMinutes, elapsedFactor]) => {
      // Create `now` that can be up to 2x the duration after start
      const maxElapsedMs = durationMinutes * 2 * 60 * 1000;
      const elapsedMs = Math.floor(elapsedFactor * maxElapsedMs);
      const now = new Date(startTime.getTime() + elapsedMs);

      const result = calculateRemainingSeconds(
        startTime.toISOString(),
        durationMinutes,
        now
      );

      expect(result).toBeGreaterThanOrEqual(0);
    }
  );
});
