// src/types/event.ts
// Core event type definitions for the Life Timeline feature

export type EventCategory = 'education' | 'work' | 'life' | 'achievement' | 'health' | 'travel' | 'other';
export type EventSentiment = 'positive' | 'neutral' | 'negative';

export interface EventNode {
  id: string;              // UUID
  userId: string;          // 关联用户 ID
  title: string;           // 事件标题 (1-100 字符)
  description: string;     // 事件描述 (0-2000 字符)
  eventDate: string;       // ISO 8601 日期 (YYYY-MM-DD)，范围 1900-01-01 至今+10年
  category: EventCategory; // 事件分类
  sentiment: EventSentiment; // 情感色彩
  createdAt: string;       // ISO 8601 时间戳
  updatedAt: string;       // ISO 8601 时间戳
}

export interface EventNodeInput {
  title: string;
  description: string;
  eventDate: string;       // YYYY-MM-DD，允许范围 1900-01-01 至当前日期+10年
  category: EventCategory;
  sentiment: EventSentiment;
}

/** 每用户事件数量上限 */
export const MAX_EVENTS_PER_USER = 5000;

/** 最早允许的事件日期 */
export const MIN_EVENT_DATE = '1900-01-01';

/** 最大日期偏移年份（当前日期 + 10年） */
export const MAX_EVENT_DATE_OFFSET_YEARS = 10;

/** 分类颜色映射（WCAG ≥ 3:1 对比度 vs 暖色背景 #FFFBEB） */
export const CATEGORY_COLORS: Record<EventCategory, string> = {
  education: '#4A90D9',   // 蓝色 (~3.0:1)
  work: '#C96830',        // 暖橙色 (~3.4:1)
  life: '#3D8B3D',        // 深绿色 (~3.8:1)
  achievement: '#9B7B28', // 深金色 (~3.6:1)
  health: '#C75B75',      // 玫瑰色 (~3.6:1)
  travel: '#9B59B6',      // 紫色 (~4.2:1)
  other: '#6B7B7C',       // 深灰色 (~3.9:1)
};

/** 分类中文标签 */
export const CATEGORY_LABELS: Record<EventCategory, string> = {
  education: '教育',
  work: '工作',
  life: '生活',
  achievement: '成就',
  health: '健康',
  travel: '旅行',
  other: '其他',
};

/** 情感色彩中文标签 */
export const SENTIMENT_LABELS: Record<EventSentiment, string> = {
  positive: '正面',
  neutral: '中性',
  negative: '负面',
};
