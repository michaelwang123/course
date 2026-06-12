import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRecordDetail } from '../../services/historyService';
import { formatTime } from '../../lib/timerUtils';
import { ExamRecordDetail } from '../../types';

/**
 * ExamResultPage - Displays the exam score report and per-question details.
 *
 * Features:
 * - Fetches record detail by ID from historyService
 * - Displays ScoreReport: total score, student score, correct rate (1 decimal %), time used (mm:ss)
 * - Per-question details: content, student answer, correct answer, status
 * - Green background for correct (bg-green-50 border-green-200)
 * - Red background for incorrect (bg-red-50 border-red-200)
 * - Handles record save failure gracefully (show error but still display report)
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7
 */
const ExamResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<ExamRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('无效的记录ID');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchRecord() {
      setLoading(true);
      setError(null);

      try {
        const detail = await getRecordDetail(id!);
        if (cancelled) return;

        if (!detail) {
          setError('考试记录未找到');
        } else {
          setRecord(detail);
        }
      } catch (err) {
        if (cancelled) return;
        // Requirement 6.7: Handle record save failure gracefully
        // Show error but if we have any data, still display what we can
        setError(
          err instanceof Error ? err.message : '加载考试记录失败'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRecord();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Format answer for display (handles both string and string[] types)
  const formatAnswer = (answer: string | string[] | undefined): string => {
    if (answer === undefined || answer === null) return '未作答';
    if (Array.isArray(answer)) {
      return answer.length > 0 ? answer.join('、') : '未作答';
    }
    return answer || '未作答';
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载考试结果...</p>
        </div>
      </div>
    );
  }

  // Error state with no record data
  if (error && !record) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-600">加载失败</h2>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            onClick={() => navigate('/history')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回记录列表
          </button>
        </div>
      </div>
    );
  }

  if (!record) return null;

  const correctCount = record.details.filter((d) => d.isCorrect).length;
  const incorrectCount = record.details.length - correctCount;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Error banner - shows when record save failed but we still have report data (Requirement 6.7) */}
      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ {error}（成绩报告仍可正常查看）
          </p>
        </div>
      )}

      {/* Score Report Section - Requirements 6.1, 6.2 */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 mb-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          考试成绩报告
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Total Score */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">满分</p>
            <p className="text-3xl font-bold text-gray-800">
              {record.totalScore}
            </p>
          </div>

          {/* Student Score */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">得分</p>
            <p className="text-3xl font-bold text-blue-600">
              {record.score}
            </p>
          </div>

          {/* Correct Rate (1 decimal %) */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">正确率</p>
            <p className="text-3xl font-bold text-green-600">
              {record.correctRate.toFixed(1)}%
            </p>
          </div>

          {/* Time Used (mm:ss) */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">用时</p>
            <p className="text-3xl font-bold text-gray-700">
              {formatTime(record.durationSeconds)}
            </p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center gap-8 text-sm text-gray-600">
          <span>科目：{record.subject}</span>
          <span>总题数：{record.details.length}</span>
          <span className="text-green-600">正确：{correctCount}</span>
          <span className="text-red-600">错误：{incorrectCount}</span>
        </div>
      </div>

      {/* Per-question Details Section - Requirements 6.3, 6.4, 6.5 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">答题详情</h2>

        {record.details.map((detail, index) => (
          <div
            key={detail.questionId}
            className={`border rounded-lg p-5 ${
              detail.isCorrect
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {/* Question content */}
            <div className="flex items-start gap-2 mb-3">
              <span className="font-bold text-gray-700 whitespace-nowrap">
                {index + 1}.
              </span>
              <span className="text-gray-900">{detail.content}</span>
            </div>

            {/* Answer details */}
            <div className="ml-6 space-y-1 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0">你的答案：</span>
                <span
                  className={
                    detail.isCorrect ? 'text-green-700' : 'text-red-700'
                  }
                >
                  {formatAnswer(detail.userAnswer)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0">正确答案：</span>
                <span className="text-green-700">
                  {formatAnswer(detail.correctAnswer)}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 shrink-0">状态：</span>
                <span
                  className={`font-medium ${
                    detail.isCorrect ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {detail.isCorrect ? '✓ 正确' : '✗ 错误'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <div className="mt-8 flex justify-center gap-4">
        <button
          onClick={() => navigate('/exam/config')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          再考一次
        </button>
        <button
          onClick={() => navigate('/history')}
          className="px-6 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
        >
          查看历史记录
        </button>
      </div>
    </div>
  );
};

export default ExamResultPage;
