import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EmptyState } from '@/components/EmptyState';
import { EmptyFilterState } from '@/components/EmptyFilterState';

describe('EmptyState', () => {
  it('shows "记录你的第一个人生时刻" text', () => {
    render(<EmptyState onAddEvent={vi.fn()} />);
    expect(screen.getByText('记录你的第一个人生时刻')).toBeInTheDocument();
  });

  it('shows "添加事件" button', () => {
    render(<EmptyState onAddEvent={vi.fn()} />);
    expect(screen.getByText('添加事件')).toBeInTheDocument();
  });

  it('clicking "添加事件" calls onAddEvent', () => {
    const onAddEvent = vi.fn();
    render(<EmptyState onAddEvent={onAddEvent} />);
    fireEvent.click(screen.getByText('添加事件'));
    expect(onAddEvent).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyFilterState', () => {
  it('shows "没有匹配的事件" text', () => {
    render(<EmptyFilterState onClearFilter={vi.fn()} />);
    expect(screen.getByText('没有匹配的事件')).toBeInTheDocument();
  });

  it('shows "清除筛选" button', () => {
    render(<EmptyFilterState onClearFilter={vi.fn()} />);
    expect(screen.getByText('清除筛选')).toBeInTheDocument();
  });

  it('clicking "清除筛选" calls onClearFilter', () => {
    const onClearFilter = vi.fn();
    render(<EmptyFilterState onClearFilter={onClearFilter} />);
    fireEvent.click(screen.getByText('清除筛选'));
    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });
});
