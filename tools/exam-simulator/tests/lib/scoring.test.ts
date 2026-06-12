import { describe, it, expect } from 'vitest';
import { test as fcTest } from '@fast-check/vitest';
import fc from 'fast-check';
import { calculateScore } from '../../src/lib/scoring';
import type { Question } from '../../src/types';

// --- Helpers ---

function makeQuestion(overrides: Partial<Question> & { id: string }): Question {
  return {
    type: 'single',
    content: 'Test question',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'A',
    score: 10,
    subject: 'math',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// --- Unit Tests ---

describe('calculateScore', () => {
  it('returns zero score for empty questions array', () => {
    const result = calculateScore([], {});
    expect(result.totalScore).toBe(0);
    expect(result.score).toBe(0);
    expect(result.correctRate).toBe(0);
    expect(result.details).toHaveLength(0);
  });

  it('calculates correct score for all correct single-choice answers', () => {
    const questions: Question[] = [
      makeQuestion({ id: '1', correctAnswer: 'A', score: 10 }),
      makeQuestion({ id: '2', correctAnswer: 'B', score: 20 }),
    ];
    const answers = { '1': 'A', '2': 'B' };

    const result = calculateScore(questions, answers);
    expect(result.totalScore).toBe(30);
    expect(result.score).toBe(30);
    expect(result.correctRate).toBe(100);
    expect(result.details.every((d) => d.isCorrect)).toBe(true);
  });

  it('calculates correct score for all incorrect answers', () => {
    const questions: Question[] = [
      makeQuestion({ id: '1', correctAnswer: 'A', score: 10 }),
      makeQuestion({ id: '2', correctAnswer: 'B', score: 20 }),
    ];
    const answers = { '1': 'C', '2': 'D' };

    const result = calculateScore(questions, answers);
    expect(result.totalScore).toBe(30);
    expect(result.score).toBe(0);
    expect(result.correctRate).toBe(0);
    expect(result.details.every((d) => !d.isCorrect)).toBe(true);
  });

  it('handles missing answers as incorrect', () => {
    const questions: Question[] = [
      makeQuestion({ id: '1', correctAnswer: 'A', score: 10 }),
      makeQuestion({ id: '2', correctAnswer: 'B', score: 20 }),
    ];
    const answers = {}; // no answers

    const result = calculateScore(questions, answers);
    expect(result.score).toBe(0);
    expect(result.correctRate).toBe(0);
  });

  it('handles boolean questions correctly', () => {
    const questions: Question[] = [
      makeQuestion({
        id: '1',
        type: 'boolean',
        options: ['正确', '错误'],
        correctAnswer: '正确',
        score: 5,
      }),
    ];
    const answers = { '1': '正确' };

    const result = calculateScore(questions, answers);
    expect(result.score).toBe(5);
    expect(result.details[0].isCorrect).toBe(true);
  });

  it('handles multiple-choice with correct set regardless of order', () => {
    const questions: Question[] = [
      makeQuestion({
        id: '1',
        type: 'multiple',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: ['A', 'C'],
        score: 15,
      }),
    ];
    // Student answers in different order
    const answers = { '1': ['C', 'A'] };

    const result = calculateScore(questions, answers);
    expect(result.score).toBe(15);
    expect(result.details[0].isCorrect).toBe(true);
  });

  it('marks multiple-choice as incorrect when subset is provided', () => {
    const questions: Question[] = [
      makeQuestion({
        id: '1',
        type: 'multiple',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: ['A', 'B', 'C'],
        score: 10,
      }),
    ];
    const answers = { '1': ['A', 'B'] };

    const result = calculateScore(questions, answers);
    expect(result.score).toBe(0);
    expect(result.details[0].isCorrect).toBe(false);
  });

  it('calculates correctRate rounded to 1 decimal place', () => {
    const questions: Question[] = [
      makeQuestion({ id: '1', correctAnswer: 'A', score: 10 }),
      makeQuestion({ id: '2', correctAnswer: 'B', score: 10 }),
      makeQuestion({ id: '3', correctAnswer: 'C', score: 10 }),
    ];
    // 1 out of 3 correct = 33.3%
    const answers = { '1': 'A', '2': 'X', '3': 'X' };

    const result = calculateScore(questions, answers);
    expect(result.correctRate).toBe(33.3);
  });

  it('includes correct details for each question', () => {
    const questions: Question[] = [
      makeQuestion({ id: 'q1', content: 'What is 1+1?', correctAnswer: 'B', score: 5 }),
    ];
    const answers = { 'q1': 'A' };

    const result = calculateScore(questions, answers);
    expect(result.details).toHaveLength(1);
    expect(result.details[0]).toEqual({
      questionId: 'q1',
      content: 'What is 1+1?',
      userAnswer: 'A',
      correctAnswer: 'B',
      score: 5,
      isCorrect: false,
    });
  });
});

// --- Property-Based Tests ---
// **Validates: Requirements 6.1, 6.2, 6.3**

describe('calculateScore - Property-Based Tests', () => {
  // Generator for a single-choice question
  const singleQuestionArb = fc
    .record({
      id: fc.uuid(),
      content: fc.string({ minLength: 1, maxLength: 100 }),
      options: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 6 }),
      score: fc.integer({ min: 1, max: 100 }),
      subject: fc.string({ minLength: 1, maxLength: 50 }),
    })
    .map((r) => ({
      ...r,
      type: 'single' as const,
      correctAnswer: r.options[0],
      createdAt: '2024-01-01T00:00:00Z',
    }));

  // Generator for a boolean question
  const booleanQuestionArb = fc
    .record({
      id: fc.uuid(),
      content: fc.string({ minLength: 1, maxLength: 100 }),
      score: fc.integer({ min: 1, max: 100 }),
      subject: fc.string({ minLength: 1, maxLength: 50 }),
    })
    .map((r) => ({
      ...r,
      type: 'boolean' as const,
      options: ['正确', '错误'],
      correctAnswer: fc.sample(fc.constantFrom('正确', '错误'), 1)[0],
      createdAt: '2024-01-01T00:00:00Z',
    }));

  // Generator for a multiple-choice question
  const multipleQuestionArb = fc
    .record({
      id: fc.uuid(),
      content: fc.string({ minLength: 1, maxLength: 100 }),
      options: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 3, maxLength: 6 }),
      score: fc.integer({ min: 1, max: 100 }),
      subject: fc.string({ minLength: 1, maxLength: 50 }),
    })
    .map((r) => ({
      ...r,
      type: 'multiple' as const,
      correctAnswer: r.options.slice(0, 2),
      createdAt: '2024-01-01T00:00:00Z',
    }));

  const questionArb = fc.oneof(singleQuestionArb, booleanQuestionArb, multipleQuestionArb);

  fcTest.prop([fc.array(questionArb, { minLength: 1, maxLength: 20 })])(
    'Property 6: totalScore equals sum of all question scores',
    (questions) => {
      const answers: Record<string, string | string[]> = {};
      const result = calculateScore(questions, answers);
      const expectedTotal = questions.reduce((s, q) => s + q.score, 0);
      expect(result.totalScore).toBe(expectedTotal);
    }
  );

  fcTest.prop([fc.array(singleQuestionArb, { minLength: 1, maxLength: 10 })])(
    'Property 6: score <= totalScore always holds',
    (questions) => {
      // Provide random answers for some questions
      const answers: Record<string, string | string[]> = {};
      for (const q of questions) {
        if (Math.random() > 0.5) {
          answers[q.id] = q.options[Math.floor(Math.random() * q.options.length)];
        }
      }
      const result = calculateScore(questions, answers);
      expect(result.score).toBeLessThanOrEqual(result.totalScore);
      expect(result.score).toBeGreaterThanOrEqual(0);
    }
  );

  fcTest.prop([fc.array(singleQuestionArb, { minLength: 1, maxLength: 10 })])(
    'Property 6: all correct answers yield score === totalScore',
    (questions) => {
      const answers: Record<string, string | string[]> = {};
      for (const q of questions) {
        answers[q.id] = q.correctAnswer;
      }
      const result = calculateScore(questions, answers);
      expect(result.score).toBe(result.totalScore);
      expect(result.correctRate).toBe(100);
    }
  );

  fcTest.prop([fc.array(questionArb, { minLength: 1, maxLength: 10 })])(
    'Property 6: details array length equals questions length',
    (questions) => {
      const answers: Record<string, string | string[]> = {};
      const result = calculateScore(questions, answers);
      expect(result.details).toHaveLength(questions.length);
    }
  );

  fcTest.prop([fc.array(questionArb, { minLength: 1, maxLength: 10 })])(
    'Property 6: correctRate is between 0 and 100 with 1 decimal',
    (questions) => {
      const answers: Record<string, string | string[]> = {};
      const result = calculateScore(questions, answers);
      expect(result.correctRate).toBeGreaterThanOrEqual(0);
      expect(result.correctRate).toBeLessThanOrEqual(100);
      // Check 1 decimal place: multiply by 10 should be an integer
      expect(Math.round(result.correctRate * 10)).toBe(result.correctRate * 10);
    }
  );
});
