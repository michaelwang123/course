import { useState, useEffect, useRef } from 'react';
import { formatTime, calculateRemainingSeconds } from '../lib/timerUtils';

interface UseTimerConfig {
  startTime: string;
  durationMinutes: number;
  onTimeout: () => void;
  /** When false, the timer does not tick and returns safe defaults. Defaults to true. */
  enabled?: boolean;
}

interface UseTimerReturn {
  remainingSeconds: number;
  formattedTime: string;
  isWarning: boolean;
  isCritical: boolean;
}

/**
 * Custom hook for exam countdown timer.
 *
 * Calculates remaining time based on server-recorded startTime and durationMinutes.
 * Updates every second via setInterval. Calls onTimeout when remaining reaches 0.
 *
 * - isWarning: true when remaining < 5 minutes (300 seconds) — display orange
 * - isCritical: true when remaining < 60 seconds — display red
 * - When enabled=false, the interval is not started and defaults are returned.
 */
export function useTimer({
  startTime,
  durationMinutes,
  onTimeout,
  enabled = true,
}: UseTimerConfig): UseTimerReturn {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    enabled ? calculateRemainingSeconds(startTime, durationMinutes) : durationMinutes * 60
  );

  const onTimeoutRef = useRef(onTimeout);
  const hasTimedOutRef = useRef(false);

  // Keep the callback ref up-to-date without causing re-renders
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    if (!enabled) return;

    // Reset timeout flag when config changes
    hasTimedOutRef.current = false;

    const tick = () => {
      const remaining = calculateRemainingSeconds(startTime, durationMinutes);
      setRemainingSeconds(remaining);

      if (remaining <= 0 && !hasTimedOutRef.current) {
        hasTimedOutRef.current = true;
        onTimeoutRef.current();
      }
    };

    // Initial calculation
    tick();

    const intervalId = setInterval(tick, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [startTime, durationMinutes, enabled]);

  const formattedTime = formatTime(remainingSeconds);
  const isCritical = remainingSeconds < 60 && remainingSeconds > 0;
  const isWarning = remainingSeconds < 300 && remainingSeconds >= 60;

  return {
    remainingSeconds,
    formattedTime,
    isWarning,
    isCritical,
  };
}
