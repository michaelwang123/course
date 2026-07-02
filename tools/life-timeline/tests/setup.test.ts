import { describe, it, expect } from 'vitest';

describe('test environment setup', () => {
  it('should have matchMedia mocked', () => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    expect(mql.matches).toBe(false);
    expect(mql.media).toBe('(prefers-reduced-motion: reduce)');
  });

  it('should have ResizeObserver mocked', () => {
    const observer = new ResizeObserver(() => {});
    expect(observer).toBeDefined();
    observer.observe(document.createElement('div'));
    observer.disconnect();
  });

  it('should have jest-dom matchers available', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
    document.body.removeChild(div);
  });
});
