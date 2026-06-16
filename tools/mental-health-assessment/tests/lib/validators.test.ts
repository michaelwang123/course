import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  validateScale,
  validateScaleItem,
  validateScaleItemCount,
  validateParticipantName,
  calculateProgress,
} from '@/lib/validators';
import type { Scale, ScaleItem, ScaleOption } from '@/types/scale';

// Helper: generate a valid Scale object
const validScaleArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 1, maxLength: 500 }),
  scaleType: fc.constantFrom('抑郁' as const, '焦虑' as const, '综合症状' as const, '一般健康' as const),
  targetAudience: fc.string({ minLength: 1, maxLength: 200 }),
  itemCount: fc.integer({ min: 1, max: 500 }),
  estimatedMinutes: fc.integer({ min: 1, max: 180 }),
  scoringRule: fc.record({
    type: fc.constantFrom('multiply' as const, 'direct' as const),
    maxOptionScore: fc.integer({ min: 1, max: 100 }),
  }),
  gradeThresholds: fc.constant([]),
  createdAt: fc.date().map((d) => d.toISOString()),
});

// Helper: generate a valid ScaleOption
const validOptionArb: fc.Arbitrary<ScaleOption> = fc.record({
  text: fc.string({ minLength: 1, maxLength: 200 }),
  score: fc.integer({ min: -100, max: 100 }),
});

// Helper: generate a valid ScaleItem
const validScaleItemArb = fc.record({
  id: fc.uuid(),
  scaleId: fc.uuid(),
  itemOrder: fc.integer({ min: 1, max: 500 }),
  content: fc.string({ minLength: 1, maxLength: 500 }),
  options: fc.array(validOptionArb, { minLength: 2, maxLength: 10 }),
  isReverseScored: fc.boolean(),
});

// Feature: mental-health-assessment, Property 1: Data model validation correctness
// **Validates: Requirements 1.2, 1.5, 2.6**
describe('Property 1: Data model validation correctness', () => {
  it('valid Scale objects pass validation', () => {
    fc.assert(
      fc.property(validScaleArb, (scale) => {
        const result = validateScale(scale);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('Scale with empty name fails validation', () => {
    fc.assert(
      fc.property(validScaleArb, (scale) => {
        const invalidScale = { ...scale, name: '' };
        const result = validateScale(invalidScale);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'name')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('Scale with name exceeding 100 chars fails validation', () => {
    fc.assert(
      fc.property(
        validScaleArb,
        fc.string({ minLength: 101, maxLength: 200 }),
        (scale, longName) => {
          const invalidScale = { ...scale, name: longName };
          const result = validateScale(invalidScale);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === 'name')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Scale with invalid scaleType fails validation', () => {
    fc.assert(
      fc.property(
        validScaleArb,
        fc.string({ minLength: 1 }).filter(
          (s) => !['抑郁', '焦虑', '综合症状', '一般健康'].includes(s)
        ),
        (scale, invalidType) => {
          const invalidScale = { ...scale, scaleType: invalidType as Scale['scaleType'] };
          const result = validateScale(invalidScale);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === 'scaleType')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Scale with itemCount outside 1-500 fails validation', () => {
    fc.assert(
      fc.property(
        validScaleArb,
        fc.oneof(
          fc.integer({ min: -1000, max: 0 }),
          fc.integer({ min: 501, max: 10000 })
        ),
        (scale, badCount) => {
          const invalidScale = { ...scale, itemCount: badCount };
          const result = validateScale(invalidScale);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === 'itemCount')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Scale with estimatedMinutes outside 1-180 fails validation', () => {
    fc.assert(
      fc.property(
        validScaleArb,
        fc.oneof(
          fc.integer({ min: -1000, max: 0 }),
          fc.integer({ min: 181, max: 10000 })
        ),
        (scale, badMinutes) => {
          const invalidScale = { ...scale, estimatedMinutes: badMinutes };
          const result = validateScale(invalidScale);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === 'estimatedMinutes')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: mental-health-assessment, Property 2: Scale item validation correctness
// **Validates: Requirements 1.3, 1.5**
describe('Property 2: Scale item validation correctness', () => {
  it('valid ScaleItem objects pass validation', () => {
    fc.assert(
      fc.property(validScaleItemArb, (item) => {
        const result = validateScaleItem(item);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('ScaleItem with empty content fails validation', () => {
    fc.assert(
      fc.property(validScaleItemArb, (item) => {
        const invalid = { ...item, content: '' };
        const result = validateScaleItem(invalid);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'content')).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('ScaleItem with content exceeding 500 chars fails validation', () => {
    fc.assert(
      fc.property(
        validScaleItemArb,
        fc.string({ minLength: 501, maxLength: 600 }),
        (item, longContent) => {
          const invalid = { ...item, content: longContent };
          const result = validateScaleItem(invalid);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === 'content')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ScaleItem with fewer than 2 options fails validation', () => {
    fc.assert(
      fc.property(
        validScaleItemArb,
        fc.array(validOptionArb, { minLength: 0, maxLength: 1 }),
        (item, fewOptions) => {
          const invalid = { ...item, options: fewOptions };
          const result = validateScaleItem(invalid);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === 'options')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ScaleItem with more than 10 options fails validation', () => {
    fc.assert(
      fc.property(
        validScaleItemArb,
        fc.array(validOptionArb, { minLength: 11, maxLength: 15 }),
        (item, manyOptions) => {
          const invalid = { ...item, options: manyOptions };
          const result = validateScaleItem(invalid);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === 'options')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ScaleItem with option score outside [-100, 100] fails validation', () => {
    fc.assert(
      fc.property(
        validScaleItemArb,
        fc.oneof(
          fc.integer({ min: -10000, max: -101 }),
          fc.integer({ min: 101, max: 10000 })
        ),
        (item, badScore) => {
          const invalidOptions = [
            { text: 'valid option', score: badScore },
            { text: 'another option', score: 0 },
          ];
          const invalid = { ...item, options: invalidOptions };
          const result = validateScaleItem(invalid);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field.includes('score'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('ScaleItem with empty option text fails validation', () => {
    fc.assert(
      fc.property(validScaleItemArb, (item) => {
        const invalidOptions = [
          { text: '', score: 1 },
          { text: 'valid', score: 2 },
        ];
        const invalid = { ...item, options: invalidOptions };
        const result = validateScaleItem(invalid);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field.includes('text'))).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: mental-health-assessment, Property 3: Scale item count consistency
// **Validates: Requirements 1.6**
describe('Property 3: Scale item count consistency', () => {
  it('when declared count equals actual items length, validation passes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        (n) => {
          const items: ScaleItem[] = Array.from({ length: n }, (_, i) => ({
            id: `item-${i}`,
            scaleId: 'scale-1',
            itemOrder: i + 1,
            content: `Question ${i + 1}`,
            options: [
              { text: 'A', score: 1 },
              { text: 'B', score: 2 },
            ],
            isReverseScored: false,
          }));
          const result = validateScaleItemCount(n, items);
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when declared count differs from actual items length, validation fails', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 0, max: 20 }),
        (n, m) => {
          fc.pre(n !== m);
          const items: ScaleItem[] = Array.from({ length: m }, (_, i) => ({
            id: `item-${i}`,
            scaleId: 'scale-1',
            itemOrder: i + 1,
            content: `Question ${i + 1}`,
            options: [
              { text: 'A', score: 1 },
              { text: 'B', score: 2 },
            ],
            isReverseScored: false,
          }));
          const result = validateScaleItemCount(n, items);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === 'itemCount')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: mental-health-assessment, Property 4: Participant name validation
// **Validates: Requirements 3.3, 3.4, 6.6**
describe('Property 4: Participant name validation', () => {
  // Generator for valid participant names: Chinese chars, English letters, and allowed punctuation
  const validCharsArb = fc.stringOf(
    fc.oneof(
      // Chinese characters
      fc.integer({ min: 0x4e00, max: 0x9fa5 }).map((c) => String.fromCharCode(c)),
      // English letters
      fc.char().filter((c) => /[a-zA-Z]/.test(c)),
      // Allowed punctuation
      fc.constantFrom('，', '。', '、', '！', '？', '·', '-')
    ),
    { minLength: 1, maxLength: 20 }
  );

  it('valid names (Chinese + English + punctuation, 1-20 chars) pass validation', () => {
    fc.assert(
      fc.property(validCharsArb, (name) => {
        const result = validateParticipantName(name);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 }
    );
  });

  it('empty or whitespace-only strings fail validation', () => {
    fc.assert(
      fc.property(
        fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 10 }),
        (whitespace) => {
          const result = validateParticipantName(whitespace);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('names exceeding 20 characters after trim fail validation', () => {
    fc.assert(
      fc.property(
        fc.stringOf(
          fc.integer({ min: 0x4e00, max: 0x9fa5 }).map((c) => String.fromCharCode(c)),
          { minLength: 21, maxLength: 30 }
        ),
        (longName) => {
          const result = validateParticipantName(longName);
          expect(result.valid).toBe(false);
          expect(result.errors.some((e) => e.field === 'name')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('names with invalid characters (digits, special symbols) fail validation', () => {
    fc.assert(
      fc.property(
        fc.stringOf(
          fc.oneof(
            fc.char().filter((c) => /[0-9@#$%^*()=+\[\]{}|\\/<>~`]/.test(c))
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (invalidName) => {
          const result = validateParticipantName(invalidName);
          expect(result.valid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: mental-health-assessment, Property 5: Progress percentage calculation
// **Validates: Requirements 4.3**
describe('Property 5: Progress percentage calculation', () => {
  it('for any answered in [0, total] and total > 0, returns Math.round(answered/total*100) in [0, 100]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        fc.integer({ min: 0, max: 500 }),
        (total, answered) => {
          fc.pre(answered <= total);
          const result = calculateProgress(answered, total);
          const expected = Math.round((answered / total) * 100);
          expect(result).toBe(expected);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when total is 0 or negative, returns 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 0 }),
        fc.integer({ min: 0, max: 100 }),
        (total, answered) => {
          const result = calculateProgress(answered, total);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when answered equals total, returns 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        (total) => {
          const result = calculateProgress(total, total);
          expect(result).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('when answered is 0, returns 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 500 }),
        (total) => {
          const result = calculateProgress(0, total);
          expect(result).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
