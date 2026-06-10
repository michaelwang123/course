import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import Home from '../index';

afterEach(() => {
  cleanup();
});

describe('Homepage', () => {
  it('renders hero title "技术教程站"', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1, name: '技术教程站' })).toBeInTheDocument();
  });

  it('renders hero subtitle "高质量中文技术教程"', () => {
    render(<Home />);
    const subtitle = screen.getByText('高质量中文技术教程');
    expect(subtitle).toBeInTheDocument();
  });

  it('renders at least 4 AnimatedCards', () => {
    const { container } = render(<Home />);
    const cards = container.querySelectorAll('.animated-card');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it('renders flow visualization with FlowLine and FlowDot', () => {
    const { container } = render(<Home />);
    // FlowLine renders an SVG with aria-hidden
    const svgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBeGreaterThan(0);
    // FlowDot renders span with aria-hidden
    const dots = container.querySelectorAll('span[aria-hidden="true"]');
    expect(dots.length).toBeGreaterThan(0);
  });

  it('renders three flow stages', () => {
    render(<Home />);
    expect(screen.getByText('文档输入')).toBeInTheDocument();
    expect(screen.getByText('智能处理')).toBeInTheDocument();
    expect(screen.getByText('知识输出')).toBeInTheDocument();
  });
});
