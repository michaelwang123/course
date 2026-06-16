import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProgressBar } from '@/components/ProgressBar';

describe('ProgressBar', () => {
  it('renders correct width for a given percentage', () => {
    const { container } = render(<ProgressBar percentage={50} />);
    const innerBar = container.querySelector('[role="progressbar"] > div') as HTMLElement;
    expect(innerBar.style.width).toBe('50%');
  });

  it('renders 0% width for 0 percentage', () => {
    const { container } = render(<ProgressBar percentage={0} />);
    const innerBar = container.querySelector('[role="progressbar"] > div') as HTMLElement;
    expect(innerBar.style.width).toBe('0%');
  });

  it('renders 100% width for 100 percentage', () => {
    const { container } = render(<ProgressBar percentage={100} />);
    const innerBar = container.querySelector('[role="progressbar"] > div') as HTMLElement;
    expect(innerBar.style.width).toBe('100%');
  });

  it('clamps values above 100 to 100%', () => {
    const { container } = render(<ProgressBar percentage={150} />);
    const innerBar = container.querySelector('[role="progressbar"] > div') as HTMLElement;
    expect(innerBar.style.width).toBe('100%');
  });

  it('clamps negative values to 0%', () => {
    const { container } = render(<ProgressBar percentage={-10} />);
    const innerBar = container.querySelector('[role="progressbar"] > div') as HTMLElement;
    expect(innerBar.style.width).toBe('0%');
  });

  it('sets correct aria-valuenow attribute', () => {
    const { container } = render(<ProgressBar percentage={75} />);
    const progressbar = container.querySelector('[role="progressbar"]') as HTMLElement;
    expect(progressbar.getAttribute('aria-valuenow')).toBe('75');
  });
});
