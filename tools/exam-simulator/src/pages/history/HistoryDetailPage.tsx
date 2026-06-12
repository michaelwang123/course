import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRecordDetail } from '../../services/historyService';
import { formatTime } from '../../lib/timerUtils';
import { ExamRecordDetail, Question, QuestionResult } from '../../types';

const HistoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<ExamRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getRecordDetail(id);
        if (!data) {
          setError('未找到该考试记录');
        } else {
          setRecord(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载考试记录失败');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-gray-500 text-lg">加载中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <Link
          to="/history"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          返回记录列表
        </Link>
      </div>
    );
  }

  if (!record) {
    return null;
  }

  const questionsMap = new Map<string, Question>(
    record.questions.map((q) => [q.id, q])
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        to="/history"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        ← 返回记录列表
      </Link>

      {/* Score Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">考试详情</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500">科目</p>
            <p className="text-lg font-semibold text-gray-800">
              {record.subject}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">得分</p>
            <p className="text-lg font-semibold text-gray-800">
              {record.score} / {record.totalScore}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">正确率</p>
            <p className="text-lg font-semibold text-gray-800">
              {record.correctRate.toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">用时</p>
            <p className="text-lg font-semibold text-gray-800">
              {formatTime(record.durationSeconds)}
            </p>
          </div>
        </div>
      </div>

      {/* Per-question details */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800">答题详情</h2>
        {record.details.map((detail: QuestionResult, index: number) => {
          const question = questionsMap.get(detail.questionId);
          const isCorrect = detail.isCorrect;

          return (
            <div
              key={detail.questionId}
              className={`rounded-lg border p-4 ${
                isCorrect
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800">
                  第 {index + 1} 题
                  {question && (
                    <span className="ml-2 text-xs text-gray-500 font-normal">
                      ({question.type === 'single'
                        ? '单选题'
                        : question.type === 'multiple'
                        ? '多选题'
                        : '判断题'}
                      ，{detail.score} 分)
                    </span>
                  )}
                </h3>
                <span
                  className={`text-sm font-medium px-2 py-0.5 rounded ${
                    isCorrect
                      ? 'bg-green-200 text-green-800'
                      : 'bg-red-200 text-red-800'
                  }`}
                >
                  {isCorrect ? '正确' : '错误'}
                </span>
              </div>

              {/* Question content */}
              <p className="text-gray-700 mb-3">
                {question ? question.content : detail.content}
              </p>

              {/* Student answer and correct answer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">你的答案：</span>
                  <span className={`ml-1 font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {formatAnswer(detail.userAnswer)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">正确答案：</span>
                  <span className="ml-1 font-medium text-green-700">
                    {formatAnswer(detail.correctAnswer)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Format an answer value (string or string[]) for display.
 */
function formatAnswer(answer: string | string[]): string {
  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer.join('、') : '未作答';
  }
  return answer || '未作答';
}

export default HistoryDetailPage;
