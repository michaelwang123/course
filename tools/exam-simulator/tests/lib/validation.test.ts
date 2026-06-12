import { test as fcTest } from '@fast-check/vitest';
import fc from 'fast-check';
import { validateExamConfig } from '../../src/lib/validation';
import { describe } from 'vitest';

/**
 * Property 2: Exam config validation enforces range constraints
 *
 * For any ExamConfigInput with a given availableCount, validateExamConfig SHALL return
 * { valid: true } if and only if:
 * - durationMinutes is a multiple of 5 in the range [5, 120]
 * - questionCount is in the range [5, 50]
 * - questionCount <= availableCount
 * - studentName is 1-20 characters
 *
 * Otherwise it SHALL return { valid: false } with errors identifying which constraints are violated.
 *
 * **Validates: Requirements 3.2, 3.3, 3.6**
 */
describe('Feature: exam-simulator, Property 2: Exam config validation enforces range constraints', () => {
  // Generator for valid studentName (1-20 chars)
  const validStudentName = fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.length >= 1);

  // Generator for valid durationMinutes (multiple of 5 in [5, 120])
  const validDurationMinutes = fc.integer({ min: 1, max: 24 }).map((n) => n * 5);

  // Generator for valid questionCount given availableCount
  const validQuestionCountAndAvailable = fc
    .integer({ min: 5, max: 50 })
    .chain((questionCount) =>
      fc.integer({ min: questionCount, max: 200 }).map((availableCount) => ({
        questionCount,
        availableCount,
      }))
    );

  fcTest.prop(
    [validStudentName, validDurationMinutes, validQuestionCountAndAvailable, fc.string({ minLength: 1, maxLength: 50 })]
  )(
    'valid ExamConfigInput always returns valid: true',
    (studentName, durationMinutes, { questionCount, availableCount }, subject) => {
      const config = {
        studentName,
        durationMinutes,
        questionCount,
        subject,
      };

      const result = validateExamConfig(config, availableCount);
      if (!result.valid) {
        throw new Error(
          `Expected valid: true for config ${JSON.stringify(config)} with availableCount=${availableCount}, but got errors: ${JSON.stringify(result.errors)}`
        );
      }
    }
  );

  // Invalid: empty studentName
  fcTest.prop([validDurationMinutes, validQuestionCountAndAvailable, fc.string({ minLength: 1, maxLength: 50 })])(
    'empty studentName returns valid: false with studentName error',
    (durationMinutes, { questionCount, availableCount }, subject) => {
      const config = {
        studentName: '',
        durationMinutes,
        questionCount,
        subject,
      };

      const result = validateExamConfig(config, availableCount);
      if (result.valid || !result.errors.studentName) {
        throw new Error(
          `Expected valid: false with studentName error for empty name, got: ${JSON.stringify(result)}`
        );
      }
    }
  );

  // Invalid: studentName > 20 characters
  fcTest.prop([
    fc.string({ minLength: 21, maxLength: 100 }),
    validDurationMinutes,
    validQuestionCountAndAvailable,
    fc.string({ minLength: 1, maxLength: 50 }),
  ])(
    'studentName > 20 characters returns valid: false with studentName error',
    (studentName, durationMinutes, { questionCount, availableCount }, subject) => {
      const config = {
        studentName,
        durationMinutes,
        questionCount,
        subject,
      };

      const result = validateExamConfig(config, availableCount);
      if (result.valid || !result.errors.studentName) {
        throw new Error(
          `Expected valid: false with studentName error for name length ${studentName.length}, got: ${JSON.stringify(result)}`
        );
      }
    }
  );

  // Invalid: durationMinutes not a multiple of 5
  fcTest.prop([
    validStudentName,
    fc.integer({ min: 5, max: 120 }).filter((n) => n % 5 !== 0),
    validQuestionCountAndAvailable,
    fc.string({ minLength: 1, maxLength: 50 }),
  ])(
    'durationMinutes not a multiple of 5 returns valid: false with durationMinutes error',
    (studentName, durationMinutes, { questionCount, availableCount }, subject) => {
      const config = {
        studentName,
        durationMinutes,
        questionCount,
        subject,
      };

      const result = validateExamConfig(config, availableCount);
      if (result.valid || !result.errors.durationMinutes) {
        throw new Error(
          `Expected valid: false with durationMinutes error for duration=${durationMinutes}, got: ${JSON.stringify(result)}`
        );
      }
    }
  );

  // Invalid: durationMinutes < 5
  fcTest.prop([
    validStudentName,
    fc.integer({ min: -100, max: 4 }),
    validQuestionCountAndAvailable,
    fc.string({ minLength: 1, maxLength: 50 }),
  ])(
    'durationMinutes < 5 returns valid: false with durationMinutes error',
    (studentName, durationMinutes, { questionCount, availableCount }, subject) => {
      const config = {
        studentName,
        durationMinutes,
        questionCount,
        subject,
      };

      const result = validateExamConfig(config, availableCount);
      if (result.valid || !result.errors.durationMinutes) {
        throw new Error(
          `Expected valid: false with durationMinutes error for duration=${durationMinutes}, got: ${JSON.stringify(result)}`
        );
      }
    }
  );

  // Invalid: durationMinutes > 120
  fcTest.prop([
    validStudentName,
    fc.integer({ min: 121, max: 500 }),
    validQuestionCountAndAvailable,
    fc.string({ minLength: 1, maxLength: 50 }),
  ])(
    'durationMinutes > 120 returns valid: false with durationMinutes error',
    (studentName, durationMinutes, { questionCount, availableCount }, subject) => {
      const config = {
        studentName,
        durationMinutes,
        questionCount,
        subject,
      };

      const result = validateExamConfig(config, availableCount);
      if (result.valid || !result.errors.durationMinutes) {
        throw new Error(
          `Expected valid: false with durationMinutes error for duration=${durationMinutes}, got: ${JSON.stringify(result)}`
        );
      }
    }
  );

  // Invalid: questionCount < 5
  fcTest.prop([
    validStudentName,
    validDurationMinutes,
    fc.integer({ min: -100, max: 4 }),
    fc.integer({ min: 50, max: 200 }),
    fc.string({ minLength: 1, maxLength: 50 }),
  ])(
    'questionCount < 5 returns valid: false with questionCount error',
    (studentName, durationMinutes, questionCount, availableCount, subject) => {
      const config = {
        studentName,
        durationMinutes,
        questionCount,
        subject,
      };

      const result = validateExamConfig(config, availableCount);
      if (result.valid || !result.errors.questionCount) {
        throw new Error(
          `Expected valid: false with questionCount error for count=${questionCount}, got: ${JSON.stringify(result)}`
        );
      }
    }
  );

  // Invalid: questionCount > 50
  fcTest.prop([
    validStudentName,
    validDurationMinutes,
    fc.integer({ min: 51, max: 200 }),
    fc.integer({ min: 200, max: 500 }),
    fc.string({ minLength: 1, maxLength: 50 }),
  ])(
    'questionCount > 50 returns valid: false with questionCount error',
    (studentName, durationMinutes, questionCount, availableCount, subject) => {
      const config = {
        studentName,
        durationMinutes,
        questionCount,
        subject,
      };

      const result = validateExamConfig(config, availableCount);
      if (result.valid || !result.errors.questionCount) {
        throw new Error(
          `Expected valid: false with questionCount error for count=${questionCount}, got: ${JSON.stringify(result)}`
        );
      }
    }
  );

  // Invalid: questionCount > availableCount
  fcTest.prop([
    validStudentName,
    validDurationMinutes,
    fc.integer({ min: 5, max: 50 }).chain((questionCount) =>
      fc.integer({ min: 0, max: questionCount - 1 }).map((availableCount) => ({
        questionCount,
        availableCount,
      }))
    ),
    fc.string({ minLength: 1, maxLength: 50 }),
  ])(
    'questionCount > availableCount returns valid: false with questionCount error',
    (studentName, durationMinutes, { questionCount, availableCount }, subject) => {
      const config = {
        studentName,
        durationMinutes,
        questionCount,
        subject,
      };

      const result = validateExamConfig(config, availableCount);
      if (result.valid || !result.errors.questionCount) {
        throw new Error(
          `Expected valid: false with questionCount error for count=${questionCount} > available=${availableCount}, got: ${JSON.stringify(result)}`
        );
      }
    }
  );
});
