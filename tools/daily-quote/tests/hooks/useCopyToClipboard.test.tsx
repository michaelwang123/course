import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCopyToClipboard } from '../../src/hooks/useCopyToClipboard';
import type { Quote } from '../../src/types/quote';

const mockQuote: Quote = {
  id: 'test1',
  content: '道可道非常道',
  bookSource: '道德经',
  chapter: '第1章',
  theme: '道的本质',
};

describe('useCopyToClipboard', () => {
  let originalClipboard: Clipboard;

  beforeEach(() => {
    vi.useFakeTimers();
    originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
    });
  });

  // API 不支持场景
  describe('when Clipboard API is not supported', () => {
    it('returns unsupported status and isSupported=false', () => {
      // Remove clipboard API
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useCopyToClipboard());

      expect(result.current.isSupported).toBe(false);
      expect(result.current.status).toBe('unsupported');
    });

    it('copy does nothing when unsupported', async () => {
      Object.defineProperty(navigator, 'clipboard', {
        value: undefined,
        writable: true,
      });

      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy(mockQuote);
      });

      // Status stays unsupported
      expect(result.current.status).toBe('unsupported');
    });
  });

  // 复制成功场景
  describe('when copy succeeds', () => {
    it('sets status to success and resets after 2 seconds', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      expect(result.current.status).toBe('idle');
      expect(result.current.isSupported).toBe(true);

      await act(async () => {
        await result.current.copy(mockQuote);
      });

      expect(result.current.status).toBe('success');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        '【道可道非常道】—— 《道德经》'
      );

      // After 2 seconds, resets to idle
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.status).toBe('idle');
    });
  });

  // 复制失败场景
  describe('when copy fails', () => {
    it('sets status to error and resets after 5 seconds', async () => {
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy(mockQuote);
      });

      expect(result.current.status).toBe('error');

      // After 5 seconds, resets to idle
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current.status).toBe('idle');
    });

    it('error does not reset before 5 seconds', async () => {
      (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Permission denied')
      );

      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy(mockQuote);
      });

      expect(result.current.status).toBe('error');

      // After 3 seconds, still error
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.status).toBe('error');
    });
  });

  // 反馈计时器重置：重复点击重置计时
  describe('timer reset on repeated clicks', () => {
    it('resets the success timer on repeated copy', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      // First copy
      await act(async () => {
        await result.current.copy(mockQuote);
      });
      expect(result.current.status).toBe('success');

      // Advance 1.5 seconds (not enough for reset)
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(result.current.status).toBe('success');

      // Second copy — resets the timer
      await act(async () => {
        await result.current.copy(mockQuote);
      });
      expect(result.current.status).toBe('success');

      // After 1.5 more seconds (3s total from first, 1.5s from second) — still success
      act(() => {
        vi.advanceTimersByTime(1500);
      });
      expect(result.current.status).toBe('success');

      // After full 2 seconds from the second copy — resets
      act(() => {
        vi.advanceTimersByTime(500);
      });
      expect(result.current.status).toBe('idle');
    });
  });
});
