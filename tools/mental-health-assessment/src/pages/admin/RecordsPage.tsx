import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Pagination } from '@/components/Pagination';
import { GradeTag } from '@/components/GradeTag';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import type { GradeLevel } from '@/types/assessment';

const PAGE_SIZE = 20;

interface RecordRow {
  id: string;
  participantName: string;
  jobType: '月嫂' | '老人护理';
  scaleName: string;
  gradeLevel: GradeLevel | null;
  completedAt: string | null;
}

/**
 * 测评记录页面
 * 按时间倒序展示所有测评者的测评结果摘要
 * 每页最多展示 20 条记录并提供分页控件
 */
export function RecordsPage() {
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecords() {
      setLoading(true);
      setError(null);

      try {
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // Query assessment sessions joined with scale name
        const { data, error: queryError, count } = await supabase
          .from('mha_assessment_sessions')
          .select('id, participant_name, job_type, scale_id, grade_level, completed_at, mha_scales(name)', { count: 'exact' })
          .order('completed_at', { ascending: false, nullsFirst: false })
          .range(from, to);

        if (cancelled) return;

        if (queryError) {
          setError(queryError.message);
          setRecords([]);
          setTotal(0);
          return;
        }

        const mapped: RecordRow[] = (data ?? []).map((row: Record<string, unknown>) => {
          const scaleData = row.mha_scales as { name: string } | null;
          return {
            id: row.id as string,
            participantName: row.participant_name as string,
            jobType: row.job_type as RecordRow['jobType'],
            scaleName: scaleData?.name ?? '未知量表',
            gradeLevel: row.grade_level as GradeLevel | null,
            completedAt: row.completed_at as string | null,
          };
        });

        setRecords(mapped);
        setTotal(count ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载测评记录失败');
          setRecords([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRecords();

    return () => {
      cancelled = true;
    };
  }, [page]);

  /**
   * 格式化日期为 YYYY-MM-DD
   */
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '进行中';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return '日期无效';
    }
  }

  function handleRetry() {
    setPage(0);
    setTimeout(() => setPage(1), 0);
  }

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">测评记录</h2>
        <p className="mt-1 text-sm text-gray-500">
          所有测评者的测评结果记录，按测评日期从新到旧排列
        </p>
      </div>

      {/* 加载状态 */}
      {loading && <LoadingSpinner />}

      {/* 错误状态 */}
      {!loading && error && (
        <ErrorMessage
          message="加载测评记录失败，请稍后重试"
          onRetry={handleRetry}
        />
      )}

      {/* 空状态 */}
      {!loading && !error && records.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-white p-8 text-center">
          <p className="text-gray-500">暂无测评记录</p>
        </div>
      )}

      {/* 记录列表 */}
      {!loading && !error && records.length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border border-green-200 bg-white shadow-sm">
            {/* 表头 - 桌面端显示 */}
            <div className="hidden border-b border-green-100 bg-green-50 px-4 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
              <span className="col-span-2 text-sm font-medium text-green-800">姓名</span>
              <span className="col-span-2 text-sm font-medium text-green-800">从业类型</span>
              <span className="col-span-3 text-sm font-medium text-green-800">量表名称</span>
              <span className="col-span-2 text-sm font-medium text-green-800">等级判定</span>
              <span className="col-span-3 text-sm font-medium text-green-800">测评日期</span>
            </div>

            {/* 列表项 */}
            <ul className="divide-y divide-green-100">
              {records.map((record) => (
                <li
                  key={record.id}
                  className="px-4 py-4 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                >
                  {/* 姓名 */}
                  <div className="col-span-2">
                    <p className="font-medium text-gray-900">{record.participantName}</p>
                  </div>

                  {/* 从业类型 */}
                  <div className="col-span-2 mt-1 sm:mt-0">
                    <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                      {record.jobType}
                    </span>
                  </div>

                  {/* 量表名称 */}
                  <div className="col-span-3 mt-1 sm:mt-0">
                    <span className="text-sm text-gray-600">{record.scaleName}</span>
                  </div>

                  {/* 等级判定 */}
                  <div className="col-span-2 mt-1 sm:mt-0">
                    {record.gradeLevel ? (
                      <GradeTag level={record.gradeLevel} />
                    ) : (
                      <span className="text-sm text-gray-400">未完成</span>
                    )}
                  </div>

                  {/* 测评日期 */}
                  <div className="col-span-3 mt-1 sm:mt-0">
                    <span className="text-sm text-gray-600">
                      {formatDate(record.completedAt)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* 分页 */}
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
