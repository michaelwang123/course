// src/constants/categories.ts
// Category configuration with colors, icons, and labels

import type { EventCategory } from '@/types/event';

export interface CategoryConfig {
  color: string;
  icon: string;   // emoji
  label: string;
}

export const CATEGORIES: Record<EventCategory, CategoryConfig> = {
  education:   { color: '#4A90D9', icon: '🎓', label: '教育' },
  work:        { color: '#C96830', icon: '💼', label: '工作' },
  life:        { color: '#3D8B3D', icon: '🌱', label: '生活' },
  achievement: { color: '#9B7B28', icon: '🏆', label: '成就' },
  health:      { color: '#C75B75', icon: '❤️', label: '健康' },
  travel:      { color: '#9B59B6', icon: '✈️', label: '旅行' },
  other:       { color: '#6B7B7C', icon: '📌', label: '其他' },
};
