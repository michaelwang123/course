// src/lib/event-validator.ts
// 事件数据验证（纯函数），逐字段独立验证

import type { EventNodeInput, EventCategory, EventSentiment } from '@/types/event';
import { getLocalToday, parseLocalDate, isValidDateFormat, addYears } from './date-utils';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** 有效的事件分类枚举值 */
const VALID_CATEGORIES: EventCategory[] = [
  'education', 'work', 'life', 'achievement', 'health', 'travel', 'other',
];

/** 有效的情感色彩枚举值 */
const VALID_SENTIMENTS: EventSentiment[] = [
  'positive', 'neutral', 'negative',
];

/**
 * 获取允许的最小日期（1900-01-01）
 */
export function getMinAllowedDate(): Date {
  return new Date(1900, 0, 1);
}

/**
 * 获取允许的最大日期（当前本地日期 + 10年）
 */
export function getMaxAllowedDate(): Date {
  const todayStr = getLocalToday();
  const maxDateStr = addYears(todayStr, 10);
  return parseLocalDate(maxDateStr);
}

/**
 * 验证标题字段
 * - 空或纯空白 → "请输入事件标题"
 * - 超过100字符 → "标题不能超过 100 个字符"
 */
export function validateTitle(title: string | undefined): ValidationResult {
  const errors: ValidationError[] = [];

  if (title === undefined || title.trim() === '') {
    errors.push({ field: 'title', message: '请输入事件标题' });
  } else if (title.length > 100) {
    errors.push({ field: 'title', message: '标题不能超过 100 个字符' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 验证日期字段
 * - 未提供 → "请选择事件日期"
 * - 格式无效或超出范围 → "日期必须在 1900 年至未来 10 年之间"
 *
 * 日期范围判断使用浏览器本地时区的当前日期
 */
export function validateDate(date: string | undefined): ValidationResult {
  const errors: ValidationError[] = [];

  if (date === undefined || date.trim() === '') {
    errors.push({ field: 'date', message: '请选择事件日期' });
  } else if (!isValidDateFormat(date)) {
    errors.push({ field: 'date', message: '日期必须在 1900 年至未来 10 年之间' });
  } else {
    const parsedDate = parseLocalDate(date);
    const minDate = getMinAllowedDate();
    const maxDate = getMaxAllowedDate();

    if (parsedDate < minDate || parsedDate > maxDate) {
      errors.push({ field: 'date', message: '日期必须在 1900 年至未来 10 年之间' });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 验证描述字段
 * - 超过2000字符 → "描述不能超过 2000 个字符"
 */
export function validateDescription(description: string | undefined): ValidationResult {
  const errors: ValidationError[] = [];

  if (description !== undefined && description.length > 2000) {
    errors.push({ field: 'description', message: '描述不能超过 2000 个字符' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 验证分类枚举值
 * - 无效值 → "请选择有效的事件分类"
 */
export function validateCategory(category: string | undefined): ValidationResult {
  const errors: ValidationError[] = [];

  if (category === undefined || !VALID_CATEGORIES.includes(category as EventCategory)) {
    errors.push({ field: 'category', message: '请选择有效的事件分类' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 验证情感色彩枚举值
 * - 无效值 → "请选择有效的情感色彩"
 */
export function validateSentiment(sentiment: string | undefined): ValidationResult {
  const errors: ValidationError[] = [];

  if (sentiment === undefined || !VALID_SENTIMENTS.includes(sentiment as EventSentiment)) {
    errors.push({ field: 'sentiment', message: '请选择有效的情感色彩' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * 验证事件节点输入数据（完整验证，逐字段独立错误）
 * 每个字段独立验证，返回所有违规字段的错误列表。
 */
export function validateEventNode(input: Partial<EventNodeInput>): ValidationResult {
  const allErrors: ValidationError[] = [];

  const titleResult = validateTitle(input.title);
  const dateResult = validateDate(input.eventDate);
  const descriptionResult = validateDescription(input.description);
  const categoryResult = validateCategory(input.category);
  const sentimentResult = validateSentiment(input.sentiment);

  allErrors.push(
    ...titleResult.errors,
    ...dateResult.errors,
    ...descriptionResult.errors,
    ...categoryResult.errors,
    ...sentimentResult.errors,
  );

  return { valid: allErrors.length === 0, errors: allErrors };
}
