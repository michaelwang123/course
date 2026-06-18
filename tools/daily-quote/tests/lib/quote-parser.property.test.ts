import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseMarkdownContent,
  extractFrontmatterTitle,
  identifyColumnRoles,
  mapTableRowToQuote,
  generateQuoteId,
  SECTION_KEYWORDS,
  CONTENT_COLUMNS,
  THEME_COLUMNS,
  CHAPTER_COLUMNS,
} from '../../src/lib/quote-parser';

// ===== 生成器 =====

/** 生成一个 SECTION_KEYWORDS 中的关键词 */
const sectionKeywordArb = fc.constantFrom(...SECTION_KEYWORDS);

/** 生成一个 CONTENT_COLUMNS 中的列头 */
const contentColumnArb = fc.constantFrom(...CONTENT_COLUMNS);

/** 生成一个 THEME_COLUMNS 中的列头 */
const themeColumnArb = fc.constantFrom(...THEME_COLUMNS);

/** 生成一个 CHAPTER_COLUMNS 中的列头 */
const chapterColumnArb = fc.constantFrom(...CHAPTER_COLUMNS);

/** 生成非空且不含管道符/换行的文本（用于表格单元格） */
const cellTextArb = fc.stringOf(
  fc.char().filter(c => c !== '|' && c !== '\n' && c !== '\r'),
  { minLength: 1, maxLength: 20 }
).map(s => s.trim()).filter(s => s.length > 0);

/** 生成不包含 CONTENT_COLUMNS 关键词的列头 */
const nonContentHeaderArb = fc.stringOf(
  fc.char().filter(c => c !== '|' && c !== '\n' && c !== '\r'),
  { minLength: 1, maxLength: 10 }
).map(s => s.trim())
  .filter(s => s.length > 0 && !CONTENT_COLUMNS.some(kw => s.includes(kw)));

/** 生成合法的 YAML title（不含换行和特殊 YAML 字符，不为纯引号字符） */
const titleArb = fc.stringOf(
  fc.char().filter(c => c !== '\n' && c !== '\r' && c !== ':' && c !== '#' && c !== '"' && c !== "'"),
  { minLength: 1, maxLength: 30 }
).map(s => s.trim()).filter(s => s.length > 0);

// ===== 辅助函数 =====

/** 构建 Markdown 表格字符串 */
function buildTable(headers: string[], rows: string[][]): string {
  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const rowLines = rows.map(row => `| ${row.join(' | ')} |`);
  return [headerLine, separatorLine, ...rowLines].join('\n');
}

/** 构建带 frontmatter 和关键词标题的完整 Markdown */
function buildMarkdown(
  title: string,
  sectionKeyword: string,
  table: string
): string {
  return [
    '---',
    `title: ${title}`,
    '---',
    '',
    `## ${sectionKeyword}章节`,
    '',
    table,
  ].join('\n');
}

// ===== Property Tests =====

describe('quote-parser property tests', () => {
  /**
   * Property 1: 关键词匹配的表格产生金句
   * **Validates: Requirements 1.2, 1.3**
   */
  describe('Property 1: 关键词匹配的表格产生金句', () => {
    it('for any markdown with keyword heading + content column table with non-empty rows → produces Quote records', () => {
      fc.assert(
        fc.property(
          titleArb,
          sectionKeywordArb,
          contentColumnArb,
          fc.array(cellTextArb, { minLength: 1, maxLength: 5 }),
          (title, keyword, contentCol, cellValues) => {
            const headers = [contentCol];
            const rows = cellValues.map(v => [v]);
            const table = buildTable(headers, rows);
            const md = buildMarkdown(title, keyword, table);

            const quotes = parseMarkdownContent(md, 'test.md');

            // Should produce exactly as many quotes as non-empty rows
            expect(quotes.length).toBe(cellValues.length);
            // Each quote should have content from the row
            for (let i = 0; i < quotes.length; i++) {
              expect(quotes[i].content).toBe(cellValues[i]);
              expect(quotes[i].bookSource).toBe(title);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: 列角色映射正确性
   * **Validates: Requirements 1.4**
   */
  describe('Property 2: 列角色映射正确性', () => {
    it('for any table row, Quote content/theme/chapter map correctly to column indices', () => {
      fc.assert(
        fc.property(
          cellTextArb,
          cellTextArb,
          cellTextArb,
          contentColumnArb,
          themeColumnArb,
          chapterColumnArb,
          titleArb,
          (contentVal, themeVal, chapterVal, contentCol, themeCol, chapterCol, bookSource) => {
            const headers = [chapterCol, contentCol, themeCol];
            const row = [chapterVal, contentVal, themeVal];

            const roles = identifyColumnRoles(headers);
            expect(roles).not.toBeNull();

            const quote = mapTableRowToQuote(row, roles!, bookSource);
            expect(quote).not.toBeNull();
            expect(quote!.content).toBe(contentVal);
            expect(quote!.theme).toBe(themeVal);
            expect(quote!.chapter).toBe(chapterVal);
            expect(quote!.bookSource).toBe(bookSource);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: 无内容列的表格被跳过
   * **Validates: Requirements 1.5**
   */
  describe('Property 3: 无内容列的表格被跳过', () => {
    it('for any table under keyword heading without CONTENT_COLUMNS → produces zero quotes', () => {
      fc.assert(
        fc.property(
          titleArb,
          sectionKeywordArb,
          fc.array(nonContentHeaderArb, { minLength: 1, maxLength: 4 }),
          fc.array(cellTextArb, { minLength: 1, maxLength: 5 }),
          (title, keyword, headers, rowValues) => {
            // Ensure headers don't accidentally contain content keywords
            const safeHeaders = headers.map(h => {
              for (const kw of CONTENT_COLUMNS) {
                if (h.includes(kw)) return 'colX';
              }
              return h;
            });

            const rows = rowValues.map(v => safeHeaders.map(() => v));
            const table = buildTable(safeHeaders, rows);
            const md = buildMarkdown(title, keyword, table);

            const quotes = parseMarkdownContent(md, 'test.md');
            expect(quotes.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 4: Frontmatter title 提取
   * **Validates: Requirements 1.6**
   */
  describe('Property 4: Frontmatter title 提取', () => {
    it('for any valid YAML frontmatter with title field → extracted value matches exactly', () => {
      fc.assert(
        fc.property(
          titleArb,
          (title) => {
            const md = `---\ntitle: ${title}\n---\n\nSome content`;
            const extracted = extractFrontmatterTitle(md);
            expect(extracted).toBe(title);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for title wrapped in double quotes → extracted value matches inner text', () => {
      fc.assert(
        fc.property(
          titleArb.filter(t => !t.includes('"')),
          (title) => {
            const md = `---\ntitle: "${title}"\n---\n\nSome content`;
            const extracted = extractFrontmatterTitle(md);
            expect(extracted).toBe(title);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('for title wrapped in single quotes → extracted value matches inner text', () => {
      fc.assert(
        fc.property(
          titleArb.filter(t => !t.includes("'")),
          (title) => {
            const md = `---\ntitle: '${title}'\n---\n\nSome content`;
            const extracted = extractFrontmatterTitle(md);
            expect(extracted).toBe(title);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 5: 确定性 ID 生成
   * **Validates: Requirements 1.7**
   */
  describe('Property 5: 确定性 ID 生成', () => {
    it('generateQuoteId with same input always produces same output', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (bookSource, content) => {
            const id1 = generateQuoteId(bookSource, content);
            const id2 = generateQuoteId(bookSource, content);
            const id3 = generateQuoteId(bookSource, content);

            expect(id1).toBe(id2);
            expect(id2).toBe(id3);
            // ID is 8-char hex
            expect(id1).toMatch(/^[0-9a-f]{8}$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 6: 空内容行跳过
   * **Validates: Requirements 1.10**
   */
  describe('Property 6: 空内容行跳过', () => {
    it('for any row where content cell is empty/whitespace → no Quote produced', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', ' ', '  ', '\t', '   '),
          cellTextArb,
          cellTextArb,
          titleArb,
          (emptyContent, themeVal, chapterVal, bookSource) => {
            const roles = { contentIndex: 0, themeIndex: 1, chapterIndex: 2 };
            const row = [emptyContent, themeVal, chapterVal];

            const quote = mapTableRowToQuote(row, roles, bookSource);
            expect(quote).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('empty content rows in full markdown parsing produce no quotes for those rows', () => {
      fc.assert(
        fc.property(
          titleArb,
          sectionKeywordArb,
          contentColumnArb,
          cellTextArb,
          (title, keyword, contentCol, validContent) => {
            // Build a table with one valid row and one empty row
            const headers = [contentCol];
            const rows = [[validContent], [''], ['  ']];
            const table = buildTable(headers, rows);
            const md = buildMarkdown(title, keyword, table);

            const quotes = parseMarkdownContent(md, 'test.md');
            // Only the valid row should produce a quote
            expect(quotes.length).toBe(1);
            expect(quotes[0].content).toBe(validContent);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
