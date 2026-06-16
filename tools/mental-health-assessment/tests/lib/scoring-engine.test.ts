import { describe, it, expect } from 'vitest';
import {
  reverseScore,
  calculateRawScore,
  calculateStandardScore,
  determineGradeLevel,
  calculateScore,
} from '@/lib/scoring-engine';
import type { ScoringInput } from '@/lib/scoring-engine';
import type { ScaleItem, ScoringRule, GradeThreshold } from '@/types/scale';
import type { AnswerRecord, GradeLevel } from '@/types/assessment';

describe('scoring-engine', () => {
  describe('reverseScore', () => {
    it('should return maxOptionScore + 1 - score', () => {
      expect(reverseScore(1, 4)).toBe(4);
      expect(reverseScore(2, 4)).toBe(3);
      expect(reverseScore(3, 4)).toBe(2);
      expect(reverseScore(4, 4)).toBe(1);
    });

    it('should work with different maxOptionScore values', () => {
      expect(reverseScore(1, 5)).toBe(5);
      expect(reverseScore(5, 5)).toBe(1);
      expect(reverseScore(3, 5)).toBe(3);
    });

    it('should be its own inverse (round-trip)', () => {
      for (let max = 1; max <= 10; max++) {
        for (let s = 1; s <= max; s++) {
          expect(reverseScore(reverseScore(s, max), max)).toBe(s);
        }
      }
    });
  });

  describe('calculateRawScore', () => {
    const items: ScaleItem[] = [
      {
        id: 'item-1',
        scaleId: 'scale-1',
        itemOrder: 1,
        content: 'Question 1',
        options: [
          { text: 'Option A', score: 1 },
          { text: 'Option B', score: 2 },
          { text: 'Option C', score: 3 },
          { text: 'Option D', score: 4 },
        ],
        isReverseScored: false,
      },
      {
        id: 'item-2',
        scaleId: 'scale-1',
        itemOrder: 2,
        content: 'Question 2 (reverse)',
        options: [
          { text: 'Option A', score: 1 },
          { text: 'Option B', score: 2 },
          { text: 'Option C', score: 3 },
          { text: 'Option D', score: 4 },
        ],
        isReverseScored: true,
      },
      {
        id: 'item-3',
        scaleId: 'scale-1',
        itemOrder: 3,
        content: 'Question 3',
        options: [
          { text: 'Option A', score: 1 },
          { text: 'Option B', score: 2 },
          { text: 'Option C', score: 3 },
          { text: 'Option D', score: 4 },
        ],
        isReverseScored: false,
      },
    ];

    it('should sum scores for all answered items', () => {
      const answers: AnswerRecord[] = [
        { itemId: 'item-1', selectedScore: 3 },
        { itemId: 'item-2', selectedScore: 2 }, // reversed: 4+1-2 = 3
        { itemId: 'item-3', selectedScore: 4 },
      ];
      // 3 + 3 + 4 = 10
      expect(calculateRawScore(answers, items, 4)).toBe(10);
    });

    it('should skip unanswered items', () => {
      const answers: AnswerRecord[] = [
        { itemId: 'item-1', selectedScore: 2 },
        // item-2 not answered
        { itemId: 'item-3', selectedScore: 1 },
      ];
      // 2 + 1 = 3
      expect(calculateRawScore(answers, items, 4)).toBe(3);
    });

    it('should apply reverse scoring for marked items', () => {
      const answers: AnswerRecord[] = [
        { itemId: 'item-2', selectedScore: 1 }, // reversed: 4+1-1 = 4
      ];
      expect(calculateRawScore(answers, items, 4)).toBe(4);
    });

    it('should return 0 when no answers provided', () => {
      expect(calculateRawScore([], items, 4)).toBe(0);
    });
  });

  describe('calculateStandardScore', () => {
    it('should return Math.floor(rawScore * factor) for multiply type', () => {
      const rule: ScoringRule = { type: 'multiply', factor: 1.25, maxOptionScore: 4 };
      expect(calculateStandardScore(40, rule)).toBe(50);
      expect(calculateStandardScore(41, rule)).toBe(51);
      expect(calculateStandardScore(43, rule)).toBe(53);
    });

    it('should return null for direct type', () => {
      const rule: ScoringRule = { type: 'direct', maxOptionScore: 1 };
      expect(calculateStandardScore(7, rule)).toBeNull();
    });

    it('should floor the result, not round', () => {
      const rule: ScoringRule = { type: 'multiply', factor: 1.25, maxOptionScore: 4 };
      // 33 * 1.25 = 41.25 → floor = 41
      expect(calculateStandardScore(33, rule)).toBe(41);
    });
  });

  describe('determineGradeLevel', () => {
    const thresholds: GradeThreshold[] = [
      { level: '正常', minScore: 0, maxScore: 52, interpretation: '正常' },
      { level: '轻度', minScore: 53, maxScore: 62, interpretation: '轻度' },
      { level: '中度', minScore: 63, maxScore: 72, interpretation: '中度' },
      { level: '重度', minScore: 73, maxScore: null, interpretation: '重度' },
    ];

    it('should return correct grade for scores within ranges', () => {
      expect(determineGradeLevel(0, thresholds)).toBe('正常');
      expect(determineGradeLevel(52, thresholds)).toBe('正常');
      expect(determineGradeLevel(53, thresholds)).toBe('轻度');
      expect(determineGradeLevel(62, thresholds)).toBe('轻度');
      expect(determineGradeLevel(63, thresholds)).toBe('中度');
      expect(determineGradeLevel(72, thresholds)).toBe('中度');
      expect(determineGradeLevel(73, thresholds)).toBe('重度');
      expect(determineGradeLevel(100, thresholds)).toBe('重度');
    });

    it('should handle GHQ-12 two-level thresholds', () => {
      const ghqThresholds: GradeThreshold[] = [
        { level: '正常', minScore: 0, maxScore: 3, interpretation: '良好' },
        { level: '轻度', minScore: 4, maxScore: null, interpretation: '困扰倾向' },
      ];
      expect(determineGradeLevel(0, ghqThresholds)).toBe('正常');
      expect(determineGradeLevel(3, ghqThresholds)).toBe('正常');
      expect(determineGradeLevel(4, ghqThresholds)).toBe('轻度');
      expect(determineGradeLevel(12, ghqThresholds)).toBe('轻度');
    });

    it('should return closest boundary level for out-of-range scores (defensive)', () => {
      // Score below all thresholds
      const narrowThresholds: GradeThreshold[] = [
        { level: '轻度', minScore: 10, maxScore: 20, interpretation: '轻度' },
        { level: '中度', minScore: 21, maxScore: 30, interpretation: '中度' },
      ];
      expect(determineGradeLevel(5, narrowThresholds)).toBe('轻度');
      expect(determineGradeLevel(35, narrowThresholds)).toBe('中度');
    });
  });

  describe('calculateScore', () => {
    it('should produce complete scoring result for SDS-like scale', () => {
      const items: ScaleItem[] = [
        {
          id: 'item-1',
          scaleId: 'scale-1',
          itemOrder: 1,
          content: 'Q1',
          options: [
            { text: 'A', score: 1 },
            { text: 'B', score: 2 },
            { text: 'C', score: 3 },
            { text: 'D', score: 4 },
          ],
          isReverseScored: false,
        },
        {
          id: 'item-2',
          scaleId: 'scale-1',
          itemOrder: 2,
          content: 'Q2',
          options: [
            { text: 'A', score: 1 },
            { text: 'B', score: 2 },
            { text: 'C', score: 3 },
            { text: 'D', score: 4 },
          ],
          isReverseScored: true,
        },
      ];

      const input: ScoringInput = {
        answers: [
          { itemId: 'item-1', selectedScore: 3 },
          { itemId: 'item-2', selectedScore: 1 }, // reversed: 4+1-1 = 4
        ],
        items,
        scoringRule: { type: 'multiply', factor: 1.25, maxOptionScore: 4 },
        gradeThresholds: [
          { level: '正常', minScore: 0, maxScore: 52, interpretation: '情绪状态良好' },
          { level: '轻度', minScore: 53, maxScore: 62, interpretation: '轻度抑郁倾向' },
          { level: '中度', minScore: 63, maxScore: 72, interpretation: '中度抑郁症状' },
          { level: '重度', minScore: 73, maxScore: null, interpretation: '较重的抑郁症状' },
        ],
      };

      const result = calculateScore(input);
      // rawScore = 3 + 4 = 7
      expect(result.rawScore).toBe(7);
      // standardScore = Math.floor(7 * 1.25) = Math.floor(8.75) = 8
      expect(result.standardScore).toBe(8);
      // 8 falls in 正常 range (0-52)
      expect(result.gradeLevel).toBe('正常');
      expect(result.interpretation).toBe('情绪状态良好');
      expect(result.advice).toBe('继续保持积极心态');
    });

    it('should return appropriate advice for non-normal grades', () => {
      const items: ScaleItem[] = [
        {
          id: 'item-1',
          scaleId: 'scale-1',
          itemOrder: 1,
          content: 'Q1',
          options: [{ text: 'A', score: 1 }, { text: 'D', score: 4 }],
          isReverseScored: false,
        },
      ];

      const input: ScoringInput = {
        answers: [{ itemId: 'item-1', selectedScore: 4 }],
        items,
        scoringRule: { type: 'direct', maxOptionScore: 4 },
        gradeThresholds: [
          { level: '正常', minScore: 0, maxScore: 3, interpretation: '良好' },
          { level: '轻度', minScore: 4, maxScore: null, interpretation: '存在心理困扰倾向' },
        ],
      };

      const result = calculateScore(input);
      expect(result.rawScore).toBe(4);
      expect(result.standardScore).toBeNull();
      expect(result.gradeLevel).toBe('轻度');
      expect(result.advice).toBe('建议关注心理健康，如有需要请咨询专业人士');
    });

    it('should handle partial answers correctly', () => {
      const items: ScaleItem[] = [
        {
          id: 'item-1',
          scaleId: 'scale-1',
          itemOrder: 1,
          content: 'Q1',
          options: [{ text: 'A', score: 1 }, { text: 'D', score: 4 }],
          isReverseScored: false,
        },
        {
          id: 'item-2',
          scaleId: 'scale-1',
          itemOrder: 2,
          content: 'Q2',
          options: [{ text: 'A', score: 1 }, { text: 'D', score: 4 }],
          isReverseScored: false,
        },
      ];

      const input: ScoringInput = {
        answers: [{ itemId: 'item-1', selectedScore: 3 }], // only one answered
        items,
        scoringRule: { type: 'direct', maxOptionScore: 4 },
        gradeThresholds: [
          { level: '正常', minScore: 0, maxScore: 3, interpretation: '良好' },
          { level: '轻度', minScore: 4, maxScore: null, interpretation: '困扰' },
        ],
      };

      const result = calculateScore(input);
      expect(result.rawScore).toBe(3);
      expect(result.gradeLevel).toBe('正常');
    });
  });
});


// ============================================================================
// Property-Based Tests for Scoring Engine
// ============================================================================

import { fc, test as fcTest } from '@fast-check/vitest';

describe('scoring-engine - Property-Based Tests', () => {
  // Feature: mental-health-assessment, Property 7: Score calculation with partial answers
  // For any set of ScaleItems and any subset of answers (including partial),
  // calculateRawScore SHALL return the sum of exactly and only the answered items' scores
  // (applying reverse scoring where marked), ignoring unanswered items.
  // **Validates: Requirements 5.1, 5.2**
  describe('Property 7: Score calculation with partial answers', () => {
    // Arbitrary to generate a ScaleItem
    const scaleItemArb = (scaleId: string, maxScore: number) =>
      fc.record({
        id: fc.uuid(),
        scaleId: fc.constant(scaleId),
        itemOrder: fc.integer({ min: 1, max: 500 }),
        content: fc.string({ minLength: 1, maxLength: 50 }),
        options: fc.array(
          fc.record({
            text: fc.string({ minLength: 1, maxLength: 20 }),
            score: fc.integer({ min: 1, max: maxScore }),
          }),
          { minLength: 2, maxLength: 4 }
        ),
        isReverseScored: fc.boolean(),
      });

    fcTest.prop(
      [
        fc.integer({ min: 1, max: 10 }), // maxOptionScore
        fc.integer({ min: 1, max: 20 }), // number of items
      ],
      { numRuns: 100 },
    )('calculateRawScore sums only answered items scores', (maxOptionScore, numItems) => {
      const scaleId = 'test-scale';
      // Generate items with unique IDs
      const items: ScaleItem[] = Array.from({ length: numItems }, (_, i) => ({
        id: `item-${i}`,
        scaleId,
        itemOrder: i + 1,
        content: `Question ${i + 1}`,
        options: [
          { text: 'A', score: 1 },
          { text: 'B', score: maxOptionScore },
        ],
        isReverseScored: i % 3 === 0, // every 3rd item is reverse scored
      }));

      // Answer a random subset of items
      const answeredCount = Math.floor(Math.random() * (numItems + 1));
      const answeredIndices = Array.from({ length: numItems }, (_, i) => i)
        .sort(() => Math.random() - 0.5)
        .slice(0, answeredCount);

      const answers: AnswerRecord[] = answeredIndices.map((idx) => ({
        itemId: items[idx].id,
        selectedScore: Math.floor(Math.random() * maxOptionScore) + 1,
      }));

      const result = calculateRawScore(answers, items, maxOptionScore);

      // Calculate expected sum manually
      let expectedSum = 0;
      for (const answer of answers) {
        const item = items.find((it) => it.id === answer.itemId);
        if (item) {
          if (item.isReverseScored) {
            expectedSum += maxOptionScore + 1 - answer.selectedScore;
          } else {
            expectedSum += answer.selectedScore;
          }
        }
      }

      expect(result).toBe(expectedSum);
    });

    fcTest.prop(
      [
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }), // item IDs
        fc.integer({ min: 1, max: 10 }), // maxOptionScore
      ],
      { numRuns: 100 },
    )('calculateRawScore ignores answers for items not in the scale', (itemIds, maxOptionScore) => {
      const items: ScaleItem[] = itemIds.map((id, i) => ({
        id,
        scaleId: 'scale-1',
        itemOrder: i + 1,
        content: `Q${i + 1}`,
        options: [{ text: 'A', score: 1 }, { text: 'B', score: maxOptionScore }],
        isReverseScored: false,
      }));

      // Provide answers for items not in the list
      const extraAnswers: AnswerRecord[] = [
        { itemId: 'non-existent-item-1', selectedScore: 5 },
        { itemId: 'non-existent-item-2', selectedScore: 3 },
      ];

      // Answer all real items with score 1
      const realAnswers: AnswerRecord[] = items.map((item) => ({
        itemId: item.id,
        selectedScore: 1,
      }));

      const resultWithExtra = calculateRawScore([...realAnswers, ...extraAnswers], items, maxOptionScore);
      const resultWithout = calculateRawScore(realAnswers, items, maxOptionScore);

      // Extra answers for non-existent items should not affect the result
      expect(resultWithExtra).toBe(resultWithout);
    });
  });

  // Feature: mental-health-assessment, Property 8: Reverse scoring round-trip
  // For any score S in [1, N], reverseScore(reverseScore(S, N), N) === S,
  // and reverseScore(S, N) === N + 1 - S.
  // **Validates: Requirements 5.2**
  describe('Property 8: Reverse scoring round-trip', () => {
    fcTest.prop(
      [
        fc.integer({ min: 1, max: 100 }), // maxOptionScore N
      ],
      { numRuns: 100 },
    )('reverseScore is an involution: reverseScore(reverseScore(S, N), N) === S', (maxOptionScore) => {
      // For every valid score in [1, N]
      for (let score = 1; score <= maxOptionScore; score++) {
        const doubleReversed = reverseScore(reverseScore(score, maxOptionScore), maxOptionScore);
        expect(doubleReversed).toBe(score);
      }
    });

    fcTest.prop(
      [
        fc.integer({ min: 1, max: 100 }), // maxOptionScore N
      ],
      { numRuns: 100 },
    )('reverseScore(S, N) === N + 1 - S for all valid S', (maxOptionScore) => {
      for (let score = 1; score <= maxOptionScore; score++) {
        const reversed = reverseScore(score, maxOptionScore);
        expect(reversed).toBe(maxOptionScore + 1 - score);
      }
    });

    fcTest.prop(
      [
        fc.integer({ min: 1, max: 50 }), // maxOptionScore N
        fc.integer({ min: 1, max: 50 }), // score S (will be clamped)
      ],
      { numRuns: 100 },
    )('reverseScore produces value in valid range [1, N]', (maxOptionScore, rawScore) => {
      const score = ((rawScore - 1) % maxOptionScore) + 1; // Ensure score in [1, N]
      const reversed = reverseScore(score, maxOptionScore);
      expect(reversed).toBeGreaterThanOrEqual(1);
      expect(reversed).toBeLessThanOrEqual(maxOptionScore);
    });
  });

  // Feature: mental-health-assessment, Property 9: Standard score calculation
  // For multiply type with factor F and rawScore R, result === Math.floor(R * F).
  // For direct type, result === null.
  // **Validates: Requirements 5.3**
  describe('Property 9: Standard score calculation', () => {
    fcTest.prop(
      [
        fc.integer({ min: 0, max: 200 }), // rawScore
        fc.float({ min: Math.fround(0.1), max: Math.fround(10.0), noNaN: true, noDefaultInfinity: true }), // factor
        fc.integer({ min: 1, max: 10 }), // maxOptionScore
      ],
      { numRuns: 100 },
    )('multiply type returns Math.floor(rawScore * factor)', (rawScore, factor, maxOptionScore) => {
      const rule: ScoringRule = { type: 'multiply', factor, maxOptionScore };
      const result = calculateStandardScore(rawScore, rule);
      expect(result).toBe(Math.floor(rawScore * factor));
    });

    fcTest.prop(
      [
        fc.integer({ min: 0, max: 200 }), // rawScore
        fc.integer({ min: 1, max: 10 }), // maxOptionScore
      ],
      { numRuns: 100 },
    )('direct type always returns null regardless of rawScore', (rawScore, maxOptionScore) => {
      const rule: ScoringRule = { type: 'direct', maxOptionScore };
      const result = calculateStandardScore(rawScore, rule);
      expect(result).toBeNull();
    });

    fcTest.prop(
      [
        fc.integer({ min: 0, max: 200 }), // rawScore
        fc.float({ min: Math.fround(0.1), max: Math.fround(10.0), noNaN: true, noDefaultInfinity: true }), // factor
        fc.integer({ min: 1, max: 10 }), // maxOptionScore
      ],
      { numRuns: 100 },
    )('multiply type result is always an integer (floored)', (rawScore, factor, maxOptionScore) => {
      const rule: ScoringRule = { type: 'multiply', factor, maxOptionScore };
      const result = calculateStandardScore(rawScore, rule);
      expect(result).not.toBeNull();
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  // Feature: mental-health-assessment, Property 10: Grade level determination
  // For valid non-overlapping exhaustive thresholds and any score in range,
  // determineGradeLevel returns the correct level.
  // **Validates: Requirements 5.4**
  describe('Property 10: Grade level determination', () => {
    const gradeLevels: GradeLevel[] = ['正常', '轻度', '中度', '重度'];

    // Generate non-overlapping exhaustive thresholds covering [0, maxScore]
    function generateThresholds(numLevels: number, maxScore: number): GradeThreshold[] {
      const thresholds: GradeThreshold[] = [];
      const step = Math.max(1, Math.floor(maxScore / numLevels));

      for (let i = 0; i < numLevels; i++) {
        const minScore = i * step;
        const maxScoreVal = i === numLevels - 1 ? null : (i + 1) * step - 1;
        thresholds.push({
          level: gradeLevels[i % gradeLevels.length],
          minScore,
          maxScore: maxScoreVal,
          interpretation: `Level ${i}`,
        });
      }

      return thresholds;
    }

    fcTest.prop(
      [
        fc.integer({ min: 2, max: 4 }), // number of levels
        fc.integer({ min: 10, max: 200 }), // max possible score
      ],
      { numRuns: 100 },
    )('any score within range matches exactly one threshold', (numLevels, maxPossibleScore) => {
      const thresholds = generateThresholds(numLevels, maxPossibleScore);

      // Test with random scores in valid range
      for (let i = 0; i < 10; i++) {
        const score = Math.floor(Math.random() * (maxPossibleScore + 1));
        const result = determineGradeLevel(score, thresholds);

        // Verify the result is a valid GradeLevel
        expect(gradeLevels).toContain(result);

        // Verify the score actually falls in the returned threshold's range
        const matchedThreshold = thresholds.find((t) => t.level === result);
        expect(matchedThreshold).toBeDefined();
        if (matchedThreshold) {
          expect(score).toBeGreaterThanOrEqual(matchedThreshold.minScore);
          if (matchedThreshold.maxScore !== null) {
            expect(score).toBeLessThanOrEqual(matchedThreshold.maxScore);
          }
        }
      }
    });

    fcTest.prop(
      [
        fc.integer({ min: 0, max: 52 }), // score in 正常 range
      ],
      { numRuns: 100 },
    )('score in first range returns first level (SDS-like thresholds)', (score) => {
      const sdsThresholds: GradeThreshold[] = [
        { level: '正常', minScore: 0, maxScore: 52, interpretation: '正常' },
        { level: '轻度', minScore: 53, maxScore: 62, interpretation: '轻度' },
        { level: '中度', minScore: 63, maxScore: 72, interpretation: '中度' },
        { level: '重度', minScore: 73, maxScore: null, interpretation: '重度' },
      ];

      expect(determineGradeLevel(score, sdsThresholds)).toBe('正常');
    });

    fcTest.prop(
      [
        fc.integer({ min: 73, max: 200 }), // score in 重度 range (no upper bound)
      ],
      { numRuns: 100 },
    )('score in unbounded last range returns last level', (score) => {
      const sdsThresholds: GradeThreshold[] = [
        { level: '正常', minScore: 0, maxScore: 52, interpretation: '正常' },
        { level: '轻度', minScore: 53, maxScore: 62, interpretation: '轻度' },
        { level: '中度', minScore: 63, maxScore: 72, interpretation: '中度' },
        { level: '重度', minScore: 73, maxScore: null, interpretation: '重度' },
      ];

      expect(determineGradeLevel(score, sdsThresholds)).toBe('重度');
    });

    fcTest.prop(
      [
        fc.integer({ min: 0, max: 12 }), // GHQ-12 score range
      ],
      { numRuns: 100 },
    )('GHQ-12 two-level thresholds correctly classify all scores', (score) => {
      const ghqThresholds: GradeThreshold[] = [
        { level: '正常', minScore: 0, maxScore: 3, interpretation: '良好' },
        { level: '轻度', minScore: 4, maxScore: null, interpretation: '存在心理困扰倾向' },
      ];

      const expected: GradeLevel = score <= 3 ? '正常' : '轻度';
      expect(determineGradeLevel(score, ghqThresholds)).toBe(expected);
    });
  });
});
