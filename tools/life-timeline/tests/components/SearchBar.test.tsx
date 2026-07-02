import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from '@/components/SearchBar';

describe('SearchBar', () => {
  it('renders input with placeholder "搜索事件..."', () => {
    render(<SearchBar keyword="" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByPlaceholderText('搜索事件...')).toBeInTheDocument();
  });

  it('input value matches keyword prop', () => {
    render(<SearchBar keyword="测试关键词" onChange={vi.fn()} onClear={vi.fn()} />);
    const input = screen.getByPlaceholderText('搜索事件...') as HTMLInputElement;
    expect(input.value).toBe('测试关键词');
  });

  it('typing calls onChange with new value', () => {
    const onChange = vi.fn();
    render(<SearchBar keyword="" onChange={onChange} onClear={vi.fn()} />);
    const input = screen.getByPlaceholderText('搜索事件...');
    fireEvent.change(input, { target: { value: '新内容' } });
    expect(onChange).toHaveBeenCalledWith('新内容');
  });

  it('clear button (X) visible when keyword is non-empty', () => {
    render(<SearchBar keyword="有内容" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.getByLabelText('清除搜索')).toBeInTheDocument();
  });

  it('clear button not rendered when keyword is empty', () => {
    render(<SearchBar keyword="" onChange={vi.fn()} onClear={vi.fn()} />);
    expect(screen.queryByLabelText('清除搜索')).not.toBeInTheDocument();
  });

  it('clicking clear calls onClear', () => {
    const onClear = vi.fn();
    render(<SearchBar keyword="有内容" onChange={vi.fn()} onClear={onClear} />);
    fireEvent.click(screen.getByLabelText('清除搜索'));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
