import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuoteDisplay from '../../src/components/QuoteDisplay';
import type { Quote } from '../../src/types/quote';

const fullQuote: Quote = {
  id: 'abc12345',
  content: '道可道，非常道',
  bookSource: '道德经',
  chapter: '第1章',
  theme: '真正的道理超越语言',
};

const minimalQuote: Quote = {
  id: 'def67890',
  content: '己所不欲，勿施于人',
  bookSource: '论语',
  chapter: '',
  theme: '',
};

describe('QuoteDisplay', () => {
  it('renders nothing when quote is null', () => {
    const { container } = render(<QuoteDisplay quote={null} animationPhase="idle" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders required fields: content and bookSource', () => {
    render(<QuoteDisplay quote={fullQuote} animationPhase="idle" />);
    expect(screen.getByText('道可道，非常道')).toBeInTheDocument();
    expect(screen.getByText(/道德经/)).toBeInTheDocument();
  });

  it('renders optional chapter when non-empty', () => {
    render(<QuoteDisplay quote={fullQuote} animationPhase="idle" />);
    expect(screen.getByText('第1章')).toBeInTheDocument();
  });

  it('renders optional theme when non-empty', () => {
    render(<QuoteDisplay quote={fullQuote} animationPhase="idle" />);
    expect(screen.getByText('真正的道理超越语言')).toBeInTheDocument();
  });

  it('does not render chapter when empty string', () => {
    render(<QuoteDisplay quote={minimalQuote} animationPhase="idle" />);
    expect(screen.getByText('己所不欲，勿施于人')).toBeInTheDocument();
    expect(screen.getByText(/论语/)).toBeInTheDocument();
    const paragraphs = screen.getAllByText(/.+/);
    const texts = paragraphs.map((el) => el.textContent);
    expect(texts).not.toContain('');
  });

  it('does not render theme when empty string', () => {
    render(<QuoteDisplay quote={minimalQuote} animationPhase="idle" />);
    const allElements = document.querySelectorAll('.italic');
    expect(allElements.length).toBe(0);
  });

  it('applies opacity-0 class when animationPhase is fade-out', () => {
    const { container } = render(<QuoteDisplay quote={fullQuote} animationPhase="fade-out" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('opacity-0');
  });

  it('applies opacity-100 class when animationPhase is idle', () => {
    const { container } = render(<QuoteDisplay quote={fullQuote} animationPhase="idle" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('opacity-100');
  });

  it('applies opacity-100 class when animationPhase is fade-in', () => {
    const { container } = render(<QuoteDisplay quote={fullQuote} animationPhase="fade-in" />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain('opacity-100');
  });

  it('decorative quotes have aria-hidden="true"', () => {
    render(<QuoteDisplay quote={fullQuote} animationPhase="idle" />);
    const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenElements.length).toBeGreaterThanOrEqual(2);
    const texts = Array.from(hiddenElements).map((el) => el.textContent);
    expect(texts).toContain('「');
    expect(texts).toContain('」');
  });
});
