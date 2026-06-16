import type { ScaleItem, ScoringRule, GradeThreshold } from '@/types/scale';
import type { AnswerRecord, GradeLevel } from '@/types/assessment';

export interface ScoringInput {
  /** 作答记录列表 */
  answers: AnswerRecord[];
  /** 量表题目列表 */
  items: ScaleItem[];
  /** 评分规则 */
  scoringRule: ScoringRule;
  /** 等级划分阈值 */
  gradeThresholds: GradeThreshold[];
}

export interface ScoringResult {
  /** 原始总分 */
  rawScore: number;
  /** 标准分（若适用） */
  standardScore: number | null;
  /** 等级判定 */
  gradeLevel: GradeLevel;
  /** 结果解读文字 */
  interpretation: string;
  /** 建议信息 */
  advice: string;
}

/**
 * 反向计分转换
 * formula: maxOptionScore + 1 - score
 */
export function reverseScore(score: number, maxOptionScore: number): number {
  return maxOptionScore + 1 - score;
}

/**
 * 计算原始总分
 * 处理正向计分和反向计分题目，跳过未作答题目
 * 使用 Map 实现 O(n+m) 查找，避免 O(n*m) 嵌套遍历
 */
export function calculateRawScore(
  answers: AnswerRecord[],
  items: ScaleItem[],
  maxOptionScore: number
): number {
  // 构建 itemId → score 的 Map，O(n) 预处理
  const answerMap = new Map<string, number>();
  for (const answer of answers) {
    answerMap.set(answer.itemId, answer.selectedScore);
  }

  let total = 0;

  for (const item of items) {
    const score = answerMap.get(item.id);
    if (score === undefined) {
      // Skip unanswered items
      continue;
    }

    if (item.isReverseScored) {
      total += reverseScore(score, maxOptionScore);
    } else {
      total += score;
    }
  }

  return total;
}

/**
 * 计算标准分
 * 根据换算规则计算（如 ×1.25 取整）
 * For type='multiply', returns Math.floor(rawScore * factor)
 * For type='direct', returns null (raw score is used directly)
 */
export function calculateStandardScore(
  rawScore: number,
  rule: ScoringRule
): number | null {
  if (rule.type === 'multiply' && rule.factor != null) {
    return Math.floor(rawScore * rule.factor);
  }
  return null;
}

/**
 * 根据分数和阈值判定等级
 * 找到分数所在的阈值范围，返回对应等级
 * 如果没有匹配（防御性情况），返回最近的边界等级
 */
export function determineGradeLevel(
  score: number,
  thresholds: GradeThreshold[]
): GradeLevel {
  // Find the threshold where score >= minScore AND (maxScore is null OR score <= maxScore)
  for (const threshold of thresholds) {
    if (
      score >= threshold.minScore &&
      (threshold.maxScore === null || score <= threshold.maxScore)
    ) {
      return threshold.level;
    }
  }

  // Defensive: return the closest boundary level
  // If score is below all thresholds, return the first (lowest) level
  // If score is above all thresholds, return the last (highest) level
  if (thresholds.length === 0) {
    return '正常';
  }

  const sorted = [...thresholds].sort((a, b) => a.minScore - b.minScore);

  if (score < sorted[0].minScore) {
    return sorted[0].level;
  }

  return sorted[sorted.length - 1].level;
}

/**
 * 完整评分流程
 * calculateRawScore → calculateStandardScore → determineGradeLevel → build result
 */
export function calculateScore(input: ScoringInput): ScoringResult {
  const { answers, items, scoringRule, gradeThresholds } = input;

  // Step 1: Calculate raw score
  const rawScore = calculateRawScore(answers, items, scoringRule.maxOptionScore);

  // Step 2: Calculate standard score
  const standardScore = calculateStandardScore(rawScore, scoringRule);

  // Step 3: Determine the score to use for grade level determination
  // Use standard score if available, otherwise use raw score
  const scoreForGrade = standardScore ?? rawScore;

  // Step 4: Determine grade level
  const gradeLevel = determineGradeLevel(scoreForGrade, gradeThresholds);

  // Step 5: Find the matching threshold for interpretation text
  const matchedThreshold = gradeThresholds.find((t) => t.level === gradeLevel);
  const interpretation = matchedThreshold?.interpretation ?? '';

  // Step 6: Determine advice based on grade level
  const advice =
    gradeLevel === '正常'
      ? '继续保持积极心态'
      : '建议关注心理健康，如有需要请咨询专业人士';

  return {
    rawScore,
    standardScore,
    gradeLevel,
    interpretation,
    advice,
  };
}
