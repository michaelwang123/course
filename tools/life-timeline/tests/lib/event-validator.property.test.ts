// Feature: life-timeline, Property 1: Event validation correctness
// tests/lib/event-validator.property.test.ts
// 属性测试：验证事件验证器的正确性与字段独立性

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  validateEventNode,
  validateTitle,
  validateDate,
  validateDescription,
  validateCategory,
  validateSentiment,
} from '@/lib/event-validator';
import type { EventCategory, EventSentiment } from '@/types/event';

// **Validates: Requirements 2.2, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9**

// --- Arbitraries ---

const VALID_CATEGORIES: EventCategory[] = [
  'education', 'work', 'life', 'achievement', 'health', 'travel', 'other',
];

const VALID_SENTIMENTS: EventSentiment[] = [
  'positive', 'neutral', 'negative',
];

/** Generate valid titles: 1-100 non-whitespace-only chars */
const validTitleArb = fc.stringOf(
  fc.char().filter(c => c.trim().length > 0),
  { minLength: 1, maxLength: 100 }
).filter(s => s.trim().length > 0);

/** Generate invalid titles: empty, whitespace-only, or >100 chars */
const invalidTitleArb = fc.oneof(
  fc.constant(''),
  fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 }),
  fc.string({ minLength: 101, maxLength: 200 })
);

/** Generate a valid date string YYYY-MM-DD within [1900-01-01, today+10y] */
const validDateArb = fc.date({
  min: new Date(1900, 0, 1),
  max: new Date(new Date().getFullYear() + 10, new Date().getMonth(), new Date().getDate()),
}).map(d => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

/** Generate invalid date strings: bad format, or out of range */
const invalidDateArb = fc.oneof(
  // Bad format
  fc.constant(''),
  fc.constant('not-a-date'),
  fc.constant('2023/01/01'),
  fc.constant('01-01-2023'),
  fc.constant('2023-13-01'),
  fc.constant('2023-02-30'),
  // Out of range: before 1900
  fc.constant('1899-12-31'),
  fc.constant('1800-06-15'),
  // Out of range: beyond today+10 years
  fc.constant(`${new Date().getFullYear() + 11}-01-01`),
  fc.constant(`${new Date().getFullYear() + 20}-06-15`)
);

/** Generate valid descriptions: 0-2000 chars */
const validDescriptionArb = fc.string({ minLength: 0, maxLength: 2000 });

/** Generate invalid descriptions: >2000 chars */
const invalidDescriptionArb = fc.string({ minLength: 2001, maxLength: 2200 });

/** Generate a valid category from the enum */
const validCategoryArb = fc.constantFrom(...VALID_CATEGORIES);

/** Generate an invalid category: strings not in the enum */
const invalidCategoryArb = fc.string({ minLength: 1, maxLength: 30 })
  .filter(s => !VALID_CATEGORIES.includes(s as EventCategory)) as fc.Arbitrary<EventCategory>;

/** Generate a valid sentiment from the enum */
const validSentimentArb = fc.constantFrom(...VALID_SENTIMENTS);

/** Generate an invalid sentiment: strings not in the enum */
const invalidSentimentArb = fc.string({ minLength: 1, maxLength: 30 })
  .filter(s => !VALID_SENTIMENTS.includes(s as EventSentiment)) as fc.Arbitrary<EventSentiment>;

// --- Property Tests ---

describe('Event Validator Property Tests', () => {
  // Property 1: Valid inputs always produce valid=true with empty errors
  it('valid inputs always produce valid=true with empty errors', () => {
    fc.assert(
      fc.property(
        validTitleArb,
        validDateArb,
        validDescriptionArb,
        validCategoryArb,
        validSentimentArb,
        (title, eventDate, description, category, sentiment) => {
          const result = validateEventNode({
            title,
            eventDate,
            description,
            category,
            sentiment,
          });
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 2: Invalid title always produces a title error
  it('invalid title always produces a title error', () => {
    fc.assert(
      fc.property(
        invalidTitleArb,
        (title) => {
          const result = validateTitle(title);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.every(e => e.field === 'title')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 3: Invalid date always produces a date error
  it('invalid date always produces a date error', () => {
    fc.assert(
      fc.property(
        invalidDateArb,
        (date) => {
          const result = validateDate(date);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.every(e => e.field === 'date')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 4: Invalid description always produces a description error
  it('invalid description always produces a description error', () => {
    fc.assert(
      fc.property(
        invalidDescriptionArb,
        (description) => {
          const result = validateDescription(description);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.every(e => e.field === 'description')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 5: Invalid category always produces a category error
  it('invalid category always produces a category error', () => {
    fc.assert(
      fc.property(
        invalidCategoryArb,
        (category) => {
          const result = validateCategory(category);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.every(e => e.field === 'category')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 6: Invalid sentiment always produces a sentiment error
  it('invalid sentiment always produces a sentiment error', () => {
    fc.assert(
      fc.property(
        invalidSentimentArb,
        (sentiment) => {
          const result = validateSentiment(sentiment);
          expect(result.valid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors.every(e => e.field === 'sentiment')).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 7: Each field validates independently — one bad field doesn't affect other field validation
  it('each field validates independently (one bad field does not affect other fields)', () => {
    fc.assert(
      fc.property(
        invalidTitleArb,
        validDateArb,
        validDescriptionArb,
        validCategoryArb,
        validSentimentArb,
        (title, eventDate, description, category, sentiment) => {
          const result = validateEventNode({
            title,
            eventDate,
            description,
            category,
            sentiment,
          });
          // Should be invalid due to title
          expect(result.valid).toBe(false);
          // Only title errors should be present
          const titleErrors = result.errors.filter(e => e.field === 'title');
          const otherErrors = result.errors.filter(e => e.field !== 'title');
          expect(titleErrors.length).toBeGreaterThan(0);
          expect(otherErrors).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 8: validateEventNode aggregates all individual field errors
  it('validateEventNode aggregates all individual field errors', () => {
    fc.assert(
      fc.property(
        invalidTitleArb,
        invalidDateArb,
        invalidDescriptionArb,
        invalidCategoryArb,
        invalidSentimentArb,
        (title, eventDate, description, category, sentiment) => {
          const result = validateEventNode({
            title,
            eventDate,
            description,
            category,
            sentiment,
          });
          expect(result.valid).toBe(false);

          // Should have errors from each field
          const fields = result.errors.map(e => e.field);
          expect(fields).toContain('title');
          expect(fields).toContain('date');
          expect(fields).toContain('description');
          expect(fields).toContain('category');
          expect(fields).toContain('sentiment');

          // Aggregate should equal sum of individual validations
          const titleResult = validateTitle(title);
          const dateResult = validateDate(eventDate);
          const descResult = validateDescription(description);
          const catResult = validateCategory(category);
          const sentResult = validateSentiment(sentiment);

          const expectedTotal =
            titleResult.errors.length +
            dateResult.errors.length +
            descResult.errors.length +
            catResult.errors.length +
            sentResult.errors.length;

          expect(result.errors.length).toBe(expectedTotal);
        }
      ),
      { numRuns: 100 }
    );
  });
});
