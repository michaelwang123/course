import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TimeScale } from '@/components/TimeScale';
import type { ScaleMark } from '@/lib/position-calculator';

function createMark(overrides: Partial<ScaleMark> = {}): ScaleMark {
  return {
    position: 100,
    label: '2020',
    type: 'major',
    ...overrides,
  };
}

describe('TimeScale', () => {
  describe('Renders scale marks', () => {
    it('should render labels from scaleMarks array', () => {
      const marks: ScaleMark[] = [
        createMark({ position: 50, label: '2019', type: 'major' }),
        createMark({ position: 150, label: '6月', type: 'minor' }),
        createMark({ position: 250, label: '2020', type: 'major' }),
      ];

      render(<TimeScale scaleMarks={marks} containerWidth={800} />);

      expect(screen.getByText('2019')).toBeInTheDocument();
      expect(screen.getByText('6月')).toBeInTheDocument();
      expect(screen.getByText('2020')).toBeInTheDocument();
    });
  });

  describe('Major marks have different styling', () => {
    it('should render major marks with font-medium class', () => {
      const marks: ScaleMark[] = [
        createMark({ position: 100, label: '2020', type: 'major' }),
      ];

      render(<TimeScale scaleMarks={marks} containerWidth={800} />);

      const label = screen.getByText('2020');
      expect(label.className).toContain('font-medium');
    });

    it('should render major marks with taller tick (h-3)', () => {
      const marks: ScaleMark[] = [
        createMark({ position: 100, label: '2021', type: 'major' }),
      ];

      const { container } = render(<TimeScale scaleMarks={marks} containerWidth={800} />);

      // The tick mark div should have h-3 for major marks
      const tick = container.querySelector('.h-3');
      expect(tick).not.toBeNull();
    });
  });

  describe('Minor marks have smaller styling', () => {
    it('should render minor marks with smaller text size', () => {
      const marks: ScaleMark[] = [
        createMark({ position: 100, label: '3月', type: 'minor' }),
      ];

      render(<TimeScale scaleMarks={marks} containerWidth={800} />);

      const label = screen.getByText('3月');
      // Minor marks use text-[10px] and text-gray-400
      expect(label.className).toContain('text-gray-400');
    });

    it('should render minor marks with shorter tick (h-2)', () => {
      const marks: ScaleMark[] = [
        createMark({ position: 100, label: '5月', type: 'minor' }),
      ];

      const { container } = render(<TimeScale scaleMarks={marks} containerWidth={800} />);

      const tick = container.querySelector('.h-2');
      expect(tick).not.toBeNull();
    });
  });

  describe('Renders at correct positions', () => {
    it('should position marks using inline style left: Xpx', () => {
      const marks: ScaleMark[] = [
        createMark({ position: 75, label: '2018' }),
        createMark({ position: 200, label: '2019' }),
      ];

      const { container } = render(<TimeScale scaleMarks={marks} containerWidth={800} />);

      const positioned = container.querySelectorAll('[style]');
      const styles = Array.from(positioned).map((el) => (el as HTMLElement).style.left);

      expect(styles).toContain('75px');
      expect(styles).toContain('200px');
    });
  });

  describe('Empty scaleMarks renders nothing', () => {
    it('should return null when scaleMarks is empty', () => {
      const { container } = render(<TimeScale scaleMarks={[]} containerWidth={800} />);

      // Component returns null for empty marks
      expect(container.innerHTML).toBe('');
    });

    it('should return null when containerWidth is 0', () => {
      const marks: ScaleMark[] = [createMark()];
      const { container } = render(<TimeScale scaleMarks={marks} containerWidth={0} />);

      expect(container.innerHTML).toBe('');
    });
  });

  describe('Multiple marks at different positions', () => {
    it('should render all marks at their respective positions', () => {
      const marks: ScaleMark[] = [
        createMark({ position: 0, label: '1月', type: 'minor' }),
        createMark({ position: 100, label: '2020', type: 'major' }),
        createMark({ position: 200, label: '4月', type: 'minor' }),
        createMark({ position: 300, label: '7月', type: 'minor' }),
        createMark({ position: 400, label: '2021', type: 'major' }),
      ];

      render(<TimeScale scaleMarks={marks} containerWidth={800} />);

      // All labels are rendered
      expect(screen.getByText('1月')).toBeInTheDocument();
      expect(screen.getByText('2020')).toBeInTheDocument();
      expect(screen.getByText('4月')).toBeInTheDocument();
      expect(screen.getByText('7月')).toBeInTheDocument();
      expect(screen.getByText('2021')).toBeInTheDocument();
    });

    it('should have aria-label for accessibility', () => {
      const marks: ScaleMark[] = [
        createMark({ position: 50, label: '2020' }),
      ];

      render(<TimeScale scaleMarks={marks} containerWidth={800} />);

      const container = screen.getByLabelText('时间刻度');
      expect(container).toBeInTheDocument();
    });
  });
});
