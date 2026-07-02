import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EventNode } from '@/types/event';
import { MAX_EVENTS_PER_USER } from '@/types/event';

// Mock @/lib/supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockAbortSignal = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn(() => ({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...(args as [])),
  },
}));

// Mock @/hooks/useOnlineStatus
const mockIsOnline = { value: true };
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => ({ isOnline: mockIsOnline.value }),
}));

// Mock @/hooks/useAuth
const mockUser = { value: { id: 'user-123' } as { id: string } | null };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser.value }),
}));

import { useEvents } from '@/hooks/useEvents';

// Helper: build a mock EventNode DB row (snake_case)
function createMockRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'evt-1',
    user_id: 'user-123',
    title: '测试事件',
    description: '描述',
    event_date: '2024-06-15',
    category: 'life',
    sentiment: 'positive',
    created_at: '2024-06-15T10:00:00.000Z',
    updated_at: '2024-06-15T10:00:00.000Z',
    ...overrides,
  };
}

// Helper: set up the select chain that refreshEvents uses
function setupSelectChain(result: { data: unknown[] | null; error: unknown | null }) {
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ order: mockOrder });
  mockOrder.mockReturnValue({ limit: mockLimit });
  mockLimit.mockReturnValue({ abortSignal: mockAbortSignal });
  mockAbortSignal.mockResolvedValue(result);
}

// Helper: set up the insert chain
function setupInsertChain(result: { data: unknown | null; error: unknown | null }) {
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });
  mockInsert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(result) }) });
}

// Helper: set up the update chain
function setupUpdateChain(result: { data: unknown | null; error: unknown | null }) {
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });
  mockUpdate.mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue(result) }) }) }) });
}

// Helper: set up the delete chain
function setupDeleteChain(result: { error: unknown | null }) {
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });
  mockDelete.mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue(result) }) });
}

describe('useEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOnline.value = true;
    mockUser.value = { id: 'user-123' };
    // Default: select returns empty array
    setupSelectChain({ data: [], error: null });
  });

  describe('Initial load', () => {
    it('should fetch events on mount when user is logged in', async () => {
      const rows = [createMockRow()];
      setupSelectChain({ data: rows, error: null });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].id).toBe('evt-1');
      expect(result.current.events[0].title).toBe('测试事件');
      expect(mockFrom).toHaveBeenCalledWith('life_timeline_events');
    });

    it('should show isLoading=true then false after fetch completes', async () => {
      setupSelectChain({ data: [], error: null });

      const { result } = renderHook(() => useEvents());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should return empty array when no user', async () => {
      mockUser.value = null;

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.events).toEqual([]);
    });
  });

  describe('Add event', () => {
    it('should insert event and update local state', async () => {
      setupSelectChain({ data: [], error: null });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newRow = createMockRow({ id: 'evt-new', title: '新事件' });
      setupInsertChain({ data: newRow, error: null });

      let addedEvent: EventNode | undefined;
      await act(async () => {
        addedEvent = await result.current.addEvent({
          title: '新事件',
          description: '描述',
          eventDate: '2024-06-15',
          category: 'life',
          sentiment: 'positive',
        });
      });

      expect(addedEvent!.id).toBe('evt-new');
      expect(addedEvent!.title).toBe('新事件');
      expect(result.current.events).toHaveLength(1);
      expect(result.current.events[0].id).toBe('evt-new');
    });
  });

  describe('Update event', () => {
    it('should update event in Supabase and local state', async () => {
      const existingRow = createMockRow({ id: 'evt-1', title: '原标题' });
      setupSelectChain({ data: [existingRow], error: null });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      const updatedRow = createMockRow({ id: 'evt-1', title: '新标题' });
      setupUpdateChain({ data: updatedRow, error: null });

      let updatedEvent: EventNode | undefined;
      await act(async () => {
        updatedEvent = await result.current.updateEvent('evt-1', { title: '新标题' });
      });

      expect(updatedEvent!.title).toBe('新标题');
      expect(result.current.events[0].title).toBe('新标题');
    });
  });

  describe('Delete event', () => {
    it('should remove event from Supabase and local state', async () => {
      const existingRow = createMockRow({ id: 'evt-1' });
      setupSelectChain({ data: [existingRow], error: null });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(1);
      });

      setupDeleteChain({ error: null });

      await act(async () => {
        await result.current.deleteEvent('evt-1');
      });

      expect(result.current.events).toHaveLength(0);
    });
  });

  describe('5000 limit', () => {
    it('when events.length >= 5000, addEvent should reject with limit message', async () => {
      // Simulate 5000 events in state by loading them
      const rows = Array.from({ length: MAX_EVENTS_PER_USER }, (_, i) =>
        createMockRow({ id: `evt-${i}`, event_date: '2024-01-01' })
      );
      setupSelectChain({ data: rows, error: null });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.events).toHaveLength(MAX_EVENTS_PER_USER);
      });

      expect(result.current.isAtLimit).toBe(true);

      await act(async () => {
        await expect(
          result.current.addEvent({
            title: '超限事件',
            description: '',
            eventDate: '2024-06-15',
            category: 'life',
            sentiment: 'neutral',
          })
        ).rejects.toThrow('事件数量已达上限 (5000)');
      });
    });
  });

  describe('Offline write operations', () => {
    it('when isOnline=false, addEvent should reject with network error', async () => {
      setupSelectChain({ data: [], error: null });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      mockIsOnline.value = false;

      // Re-render to pick up new isOnline value
      const { result: result2 } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false);
      });

      await act(async () => {
        await expect(
          result2.current.addEvent({
            title: '离线事件',
            description: '',
            eventDate: '2024-06-15',
            category: 'life',
            sentiment: 'neutral',
          })
        ).rejects.toThrow('网络连接已断开，无法执行此操作');
      });
    });

    it('when isOnline=false, updateEvent should reject', async () => {
      mockIsOnline.value = false;
      setupSelectChain({ data: [], error: null });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.updateEvent('evt-1', { title: '更新' })
        ).rejects.toThrow('网络连接已断开，无法执行此操作');
      });
    });

    it('when isOnline=false, deleteEvent should reject', async () => {
      mockIsOnline.value = false;
      setupSelectChain({ data: [], error: null });

      const { result } = renderHook(() => useEvents());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await expect(
          result.current.deleteEvent('evt-1')
        ).rejects.toThrow('网络连接已断开，无法执行此操作');
      });
    });
  });

  describe('Fetch error handling', () => {
    it('should handle AbortError gracefully with timeout message', async () => {
      // Simulate abort error during fetch (will be retried up to 3 times)
      mockFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
        delete: mockDelete,
      });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ order: mockOrder });
      mockOrder.mockReturnValue({ limit: mockLimit });
      mockLimit.mockReturnValue({
        abortSignal: vi.fn().mockRejectedValue(
          Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
        ),
      });

      const { result } = renderHook(() => useEvents());

      // Wait for retries to complete (3 attempts with exponential backoff: 1s + 2s + final)
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 10000 });

      expect(result.current.error).toBe('数据加载超时，请稍后重试');
      expect(result.current.events).toEqual([]);
    }, 15000);  // Increase test timeout to accommodate retries
  });
});
