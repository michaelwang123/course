import type { Scale, ScaleItem } from '@/types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** Allowed characters for participant name: Chinese, English letters, and common punctuation */
const PARTICIPANT_NAME_PATTERN = /^[\u4e00-\u9fa5a-zA-Z，。、！？·\-]+$/;

/** Valid scale types */
const VALID_SCALE_TYPES: ReadonlyArray<string> = ['抑郁', '焦虑', '综合症状', '一般健康'];

/**
 * Validate participant name.
 * Rules: 1-20 chars after trim, Chinese/English/punctuation only, no pure whitespace.
 */
export function validateParticipantName(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    errors.push({ field: 'name', message: '请输入姓名' });
    return { valid: false, errors };
  }

  if (trimmed.length > 20) {
    errors.push({ field: 'name', message: '姓名不能超过20个字符' });
  }

  if (!PARTICIPANT_NAME_PATTERN.test(trimmed)) {
    errors.push({ field: 'name', message: '姓名只能包含中文、英文字母和常见标点' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate scale data.
 * Validates all Scale field constraints per requirements.
 */
export function validateScale(scale: Partial<Scale>): ValidationResult {
  const errors: ValidationError[] = [];

  // name: 1-100 chars
  if (scale.name == null || scale.name.length === 0) {
    errors.push({ field: 'name', message: '量表名称不能为空' });
  } else if (scale.name.length > 100) {
    errors.push({ field: 'name', message: '量表名称不能超过100个字符' });
  }

  // description: 1-500 chars
  if (scale.description == null || scale.description.length === 0) {
    errors.push({ field: 'description', message: '量表简介不能为空' });
  } else if (scale.description.length > 500) {
    errors.push({ field: 'description', message: '量表简介不能超过500个字符' });
  }

  // scaleType: must be a valid enum value
  if (scale.scaleType == null) {
    errors.push({ field: 'scaleType', message: '请选择量表类型' });
  } else if (!VALID_SCALE_TYPES.includes(scale.scaleType)) {
    errors.push({ field: 'scaleType', message: '量表类型无效' });
  }

  // targetAudience: 1-200 chars
  if (scale.targetAudience == null || scale.targetAudience.length === 0) {
    errors.push({ field: 'targetAudience', message: '适用人群描述不能为空' });
  } else if (scale.targetAudience.length > 200) {
    errors.push({ field: 'targetAudience', message: '适用人群描述不能超过200个字符' });
  }

  // itemCount: integer 1-500
  if (scale.itemCount == null) {
    errors.push({ field: 'itemCount', message: '题目数量不能为空' });
  } else if (!Number.isInteger(scale.itemCount) || scale.itemCount < 1 || scale.itemCount > 500) {
    errors.push({ field: 'itemCount', message: '题目数量必须为1-500之间的整数' });
  }

  // estimatedMinutes: integer 1-180
  if (scale.estimatedMinutes == null) {
    errors.push({ field: 'estimatedMinutes', message: '预计完成时间不能为空' });
  } else if (!Number.isInteger(scale.estimatedMinutes) || scale.estimatedMinutes < 1 || scale.estimatedMinutes > 180) {
    errors.push({ field: 'estimatedMinutes', message: '预计完成时间必须为1-180之间的整数' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate scale item data.
 * Validates content, options count (2-10), option text (1-200), option score (-100 to 100 integer).
 */
export function validateScaleItem(item: Partial<ScaleItem>): ValidationResult {
  const errors: ValidationError[] = [];

  // content: 1-500 chars
  if (item.content == null || item.content.length === 0) {
    errors.push({ field: 'content', message: '题干内容不能为空' });
  } else if (item.content.length > 500) {
    errors.push({ field: 'content', message: '题干内容不能超过500个字符' });
  }

  // options: array of 2-10 items
  if (!item.options || !Array.isArray(item.options)) {
    errors.push({ field: 'options', message: '选项列表不能为空' });
  } else {
    if (item.options.length < 2) {
      errors.push({ field: 'options', message: '每道题至少需要2个选项' });
    } else if (item.options.length > 10) {
      errors.push({ field: 'options', message: '每道题最多10个选项' });
    }

    // Validate each option
    for (let i = 0; i < item.options.length; i++) {
      const option = item.options[i];

      // option text: 1-200 chars
      if (option.text == null || option.text.length === 0) {
        errors.push({ field: `options[${i}].text`, message: `选项${i + 1}文本不能为空` });
      } else if (option.text.length > 200) {
        errors.push({ field: `options[${i}].text`, message: `选项${i + 1}文本不能超过200个字符` });
      }

      // option score: integer in [-100, 100]
      if (option.score == null) {
        errors.push({ field: `options[${i}].score`, message: `选项${i + 1}分值不能为空` });
      } else if (!Number.isInteger(option.score) || option.score < -100 || option.score > 100) {
        errors.push({ field: `options[${i}].score`, message: `选项${i + 1}分值必须为-100到100之间的整数` });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate scale item count consistency.
 * Verifies that declared count matches actual items length.
 */
export function validateScaleItemCount(
  declaredCount: number,
  actualItems: ScaleItem[]
): ValidationResult {
  const errors: ValidationError[] = [];

  if (declaredCount !== actualItems.length) {
    errors.push({
      field: 'itemCount',
      message: `量表声明题目数量(${declaredCount})与实际题目数(${actualItems.length})不一致`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate progress percentage (rounded to integer).
 * Returns Math.round(answered / total * 100).
 */
export function calculateProgress(answered: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((answered / total) * 100);
}

/**
 * Count unanswered questions.
 * Returns the number of questions that have not been answered.
 */
export function countUnanswered(
  answers: Record<string, number>,
  totalQuestions: number
): number {
  const answeredCount = Object.keys(answers).length;
  return totalQuestions - answeredCount;
}
