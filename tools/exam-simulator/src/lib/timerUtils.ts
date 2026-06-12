/**
 * Timer utility functions for exam countdown display and remaining time calculation.
 */

/**
 * Formats a non-negative integer of seconds into a display string.
 * - If seconds < 3600: returns "MM:SS" (zero-padded)
 * - If seconds >= 3600: returns "HH:MM:SS" (zero-padded)
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  if (seconds >= 3600) {
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  return `${mm}:${ss}`;
}

/**
 * Calculates the remaining seconds for an exam session.
 *
 * @param startTime - ISO 8601 date string representing when the exam started
 * @param durationMinutes - Total exam duration in minutes
 * @param now - Reference time (defaults to new Date() for production, injected for testing)
 * @returns Remaining seconds, minimum 0
 */
export function calculateRemainingSeconds(
  startTime: string,
  durationMinutes: number,
  now: Date = new Date()
): number {
  const elapsedSeconds = Math.floor(
    (now.getTime() - new Date(startTime).getTime()) / 1000
  );
  return Math.max(0, durationMinutes * 60 - elapsedSeconds);
}
