import type { GradeLevel } from './assessment';

export interface Scale {
  id: string;
  name: string;
  description: string;
  scaleType: '抑郁' | '焦虑' | '综合症状' | '一般健康';
  targetAudience: string;
  itemCount: number;
  estimatedMinutes: number;
  scoringRule: ScoringRule;
  gradeThresholds: GradeThreshold[];
  createdAt: string;
}

export interface ScoringRule {
  /** 换算类型: 'multiply' = 乘以系数取整, 'direct' = 直接求和 */
  type: 'multiply' | 'direct';
  /** 乘法系数（type='multiply' 时使用） */
  factor?: number;
  /** 量表最大选项分值（用于反向计分） */
  maxOptionScore: number;
}

export interface GradeThreshold {
  level: GradeLevel;
  /** 分数下限（含） */
  minScore: number;
  /** 分数上限（含），null 表示无上限 */
  maxScore: number | null;
  /** 结果解读文字 */
  interpretation: string;
}

export interface ScaleItem {
  id: string;
  scaleId: string;
  itemOrder: number;
  content: string;
  options: ScaleOption[];
  isReverseScored: boolean;
}

export interface ScaleOption {
  text: string;
  score: number;
}
