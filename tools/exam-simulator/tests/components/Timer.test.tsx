import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { Timer } from '../../src/components/Timer';

describe('Timer', () => {
  afterEach(() => {
    cleanup();
  });

  it('displays the formatted time string', () => {
    render(
      <Timer
        remainingSeconds={600}
        formattedTime="10:00"
        isWarning={false}
        isCritical={false}
      />
    );
    expect(screen.getByText(/10:00/)).toBeDefined();
  });

  it('displays "剩余时间：" label with time', () => {
    render(
      <Timer
        remainingSeconds={1800}
        formattedTime="30:00"
        isWarning={false}
        isCritical={false}
      />
    );
    expect(screen.getByText('剩余时间：30:00')).toBeDefined();
  });

  it('applies default gray text color when no warning or critical', () => {
    const { container } = render(
      <Timer
        remainingSeconds={600}
        formattedTime="10:00"
        isWarning={false}
        isCritical={false}
      />
    );
    const timerDiv = container.firstChild as HTMLElement;
    expect(timerDiv.className).toContain('text-gray-800');
    expect(timerDiv.className).not.toContain('text-orange-500');
    expect(timerDiv.className).not.toContain('text-red-600');
  });

  it('applies orange styling when isWarning is true', () => {
    const { container } = render(
      <Timer
        remainingSeconds={250}
        formattedTime="04:10"
        isWarning={true}
        isCritical={false}
      />
    );
    const timerDiv = container.firstChild as HTMLElement;
    expect(timerDiv.className).toContain('text-orange-500');
    expect(timerDiv.className).not.toContain('text-red-600');
  });

  it('applies red styling when isCritical is true', () => {
    const { container } = render(
      <Timer
        remainingSeconds={30}
        formattedTime="00:30"
        isWarning={false}
        isCritical={true}
      />
    );
    const timerDiv = container.firstChild as HTMLElement;
    expect(timerDiv.className).toContain('text-red-600');
    expect(timerDiv.className).not.toContain('text-orange-500');
  });

  it('prioritizes red styling when both isWarning and isCritical are true', () => {
    const { container } = render(
      <Timer
        remainingSeconds={30}
        formattedTime="00:30"
        isWarning={true}
        isCritical={true}
      />
    );
    const timerDiv = container.firstChild as HTMLElement;
    expect(timerDiv.className).toContain('text-red-600');
    expect(timerDiv.className).not.toContain('text-orange-500');
  });

  it('uses monospace font for consistent digit width', () => {
    const { container } = render(
      <Timer
        remainingSeconds={600}
        formattedTime="10:00"
        isWarning={false}
        isCritical={false}
      />
    );
    const timerDiv = container.firstChild as HTMLElement;
    expect(timerDiv.className).toContain('font-mono');
  });
});
