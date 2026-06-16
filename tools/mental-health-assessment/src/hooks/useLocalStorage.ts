import { useState, useCallback } from 'react';

/**
 * Generic hook for localStorage read/write with JSON serialization.
 * Provides a useState-like API backed by localStorage.
 *
 * - Reads from localStorage on mount (with JSON.parse)
 * - Writes to localStorage on state change (with JSON.stringify)
 * - Returns [value, setValue] tuple (like useState)
 * - Error handling: if localStorage read/parse fails, uses initialValue
 *
 * @param key - The localStorage key
 * @param initialValue - Default value used when key is absent or data is corrupted
 * @returns [storedValue, setValue] tuple
 *
 * Requirements: 10.3
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Initialize state from localStorage or use initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return JSON.parse(item) as T;
    } catch {
      // If localStorage read or JSON.parse fails, use initialValue
      return initialValue;
    }
  });

  // Wrapped setter that syncs state with localStorage on write
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setStoredValue((prevValue) => {
        // Support functional updates like useState
        const valueToStore =
          value instanceof Function ? value(prevValue) : value;

        // Write to localStorage
        try {
          localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch {
          // Silently fail on write errors (e.g., quota exceeded)
        }

        return valueToStore;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
