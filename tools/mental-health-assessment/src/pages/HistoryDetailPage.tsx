import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { GradeTag } from '@/components/GradeTag';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { AssessmentSession, AnswerRecord, GradeLevel } from '@/types/assessment';
import type { ScaleItem } from '@/types/scale';

interface DetailData {
  session: AssessmentSession;
  scaleName: string;
  items: ScaleItem[];
}

/**
 * 历史记录详情页
 * 路由: /history/:sessionId
 * 展示单次测评的完整结果，包括逐题作答详情
 */
export function HistoryDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('无效的测评记录');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setError(null);

      try {
        // 1. Load session data
        const { data: sessionData, error: sessionError } = await supabase
          .from('mha_assessment_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (cancelled) return;

        if (sessionError || !sessionData) {
          setError('未找到测评记录');
          setLoading(false);
          return;
        }

        const session: AssessmentSession = {
          id: sessionData.id,
          participantName: sessionData.participant_name,
          jobType: sessionData.job_type,
          scaleId: sessionData.scale_id,
          answers: sessionData.answers as AnswerRecord[] | null,
          rawScore: sessionData.raw_score,
          standardScore: sessionData.standard_score,
          gradeLevel: sessionData.grade_level as GradeLevel | null,
          interpretation: sessionData.interpretation,
          startedAt: sessionData.started_at,
          completedAt: sessionData.completed_at,
        };

        // 2. Load scale info
        const { data: scaleData, error: scaleError } = await supabase
          .from('mha_scales')
          .select('name')
          .eq('id', session.scaleId)
          .single();

        if (cancelled) return;

        if (scaleError || !scaleData) {
          setError('无法加载量表信息');
          setLoading(false);
          return;
        }

        // 3. Load scale items (questions)
        const { data: itemsData, error: itemsError } = await supabase
          .from('mha_scale_items')
          .select('*')
          .eq('scale_id', session.scaleId)
          .order('item_order', { ascending: true });

        if (cancelled) return;

        if (itemsError) {
          setError('无法加载题目数据');
          setLoading(false);
          return;
        }

        const items: ScaleItem[] = (itemsData ?? []).map((row: Record<string, unknown>) => ({
          id: row.id as string,
          scaleId: row.scale_id as string,
          itemOrder: row.item_order as number,
          content: row.content as string,
          options: row.options as ScaleItem['options'],
          isReverseScored: row.is_reverse_scored as boolean,
        }));

        setData({
          session,
          scaleName: scaleData.name,
          items,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载详情失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  function handleBack() {
    navigate('/history');
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function getAnswerForItem(itemId: string): AnswerRecord | undefined {
    if (!data?.session.answers) return undefined;
    return data.session.answers.find((a) => a.itemId === itemId);
  }

  function getOptionTextForScore(item: ScaleItem, score: number): string {
    const option = item.options.find((o) => o.score === score);
    return option?.text ?? `得分: ${score}`;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            返回历史记录
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { session, scaleName, items } = data;

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-800 focus:outline-none focus:underline"
        aria-label="返回历史记录列表"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        返回历史记录
      </button>

      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">测评详情</h1>
        <p className="mt-1 text-sm text-gray-600">
          {formatDate(session.completedAt)} · {scaleName}
        </p>
      </div>

      {/* 基本信息 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">基本信息</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">姓名</span>
            <span className="font-medium text-gray-900">{session.participantName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">从业类型</span>
            <span className="font-medium text-gray-900">{session.jobType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">测评量表</span>
            <span className="font-medium text-gray-900">{scaleName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">测评日期</span>
            <span className="font-medium text-gray-900">
              {formatDate(session.completedAt)}
            </span>
          </div>
        </div>
      </div>

      {/* 评分结果 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">评分结果</h2>
        <div className="space-y-3">
          {session.rawScore !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">原始总分</span>
              <span className="text-lg font-bold text-gray-900">{session.rawScore}</span>
            </div>
          )}
          {session.standardScore !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">标准分</span>
              <span className="text-lg font-bold text-gray-900">{session.standardScore}</span>
            </div>
          )}
          {session.gradeLevel && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">等级判定</span>
              <GradeTag level={session.gradeLevel} />
            </div>
          )}
        </div>
      </div>

      {/* 结果解读 */}
      {session.interpretation && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">结果解读</h2>
          <p className="text-sm leading-relaxed text-gray-700">{session.interpretation}</p>
        </div>
      )}

      {/* 逐题作答详情 */}
      {session.answers && session.answers.length > 0 && items.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            逐题作答详情
          </h2>
          <div className="space-y-4">
            {items.map((item) => {
              const answer = getAnswerForItem(item.id);
              return (
                <div
                  key={item.id}
                  className="rounded-md border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
                      {item.itemOrder}
                    </span>
                    <p className="text-sm text-gray-800">{item.content}</p>
                  </div>
                  <div className="mt-2 ml-7 flex items-center gap-2">
                    {answer ? (
                      <>
                        <span className="text-xs text-gray-500">选择:</span>
                        <span className="text-sm font-medium text-green-700">
                          {getOptionTextForScore(item, answer.selectedScore)}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({answer.selectedScore}分)
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-400">未作答</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 底部返回按钮 */}
      <div className="pb-4">
        <button
          onClick={handleBack}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          返回历史记录
        </button>
      </div>
    </div>
  );
}
