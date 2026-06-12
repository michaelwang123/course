/**
 * Creates a debounced version of a function that delays invocation
 * until after `delayMs` milliseconds have elapsed since the last call.
 *
 * The returned function includes a `.cancel()` method to clear any
 * pending timeout (useful for cleanup on component unmount).
 *
 * @param fn - The function to debounce
 * @param delayMs - Delay in milliseconds
 * @returns Debounced function with a cancel method
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, delayMs);
  };

  debounced.cancel = (): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}
