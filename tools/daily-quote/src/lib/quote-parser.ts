import { createHash } from 'crypto';
import type { Quote, ColumnRoleMap, ParsedTable } from '../types/quote';

// ===== 关键词常量配置 =====

/** 用于识别金句表格所在章节的关键词集合 */
export const SECTION_KEYWORDS = ['经典', '精选', '语录', '箴言', '公案', '概念', '概览', '名句'];

/** 表示金句内容的列头集合 */
export const CONTENT_COLUMNS = ['名句', '语录', '箴言', '寓言', '原则', '公案', '核心要义'];

/** 表示主题/要义的列头集合 */
export const THEME_COLUMNS = ['智慧要点', '主题', '寓意', '解释', '教义', '要义'];

/** 表示章节/出处的列头集合 */
export const CHAPTER_COLUMNS = ['篇目', '章', '出处', '经文', '编号', '篇名'];

// ===== 纯函数实现 =====

/**
 * 解析单个 Markdown 文件内容，返回 Quote 数组
 * @param content - Markdown 文件全文
 * @param filePath - 文件路径（仅用于警告日志）
 */
export function parseMarkdownContent(content: string, filePath: string): Quote[] {
  const title = extractFrontmatterTitle(content);
  if (!title) {
    console.warn(`[quote-parser] 跳过文件（无 title）: ${filePath}`);
    return [];
  }

  const tables = findQuoteTables(content);
  const quotes: Quote[] = [];

  for (const table of tables) {
    for (const row of table.rows) {
      const quote = mapTableRowToQuote(row, table.roles, title);
      if (quote) {
        quotes.push(quote);
      }
    }
  }

  return quotes;
}

/**
 * 从 YAML frontmatter 提取 title 字段
 * @returns title 字符串，或 null（无 frontmatter / 无 title）
 */
export function extractFrontmatterTitle(content: string): string | null {
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];
  // 简单解析 YAML title 字段（支持带引号和不带引号）
  const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
  if (!titleMatch) {
    return null;
  }

  let title = titleMatch[1].trim();
  // 去除可能的引号包裹
  if ((title.startsWith('"') && title.endsWith('"')) ||
      (title.startsWith("'") && title.endsWith("'"))) {
    title = title.slice(1, -1);
  }

  return title || null;
}

/**
 * 通过关键词匹配策略识别金句表格（支持父级标题传递）
 * @returns 所有匹配的 ParsedTable 数组
 */
export function findQuoteTables(content: string): ParsedTable[] {
  const lines = content.split(/\r?\n/);
  const results: ParsedTable[] = [];

  // 标题层级栈：记录每个层级的标题文本
  // headingStack[level] = title text, level from 1 to 6
  const headingStack: (string | null)[] = [null, null, null, null, null, null, null];
  let currentHeadingForTable: string = '';

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 检测标题行
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2].trim();

      // 更新标题栈：设置当前层级，清除更深层级
      headingStack[level] = headingText;
      for (let l = level + 1; l <= 6; l++) {
        headingStack[l] = null;
      }

      currentHeadingForTable = headingText;
      i++;
      continue;
    }

    // 检测表格起始行（以 | 开头）
    if (line.trim().startsWith('|')) {
      const tableResult = parseTableBlock(lines, i);
      if (tableResult) {
        const { headers, rows, endIndex } = tableResult;

        // 检查标题链是否包含关键词
        if (isHeadingChainMatch(headingStack)) {
          // 尝试识别列角色
          const roles = identifyColumnRoles(headers);
          if (roles) {
            results.push({
              sectionTitle: currentHeadingForTable,
              headers,
              rows,
              roles,
            });
          }
        }

        i = endIndex;
        continue;
      }
    }

    i++;
  }

  return results;
}

/**
 * 根据列头匹配确定列角色映射
 * 独立扫描每个角色，优先级：内容 > 章节 > 主题
 * @returns ColumnRoleMap 如果存在内容列；否则返回 null
 */
export function identifyColumnRoles(headers: string[]): ColumnRoleMap | null {
  // 1. 先找内容列（最高优先级）
  const contentIndex = headers.findIndex(h => CONTENT_COLUMNS.some(kw => h.trim().includes(kw)));
  if (contentIndex === -1) return null;

  // 2. 从剩余列中找主题列
  let themeIndex: number | null = null;
  for (let i = 0; i < headers.length; i++) {
    if (i === contentIndex) continue;
    if (THEME_COLUMNS.some(kw => headers[i].trim().includes(kw))) {
      themeIndex = i;
      break;
    }
  }

  // 3. 从剩余列中找章节列
  let chapterIndex: number | null = null;
  for (let i = 0; i < headers.length; i++) {
    if (i === contentIndex || i === themeIndex) continue;
    if (CHAPTER_COLUMNS.some(kw => headers[i].trim().includes(kw))) {
      chapterIndex = i;
      break;
    }
  }

  return { contentIndex, themeIndex, chapterIndex };
}

/**
 * 将表格行映射为 Quote 记录
 * @returns Quote 如果内容非空；否则返回 null（跳过空内容行）
 */
export function mapTableRowToQuote(
  row: string[],
  roles: ColumnRoleMap,
  bookSource: string
): Quote | null {
  const content = (row[roles.contentIndex] ?? '').trim();

  // 空内容行跳过
  if (!content) {
    return null;
  }

  const chapter = roles.chapterIndex !== null
    ? (row[roles.chapterIndex] ?? '').trim()
    : '';

  const theme = roles.themeIndex !== null
    ? (row[roles.themeIndex] ?? '').trim()
    : '';

  return {
    id: generateQuoteId(bookSource, content),
    content,
    bookSource,
    chapter,
    theme,
  };
}

/**
 * 基于 SHA-256 哈希前 8 位生成确定性 ID
 * 使用 Node.js crypto 模块，仅在构建时调用
 */
export function generateQuoteId(bookSource: string, content: string): string {
  return createHash('sha256')
    .update(`${bookSource}:${content}`)
    .digest('hex')
    .slice(0, 8);
}

/**
 * 判断标题是否包含 Section_Keywords 中的任一关键词
 */
export function isSectionTitleMatch(title: string): boolean {
  return SECTION_KEYWORDS.some(kw => title.includes(kw));
}

// ===== 内部辅助函数 =====

/**
 * 检查标题层级栈中是否有任一标题匹配关键词
 * 实现父级标题传递逻辑
 */
function isHeadingChainMatch(headingStack: (string | null)[]): boolean {
  for (let level = 1; level <= 6; level++) {
    const heading = headingStack[level];
    if (heading && isSectionTitleMatch(heading)) {
      return true;
    }
  }
  return false;
}

/**
 * 从指定行开始解析 Markdown 表格块
 * @returns 解析结果（headers, rows, endIndex）或 null（非有效表格）
 */
function parseTableBlock(
  lines: string[],
  startIndex: number
): { headers: string[]; rows: string[][]; endIndex: number } | null {
  // 第一行应为表头
  const headerLine = lines[startIndex];
  if (!headerLine || !headerLine.trim().startsWith('|')) {
    return null;
  }

  const headers = parseTableRow(headerLine);
  if (headers.length === 0) {
    return null;
  }

  // 第二行应为分隔行（含 --- 模式）
  const separatorIndex = startIndex + 1;
  if (separatorIndex >= lines.length) {
    return null;
  }

  const separatorLine = lines[separatorIndex];
  if (!isTableSeparator(separatorLine)) {
    return null;
  }

  // 读取数据行
  const rows: string[][] = [];
  let i = separatorIndex + 1;
  while (i < lines.length && lines[i].trim().startsWith('|')) {
    const row = parseTableRow(lines[i]);
    if (row.length > 0) {
      rows.push(row);
    }
    i++;
  }

  return { headers, rows, endIndex: i };
}

/**
 * 解析表格行，返回单元格文本数组
 * 输入: "| cell1 | cell2 | cell3 |"
 * 输出: ["cell1", "cell2", "cell3"]
 */
function parseTableRow(line: string): string[] {
  const trimmed = line.trim();
  // 去除首尾的 | 字符
  const inner = trimmed.startsWith('|') ? trimmed.slice(1) : trimmed;
  const withoutTrailing = inner.endsWith('|') ? inner.slice(0, -1) : inner;

  return withoutTrailing.split('|').map(cell => cell.trim());
}

/**
 * 判断是否为表格分隔行（如 |---|---|---|）
 */
function isTableSeparator(line: string): boolean {
  if (!line || !line.trim().startsWith('|')) {
    return false;
  }
  // 分隔行中每个单元格应主要由 - 和 : 组成
  const cells = parseTableRow(line);
  return cells.length > 0 && cells.every(cell => /^[-:]+$/.test(cell.trim()));
}
