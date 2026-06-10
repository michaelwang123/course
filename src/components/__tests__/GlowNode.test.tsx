import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlowNode from '../GlowNode';

describe('GlowNode', () => {
  it('renders label text and applies default size (md) classes', () => {
    const { container } = render(<GlowNode label="API Server" />);
    const node = container.firstElementChild as HTMLElement;

    expect(screen.getByText('API Server')).toBeInTheDocument();
    expect(node.className).toContain('px-4');
    expect(node.className).toContain('py-2');
    expect(node.className).toContain('text-sm');
  });

  it('applies correct CSS classes for sm size', () => {
    const { container } = render(<GlowNode label="Small" size="sm" />);
    const node = container.firstElementChild as HTMLElement;

    expect(node.className).toContain('px-2');
    expect(node.className).toContain('py-1');
    expect(node.className).toContain('text-xs');
  });

  it('applies correct CSS classes for lg size', () => {
    const { container } = render(<GlowNode label="Large" size="lg" />);
    const node = container.firstElementChild as HTMLElement;

    expect(node.className).toContain('px-6');
    expect(node.className).toContain('py-3');
    expect(node.className).toContain('text-base');
  });

  it('renders icon element when icon prop is provided', () => {
    const { container } = render(<GlowNode label="Node" icon="icon-database" />);
    const iconEl = container.querySelector('.glow-node__icon');

    expect(iconEl).toBeInTheDocument();
    expect(iconEl?.className).toContain('icon-database');
    expect(iconEl?.getAttribute('aria-hidden')).toBe('true');
  });

  it('does not render icon element when icon prop is not provided', () => {
    const { container } = render(<GlowNode label="No Icon" />);
    const iconEl = container.querySelector('.glow-node__icon');

    expect(iconEl).toBeNull();
  });

  it('applies capsule shape (border-radius 9999px) and glow box-shadow', () => {
    const { container } = render(<GlowNode label="Glow" />);
    const node = container.firstElementChild as HTMLElement;

    expect(node.style.borderRadius).toBe('9999px');
    expect(node.style.boxShadow).toBe('0 0 8px rgba(0,255,170,0.4)');
  });

  it('applies pulse-glow animation', () => {
    const { container } = render(<GlowNode label="Pulse" />);
    const node = container.firstElementChild as HTMLElement;

    expect(node.style.animationName).toBe('pulse-glow');
  });
});
