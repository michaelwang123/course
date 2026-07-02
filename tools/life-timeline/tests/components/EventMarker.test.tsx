import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { EventMarker } from '@/components/EventMarker';
import { CATEGORIES } from '@/constants/categories';
import type { EventNode } from '@/types/event';

// Mock event data
const mockEvent: EventNode = {
  id: 'test-id-001',
  userId: 'user-001',
  title: '大学毕业',
  description: '难忘的一天',
  eventDate: '2020-06-15',
  category: 'education',
  sentiment: 'positive',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const defaultProps = {
  event: mockEvent,
  position: 100,
  isStacked: false,
  stackCount: 1,
  isFuture: false,
  isFocused: false,
  onClick: vi.fn(),
  onHover: vi.fn(),
};

describe('EventMarker', () => {
  describe('Category color rendering', () => {
    it('should render with the correct background color from CATEGORIES', () => {
      render(<EventMarker {...defaultProps} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        backgroundColor: CATEGORIES.education.color,
      });
    });

    it('should render with different category color', () => {
      const travelEvent: EventNode = { ...mockEvent, category: 'travel' };
      render(<EventMarker {...defaultProps} event={travelEvent} />);

      const button = screen.getByRole('button');
      expect(button).toHaveStyle({
        backgroundColor: CATEGORIES.travel.color,
      });
    });
  });

  describe('Category icon rendering', () => {
    it('should render the emoji icon from CATEGORIES', () => {
      render(<EventMarker {...defaultProps} />);

      expect(screen.getByText(CATEGORIES.education.icon)).toBeInTheDocument();
    });

    it('should render the correct icon for different categories', () => {
      const workEvent: EventNode = { ...mockEvent, category: 'work' };
      render(<EventMarker {...defaultProps} event={workEvent} />);

      expect(screen.getByText(CATEGORIES.work.icon)).toBeInTheDocument();
    });
  });

  describe('Future event dashed border', () => {
    it('should apply border-dashed class when isFuture is true', () => {
      render(<EventMarker {...defaultProps} isFuture={true} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('border-dashed');
      expect(button.className).not.toContain('border-solid');
    });
  });

  describe('Non-future event solid border', () => {
    it('should apply border-solid class when isFuture is false', () => {
      render(<EventMarker {...defaultProps} isFuture={false} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('border-solid');
      expect(button.className).not.toContain('border-dashed');
    });
  });

  describe('Focused state ring', () => {
    it('should apply ring-2 and ring-blue-500 classes when isFocused is true', () => {
      render(<EventMarker {...defaultProps} isFocused={true} />);

      const button = screen.getByRole('button');
      expect(button.className).toContain('ring-2');
      expect(button.className).toContain('ring-blue-500');
    });

    it('should not apply ring classes when isFocused is false', () => {
      render(<EventMarker {...defaultProps} isFocused={false} />);

      const button = screen.getByRole('button');
      expect(button.className).not.toContain('ring-2');
      expect(button.className).not.toContain('ring-blue-500');
    });
  });

  describe('Stack count badge', () => {
    it('should show badge when isStacked is true and stackCount > 1', () => {
      render(<EventMarker {...defaultProps} isStacked={true} stackCount={3} />);

      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should not show badge for single events (stackCount=1)', () => {
      render(<EventMarker {...defaultProps} isStacked={false} stackCount={1} />);

      // No badge element should exist
      const button = screen.getByRole('button');
      const badges = button.querySelectorAll('.bg-gray-800');
      expect(badges.length).toBe(0);
    });

    it('should not show badge when isStacked is true but stackCount is 1', () => {
      render(<EventMarker {...defaultProps} isStacked={true} stackCount={1} />);

      const button = screen.getByRole('button');
      const badges = button.querySelectorAll('.bg-gray-800');
      expect(badges.length).toBe(0);
    });
  });

  describe('Click handler', () => {
    it('should call onClick when button is clicked', () => {
      const onClick = vi.fn();
      render(<EventMarker {...defaultProps} onClick={onClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hover handler', () => {
    it('should call onHover with true on mouseenter', () => {
      const onHover = vi.fn();
      render(<EventMarker {...defaultProps} onHover={onHover} />);

      const button = screen.getByRole('button');
      fireEvent.mouseEnter(button);

      expect(onHover).toHaveBeenCalledWith(true);
    });

    it('should call onHover with false on mouseleave', () => {
      const onHover = vi.fn();
      render(<EventMarker {...defaultProps} onHover={onHover} />);

      const button = screen.getByRole('button');
      fireEvent.mouseLeave(button);

      expect(onHover).toHaveBeenCalledWith(false);
    });
  });

  describe('Aria label', () => {
    it('should have proper aria-label containing event title and date', () => {
      render(<EventMarker {...defaultProps} />);

      const button = screen.getByRole('button');
      const ariaLabel = button.getAttribute('aria-label');

      expect(ariaLabel).toContain('大学毕业');
      expect(ariaLabel).toContain('2020-06-15');
    });

    it('should include future event indicator in aria-label when isFuture', () => {
      render(<EventMarker {...defaultProps} isFuture={true} />);

      const button = screen.getByRole('button');
      const ariaLabel = button.getAttribute('aria-label');

      expect(ariaLabel).toContain('未来事件');
    });

    it('should include stack count in aria-label when stacked', () => {
      render(<EventMarker {...defaultProps} isStacked={true} stackCount={5} />);

      const button = screen.getByRole('button');
      const ariaLabel = button.getAttribute('aria-label');

      expect(ariaLabel).toContain('5');
    });
  });
});
