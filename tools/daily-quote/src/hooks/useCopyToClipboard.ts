import { useState, useEffect, useRef, useCallback } from 'react';
import type { Quote } from '../types/quote';
import { formatQuoteForCopy } from '../lib/format-quote';

type CopyStatus = 'idle' | 'success' | 'error' | 'unsupported';

interface UseCopyToClipboardReturn {
  copy: (quote: Quote) => Promise<void>;
  status: CopyStatus;
  isSupported: boolean;
}

/**
 * 管理剪贴板复制功能的 Hook
 * - 挂载时检测 navigator.clipboard 可用性
 * - copy() 将格式化后的金句文本写入剪贴板
 * - 自动管理 status 状态及重置计时器
 */
export function useCopyToClipboard(): UseCopyToClipboardReturn {
  const [status, setStatus] = useState<CopyStatus>('idle');
  const [isSupported, setIsSupported] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 挂载时检测 Clipboard API 是否可用
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      setIsSupported(false);
      setStatus('unsupported');
    }
  }, []);

  // 组件卸载时清理计时器
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = useCallback(async (quote: Quote): Promise<void> => {
    if (!isSupported) {
      return;
    }

    // 清除之前的计时器（重复点击重置计时）
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    try {
      const text = formatQuoteForCopy(quote);
      await navigator.clipboard.writeText(text);
      setStatus('success');

      // 2 秒后重置为 idle
      timerRef.current = setTimeout(() => {
        setStatus('idle');
        timerRef.current = null;
      }, 2000);
    } catch {
      setStatus('error');

      // 5 秒后重置为 idle
      timerRef.current = setTimeout(() => {
        setStatus('idle');
        timerRef.current = null;
      }, 5000);
    }
  }, [isSupported]);

  return { copy, status, isSupported };
}
