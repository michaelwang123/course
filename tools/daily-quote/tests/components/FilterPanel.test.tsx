import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from '../../src/components/FilterPanel';
import type { BookSourceInfo } from '../../src/types/quote';

const mockSources: BookSourceInfo[] = [
  { name: '道德经', count: 10 },
  { name: '论语', count: 8 },
  { name: '庄子', count: 5 },
];

describe('FilterPanel', () => {
  it('renders source names with their counts', () => {
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set()}
        onSelectionChange={() => {}}
      />
    );
    expect(screen.getByText(/道德经/)).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
    expect(screen.getByText(/论语/)).toBeInTheDocument();
    expect(screen.getByText('(8)')).toBeInTheDocument();
    expect(screen.getByText(/庄子/)).toBeInTheDocument();
    expect(screen.getByText('(5)')).toBeInTheDocument();
  });

  it('renders "全部" button that is pressed when selectedSources is empty', () => {
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set()}
        onSelectionChange={() => {}}
      />
    );
    const allButton = screen.getByText('全部');
    expect(allButton).toBeInTheDocument();
    expect(allButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('"全部" button is not pressed when some sources are selected', () => {
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set(['道德经'])}
        onSelectionChange={() => {}}
      />
    );
    const allButton = screen.getByText('全部');
    expect(allButton.getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking "全部" calls onSelectionChange with empty Set', () => {
    const onChange = vi.fn();
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set(['道德经'])}
        onSelectionChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('全部'));
    expect(onChange).toHaveBeenCalledWith(new Set());
  });

  it('clicking a source adds it to selection', () => {
    const onChange = vi.fn();
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set()}
        onSelectionChange={onChange}
      />
    );
    // Click "道德经" button (the button contains both name and count)
    const buttons = screen.getAllByRole('button');
    const daodejingBtn = buttons.find((btn) => btn.textContent?.includes('道德经'));
    fireEvent.click(daodejingBtn!);
    expect(onChange).toHaveBeenCalledWith(new Set(['道德经']));
  });

  it('clicking a selected source removes it from selection (back to all if last)', () => {
    const onChange = vi.fn();
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set(['道德经'])}
        onSelectionChange={onChange}
      />
    );
    const buttons = screen.getAllByRole('button');
    const daodejingBtn = buttons.find((btn) => btn.textContent?.includes('道德经'));
    fireEvent.click(daodejingBtn!);
    // Removing the last source goes back to empty Set (全部)
    expect(onChange).toHaveBeenCalledWith(new Set());
  });

  it('supports multi-select: clicking second source adds to existing selection', () => {
    const onChange = vi.fn();
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set(['道德经'])}
        onSelectionChange={onChange}
      />
    );
    const buttons = screen.getAllByRole('button');
    const lunyuBtn = buttons.find((btn) => btn.textContent?.includes('论语'));
    fireEvent.click(lunyuBtn!);
    expect(onChange).toHaveBeenCalledWith(new Set(['道德经', '论语']));
  });

  it('selected source button has aria-pressed="true"', () => {
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set(['论语'])}
        onSelectionChange={() => {}}
      />
    );
    const buttons = screen.getAllByRole('button');
    const lunyuBtn = buttons.find((btn) => btn.textContent?.includes('论语'));
    expect(lunyuBtn?.getAttribute('aria-pressed')).toBe('true');
  });

  it('unselected source button has aria-pressed="false"', () => {
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set(['论语'])}
        onSelectionChange={() => {}}
      />
    );
    const buttons = screen.getAllByRole('button');
    const daodejingBtn = buttons.find((btn) => btn.textContent?.includes('道德经'));
    expect(daodejingBtn?.getAttribute('aria-pressed')).toBe('false');
  });

  it('has navigation aria-label for accessibility', () => {
    render(
      <FilterPanel
        sources={mockSources}
        selectedSources={new Set()}
        onSelectionChange={() => {}}
      />
    );
    expect(screen.getByLabelText('书籍来源筛选')).toBeInTheDocument();
  });
});
