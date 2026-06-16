import { describe, it, expect } from 'vitest';
import { sdsScale, sdsItems, sdsScoringRule, sdsGradeThresholds } from '@/data/sds-scale';
import { sasScale, sasItems, sasScoringRule, sasGradeThresholds } from '@/data/sas-scale';
import { ghq12Scale, ghq12Items, ghq12ScoringRule, ghq12GradeThresholds } from '@/data/ghq12-scale';

describe('Preset Scale Data Integrity', () => {
  describe('SDS Depression Scale', () => {
    it('has exactly 20 items', () => {
      expect(sdsItems).toHaveLength(20);
    });

    it('each item has 4 options with scores 1-4', () => {
      for (const item of sdsItems) {
        expect(item.options).toHaveLength(4);
        const scores = item.options.map((o) => o.score).sort((a, b) => a - b);
        expect(scores).toEqual([1, 2, 3, 4]);
      }
    });

    it('has correct reverse-scored items (items 2,5,6,11,12,14,16,17,18,20)', () => {
      const expectedReverse = [2, 5, 6, 11, 12, 14, 16, 17, 18, 20];
      for (const item of sdsItems) {
        if (expectedReverse.includes(item.itemOrder)) {
          expect(item.isReverseScored, `Item ${item.itemOrder} should be reverse-scored`).toBe(true);
        } else {
          expect(item.isReverseScored, `Item ${item.itemOrder} should NOT be reverse-scored`).toBe(false);
        }
      }
    });

    it('scale metadata itemCount matches actual items length', () => {
      expect(sdsScale.itemCount).toBe(sdsItems.length);
    });

    it('scoring rule is multiply with factor 1.25', () => {
      expect(sdsScoringRule.type).toBe('multiply');
      expect(sdsScoringRule.factor).toBe(1.25);
      expect(sdsScoringRule.maxOptionScore).toBe(4);
    });

    it('grade thresholds cover expected ranges', () => {
      expect(sdsGradeThresholds).toHaveLength(4);
      expect(sdsGradeThresholds[0]).toMatchObject({ level: '正常', minScore: 0, maxScore: 52 });
      expect(sdsGradeThresholds[1]).toMatchObject({ level: '轻度', minScore: 53, maxScore: 62 });
      expect(sdsGradeThresholds[2]).toMatchObject({ level: '中度', minScore: 63, maxScore: 72 });
      expect(sdsGradeThresholds[3]).toMatchObject({ level: '重度', minScore: 73, maxScore: null });
    });

    it('all items have valid structure', () => {
      for (const item of sdsItems) {
        expect(item.id).toBeTruthy();
        expect(item.scaleId).toBeTruthy();
        expect(item.itemOrder).toBeGreaterThan(0);
        expect(item.content).toBeTruthy();
        expect(item.options.length).toBeGreaterThanOrEqual(2);
        for (const option of item.options) {
          expect(option.text).toBeTruthy();
          expect(typeof option.score).toBe('number');
        }
      }
    });
  });

  describe('SAS Anxiety Scale', () => {
    it('has exactly 20 items', () => {
      expect(sasItems).toHaveLength(20);
    });

    it('each item has 4 options with scores 1-4', () => {
      for (const item of sasItems) {
        expect(item.options).toHaveLength(4);
        const scores = item.options.map((o) => o.score).sort((a, b) => a - b);
        expect(scores).toEqual([1, 2, 3, 4]);
      }
    });

    it('has correct reverse-scored items (items 5,9,13,17,19)', () => {
      const expectedReverse = [5, 9, 13, 17, 19];
      for (const item of sasItems) {
        if (expectedReverse.includes(item.itemOrder)) {
          expect(item.isReverseScored, `Item ${item.itemOrder} should be reverse-scored`).toBe(true);
        } else {
          expect(item.isReverseScored, `Item ${item.itemOrder} should NOT be reverse-scored`).toBe(false);
        }
      }
    });

    it('scale metadata itemCount matches actual items length', () => {
      expect(sasScale.itemCount).toBe(sasItems.length);
    });

    it('scoring rule is multiply with factor 1.25', () => {
      expect(sasScoringRule.type).toBe('multiply');
      expect(sasScoringRule.factor).toBe(1.25);
      expect(sasScoringRule.maxOptionScore).toBe(4);
    });

    it('grade thresholds cover expected ranges', () => {
      expect(sasGradeThresholds).toHaveLength(4);
      expect(sasGradeThresholds[0]).toMatchObject({ level: '正常', minScore: 0, maxScore: 49 });
      expect(sasGradeThresholds[1]).toMatchObject({ level: '轻度', minScore: 50, maxScore: 59 });
      expect(sasGradeThresholds[2]).toMatchObject({ level: '中度', minScore: 60, maxScore: 69 });
      expect(sasGradeThresholds[3]).toMatchObject({ level: '重度', minScore: 70, maxScore: null });
    });

    it('all items have valid structure', () => {
      for (const item of sasItems) {
        expect(item.id).toBeTruthy();
        expect(item.scaleId).toBeTruthy();
        expect(item.itemOrder).toBeGreaterThan(0);
        expect(item.content).toBeTruthy();
        expect(item.options.length).toBeGreaterThanOrEqual(2);
        for (const option of item.options) {
          expect(option.text).toBeTruthy();
          expect(typeof option.score).toBe('number');
        }
      }
    });
  });

  describe('GHQ-12 General Health Questionnaire', () => {
    it('has exactly 12 items', () => {
      expect(ghq12Items).toHaveLength(12);
    });

    it('each item has 4 options with GHQ scoring 0-0-1-1', () => {
      for (const item of ghq12Items) {
        expect(item.options).toHaveLength(4);
        const scores = item.options.map((o) => o.score);
        expect(scores).toEqual([0, 0, 1, 1]);
      }
    });

    it('has no reverse-scored items', () => {
      for (const item of ghq12Items) {
        expect(item.isReverseScored, `Item ${item.itemOrder} should NOT be reverse-scored`).toBe(false);
      }
    });

    it('scale metadata itemCount matches actual items length', () => {
      expect(ghq12Scale.itemCount).toBe(ghq12Items.length);
    });

    it('scoring rule is direct', () => {
      expect(ghq12ScoringRule.type).toBe('direct');
      expect(ghq12ScoringRule.maxOptionScore).toBe(1);
    });

    it('grade thresholds cover expected ranges', () => {
      expect(ghq12GradeThresholds).toHaveLength(2);
      expect(ghq12GradeThresholds[0]).toMatchObject({ level: '正常', minScore: 0, maxScore: 3 });
      expect(ghq12GradeThresholds[1]).toMatchObject({ level: '轻度', minScore: 4, maxScore: null });
    });

    it('all items have valid structure', () => {
      for (const item of ghq12Items) {
        expect(item.id).toBeTruthy();
        expect(item.scaleId).toBeTruthy();
        expect(item.itemOrder).toBeGreaterThan(0);
        expect(item.content).toBeTruthy();
        expect(item.options.length).toBeGreaterThanOrEqual(2);
        for (const option of item.options) {
          expect(option.text).toBeTruthy();
          expect(typeof option.score).toBe('number');
        }
      }
    });
  });
});
