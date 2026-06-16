import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/timeout';
import type { AssessmentSession } from '@/types/assessment';

export interface UseHistoryResult {
  records: AssessmentSession[];
  loading: boolean;
  error: string | null;
  total: number;
}

/**
 * 查询测评历史记录
 * 从 mha_assessment_sessions 表按 completed_at DESC 排序
 * 支持按量表类型筛选（通过 inner join mha_scales 的 scale_type）
 *
 * @param participantName - 测评者姓名
 * @param scaleType - 可选的量表类型筛选（如 '抑郁'、'焦虑' 等）
 * @param page - 页码（从 1 开始）
 * @param pageSize - 每页条数，默认 20
 */
export function useHistory(
  participantName: string,
  scaleType?: string | null,
  page: number = 1,
  pageSize: number = 20
): UseHistoryResult {
  const [records, setRecords] = useState<AssessmentSession[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    if (!participantName.trim()) {
      setRecords([]);
      setLoading(false);
      setError(null);
      setTotal(0);
      return;
    }

    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      setError(null);

      try {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // 根据是否有 scaleType 筛选，使用不同的查询策略
        if (scaleType) {
          // 先查找匹配类型的 scale IDs，再过滤 sessions
          const { data: scaleData, error: scaleError } = await withTimeout(
            supabase
              .from('mha_scales')
              .select('id')
              .eq('scale_type', scaleType)
          );

          if (cancelled) return;

          if (scaleError) {
            setError(scaleError.message);
            setRecords([]);
            setTotal(0);
            return;
          }

          const scaleIds = (scaleData ?? []).map((s: { id: string }) => s.id);

          if (scaleIds.length === 0) {
            setRecords([]);
            setTotal(0);
            setLoading(false);
            return;
          }

          const { data, error: queryError, count } = await withTimeout(
            supabase
              .from('mha_assessment_sessions')
              .select('*', { count: 'exact' })
              .eq('participant_name', participantName.trim())
              .in('scale_id', scaleIds)
              .order('completed_at', { ascending: false, nullsFirst: false })
              .range(from, to)
          );

          if (cancelled) return;

          if (queryError) {
            setError(queryError.message);
            setRecords([]);
            setTotal(0);
            return;
          }

          const mapped: AssessmentSession[] = (data ?? []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            participantName: row.participant_name as string,
            jobType: row.job_type as AssessmentSession['jobType'],
            scaleId: row.scale_id as string,
            answers: row.answers as AssessmentSession['answers'],
            rawScore: row.raw_score as number | null,
            standardScore: row.standard_score as number | null,
            gradeLevel: row.grade_level as AssessmentSession['gradeLevel'],
            interpretation: row.interpretation as string | null,
            startedAt: row.started_at as string,
            completedAt: row.completed_at as string | null,
          }));

          setRecords(mapped);
          setTotal(count ?? 0);
        } else {
          // 无筛选，直接查询
          const { data, error: queryError, count } = await withTimeout(
            supabase
              .from('mha_assessment_sessions')
              .select('*', { count: 'exact' })
              .eq('participant_name', participantName.trim())
              .order('completed_at', { ascending: false, nullsFirst: false })
              .range(from, to)
          );

          if (cancelled) return;

          if (queryError) {
            setError(queryError.message);
            setRecords([]);
            setTotal(0);
            return;
          }

          const mapped: AssessmentSession[] = (data ?? []).map((row: Record<string, unknown>) => ({
            id: row.id as string,
            participantName: row.participant_name as string,
            jobType: row.job_type as AssessmentSession['jobType'],
            scaleId: row.scale_id as string,
            answers: row.answers as AssessmentSession['answers'],
            rawScore: row.raw_score as number | null,
            standardScore: row.standard_score as number | null,
            gradeLevel: row.grade_level as AssessmentSession['gradeLevel'],
            interpretation: row.interpretation as string | null,
            startedAt: row.started_at as string,
            completedAt: row.completed_at as string | null,
          }));

          setRecords(mapped);
          setTotal(count ?? 0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载历史记录失败');
          setRecords([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, [participantName, scaleType, page, pageSize]);

  return { records, loading, error, total };
}
