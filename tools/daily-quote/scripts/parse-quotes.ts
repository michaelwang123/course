import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseMarkdownContent } from '../src/lib/quote-parser';
import type { Quote } from '../src/types/quote';

// ===== 路径解析 =====

const scriptDir = dirname(fileURLToPath(import.meta.url));
const inputDir = resolve(scriptDir, '../../../docs/book_read/');
const outputPath = resolve(scriptDir, '../src/data/quotes.json');

// ===== 统计信息类型 =====

interface ParseStats {
  scannedFiles: number;
  successFiles: number;
  skippedFiles: { file: string; reason: string }[];
  totalQuotes: number;
  bookQuotes: Map<string, number>;
}

// ===== 主函数 =====

async function main(): Promise<void> {
  // 1. 验证输入目录存在
  if (!existsSync(inputDir)) {
    throw new Error(
      `[parse-quotes] 输入目录不存在: ${inputDir}\n` +
      `请确认 docs/book_read/ 目录位于项目根目录下。`
    );
  }

  // 2. 读取所有 .md 文件（排除 index.md）
  const allFiles = await readdir(inputDir);
  const mdFiles = allFiles
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort();

  const stats: ParseStats = {
    scannedFiles: mdFiles.length,
    successFiles: 0,
    skippedFiles: [],
    totalQuotes: 0,
    bookQuotes: new Map(),
  };

  // 3. 逐文件解析
  const allQuotes: Quote[] = [];

  for (const file of mdFiles) {
    const filePath = join(inputDir, file);

    let content: string;
    try {
      content = await readFile(filePath, 'utf-8');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[parse-quotes] 文件读取失败，跳过: ${filePath} (${message})`);
      stats.skippedFiles.push({ file, reason: `读取失败: ${message}` });
      continue;
    }

    const quotes = parseMarkdownContent(content, filePath);

    if (quotes.length === 0) {
      stats.skippedFiles.push({ file, reason: '无可识别的金句表格或缺少 title' });
    } else {
      stats.successFiles++;
      stats.totalQuotes += quotes.length;
      stats.bookQuotes.set(quotes[0].bookSource, quotes.length);
      allQuotes.push(...quotes);
    }
  }

  // 4. 去重（相同 bookSource + content 产生相同 ID，避免重复条目）
  const uniqueQuotes = [...new Map(allQuotes.map(q => [q.id, q])).values()];
  const deduplicatedCount = allQuotes.length - uniqueQuotes.length;

  // 5. 确保输出目录存在
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }

  // 6. 写入 JSON
  await writeFile(outputPath, JSON.stringify(uniqueQuotes, null, 2), 'utf-8');

  // 7. 输出统计摘要
  console.log('\n===== 金句解析统计 =====');
  console.log(`扫描文件数:       ${stats.scannedFiles}`);
  console.log(`成功解析文件数:   ${stats.successFiles}`);
  console.log(`跳过文件数:       ${stats.skippedFiles.length}`);
  if (stats.skippedFiles.length > 0) {
    for (const { file, reason } of stats.skippedFiles) {
      console.log(`  - ${file}: ${reason}`);
    }
  }
  console.log(`总金句数:         ${uniqueQuotes.length}${deduplicatedCount > 0 ? ` (去重 ${deduplicatedCount} 条)` : ''}`);
  console.log('\n各书籍金句数:');
  for (const [book, count] of stats.bookQuotes.entries()) {
    console.log(`  《${book}》: ${count} 条`);
  }
  console.log(`\n输出文件: ${outputPath}`);
  console.log('========================\n');
}

// ===== 执行 =====

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
