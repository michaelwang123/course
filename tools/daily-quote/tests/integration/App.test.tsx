import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../../src/App';

// --- Test data (avoid content/chapter collisions for robust querying) ---
const testQuotes = [
  { id: 'q1', content: '道可道，非常道', bookSource: '道德经', chapter: '第1章', theme: '道的本质' },
  { id: 'q2', content: '己所不欲，勿施于人', bookSource: '论语', chapter: '卫灵公', theme: '仁' },
  { id: 'q3', content: '上善若水', bookSource: '道德经', chapter: '第8章', theme: '善' },
  { id: 'q4', content: '庖丁解牛', bookSource: '庄子', chapter: '养生主', theme: '顺应规律' },
];

// --- Mock quotes.json ---
vi.mock('../../src/data/quotes.json', () => ({
  default: [
    { id: 'q1', content: '道可道，非常道', bookSource: '道德经', chapter: '第1章', theme: '道的本质' },
    { id: 'q2', content: '己所不欲，勿施于人', bookSource: '论语', chapter: '卫灵公', theme: '仁' },
    { id: 'q3', content: '上善若水', bookSource: '道德经', chapter: '第8章', theme: '善' },
    { id: 'q4', content: '庖丁解牛', bookSource: '庄子', chapter: '养生主', theme: '顺应规律' },
  ],
}));

describe('App Integration Tests', () => {
  let clipboardWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock navigator.clipboard
    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: clipboardWriteText },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Validates: Requirement 2.1 - 页面加载后从 Quote_Pool 中随机选取一条 Quote 进行展示
  it('displays a quote on initial load (non-empty state)', async () => {
    render(<App />);

    // A quote from the pool should be visible
    await waitFor(() => {
      const quoteContents = testQuotes.map((q) => q.content);
      const found = quoteContents.some((content) => screen.queryByText(content) !== null);
      expect(found).toBe(true);
    });

    // The aria-live region should be present in the DOM
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();

    // Book source annotation (—— 《...》) should be present
    const allParagraphs = document.querySelectorAll('p');
    const sourceAnnotationFound = Array.from(allParagraphs).some(
      (p) => p.textContent?.includes('——') && p.textContent?.includes('《')
    );
    expect(sourceAnnotationFound).toBe(true);
  });

  // Validates: Requirement 3.3 - 筛选后金句池正确更新
  it('filters quotes when a source is selected', async () => {
    render(<App />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('全部')).toBeInTheDocument();
    });

    // Click on "论语" source filter button (identified by aria-pressed attribute)
    const filterButtons = screen.getAllByRole('button', { name: /论语/ });
    const lunyuFilterButton = filterButtons.find(
      (btn) => btn.getAttribute('aria-pressed') !== null
    )!;
    fireEvent.click(lunyuFilterButton);

    // After filtering by 论语, the only quote is "己所不欲，勿施于人"
    await waitFor(() => {
      expect(screen.getByText('己所不欲，勿施于人')).toBeInTheDocument();
    });

    // The source annotation should contain 论语
    const allParagraphs = document.querySelectorAll('p');
    const lunyuSourceFound = Array.from(allParagraphs).some(
      (p) => p.textContent?.includes('论语') && p.textContent?.includes('——')
    );
    expect(lunyuSourceFound).toBe(true);
  });

  // Validates: Requirement 4.2 - 复制按钮端到端流程
  it('copies formatted quote text to clipboard when copy button is clicked', async () => {
    render(<App />);

    // Wait for a quote to display using queryAllByText to handle potential duplicates
    await waitFor(() => {
      const quoteContents = testQuotes.map((q) => q.content);
      const found = quoteContents.some((content) => screen.queryAllByText(content).length > 0);
      expect(found).toBe(true);
    });

    // Click the copy button
    const copyButton = screen.getByRole('button', { name: '复制金句到剪贴板' });
    fireEvent.click(copyButton);

    // Clipboard should have been called with formatted text
    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledTimes(1);
    });

    // Verify the format: 【{content}】—— 《{bookSource}》
    const calledText = clipboardWriteText.mock.calls[0][0] as string;
    expect(calledText).toMatch(/^【.+】—— 《.+》$/);

    // Verify the copied content matches one of our test quotes
    const matchedQuote = testQuotes.find(
      (q) => calledText === `【${q.content}】—— 《${q.bookSource}》`
    );
    expect(matchedQuote).toBeDefined();

    // Success feedback should appear
    await waitFor(() => {
      expect(screen.getByText(/已复制/)).toBeInTheDocument();
    });
  });
});
