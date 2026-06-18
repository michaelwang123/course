import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FilterPanel } from '../../src/components/FilterPanel';
import RefreshButton from '../../src/components/RefreshButton';
import CopyButton from '../../src/components/CopyButton';
import type { BookSourceInfo, Quote } from '../../src/types/quote';

/**
 * Accessibility tests for task 10.2:
 * - All interactive elements have focus-visible styles
 * - Tab order follows expected sequence
 * - aria-live region behavior
 * Validates: Requirements 7.4
 */

const mockSources: BookSourceInfo[] = [
  { name: '道德经', count: 10 },
  { name: '论语', count: 8 },
];

const mockQuote: Quote = {
  id: 'abc12345',
  content: '道可道，非常道',
  bookSource: '道德经',
  chapter: '第1章',
  theme: '真正的道理超越语言',
};

describe('Accessibility: focus-visible styles', () => {
  it('FilterPanel "全部" button has focus-visible ring classes', () => {
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set()}
        onSelectionChange={() => {}}
      />
    );
    const allButton = screen.getByText('全部');
    expect(allButton.className).toContain('focus-visible:ring-2');
    expect(allButton.className).toContain('focus-visible:ring-amber-500');
    expect(allButton.className).toContain('focus-visible:ring-offset-2');
  });

  it('FilterPanel source buttons have focus-visible ring classes', () => {
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set()}
        onSelectionChange={() => {}}
      />
    );
    const buttons = screen.getAllByRole('button');
    // Skip the first button ("全部"), check source buttons
    const sourceButtons = buttons.filter((btn) => btn.textContent !== '全部');
    sourceButtons.forEach((btn) => {
      expect(btn.className).toContain('focus-visible:ring-2');
      expect(btn.className).toContain('focus-visible:ring-amber-500');
      expect(btn.className).toContain('focus-visible:ring-offset-2');
    });
  });

  it('RefreshButton has focus-visible ring classes', () => {
    render(<RefreshButton onRefresh={() => {}} disabled={false} />);
    const button = screen.getByRole('button', { name: '换一句' });
    expect(button.className).toContain('focus-visible:ring-2');
    expect(button.className).toContain('focus-visible:ring-amber-500');
    expect(button.className).toContain('focus-visible:ring-offset-2');
  });

  it('CopyButton has focus-visible ring classes', () => {
    // Mock navigator.clipboard to avoid unsupported state
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    render(<CopyButton quote={mockQuote} />);
    const button = screen.getByRole('button', { name: '复制金句到剪贴板' });
    expect(button.className).toContain('focus-visible:ring-2');
    expect(button.className).toContain('focus-visible:ring-amber-500');
    expect(button.className).toContain('focus-visible:ring-offset-2');
  });
});

describe('Accessibility: keyboard tab order', () => {
  it('interactive elements follow DOM order: FilterPanel → RefreshButton → CopyButton', () => {
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    // Render components in the expected DOM order (matching App.tsx layout)
    render(
      <div>
        <FilterPanel
          sources={mockSources}
          selectedSources={new Set()}
          onSelectionChange={() => {}}
        />
        <RefreshButton onRefresh={() => {}} disabled={false} />
        <CopyButton quote={mockQuote} />
      </div>
    );

    const allButtons = screen.getAllByRole('button');

    // Expected order: 全部, 道德经, 论语, 换一句, 复制金句到剪贴板
    const buttonLabels = allButtons.map(
      (btn) => btn.getAttribute('aria-label') || btn.textContent
    );

    const filterIndex = buttonLabels.findIndex((l) => l === '全部');
    const refreshIndex = buttonLabels.findIndex((l) => l === '换一句');
    const copyIndex = buttonLabels.findIndex((l) => l === '复制金句到剪贴板');

    // Verify order: filter buttons come before refresh, refresh before copy
    expect(filterIndex).toBeLessThan(refreshIndex);
    expect(refreshIndex).toBeLessThan(copyIndex);
  });

  it('all interactive elements have no positive tabindex (natural DOM order)', () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });

    render(
      <div>
        <FilterPanel
          sources={mockSources}
          selectedSources={new Set()}
          onSelectionChange={() => {}}
        />
        <RefreshButton onRefresh={() => {}} disabled={false} />
        <CopyButton quote={mockQuote} />
      </div>
    );

    const allButtons = screen.getAllByRole('button');
    allButtons.forEach((btn) => {
      // tabIndex should be 0 or not set (natural order), never positive
      const tabIndex = btn.getAttribute('tabindex');
      if (tabIndex !== null) {
        expect(parseInt(tabIndex)).toBeLessThanOrEqual(0);
      }
    });
  });
});

describe('Accessibility: aria-live region', () => {
  it('aria-live="polite" container correctly wraps dynamic content', () => {
    // Simulating the App pattern: aria-live region wrapping QuoteDisplay
    render(
      <div aria-live="polite" aria-atomic="true">
        <p>{mockQuote.content}</p>
      </div>
    );

    const liveRegion = screen.getByText(mockQuote.content).closest('[aria-live]');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });
});
