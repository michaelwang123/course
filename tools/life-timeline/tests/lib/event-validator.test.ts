// tests/lib/event-validator.test.ts
// 事件验证器单元测试 - 边界案例测试

import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  validateTitle,
  validateDate,
  validateDescription,
  validateCategory,
  validateSentiment,
  validateEventNode,
} from '@/lib/event-validator';

describe('validateTitle', () => {
  it('undefined → error "请输入事件标题"', () => {
    const result = validateTitle(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({ field: 'title', message: '请输入事件标题' });
  });

  it('"" → error "请输入事件标题"', () => {
    const result = validateTitle('');
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toBe('请输入事件标题');
  });

  it('"   " (whitespace only) → error "请输入事件标题"', () => {
    const result = validateTitle('   ');
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toBe('请输入事件标题');
  });

  it('"a" (1 char) → valid', () => {
    const result = validateTitle('a');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('"a".repeat(100) → valid', () => {
    const result = validateTitle('a'.repeat(100));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('"a".repeat(101) → error "标题不能超过 100 个字符"', () => {
    const result = validateTitle('a'.repeat(101));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({ field: 'title', message: '标题不能超过 100 个字符' });
  });
});


describe('validateDate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('undefined → error "请选择事件日期"', () => {
    const result = validateDate(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({ field: 'date', message: '请选择事件日期' });
  });

  it('"" → error "请选择事件日期"', () => {
    const result = validateDate('');
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toBe('请选择事件日期');
  });

  it('"invalid" → error "日期必须在 1900 年至未来 10 年之间"', () => {
    const result = validateDate('invalid');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({ field: 'date', message: '日期必须在 1900 年至未来 10 年之间' });
  });

  it('"1899-12-31" → error (before min date)', () => {
    const result = validateDate('1899-12-31');
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toBe('日期必须在 1900 年至未来 10 年之间');
  });

  it('"1900-01-01" → valid', () => {
    const result = validateDate('1900-01-01');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('today\'s date → valid', () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    const result = validateDate(todayStr);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('date 10 years from now → valid', () => {
    const today = new Date();
    const futureYear = today.getFullYear() + 10;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const futureStr = `${futureYear}-${month}-${day}`;

    const result = validateDate(futureStr);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('date 11 years from now → error', () => {
    const today = new Date();
    const futureYear = today.getFullYear() + 11;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const futureStr = `${futureYear}-${month}-${day}`;

    const result = validateDate(futureStr);
    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toBe('日期必须在 1900 年至未来 10 年之间');
  });
});


describe('validateDescription', () => {
  it('undefined → valid', () => {
    const result = validateDescription(undefined);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('"" → valid', () => {
    const result = validateDescription('');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('"a".repeat(2000) → valid', () => {
    const result = validateDescription('a'.repeat(2000));
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('"a".repeat(2001) → error "描述不能超过 2000 个字符"', () => {
    const result = validateDescription('a'.repeat(2001));
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({ field: 'description', message: '描述不能超过 2000 个字符' });
  });
});

describe('validateCategory', () => {
  it('"education" → valid', () => {
    const result = validateCategory('education');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('"work" → valid', () => {
    const result = validateCategory('work');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('undefined → error "请选择有效的事件分类"', () => {
    const result = validateCategory(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({ field: 'category', message: '请选择有效的事件分类' });
  });

  it('"invalid" → error "请选择有效的事件分类"', () => {
    const result = validateCategory('invalid');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({ field: 'category', message: '请选择有效的事件分类' });
  });
});

describe('validateSentiment', () => {
  it('"positive" → valid', () => {
    const result = validateSentiment('positive');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('undefined → error "请选择有效的情感色彩"', () => {
    const result = validateSentiment(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({ field: 'sentiment', message: '请选择有效的情感色彩' });
  });

  it('"invalid" → error "请选择有效的情感色彩"', () => {
    const result = validateSentiment('invalid');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toEqual({ field: 'sentiment', message: '请选择有效的情感色彩' });
  });
});


describe('validateEventNode', () => {
  it('all valid fields → valid=true, errors=[]', () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const result = validateEventNode({
      title: '毕业典礼',
      description: '大学毕业',
      eventDate: `${year}-${month}-${day}`,
      category: 'education',
      sentiment: 'positive',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('all invalid fields → valid=false, errors contains all 5 field errors', () => {
    const result = validateEventNode({
      title: undefined,
      description: 'a'.repeat(2001),
      eventDate: undefined,
      category: undefined,
      sentiment: undefined,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(5);

    const fields = result.errors.map((e) => e.field);
    expect(fields).toContain('title');
    expect(fields).toContain('date');
    expect(fields).toContain('description');
    expect(fields).toContain('category');
    expect(fields).toContain('sentiment');
  });

  it('mix of valid/invalid → only invalid fields have errors', () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    const result = validateEventNode({
      title: '有效标题',
      description: '',
      eventDate: `${year}-${month}-${day}`,
      category: 'invalid_category' as any,
      sentiment: undefined,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);

    const fields = result.errors.map((e) => e.field);
    expect(fields).toContain('category');
    expect(fields).toContain('sentiment');
    expect(fields).not.toContain('title');
    expect(fields).not.toContain('date');
    expect(fields).not.toContain('description');
  });
});
