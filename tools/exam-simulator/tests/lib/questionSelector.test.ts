import { describe, it, expect } from 'vitest';
import { test as fcTest } from '@fast-check/vitest';
import fc from 'fast-check';
import { selectQuestions } from '../../src/lib/questionSelector';
import { Question } from '../../src/types';

function makeQuestion(id: string): Question {
  return {
    id,
    type: 'single',
    content: `Question ${id}`,
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    score: 10,
    subject: 'math',
    createdAt: '2024-01-01T00:00:00Z',
  };
}

describe('selectQuestions', () => {
  const questions = Array.from({ length: 10 }, (_, i) => makeQuestion(String(i + 1)));

  it('returns exactly count elements', () => {
    const result = selectQuestions(questions, 5);
    expect(result).toHaveLength(5);
  });

  it('returns all elements when count >= questions.length', () => {
    const result = selectQuestions(questions, 15);
    expect(result).toHaveLength(10);
  });

  it('returns no duplicates', () => {
    const result = selectQuestions(questions, 7);
    const ids = result.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all returned elements are from the original array', () => {
    const result = selectQuestions(questions, 5);
    const originalIds = new Set(questions.map(q => q.id));
    for (const q of result) {
      expect(originalIds.has(q.id)).toBe(true);
    }
  });

  it('uses the rng parameter for deterministic selection', () => {
    let counter = 0;
    const deterministicRng = () => {
      counter++;
      return 0.5;
    };

    const result1 = selectQuestions(questions, 5, deterministicRng);

    counter = 0;
    const result2 = selectQuestions(questions, 5, deterministicRng);

    expect(result1.map(q => q.id)).toEqual(result2.map(q => q.id));
  });

  it('does not mutate the original array', () => {
    const original = [...questions];
    selectQuestions(questions, 5);
    expect(questions).toEqual(original);
  });

  it('returns empty array when given empty input', () => {
    const result = selectQuestions([], 5);
    expect(result).toHaveLength(0);
  });
});


// --- Property-Based Tests ---
// **Validates: Requirements 3.5**

describe('selectQuestions - Property-Based Tests', () => {
  // Generator for unique Question objects with distinct IDs
  const uniqueQuestionsArb = (minLength: number, maxLength: number) =>
    fc
      .array(fc.uuid(), { minLength, maxLength })
      .filter((ids) => new Set(ids).size === ids.length)
      .map((ids) =>
        ids.map(
          (id): Question => ({
            id,
            type: 'single',
            content: `Question ${id}`,
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            score: 10,
            subject: 'math',
            createdAt: '2024-01-01T00:00:00Z',
          })
        )
      );

  fcTest.prop([
    uniqueQuestionsArb(5, 50).chain((questions) =>
      fc.tuple(
        fc.constant(questions),
        fc.integer({ min: 1, max: questions.length })
      )
    ),
  ])(
    'Property 3: returned array has exactly count elements',
    ([questions, count]) => {
      const result = selectQuestions(questions, count);
      expect(result).toHaveLength(count);
    }
  );

  fcTest.prop([
    uniqueQuestionsArb(5, 50).chain((questions) =>
      fc.tuple(
        fc.constant(questions),
        fc.integer({ min: 1, max: questions.length })
      )
    ),
  ])(
    'Property 3: all returned elements are distinct (no duplicate IDs)',
    ([questions, count]) => {
      const result = selectQuestions(questions, count);
      const ids = result.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  );

  fcTest.prop([
    uniqueQuestionsArb(5, 50).chain((questions) =>
      fc.tuple(
        fc.constant(questions),
        fc.integer({ min: 1, max: questions.length })
      )
    ),
  ])(
    'Property 3: all returned elements exist in the original array',
    ([questions, count]) => {
      const result = selectQuestions(questions, count);
      const originalIds = new Set(questions.map((q) => q.id));
      for (const q of result) {
        expect(originalIds.has(q.id)).toBe(true);
      }
    }
  );
});
