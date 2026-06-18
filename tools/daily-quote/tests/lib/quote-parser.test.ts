import { describe, it, expect, vi } from 'vitest';
import {
  parseMarkdownContent,
  extractFrontmatterTitle,
  findQuoteTables,
  identifyColumnRoles,
  mapTableRowToQuote,
  generateQuoteId,
  isSectionTitleMatch,
} from '../../src/lib/quote-parser';

// ===== Fixture: 道德经格式 =====
// 标题"经典章节精选"下，列头 `| 章 | 名句 | 智慧要点 |`
const daodejingFixture = `---
title: 道德经
sidebar_position: 2
---

# 《道德经》— 老子

## 核心思想

一些介绍文字。

## 经典章节精选

| 章 | 名句 | 智慧要点 |
|----|------|----------|
| 第1章 | 道可道，非常道 | 真正的道理超越语言 |
| 第8章 | 上善若水 | 最高的善像水一样利万物而不争 |
| 第33章 | 知人者智，自知者明 | 了解自己比了解别人更难更重要 |
`;

// ===== Fixture: 论语格式 =====
// 标题"经典名句精选"下，列头 `| 篇目 | 名句 | 智慧要点 |`
const lunyuFixture = `---
title: 论语
---

# 《论语》— 孔子及弟子

## 经典名句精选

| 篇目 | 名句 | 智慧要点 |
|------|------|----------|
| 卫灵公 | 己所不欲，勿施于人 | 人际关系的黄金法则 |
| 为政 | 三十而立，四十而不惑 | 人生各阶段的成长目标 |
| 里仁 | 见贤思齐焉，见不贤而内自省也 | 以他人为镜，持续自我改善 |
`;

// ===== Fixture: 庄子格式 =====
// 标题"经典寓言"下，列头 `| 寓言 | 出处 | 寓意 |`
const zhuangziFixture = `---
title: 庄子
---

# 《庄子》— 庄周

## 经典寓言

| 寓言 | 出处 | 寓意 |
|------|------|------|
| 鲲鹏展翅 | 逍遥游 | 境界不同，视野不同 |
| 庖丁解牛 | 养生主 | 顺应规律，游刃有余 |
| 蝴蝶梦 | 齐物论 | 真实与梦境的边界模糊 |
`;

// ===== Fixture: 传习录格式 =====
// 标题"经典语录"下，列头 `| 语录 | 智慧要点 |`（无章节列）
const chuanxiluFixture = `---
title: 传习录
---

# 《传习录》— 王阳明

## 经典语录

| 语录 | 智慧要点 |
|------|----------|
| 破山中贼易，破心中贼难 | 战胜内心的弱点比外在成就更难 |
| 此心不动，随机而动 | 内心稳定，行动自然恰当 |
| 人须在事上磨 | 实践是最好的修行 |
`;

// ===== Fixture: 圣经箴言格式 =====
// 子标题"关于品格"在父标题"主题分类精选"下（父级关键词传递）
const shengjingFixture = `---
title: 圣经·箴言篇
---

# 《圣经·箴言篇》— 所罗门等

## 核心思想

一些介绍。

## 主题分类精选

### 关于品格

| 经文 | 箴言 |
|------|------|
| 10:9 | 行正直路的，步步安稳 |
| 11:2 | 骄傲来，羞耻也来；谦逊人却有智慧 |
| 16:32 | 不轻易发怒的，胜过勇士；治服己心的，强如取城 |

### 关于财富

| 经文 | 箴言 |
|------|------|
| 13:11 | 不劳而得之财必然消耗，勤劳积蓄的必见加增 |
| 22:7 | 富户管辖穷人，欠债的是债主的仆人 |
`;

// ===== Fixture: 无 frontmatter =====
const noFrontmatterFixture = `# 一篇没有 frontmatter 的文档

## 经典语录

| 语录 | 智慧要点 |
|------|----------|
| 测试内容 | 测试要点 |
`;

// ===== Fixture: 有 frontmatter 但无 title =====
const noTitleFixture = `---
sidebar_position: 1
slug: /book-read/
---

# 一个标题

## 经典语录

| 语录 | 智慧要点 |
|------|----------|
| 测试内容 | 测试要点 |
`;

// ===== Fixture: index.md 类文件 — 有 frontmatter + title 但无金句表格 =====
const indexMdFixture = `---
title: 人类智慧书籍
sidebar_position: 1
slug: /book-read/
---

# 人类智慧书籍

## 书目分类

### 东方哲学

| 书名 | 作者 | 核心主题 |
|------|------|----------|
| 《道德经》 | 老子 | 道法自然，无为而治 |
| 《论语》 | 孔子及弟子 | 仁义礼智，修身齐家 |
`;

// ===== Fixture: 空内容行 =====
const emptyContentRowFixture = `---
title: 测试书籍
---

## 经典语录

| 语录 | 智慧要点 |
|------|----------|
| 有内容的行 | 要点A |
|  | 这行内容为空 |
| 另一行有内容 | 要点B |
`;

// ===================================================================
// Tests
// ===================================================================

describe('extractFrontmatterTitle', () => {
  it('应从标准 YAML frontmatter 中提取 title', () => {
    expect(extractFrontmatterTitle(daodejingFixture)).toBe('道德经');
  });

  it('应支持带引号的 title', () => {
    const content = `---\ntitle: "论语"\n---\n\n# 内容`;
    expect(extractFrontmatterTitle(content)).toBe('论语');
  });

  it('应支持单引号包裹的 title', () => {
    const content = `---\ntitle: '庄子'\n---\n\n# 内容`;
    expect(extractFrontmatterTitle(content)).toBe('庄子');
  });

  it('无 frontmatter 时返回 null', () => {
    expect(extractFrontmatterTitle(noFrontmatterFixture)).toBeNull();
  });

  it('frontmatter 中无 title 字段时返回 null', () => {
    expect(extractFrontmatterTitle(noTitleFixture)).toBeNull();
  });

  it('title 为空字符串时返回 null', () => {
    const content = `---\ntitle: \n---\n\n# 内容`;
    expect(extractFrontmatterTitle(content)).toBeNull();
  });
});

describe('isSectionTitleMatch', () => {
  it('应匹配包含"经典"的标题', () => {
    expect(isSectionTitleMatch('经典章节精选')).toBe(true);
  });

  it('应匹配包含"精选"的标题', () => {
    expect(isSectionTitleMatch('主题分类精选')).toBe(true);
  });

  it('应匹配包含"语录"的标题', () => {
    expect(isSectionTitleMatch('经典语录')).toBe(true);
  });

  it('应匹配包含"箴言"的标题', () => {
    expect(isSectionTitleMatch('智慧箴言')).toBe(true);
  });

  it('应匹配包含"公案"的标题', () => {
    expect(isSectionTitleMatch('禅宗公案')).toBe(true);
  });

  it('不应匹配无关标题', () => {
    expect(isSectionTitleMatch('核心思想')).toBe(false);
    expect(isSectionTitleMatch('现代启示')).toBe(false);
    expect(isSectionTitleMatch('书目分类')).toBe(false);
  });

  it('部分匹配即可（关键词是子串即匹配）', () => {
    expect(isSectionTitleMatch('经典名句精选汇编')).toBe(true);
  });
});

describe('identifyColumnRoles', () => {
  it('应识别道德经格式列角色（章 + 名句 + 智慧要点）', () => {
    const roles = identifyColumnRoles(['章', '名句', '智慧要点']);
    expect(roles).not.toBeNull();
    expect(roles!.contentIndex).toBe(1); // 名句
    expect(roles!.themeIndex).toBe(2);   // 智慧要点
    expect(roles!.chapterIndex).toBe(0); // 章
  });

  it('应识别论语格式列角色（篇目 + 名句 + 智慧要点）', () => {
    const roles = identifyColumnRoles(['篇目', '名句', '智慧要点']);
    expect(roles).not.toBeNull();
    expect(roles!.contentIndex).toBe(1);
    expect(roles!.themeIndex).toBe(2);
    expect(roles!.chapterIndex).toBe(0); // 篇目
  });

  it('应识别庄子格式列角色（寓言 + 出处 + 寓意）', () => {
    const roles = identifyColumnRoles(['寓言', '出处', '寓意']);
    expect(roles).not.toBeNull();
    expect(roles!.contentIndex).toBe(0); // 寓言
    expect(roles!.themeIndex).toBe(2);   // 寓意
    expect(roles!.chapterIndex).toBe(1); // 出处
  });

  it('应识别传习录格式列角色（语录 + 智慧要点，无章节列）', () => {
    const roles = identifyColumnRoles(['语录', '智慧要点']);
    expect(roles).not.toBeNull();
    expect(roles!.contentIndex).toBe(0); // 语录
    expect(roles!.themeIndex).toBe(1);   // 智慧要点
    expect(roles!.chapterIndex).toBeNull();
  });

  it('应识别圣经箴言格式列角色（经文 + 箴言）', () => {
    const roles = identifyColumnRoles(['经文', '箴言']);
    expect(roles).not.toBeNull();
    expect(roles!.contentIndex).toBe(1); // 箴言
    expect(roles!.themeIndex).toBeNull();
    expect(roles!.chapterIndex).toBe(0); // 经文
  });

  it('无内容列时返回 null', () => {
    const roles = identifyColumnRoles(['书名', '作者', '核心主题']);
    expect(roles).toBeNull();
  });
});

describe('mapTableRowToQuote', () => {
  it('应正确映射含所有列的行', () => {
    const roles = { contentIndex: 1, themeIndex: 2, chapterIndex: 0 };
    const row = ['第1章', '道可道，非常道', '真正的道理超越语言'];
    const quote = mapTableRowToQuote(row, roles, '道德经');

    expect(quote).not.toBeNull();
    expect(quote!.content).toBe('道可道，非常道');
    expect(quote!.chapter).toBe('第1章');
    expect(quote!.theme).toBe('真正的道理超越语言');
    expect(quote!.bookSource).toBe('道德经');
  });

  it('无章节列时 chapter 为空字符串', () => {
    const roles = { contentIndex: 0, themeIndex: 1, chapterIndex: null };
    const row = ['破山中贼易，破心中贼难', '战胜内心的弱点比外在成就更难'];
    const quote = mapTableRowToQuote(row, roles, '传习录');

    expect(quote).not.toBeNull();
    expect(quote!.chapter).toBe('');
  });

  it('无主题列时 theme 为空字符串', () => {
    const roles = { contentIndex: 1, themeIndex: null, chapterIndex: 0 };
    const row = ['10:9', '行正直路的，步步安稳'];
    const quote = mapTableRowToQuote(row, roles, '圣经·箴言篇');

    expect(quote).not.toBeNull();
    expect(quote!.theme).toBe('');
  });

  it('内容列为空时返回 null', () => {
    const roles = { contentIndex: 1, themeIndex: 2, chapterIndex: 0 };
    const row = ['第2章', '', '某个要点'];
    const quote = mapTableRowToQuote(row, roles, '道德经');

    expect(quote).toBeNull();
  });

  it('内容列只有空格时返回 null', () => {
    const roles = { contentIndex: 0, themeIndex: 1, chapterIndex: null };
    const row = ['   ', '要点'];
    const quote = mapTableRowToQuote(row, roles, '传习录');

    expect(quote).toBeNull();
  });
});

describe('generateQuoteId', () => {
  it('应生成 8 字符的 hex 字符串', () => {
    const id = generateQuoteId('道德经', '道可道，非常道');
    expect(id).toHaveLength(8);
    expect(id).toMatch(/^[0-9a-f]{8}$/);
  });

  it('相同输入应产生相同 ID（确定性）', () => {
    const id1 = generateQuoteId('论语', '己所不欲，勿施于人');
    const id2 = generateQuoteId('论语', '己所不欲，勿施于人');
    expect(id1).toBe(id2);
  });

  it('不同输入应产生不同 ID', () => {
    const id1 = generateQuoteId('道德经', '道可道，非常道');
    const id2 = generateQuoteId('道德经', '上善若水');
    expect(id1).not.toBe(id2);
  });

  it('不同书籍来源的相同内容应产生不同 ID', () => {
    const id1 = generateQuoteId('书A', '相同内容');
    const id2 = generateQuoteId('书B', '相同内容');
    expect(id1).not.toBe(id2);
  });
});

describe('findQuoteTables', () => {
  it('应在"经典章节精选"标题下识别道德经金句表格', () => {
    const tables = findQuoteTables(daodejingFixture);
    expect(tables.length).toBe(1);
    expect(tables[0].sectionTitle).toBe('经典章节精选');
    expect(tables[0].headers).toEqual(['章', '名句', '智慧要点']);
    expect(tables[0].rows.length).toBe(3);
  });

  it('应在"经典名句精选"标题下识别论语金句表格', () => {
    const tables = findQuoteTables(lunyuFixture);
    expect(tables.length).toBe(1);
    expect(tables[0].sectionTitle).toBe('经典名句精选');
    expect(tables[0].rows.length).toBe(3);
  });

  it('应在"经典寓言"标题下识别庄子金句表格', () => {
    const tables = findQuoteTables(zhuangziFixture);
    expect(tables.length).toBe(1);
    expect(tables[0].sectionTitle).toBe('经典寓言');
  });

  it('应在"经典语录"标题下识别传习录金句表格', () => {
    const tables = findQuoteTables(chuanxiluFixture);
    expect(tables.length).toBe(1);
    expect(tables[0].sectionTitle).toBe('经典语录');
  });

  it('应通过父级标题传递关键词（"关于品格"在"主题分类精选"下）', () => {
    const tables = findQuoteTables(shengjingFixture);
    // 应识别"关于品格"和"关于财富"下的表格（都在"主题分类精选"父标题下）
    expect(tables.length).toBe(2);
    expect(tables[0].sectionTitle).toBe('关于品格');
    expect(tables[1].sectionTitle).toBe('关于财富');
  });

  it('不应识别无关键词标题下的表格', () => {
    const content = `---
title: 测试
---

## 书目分类

| 书名 | 作者 | 核心主题 |
|------|------|----------|
| 道德经 | 老子 | 道法自然 |
`;
    const tables = findQuoteTables(content);
    expect(tables.length).toBe(0);
  });

  it('index.md 类文件中"书目分类"标题下的表格不应被识别', () => {
    const tables = findQuoteTables(indexMdFixture);
    expect(tables.length).toBe(0);
  });
});

describe('parseMarkdownContent - 道德经格式', () => {
  it('应解析出 3 条金句', () => {
    const quotes = parseMarkdownContent(daodejingFixture, 'dao-de-jing.md');
    expect(quotes.length).toBe(3);
  });

  it('每条金句的 bookSource 应为"道德经"', () => {
    const quotes = parseMarkdownContent(daodejingFixture, 'dao-de-jing.md');
    quotes.forEach(q => expect(q.bookSource).toBe('道德经'));
  });

  it('应正确映射 chapter, content, theme', () => {
    const quotes = parseMarkdownContent(daodejingFixture, 'dao-de-jing.md');
    expect(quotes[0].content).toBe('道可道，非常道');
    expect(quotes[0].chapter).toBe('第1章');
    expect(quotes[0].theme).toBe('真正的道理超越语言');
  });

  it('每条金句应具有唯一 id', () => {
    const quotes = parseMarkdownContent(daodejingFixture, 'dao-de-jing.md');
    const ids = quotes.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('parseMarkdownContent - 论语格式', () => {
  it('应解析出 3 条金句', () => {
    const quotes = parseMarkdownContent(lunyuFixture, 'lun-yu.md');
    expect(quotes.length).toBe(3);
  });

  it('应正确映射篇目为 chapter', () => {
    const quotes = parseMarkdownContent(lunyuFixture, 'lun-yu.md');
    expect(quotes[0].chapter).toBe('卫灵公');
    expect(quotes[0].content).toBe('己所不欲，勿施于人');
  });
});

describe('parseMarkdownContent - 庄子格式', () => {
  it('应解析出 3 条金句', () => {
    const quotes = parseMarkdownContent(zhuangziFixture, 'zhuang-zi.md');
    expect(quotes.length).toBe(3);
  });

  it('寓言列映射为 content，出处列映射为 chapter', () => {
    const quotes = parseMarkdownContent(zhuangziFixture, 'zhuang-zi.md');
    expect(quotes[0].content).toBe('鲲鹏展翅');
    expect(quotes[0].chapter).toBe('逍遥游');
    expect(quotes[0].theme).toBe('境界不同，视野不同');
  });
});

describe('parseMarkdownContent - 传习录格式（无章节列）', () => {
  it('应解析出 3 条金句', () => {
    const quotes = parseMarkdownContent(chuanxiluFixture, 'chuan-xi-lu.md');
    expect(quotes.length).toBe(3);
  });

  it('chapter 应为空字符串', () => {
    const quotes = parseMarkdownContent(chuanxiluFixture, 'chuan-xi-lu.md');
    quotes.forEach(q => expect(q.chapter).toBe(''));
  });

  it('应正确映射语录为 content', () => {
    const quotes = parseMarkdownContent(chuanxiluFixture, 'chuan-xi-lu.md');
    expect(quotes[0].content).toBe('破山中贼易，破心中贼难');
    expect(quotes[0].theme).toBe('战胜内心的弱点比外在成就更难');
  });
});

describe('parseMarkdownContent - 圣经箴言格式（父级关键词传递）', () => {
  it('应解析"主题分类精选"下所有子表格的金句', () => {
    const quotes = parseMarkdownContent(shengjingFixture, 'sheng-jing-zhen-yan.md');
    // 关于品格: 3条, 关于财富: 2条
    expect(quotes.length).toBe(5);
  });

  it('bookSource 应为 frontmatter title', () => {
    const quotes = parseMarkdownContent(shengjingFixture, 'sheng-jing-zhen-yan.md');
    quotes.forEach(q => expect(q.bookSource).toBe('圣经·箴言篇'));
  });

  it('经文列映射为 chapter，箴言列映射为 content', () => {
    const quotes = parseMarkdownContent(shengjingFixture, 'sheng-jing-zhen-yan.md');
    expect(quotes[0].content).toBe('行正直路的，步步安稳');
    expect(quotes[0].chapter).toBe('10:9');
  });
});

describe('parseMarkdownContent - 跳过逻辑', () => {
  it('无 frontmatter 的文件应跳过（返回空数组）', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const quotes = parseMarkdownContent(noFrontmatterFixture, 'no-frontmatter.md');
    expect(quotes).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('跳过文件')
    );
    warnSpy.mockRestore();
  });

  it('无 title 的文件应跳过（返回空数组）', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const quotes = parseMarkdownContent(noTitleFixture, 'no-title.md');
    expect(quotes).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('index.md 类文件（有 frontmatter 但无金句表格）应返回空数组', () => {
    const quotes = parseMarkdownContent(indexMdFixture, 'index.md');
    expect(quotes).toEqual([]);
  });

  it('空内容行应被跳过', () => {
    const quotes = parseMarkdownContent(emptyContentRowFixture, 'empty-content.md');
    expect(quotes.length).toBe(2);
    expect(quotes[0].content).toBe('有内容的行');
    expect(quotes[1].content).toBe('另一行有内容');
  });
});

describe('parseMarkdownContent - 关键词匹配边界条件', () => {
  it('标题层级传递：更深层子标题下的表格通过父级匹配', () => {
    const content = `---
title: 测试
---

## 经典精选

### 第一部分

#### 子分类A

| 名句 | 智慧要点 |
|------|----------|
| 深层嵌套内容 | 深层要点 |
`;
    const quotes = parseMarkdownContent(content, 'deep-nest.md');
    expect(quotes.length).toBe(1);
    expect(quotes[0].content).toBe('深层嵌套内容');
  });

  it('同级新标题不含关键词时清除父级传递', () => {
    const content = `---
title: 测试
---

## 经典精选

| 名句 | 智慧要点 |
|------|----------|
| 应解析A | 要点A |

## 现代启示

| 名句 | 智慧要点 |
|------|----------|
| 不应解析B | 要点B |
`;
    const quotes = parseMarkdownContent(content, 'sibling-reset.md');
    expect(quotes.length).toBe(1);
    expect(quotes[0].content).toBe('应解析A');
  });

  it('部分匹配关键词也可触发（如"精选合集"包含"精选"）', () => {
    const content = `---
title: 测试
---

## 智慧精选合集

| 名句 | 智慧要点 |
|------|----------|
| 部分匹配 | 匹配要点 |
`;
    const quotes = parseMarkdownContent(content, 'partial.md');
    expect(quotes.length).toBe(1);
  });
});
