import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/timeout';
import type { Scale } from '@/types/scale';

export interface UseScalesResult {
  scales: Scale[];
  loading: boolean;
  error: string | null;
  total: number;
}

/**
 * 获取量表列表（分页）
 * 从 mha_scales 表查询，按 created_at DESC 排序
 */
export function useScales(page: number = 1, pageSize: number = 20): UseScalesResult {
  const [scales, setScales] = useState<Scale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchScales() {
      setLoading(true);
      setError(null);

      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error: queryError, count } = await withTimeout(
          supabase
            .from('mha_scales')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)
        );

        if (cancelled) return;

        if (queryError) {
          setError(queryError.message);
          setScales([]);
          setTotal(0);
          return;
        }

        const mapped: Scale[] = (data ?? []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          name: row.name as string,
          description: row.description as string,
          scaleType: row.scale_type as Scale['scaleType'],
          targetAudience: row.target_audience as string,
          itemCount: row.item_count as number,
          estimatedMinutes: row.estimated_minutes as number,
          scoringRule: row.scoring_rule as Scale['scoringRule'],
          gradeThresholds: row.grade_thresholds as Scale['gradeThresholds'],
          createdAt: row.created_at as string,
        }));

        setScales(mapped);
        setTotal(count ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载量表列表失败');
          setScales([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchScales();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  return { scales, loading, error, total };
}
