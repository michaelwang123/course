import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import type { VisibleNode } from '@/lib/virtual-renderer';
import type { EventNode } from '@/types/event';

// Helper: create a mock EventNode
function createMockEvent(id: string, date: string): EventNode {
  return {
    id,
    userId: 'user-1',
    title: `Event ${id}`,
    description: '',
    eventDate: date,
    category: 'life',
    sentiment: 'positive',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };
}

// Helper: create a mock VisibleNode
function createMockVisibleNode(id: string, date: string, position: number): VisibleNode {
  return {
    event: createMockEvent(id, date),
    position,
    isStacked: false,
    stackIndex: 0,
    stackCount: 1,
    isFuture: false,
  };
}

// Helper: dispatch keyboard event on document
function fireKey(key: string, options?: { shiftKey?: boolean }) {
  const event = new KeyboardEvent('keydown', { key, ...options, bubbles: true });
  document.dispatchEvent(event);
}

describe('useKeyboardNav', () => {
  let mockNodes: VisibleNode[];
  let onSelectEvent: ReturnType<typeof vi.fn>;
  let onMoveTimeline: ReturnType<typeof vi.fn>;
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNodes = [
      createMockVisibleNode('1', '2020-01-01', 100),
      createMockVisibleNode('2', '2021-06-15', 200),
      createMockVisibleNode('3', '2022-12-31', 300),
    ];
    onSelectEvent = vi.fn();
    onMoveTimeline = vi.fn();
    onClose = vi.fn();
  });

  describe('ArrowLeft / ArrowRight', () => {
    it('should call onMoveTimeline with "left" when ArrowLeft is pressed', () => {
      renderHook(() => useKeyboardNav(mockNodes, onSelectEvent, onMoveTimeline, onClose));

      act(() => {
        fireKey('ArrowLeft');
      });

      expect(onMoveTimeline).toHaveBeenCalledWith('left');
      expect(onMoveTimeline).toHaveBeenCalledTimes(1);
    });

    it('should call onMoveTimeline with "right" when ArrowRight is pressed', () => {
      renderHook(() => useKeyboardNav(mockNodes, onSelectEvent, onMoveTimeline, onClose));

      act(() => {
        fireKey('ArrowRight');
      });

      expect(onMoveTimeline).toHaveBeenCalledWith('right');
      expect(onMoveTimeline).toHaveBeenCalledTimes(1);
    });
  });

  describe('Tab (cycle forward)', () => {
    it('should cycle focusedIndex forward: null → 0 → 1 → 2 → 0', () => {
      const { result } = renderHook(() =>
        useKeyboardNav(mockNodes, onSelectEvent, onMoveTimeline, onClose)
      );

      // Initially null
      expect(result.current.focusedIndex).toBeNull();

      // Tab: null → 0
      act(() => {
        fireKey('Tab');
      });
      expect(result.current.focusedIndex).toBe(0);

      // Tab: 0 → 1
      act(() => {
        fireKey('Tab');
      });
      expect(result.current.focusedIndex).toBe(1);

      // Tab: 1 → 2
      act(() => {
        fireKey('Tab');
      });
      expect(result.current.focusedIndex).toBe(2);

      // Tab: 2 → 0 (wrap around)
      act(() => {
        fireKey('Tab');
      });
      expect(result.current.focusedIndex).toBe(0);
    });
  });

  describe('Shift+Tab (cycle backward)', () => {
    it('should cycle focusedIndex backward: null → last → last-1 → ... → last', () => {
      const { result } = renderHook(() =>
        useKeyboardNav(mockNodes, onSelectEvent, onMoveTimeline, onClose)
      );

      // Initially null
      expect(result.current.focusedIndex).toBeNull();

      // Shift+Tab: null → 2 (last)
      act(() => {
        fireKey('Tab', { shiftKey: true });
      });
      expect(result.current.focusedIndex).toBe(2);

      // Shift+Tab: 2 → 1
      act(() => {
        fireKey('Tab', { shiftKey: true });
      });
      expect(result.current.focusedIndex).toBe(1);

      // Shift+Tab: 1 → 0
      act(() => {
        fireKey('Tab', { shiftKey: true });
      });
      expect(result.current.focusedIndex).toBe(0);

      // Shift+Tab: 0 → 2 (wrap around to last)
      act(() => {
        fireKey('Tab', { shiftKey: true });
      });
      expect(result.current.focusedIndex).toBe(2);
    });
  });

  describe('Enter', () => {
    it('should call onSelectEvent with focused event when focusedIndex is set', () => {
      const { result } = renderHook(() =>
        useKeyboardNav(mockNodes, onSelectEvent, onMoveTimeline, onClose)
      );

      // Set focus to index 1
      act(() => {
        fireKey('Tab'); // null → 0
      });
      act(() => {
        fireKey('Tab'); // 0 → 1
      });
      expect(result.current.focusedIndex).toBe(1);

      // Press Enter
      act(() => {
        fireKey('Enter');
      });

      expect(onSelectEvent).toHaveBeenCalledWith(mockNodes[1].event);
      expect(onSelectEvent).toHaveBeenCalledTimes(1);
    });

    it('should NOT call onSelectEvent when focusedIndex is null', () => {
      renderHook(() => useKeyboardNav(mockNodes, onSelectEvent, onMoveTimeline, onClose));

      // focusedIndex is null initially
      act(() => {
        fireKey('Enter');
      });

      expect(onSelectEvent).not.toHaveBeenCalled();
    });
  });

  describe('Space', () => {
    it('should call onSelectEvent with focused event when focusedIndex is set', () => {
      const { result } = renderHook(() =>
        useKeyboardNav(mockNodes, onSelectEvent, onMoveTimeline, onClose)
      );

      // Set focus to index 0
      act(() => {
        fireKey('Tab'); // null → 0
      });
      expect(result.current.focusedIndex).toBe(0);

      // Press Space
      act(() => {
        fireKey(' ');
      });

      expect(onSelectEvent).toHaveBeenCalledWith(mockNodes[0].event);
      expect(onSelectEvent).toHaveBeenCalledTimes(1);
    });
  });

  describe('Escape', () => {
    it('should call onClose when Escape is pressed', () => {
      renderHook(() => useKeyboardNav(mockNodes, onSelectEvent, onMoveTimeline, onClose));

      act(() => {
        fireKey('Escape');
      });

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Focus reset on visibleNodes change', () => {
    it('should reset focusedIndex to null when visibleNodes changes', () => {
      const { result, rerender } = renderHook(
        ({ nodes }) => useKeyboardNav(nodes, onSelectEvent, onMoveTimeline, onClose),
        { initialProps: { nodes: mockNodes } }
      );

      // Set focus
      act(() => {
        fireKey('Tab'); // null → 0
      });
      expect(result.current.focusedIndex).toBe(0);

      // Change visibleNodes
      const newNodes = [createMockVisibleNode('4', '2023-03-01', 400)];
      rerender({ nodes: newNodes });

      expect(result.current.focusedIndex).toBeNull();
    });
  });

  describe('Empty visibleNodes', () => {
    it('should do nothing when Tab is pressed with empty visibleNodes', () => {
      const { result } = renderHook(() =>
        useKeyboardNav([], onSelectEvent, onMoveTimeline, onClose)
      );

      act(() => {
        fireKey('Tab');
      });

      expect(result.current.focusedIndex).toBeNull();
    });

    it('should do nothing when Shift+Tab is pressed with empty visibleNodes', () => {
      const { result } = renderHook(() =>
        useKeyboardNav([], onSelectEvent, onMoveTimeline, onClose)
      );

      act(() => {
        fireKey('Tab', { shiftKey: true });
      });

      expect(result.current.focusedIndex).toBeNull();
    });
  });
});
