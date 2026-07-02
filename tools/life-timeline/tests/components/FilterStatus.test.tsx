import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FilterStatus } from '@/components/FilterStatus';

describe('FilterStatus', () => {
  it('when isFiltering=true: shows "显示 X/Y 个事件" text', () => {
    render(
      <FilterStatus
        matchedCount={5}
        totalCount={20}
        isFiltering={true}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/\/20 个事件/)).toBeInTheDocument();
  });

  it('when isFiltering=true: shows "清除筛选" button', () => {
    render(
      <FilterStatus
        matchedCount={3}
        totalCount={10}
        isFiltering={true}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByText('清除筛选')).toBeInTheDocument();
  });

  it('when isFiltering=false: shows "共 Y 个事件" text', () => {
    render(
      <FilterStatus
        matchedCount={15}
        totalCount={15}
        isFiltering={false}
        onClearAll={vi.fn()}
      />
    );
    expect(screen.getByText('共 15 个事件')).toBeInTheDocument();
  });

  it('when totalCount=0 and not filtering: renders nothing', () => {
    const { container } = render(
      <FilterStatus
        matchedCount={0}
        totalCount={0}
        isFiltering={false}
        onClearAll={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('clicking "清除筛选" calls onClearAll', () => {
    const onClearAll = vi.fn();
    render(
      <FilterStatus
        matchedCount={2}
        totalCount={10}
        isFiltering={true}
        onClearAll={onClearAll}
      />
    );
    fireEvent.click(screen.getByText('清除筛选'));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});
