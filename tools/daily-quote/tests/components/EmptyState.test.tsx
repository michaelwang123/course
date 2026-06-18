import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../../src/components/EmptyState';

describe('EmptyState', () => {
  describe('type="loading"', () => {
    it('renders loading text', () => {
      render(<EmptyState type="loading" />);
      expect(screen.getByText('正在加载金句...')).toBeInTheDocument();
    });

    it('has animate-pulse class for loading animation', () => {
      render(<EmptyState type="loading" />);
      const el = screen.getByText('正在加载金句...');
      expect(el.className).toContain('animate-pulse');
    });
  });

  describe('type="no-data"', () => {
    it('renders no-data message', () => {
      render(<EmptyState type="no-data" />);
      expect(screen.getByText('暂无可用金句')).toBeInTheDocument();
    });

    it('shows guidance about data source', () => {
      render(<EmptyState type="no-data" />);
      expect(screen.getByText(/docs\/book_read\//)).toBeInTheDocument();
    });
  });

  describe('type="no-filter-results"', () => {
    it('renders no-filter-results message', () => {
      render(<EmptyState type="no-filter-results" />);
      expect(screen.getByText('当前筛选条件下没有金句')).toBeInTheDocument();
    });

    it('renders reset button when onResetFilter is provided', () => {
      const onReset = vi.fn();
      render(<EmptyState type="no-filter-results" onResetFilter={onReset} />);
      const resetBtn = screen.getByText('重置筛选');
      expect(resetBtn).toBeInTheDocument();
    });

    it('calls onResetFilter when reset button is clicked', () => {
      const onReset = vi.fn();
      render(<EmptyState type="no-filter-results" onResetFilter={onReset} />);
      fireEvent.click(screen.getByText('重置筛选'));
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('does not render reset button when onResetFilter is not provided', () => {
      render(<EmptyState type="no-filter-results" />);
      expect(screen.queryByText('重置筛选')).not.toBeInTheDocument();
    });
  });
});
