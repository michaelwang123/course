/**
 * 金句记录
 */
export interface Quote {
  /** 确定性哈希 ID (基于 bookSource + content，SHA-256 前 8 位 hex) */
  id: string;
  /** 金句文本（必有值，空内容行在解析时跳过） */
  content: string;
  /** 书籍来源（必有值，无 title 的文件在解析时跳过） */
  bookSource: string;
  /** 篇目/章节（可为空字符串） */
  chapter: string;
  /** 智慧要点/主题（可为空字符串） */
  theme: string;
}

/**
 * 列角色映射 — 标识金句表格中各列的角色
 */
export interface ColumnRoleMap {
  /** 内容列索引（必有） */
  contentIndex: number;
  /** 主题列索引（可能无） */
  themeIndex: number | null;
  /** 章节列索引（可能无） */
  chapterIndex: number | null;
}

/**
 * 解析后的表格结构
 */
export interface ParsedTable {
  /** 表格所在的标题 */
  sectionTitle: string;
  /** 列头数组 */
  headers: string[];
  /** 各行单元格文本 */
  rows: string[][];
  /** 列角色映射 */
  roles: ColumnRoleMap;
}

/**
 * 书籍来源信息（用于筛选面板）
 */
export interface BookSourceInfo {
  /** 书名 */
  name: string;
  /** 该书的金句数量 */
  count: number;
}
