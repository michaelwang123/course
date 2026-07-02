import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterPanel } from '@/components/FilterPanel';
import { CATEGORIES } from '@/constants/categories';
import { SENTIMENT_LABELS } from '@/types/event';
import type { EventCategory, EventSentiment } from '@/types/event';

const allCategories = Object.keys(CATEGORIES) as EventCategory[];
const allSentiments = Object.keys(SENTIMENT_LABELS) as EventSentiment[];

const defaultProps = {
  categories: [] as EventCategory[],
  sentiments: [] as EventSentiment[],
  onCategoriesChange: vi.fn(),
  onSentimentsChange: vi.fn(),
  onClearAll: vi.fn(),
};

describe('FilterPanel', () => {
  it('renders all category buttons', () => {
    render(<FilterPanel {...defaultProps} />);
    for (const cat of allCategories) {
      expect(screen.getByText(CATEGORIES[cat].label)).toBeInTheDocument();
    }
  });

  it('renders all sentiment buttons', () => {
    render(<FilterPanel {...defaultProps} />);
    for (const sent of allSentiments) {
      expect(screen.getByText(SENTIMENT_LABELS[sent])).toBeInTheDocument();
    }
  });

  it('clicking category toggle calls onCategoriesChange with updated array', () => {
    const onCategoriesChange = vi.fn();
    render(
      <FilterPanel {...defaultProps} onCategoriesChange={onCategoriesChange} />
    );
    fireEvent.click(screen.getByText(CATEGORIES.education.label));
    expect(onCategoriesChange).toHaveBeenCalledWith(['education']);
  });

  it('clicking active category deselects it', () => {
    const onCategoriesChange = vi.fn();
    render(
      <FilterPanel
        {...defaultProps}
        categories={['education']}
        onCategoriesChange={onCategoriesChange}
      />
    );
    fireEvent.click(screen.getByText(CATEGORIES.education.label));
    expect(onCategoriesChange).toHaveBeenCalledWith([]);
  });

  it('clicking sentiment toggle calls onSentimentsChange', () => {
    const onSentimentsChange = vi.fn();
    render(
      <FilterPanel {...defaultProps} onSentimentsChange={onSentimentsChange} />
    );
    fireEvent.click(screen.getByText(SENTIMENT_LABELS.positive));
    expect(onSentimentsChange).toHaveBeenCalledWith(['positive']);
  });

  it('"清除筛选" button shown when any filter active', () => {
    render(<FilterPanel {...defaultProps} categories={['work']} />);
    expect(screen.getByText('清除筛选')).toBeInTheDocument();
  });

  it('"清除筛选" not shown when no filters', () => {
    render(<FilterPanel {...defaultProps} />);
    expect(screen.queryByText('清除筛选')).not.toBeInTheDocument();
  });

  it('clicking "清除筛选" calls onClearAll', () => {
    const onClearAll = vi.fn();
    render(
      <FilterPanel
        {...defaultProps}
        categories={['life']}
        onClearAll={onClearAll}
      />
    );
    fireEvent.click(screen.getByText('清除筛选'));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});
