import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { calculateScore, type ScoringResult } from '@/lib/scoring-engine';
import { clearProgress } from '@/lib/storage';
import { useAssessmentContext } from '@/context/AssessmentContext';
import { GradeTag } from '@/components/GradeTag';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Disclaimer } from '@/components/Disclaimer';
import type { Scale } from '@/types/scale';
import type { AnswerRecord, GradeLevel } from '@/types/assessment';

interface ResultData {
  participantName: string;
  jobType: '月嫂' | '老人护理';
  scaleName: string;
  rawScore: number;
  standardScore: number | null;
  gradeLevel: GradeLevel;
  interpretation: string;
  advice: string;
}

/**
 * 结果展示页
 * 展示测评者的评分结果、等级判定和建议信息
 * 路由: /result/:sessionId
 */
export function ResultPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useAssessmentContext();

  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('无效的测评会话');
      setLoading(false);
      return;
    }

    calculateAndSaveResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  async function calculateAndSaveResult() {
    try {
      // 优先从 Supabase 加载已保存的结果（AssessmentPage.submit 已计算并保存）
      // 仅在数据尚未持久化时使用 context 计算作为降级方案
      await loadFromSupabase();
    } catch (err) {
      // 如果 Supabase 加载失败，尝试从 context 计算（降级方案）
      if (
        state.sessionId === sessionId &&
        state.items.length > 0 &&
        Object.keys(state.answers).length > 0
      ) {
        try {
          await calculateFromContext();
        } catch (contextErr) {
          setError(contextErr instanceof Error ? contextErr.message : '加载结果失败');
        }
      } else {
        setError(err instanceof Error ? err.message : '加载结果失败');
      }
    } finally {
      setLoading(false);
    }
  }

  async function calculateFromContext() {
    // Fetch the scale data for scoring rule and grade thresholds
    const { data: scaleData, error: scaleError } = await supabase
      .from('mha_scales')
      .select('*')
      .eq('id', state.scaleId)
      .single();

    if (scaleError || !scaleData) {
      throw new Error('无法加载量表评分规则');
    }

    const scale: Scale = {
      id: scaleData.id,
      name: scaleData.name,
      description: scaleData.description,
      scaleType: scaleData.scale_type,
      targetAudience: scaleData.target_audience,
      itemCount: scaleData.item_count,
      estimatedMinutes: scaleData.estimated_minutes,
      scoringRule: scaleData.scoring_rule,
      gradeThresholds: scaleData.grade_thresholds,
      createdAt: scaleData.created_at,
    };

    // Convert context answers (Record<string, number>) to AnswerRecord[]
    const answerRecords: AnswerRecord[] = Object.entries(state.answers).map(
      ([itemId, selectedScore]) => ({ itemId, selectedScore })
    );

    // Calculate score
    const scoringResult: ScoringResult = calculateScore({
      answers: answerRecords,
      items: state.items,
      scoringRule: scale.scoringRule,
      gradeThresholds: scale.gradeThresholds,
    });

    const resultData: ResultData = {
      participantName: state.participantName,
      jobType: state.jobType!,
      scaleName: state.scaleName || scale.name,
      rawScore: scoringResult.rawScore,
      standardScore: scoringResult.standardScore,
      gradeLevel: scoringResult.gradeLevel,
      interpretation: scoringResult.interpretation,
      advice: scoringResult.advice,
    };

    setResult(resultData);

    // Save to Supabase
    await saveResultToSupabase(answerRecords, scoringResult);

    // Clear localStorage progress after successful display
    clearProgress();
  }

  async function loadFromSupabase() {
    // Load an already-completed session from the database
    const { data: sessionData, error: sessionError } = await supabase
      .from('mha_assessment_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !sessionData) {
      throw new Error('未找到测评记录');
    }

    // If the session doesn't have results yet, we can't display them
    if (!sessionData.grade_level) {
      throw new Error('该测评尚未完成');
    }

    // Get scale name
    const { data: scaleData } = await supabase
      .from('mha_scales')
      .select('name')
      .eq('id', sessionData.scale_id)
      .single();

    const resultData: ResultData = {
      participantName: sessionData.participant_name,
      jobType: sessionData.job_type,
      scaleName: scaleData?.name ?? '未知量表',
      rawScore: sessionData.raw_score ?? 0,
      standardScore: sessionData.standard_score ?? null,
      gradeLevel: sessionData.grade_level as GradeLevel,
      interpretation: sessionData.interpretation ?? '',
      advice:
        sessionData.grade_level === '正常'
          ? '继续保持积极心态'
          : '建议关注心理健康，如有需要请咨询专业人士',
    };

    setResult(resultData);

    // Clear localStorage in case it still has stale data
    clearProgress();
  }

  async function saveResultToSupabase(
    answerRecords: AnswerRecord[],
    scoringResult: ScoringResult
  ) {
    try {
      const { error: updateError } = await supabase
        .from('mha_assessment_sessions')
        .update({
          answers: answerRecords,
          raw_score: scoringResult.rawScore,
          standard_score: scoringResult.standardScore,
          grade_level: scoringResult.gradeLevel,
          interpretation: scoringResult.interpretation,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateError) {
        setSaveError('评分结果保存失败，但您可以查看当前评分');
      }
    } catch {
      setSaveError('评分结果保存失败，但您可以查看当前评分');
    }
  }

  function handleGoHome() {
    dispatch({ type: 'RESET' });
    navigate('/');
  }

  function handleTakeAnother() {
    dispatch({ type: 'RESET' });
    navigate('/');
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
            onClick={handleGoHome}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">测评结果</h1>
        <p className="mt-1 text-sm text-gray-600">
          您的心理健康评估报告
        </p>
      </div>

      {/* 保存错误提示 */}
      {saveError && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-700">{saveError}</p>
        </div>
      )}

      {/* 基本信息 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          基本信息
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">姓名</span>
            <span className="font-medium text-gray-900">
              {result.participantName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">从业类型</span>
            <span className="font-medium text-gray-900">
              {result.jobType}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">测评量表</span>
            <span className="font-medium text-gray-900">
              {result.scaleName}
            </span>
          </div>
        </div>
      </div>

      {/* 评分结果 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          评分结果
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">原始总分</span>
            <span className="text-lg font-bold text-gray-900">
              {result.rawScore}
            </span>
          </div>
          {result.standardScore !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">标准分</span>
              <span className="text-lg font-bold text-gray-900">
                {result.standardScore}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">等级判定</span>
            <GradeTag level={result.gradeLevel} />
          </div>
        </div>
      </div>

      {/* 结果解读 */}
      {result.interpretation && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            结果解读
          </h2>
          <p className="text-sm leading-relaxed text-gray-700">
            {result.interpretation}
          </p>
        </div>
      )}

      {/* 建议信息 */}
      <div
        className={`rounded-lg p-4 ${
          result.gradeLevel === '正常'
            ? 'border border-green-200 bg-green-50'
            : 'border border-yellow-200 bg-yellow-50'
        }`}
      >
        <h2 className="mb-2 text-base font-semibold text-gray-900">
          建议
        </h2>
        <p
          className={`text-sm leading-relaxed ${
            result.gradeLevel === '正常'
              ? 'text-green-700'
              : 'text-yellow-700'
          }`}
        >
          {result.advice}
        </p>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={handleGoHome}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          返回首页
        </button>
        <button
          onClick={handleTakeAnother}
          className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          再次测评
        </button>
      </div>

      {/* 免责声明 */}
      <div className="rounded-lg bg-green-50 p-4">
        <Disclaimer />
      </div>
    </div>
  );
}
