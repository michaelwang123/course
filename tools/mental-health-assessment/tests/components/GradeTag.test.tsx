import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GradeTag } from '@/components/GradeTag';
import type { GradeLevel } from '@/types/assessment';

describe('GradeTag', () => {
  it('renders "正常" text with green classes', () => {
    const { container } = render(<GradeTag level="正常" />);
    const tag = container.querySelector('span')!;
    expect(tag.textContent).toBe('正常');
    expect(tag.className).toContain('bg-green-100');
    expect(tag.className).toContain('text-green-800');
  });

  it('renders "轻度" text with yellow classes', () => {
    const { container } = render(<GradeTag level="轻度" />);
    const tag = container.querySelector('span')!;
    expect(tag.textContent).toBe('轻度');
    expect(tag.className).toContain('bg-yellow-100');
    expect(tag.className).toContain('text-yellow-800');
  });

  it('renders "中度" text with orange classes', () => {
    const { container } = render(<GradeTag level="中度" />);
    const tag = container.querySelector('span')!;
    expect(tag.textContent).toBe('中度');
    expect(tag.className).toContain('bg-orange-100');
    expect(tag.className).toContain('text-orange-800');
  });

  it('renders "重度" text with red classes', () => {
    const { container } = render(<GradeTag level="重度" />);
    const tag = container.querySelector('span')!;
    expect(tag.textContent).toBe('重度');
    expect(tag.className).toContain('bg-red-100');
    expect(tag.className).toContain('text-red-800');
  });

  it('renders all grade levels correctly', () => {
    const levels: GradeLevel[] = ['正常', '轻度', '中度', '重度'];
    for (const level of levels) {
      const { container, unmount } = render(<GradeTag level={level} />);
      const tag = container.querySelector('span')!;
      expect(tag.textContent).toBe(level);
      unmount();
    }
  });
});
