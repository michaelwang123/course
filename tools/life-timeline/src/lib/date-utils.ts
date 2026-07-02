// src/lib/date-utils.ts
// 日期工具函数（纯函数），所有日期操作使用浏览器本地时区

/**
 * 获取当前本地日期（YYYY-MM-DD 格式）
 * 使用浏览器本地时区
 */
export function getLocalToday(): string {
  const now = new Date();
  return formatLocalDate(now);
}

/**
 * 解析 YYYY-MM-DD 字符串为本地 Date 对象
 * 解释为浏览器本地时区的日期（午夜 00:00:00）
 */
export function parseLocalDate(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // Date 月份从 0 开始
  const day = parseInt(dayStr, 10);
  return new Date(year, month, day);
}

/**
 * 格式化 Date 为 YYYY-MM-DD 字符串
 * 使用浏览器本地时区的 getFullYear/getMonth/getDate
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 计算两个日期之间的天数差（绝对值，本地时区）
 */
export function daysBetween(date1: string, date2: string): number {
  const d1 = parseLocalDate(date1);
  const d2 = parseLocalDate(date2);
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 日期加减年份（本地时区）
 * 处理闰年边界情况：如 2024-02-29 + 1年 → 2025-02-28
 */
export function addYears(dateStr: string, years: number): string {
  const date = parseLocalDate(dateStr);
  const targetYear = date.getFullYear() + years;
  const month = date.getMonth();
  const day = date.getDate();

  // 先设置年份，再检查日期是否溢出（如闰年 2/29 → 非闰年）
  const result = new Date(targetYear, month, day);

  // 如果月份发生了溢出（例如 Feb 29 → Mar 1），则回退到上月最后一天
  if (result.getMonth() !== month) {
    // 设置为目标年份该月的最后一天
    result.setDate(0); // 回到上个月最后一天
  }

  return formatLocalDate(result);
}

/**
 * 判断日期字符串是否为有效的 YYYY-MM-DD 格式
 * 验证格式 AND 验证日期实际存在（如 2023-02-29 无效）
 */
export function isValidDateFormat(dateStr: string): boolean {
  // 验证格式：严格匹配 YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }

  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  // 基本范围检查
  if (month < 1 || month > 12) {
    return false;
  }
  if (day < 1 || day > 31) {
    return false;
  }

  // 通过 Date 构造验证日期实际存在
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}
