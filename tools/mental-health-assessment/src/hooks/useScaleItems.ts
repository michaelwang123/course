import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/timeout';
import type { ScaleItem } from '@/types/scale';

export interface UseScaleItemsResult {
  items: ScaleItem[];
  loading: boolean;
  error: string | null;
}

/**
 * 获取指定量表的所有题目
 * 从 mha_scale_items 表按 item_order ASC 排序查询
 * 用于 AssessmentPage 加载测评题目
 *
 * @param scaleId - 量表 ID，为 null 时不发起请求
 */
export function useScaleItems(scaleId: string | null): UseScaleItemsResult {
  const [items, setItems] = useState<ScaleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scaleId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchItems() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await withTimeout(
          supabase
            .from('mha_scale_items')
            .select('*')
            .eq('scale_id', scaleId)
            .order('item_order', { ascending: true })
        );

        if (cancelled) return;

        if (queryError) {
          setError(queryError.message);
          setItems([]);
          return;
        }

        const mapped: ScaleItem[] = (data ?? []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          scaleId: row.scale_id as string,
          itemOrder: row.item_order as number,
          content: row.content as string,
          options: row.options as ScaleItem['options'],
          isReverseScored: row.is_reverse_scored as boolean,
        }));

        setItems(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载量表题目失败');
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchItems();

    return () => {
      cancelled = true;
    };
  }, [scaleId]);

  return { items, loading, error };
}
