import { describe, it, expect } from 'vitest';
import { test as fcTest } from '@fast-check/vitest';
import fc from 'fast-check';
import type { AssessmentSession } from '@/types/assessment';

/**
 * Pure function that replicates the filtering and sorting logic
 * used by the useHistory hook (which applies these via Supabase queries).
 *
 * This tests the data-level property: after filtering by scaleIds and
 * sorting by completedAt DESC, the result only contains matching records
 * in the correct order.
 */
function filterAndSortRecords(
  records: AssessmentSession[],
  scaleIds: string[] | null
): AssessmentSession[] {
  let result = [...records];
  if (scaleIds && scaleIds.length > 0) {
    result = result.filter(r => scaleIds.includes(r.scaleId));
  }
  result.sort((a, b) => {
    const dateA = a.completedAt ?? '';
    const dateB = b.completedAt ?? '';
    return dateB.localeCompare(dateA);
  });
  return result;
}

// Feature: mental-health-assessment, Property 11: History records filtering and sorting
describe('Property-based tests: history records filtering and sorting', () => {
  // Generator for a valid AssessmentSession record
  const assessmentSessionArb: fc.Arbitrary<AssessmentSession> = fc.record({
    id: fc.uuid(),
    participantName: fc.string({ minLength: 1, maxLength: 20 }),
    jobType: fc.constantFrom('月嫂' as const, '老人护理' as const),
    scaleId: fc.uuid(),
    answers: fc.constant(null),
    rawScore: fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 200 })),
    standardScore: fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 200 })),
    gradeLevel: fc.oneof(
      fc.constant(null),
      fc.constantFrom('正常' as const, '轻度' as const, '中度' as const, '重度' as const)
    ),
    interpretation: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 100 })),
    startedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString()),
    completedAt: fc.oneof(
      fc.constant(null),
      fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).map(d => d.toISOString())
    ),
  });

  // **Validates: Requirements 6.2, 6.5**
  fcTest.prop(
    [fc.array(assessmentSessionArb, { minLength: 0, maxLength: 50 }), fc.option(fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }))],
    { numRuns: 100 },
  )('filtered results contain only matching scale IDs and are sorted by completedAt DESC', (records, scaleIds) => {
    const result = filterAndSortRecords(records, scaleIds);

    // Property A: If scaleIds filter is applied, all results must have a matching scaleId
    if (scaleIds !== null && scaleIds.length > 0) {
      for (const record of result) {
        expect(scaleIds).toContain(record.scaleId);
      }
      // Also verify no matching records were dropped
      const expectedCount = records.filter(r => scaleIds.includes(r.scaleId)).length;
      expect(result.length).toBe(expectedCount);
    } else {
      // No filter applied: all records should be present
      expect(result.length).toBe(records.length);
    }

    // Property B: Results are sorted by completedAt in descending order (most recent first)
    for (let i = 0; i < result.length - 1; i++) {
      const dateA = result[i].completedAt ?? '';
      const dateB = result[i + 1].completedAt ?? '';
      expect(dateB.localeCompare(dateA)).toBeLessThanOrEqual(0);
    }
  });

  // Additional property: filtering with empty scaleIds (null) returns all records sorted
  fcTest.prop(
    [fc.array(assessmentSessionArb, { minLength: 0, maxLength: 30 })],
    { numRuns: 100 },
  )('null scaleIds filter returns all records sorted by completedAt DESC', (records) => {
    const result = filterAndSortRecords(records, null);

    // All records should be present
    expect(result.length).toBe(records.length);

    // Results are sorted by completedAt DESC
    for (let i = 0; i < result.length - 1; i++) {
      const dateA = result[i].completedAt ?? '';
      const dateB = result[i + 1].completedAt ?? '';
      expect(dateB.localeCompare(dateA)).toBeLessThanOrEqual(0);
    }
  });

  // Additional property: filtering with scaleIds that don't match any records returns empty
  it('filtering with non-matching scaleIds returns empty array', () => {
    fc.assert(
      fc.property(
        fc.array(assessmentSessionArb, { minLength: 1, maxLength: 20 }),
        (records) => {
          // Use a UUID that's extremely unlikely to match any generated scaleId
          const nonMatchingIds = ['00000000-0000-0000-0000-000000000000'];
          // Ensure none of the records have this scaleId
          const filteredRecords = records.filter(r => r.scaleId !== nonMatchingIds[0]);
          const result = filterAndSortRecords(filteredRecords, nonMatchingIds);
          expect(result.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
