import { describe, it, expect, beforeEach } from 'vitest';
import { test as fcTest } from '@fast-check/vitest';
import fc from 'fast-check';
import {
  STORAGE_KEY,
  saveProgress,
  loadProgress,
  clearProgress,
  hasUnfinishedSession,
  StoredSession,
} from '@/lib/storage';

describe('storage utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const validSession: StoredSession = {
    sessionId: 'test-session-id',
    scaleId: 'test-scale-id',
    participantName: '张三',
    jobType: '月嫂',
    answers: { 'item-1': 3, 'item-2': 2 },
    currentIndex: 2,
    savedAt: '2024-01-15T10:30:00.000Z',
  };

  describe('STORAGE_KEY', () => {
    it('should be "mental-health-assessment-progress"', () => {
      expect(STORAGE_KEY).toBe('mental-health-assessment-progress');
    });
  });

  describe('saveProgress', () => {
    it('should save session to localStorage', () => {
      saveProgress(validSession);
      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored!)).toEqual(validSession);
    });

    it('should overwrite previously saved session', () => {
      saveProgress(validSession);
      const updated = { ...validSession, currentIndex: 5 };
      saveProgress(updated);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.currentIndex).toBe(5);
    });
  });

  describe('loadProgress', () => {
    it('should return null when no data exists', () => {
      expect(loadProgress()).toBeNull();
    });

    it('should return parsed session when valid data exists', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(validSession));
      const loaded = loadProgress();
      expect(loaded).toEqual(validSession);
    });

    it('should return null when data is corrupted JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not-valid-json{{{');
      expect(loadProgress()).toBeNull();
    });

    it('should return null when data is empty string', () => {
      localStorage.setItem(STORAGE_KEY, '');
      expect(loadProgress()).toBeNull();
    });
  });

  describe('clearProgress', () => {
    it('should remove session from localStorage', () => {
      saveProgress(validSession);
      clearProgress();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should not throw when no data exists', () => {
      expect(() => clearProgress()).not.toThrow();
    });
  });

  describe('hasUnfinishedSession', () => {
    it('should return false when no session exists', () => {
      expect(hasUnfinishedSession()).toBe(false);
    });

    it('should return true when a valid session exists', () => {
      saveProgress(validSession);
      expect(hasUnfinishedSession()).toBe(true);
    });

    it('should return false when stored data is corrupted', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');
      expect(hasUnfinishedSession()).toBe(false);
    });
  });

  describe('round-trip consistency', () => {
    it('should preserve all fields through save/load cycle', () => {
      saveProgress(validSession);
      const loaded = loadProgress();
      expect(loaded).toEqual(validSession);
    });

    it('should handle session with empty answers', () => {
      const emptySession: StoredSession = {
        ...validSession,
        answers: {},
        currentIndex: 0,
      };
      saveProgress(emptySession);
      expect(loadProgress()).toEqual(emptySession);
    });

    it('should handle session with many answers', () => {
      const manyAnswers: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        manyAnswers[`item-${i}`] = Math.floor(Math.random() * 4) + 1;
      }
      const bigSession: StoredSession = {
        ...validSession,
        answers: manyAnswers,
        currentIndex: 50,
      };
      saveProgress(bigSession);
      expect(loadProgress()).toEqual(bigSession);
    });
  });
});


// Feature: mental-health-assessment, Property 12: Session persistence round-trip
describe('Property-based tests: session persistence round-trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const storedSessionArb: fc.Arbitrary<StoredSession> = fc.record({
    sessionId: fc.uuid(),
    scaleId: fc.uuid(),
    participantName: fc.string({ minLength: 1, maxLength: 20 }),
    jobType: fc.constantFrom('月嫂' as const, '老人护理' as const),
    answers: fc.dictionary(fc.uuid(), fc.integer({ min: 0, max: 10 })),
    currentIndex: fc.nat({ max: 200 }),
    savedAt: fc.date().map(d => d.toISOString()),
  });

  // **Validates: Requirements 10.3, 10.5**
  fcTest.prop(
    [storedSessionArb],
    { numRuns: 100 },
  )('saveProgress followed by loadProgress returns deeply equal object', (session) => {
    localStorage.clear();
    saveProgress(session);
    const loaded = loadProgress();
    expect(loaded).toEqual(session);
  });
});
