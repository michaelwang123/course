import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRandomQuote } from '../../src/hooks/useRandomQuote';
import type { Quote } from '../../src/types/quote';

function makeQuote(id: string, content = `content-${id}`): Quote {
  return { id, content, bookSource: 'TestBook', chapter: '', theme: '' };
}

describe('useRandomQuote', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 空池返回 null
  it('returns null when pool is empty', () => {
    const { result } = renderHook(() => useRandomQuote([]));
    expect(result.current.currentQuote).toBeNull();
    expect(result.current.displayedQuote).toBeNull();
    expect(result.current.canGetNext).toBe(false);
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.animationPhase).toBe('idle');
  });

  // 单条金句禁用 nextQuote
  it('disables nextQuote when pool has only one quote', () => {
    const pool = [makeQuote('1')];
    const { result } = renderHook(() => useRandomQuote(pool));

    expect(result.current.currentQuote).toEqual(pool[0]);
    expect(result.current.canGetNext).toBe(false);

    // calling nextQuote should have no effect
    act(() => {
      result.current.nextQuote();
    });
    expect(result.current.currentQuote).toEqual(pool[0]);
  });

  // 池变化触发重新选取
  it('re-picks a quote when pool content changes', () => {
    const pool1 = [makeQuote('1'), makeQuote('2')];
    const pool2 = [makeQuote('3'), makeQuote('4')];

    const { result, rerender } = renderHook(
      ({ pool }) => useRandomQuote(pool),
      { initialProps: { pool: pool1 } }
    );

    const firstQuote = result.current.currentQuote;
    expect(firstQuote).not.toBeNull();
    expect(pool1.some((q) => q.id === firstQuote!.id)).toBe(true);

    // change pool content (different ids)
    rerender({ pool: pool2 });

    const secondQuote = result.current.currentQuote;
    expect(secondQuote).not.toBeNull();
    expect(pool2.some((q) => q.id === secondQuote!.id)).toBe(true);
  });

  // 首次加载：fade-in 动画 200ms
  it('starts with fade-in animation on first load, resets after 200ms', () => {
    const pool = [makeQuote('1'), makeQuote('2')];
    const { result } = renderHook(() => useRandomQuote(pool));

    // First load: directly fade-in (no previous content to fade-out)
    expect(result.current.isAnimating).toBe(true);
    expect(result.current.animationPhase).toBe('fade-in');

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.isAnimating).toBe(false);
    expect(result.current.animationPhase).toBe('idle');
  });

  // nextQuote 触发两阶段动画：fade-out(200ms) → fade-in(200ms)
  it('triggers two-phase animation on nextQuote: fade-out then fade-in', () => {
    const pool = [makeQuote('1'), makeQuote('2'), makeQuote('3')];
    const { result } = renderHook(() => useRandomQuote(pool));

    // Complete initial animation
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.animationPhase).toBe('idle');

    const oldDisplayed = result.current.displayedQuote;

    // Call nextQuote
    act(() => {
      result.current.nextQuote();
    });

    // Phase 1: fade-out (old content still displayed)
    expect(result.current.animationPhase).toBe('fade-out');
    expect(result.current.isAnimating).toBe(true);

    // After 200ms: content swaps + starts fade-in
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.animationPhase).toBe('fade-in');
    expect(result.current.displayedQuote).not.toBeNull();
    expect(result.current.displayedQuote!.id).not.toBe(oldDisplayed!.id);

    // After another 200ms: idle
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.animationPhase).toBe('idle');
    expect(result.current.isAnimating).toBe(false);
  });

  // nextQuote 返回不同金句
  it('nextQuote returns a different quote from current', () => {
    const pool = [makeQuote('1'), makeQuote('2'), makeQuote('3')];
    const { result } = renderHook(() => useRandomQuote(pool));

    const initial = result.current.currentQuote;

    act(() => {
      result.current.nextQuote();
    });

    expect(result.current.currentQuote).not.toBeNull();
    expect(result.current.currentQuote!.id).not.toBe(initial!.id);
  });

  // canGetNext reflects pool size
  it('canGetNext is true when pool has 2+ quotes', () => {
    const pool = [makeQuote('1'), makeQuote('2')];
    const { result } = renderHook(() => useRandomQuote(pool));
    expect(result.current.canGetNext).toBe(true);
  });

  // pool becomes empty after non-empty
  it('handles pool changing from non-empty to empty', () => {
    const pool1 = [makeQuote('1'), makeQuote('2')];
    const { result, rerender } = renderHook(
      ({ pool }) => useRandomQuote(pool),
      { initialProps: { pool: pool1 } }
    );

    expect(result.current.currentQuote).not.toBeNull();

    rerender({ pool: [] });

    expect(result.current.currentQuote).toBeNull();
    expect(result.current.displayedQuote).toBeNull();
    expect(result.current.isAnimating).toBe(false);
    expect(result.current.canGetNext).toBe(false);
  });

  // displayedQuote 与 currentQuote 在动画完成后一致
  it('displayedQuote matches currentQuote after animation completes', () => {
    const pool = [makeQuote('1'), makeQuote('2')];
    const { result } = renderHook(() => useRandomQuote(pool));

    // Complete initial fade-in
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.displayedQuote).toEqual(result.current.currentQuote);
  });
});
