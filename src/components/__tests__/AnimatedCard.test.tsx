import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnimatedCard from '../AnimatedCard';

describe('AnimatedCard', () => {
  it('renders title and description as a div when no link is provided', () => {
    const { container } = render(
      <AnimatedCard title="测试标题" description="测试描述" />
    );
    const element = container.firstElementChild;

    expect(element?.tagName).toBe('DIV');
    expect(screen.getByText('测试标题')).toBeInTheDocument();
    expect(screen.getByText('测试描述')).toBeInTheDocument();
  });

  it('renders as an <a> tag with correct href when link is provided', () => {
    const { container } = render(
      <AnimatedCard title="链接卡片" description="描述" link="/ragflow/" />
    );
    const element = container.firstElementChild;

    expect(element?.tagName).toBe('A');
    expect(element?.getAttribute('href')).toBe('/ragflow/');
    expect(screen.getByText('链接卡片')).toBeInTheDocument();
  });

  it('applies animationDelay style matching the delay prop', () => {
    const { container } = render(
      <AnimatedCard title="延迟卡片" description="描述" delay={200} />
    );
    const element = container.firstElementChild as HTMLElement;

    expect(element.style.animationDelay).toBe('200ms');
  });

  it('applies default animationDelay of 0ms when no delay prop is given', () => {
    const { container } = render(
      <AnimatedCard title="默认延迟" description="描述" />
    );
    const element = container.firstElementChild as HTMLElement;

    expect(element.style.animationDelay).toBe('0ms');
  });

  it('renders icon when icon prop is provided', () => {
    render(<AnimatedCard title="带图标" description="描述" icon="🔍" />);
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('does not render icon element when icon prop is not provided', () => {
    const { container } = render(
      <AnimatedCard title="无图标" description="描述" />
    );
    const icon = container.querySelector('.animated-card__icon');
    expect(icon).toBeNull();
  });

  it('adds target="_blank" and rel="noopener noreferrer" for external links', () => {
    const { container } = render(
      <AnimatedCard title="外部链接" description="描述" link="https://example.com" />
    );
    const element = container.firstElementChild as HTMLElement;

    expect(element.tagName).toBe('A');
    expect(element.getAttribute('target')).toBe('_blank');
    expect(element.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('does not add target or rel for internal links', () => {
    const { container } = render(
      <AnimatedCard title="内部链接" description="描述" link="/course/ragflow/" />
    );
    const element = container.firstElementChild as HTMLElement;

    expect(element.tagName).toBe('A');
    expect(element.getAttribute('target')).toBeNull();
    expect(element.getAttribute('rel')).toBeNull();
  });

  it('treats protocol-relative URLs as external', () => {
    const { container } = render(
      <AnimatedCard title="协议相对" description="描述" link="//cdn.example.com/resource" />
    );
    const element = container.firstElementChild as HTMLElement;

    expect(element.getAttribute('target')).toBe('_blank');
    expect(element.getAttribute('rel')).toBe('noopener noreferrer');
  });
});
