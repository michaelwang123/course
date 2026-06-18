import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Quote } from '../types/quote';

export interface UseRandomQuoteReturn {
  currentQuote: Quote | null;
  displayedQuote: Quote | null;
  nextQuote: () => void;
  isAnimating: boolean;
  animationPhase: 'idle' | 'fade-out' | 'fade-in';
  canGetNext: boolean;
}

/**
 * 从 pool 中随机选取一条 Quote，支持换一句（排除当前）和两阶段动画。
 * 通过 id 指纹进行内容级比较，避免引用变化引起的误触发。
 *
 * 动画流程：fade-out(200ms) → 内容替换 → fade-in(200ms)
 */
export function useRandomQuote(pool: Quote[]): UseRandomQuoteReturn {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [displayedQuote, setDisplayedQuote] = useState<Quote | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'fade-out' | 'fade-in'>('idle');
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const poolFingerprintRef = useRef<string>('');

  const canGetNext = pool.length >= 2;
  const isAnimating = animationPhase !== 'idle';

  // 内容级指纹：只有 pool 中 id 集合实际变化时才重新选取
  const poolFingerprint = useMemo(
    () => pool.map((q) => q.id).sort().join(','),
    [pool]
  );

  /**
   * 从给定的候选列表中随机选取一条 Quote
   */
  const pickRandom = useCallback((candidates: Quote[]): Quote | null => {
    if (candidates.length === 0) return null;
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  }, []);

  /**
   * 清除当前动画计时器
   */
  const clearAnimationTimer = useCallback(() => {
    if (animationTimerRef.current !== null) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  }, []);

  /**
   * 两阶段动画切换：
   * 1. fade-out 当前内容(200ms)
   * 2. 替换 displayedQuote + fade-in(200ms)
   */
  const transitionTo = useCallback((newQuote: Quote | null) => {
    clearAnimationTimer();

    if (newQuote === null) {
      setCurrentQuote(null);
      setDisplayedQuote(null);
      setAnimationPhase('idle');
      return;
    }

    setCurrentQuote(newQuote);

    // 如果当前没有展示内容，直接淡入（首次加载）
    if (displayedQuote === null) {
      setDisplayedQuote(newQuote);
      setAnimationPhase('fade-in');
      animationTimerRef.current = setTimeout(() => {
        setAnimationPhase('idle');
        animationTimerRef.current = null;
      }, 200);
      return;
    }

    // Phase 1: 淡出当前内容
    setAnimationPhase('fade-out');
    animationTimerRef.current = setTimeout(() => {
      // Phase 2: 替换内容 + 淡入
      setDisplayedQuote(newQuote);
      setAnimationPhase('fade-in');
      animationTimerRef.current = setTimeout(() => {
        setAnimationPhase('idle');
        animationTimerRef.current = null;
      }, 200);
    }, 200);
  }, [displayedQuote, clearAnimationTimer]);

  /**
   * pool 内容变化时触发新的随机选取 + 动画
   */
  useEffect(() => {
    if (poolFingerprint === poolFingerprintRef.current) return;
    poolFingerprintRef.current = poolFingerprint;

    const picked = pickRandom(pool);
    transitionTo(picked);
  }, [poolFingerprint, pool, pickRandom, transitionTo]);

  /**
   * 换一句：排除当前 quote 后随机选一个
   */
  const nextQuote = useCallback(() => {
    if (!canGetNext) return;
    const candidates = currentQuote
      ? pool.filter((q) => q.id !== currentQuote.id)
      : pool;
    const picked = pickRandom(candidates);
    if (picked) {
      transitionTo(picked);
    }
  }, [pool, currentQuote, canGetNext, pickRandom, transitionTo]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (animationTimerRef.current !== null) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  return {
    currentQuote,
    displayedQuote,
    nextQuote,
    isAnimating,
    animationPhase,
    canGetNext,
  };
}
