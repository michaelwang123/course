import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QuestionInput } from '../../types';
import { useToast } from '../../components/Toast';
import * as questionService from '../../services/questionService';
import { QuestionForm } from './components/QuestionForm';

export const QuestionFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEditMode = Boolean(id);

  const [initialData, setInitialData] = useState<QuestionInput | undefined>(undefined);
  const [loading, setLoading] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) {
      loadQuestion(id);
    }
  }, [id, isEditMode]);

  async function loadQuestion(questionId: string) {
    setLoading(true);
    setLoadError(null);
    try {
      const question = await questionService.getById(questionId);
      if (!question) {
        setLoadError('题目不存在或已被删除');
        return;
      }
      setInitialData({
        type: question.type,
        content: question.content,
        options: question.options,
        correctAnswer: question.correctAnswer,
        score: question.score,
        subject: question.subject,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载题目失败';
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(data: QuestionInput) {
    setIsSubmitting(true);
    try {
      if (isEditMode && id) {
        await questionService.update(id, data);
        showToast('success', '题目更新成功');
      } else {
        await questionService.create(data);
        showToast('success', '题目创建成功');
      }
      navigate('/admin/questions');
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败，请重试';
      showToast('error', message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{loadError}</p>
        <button
          onClick={() => navigate('/admin/questions')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          返回题目列表
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          {isEditMode ? '编辑题目' : '新建题目'}
        </h1>
        <button
          onClick={() => navigate('/admin/questions')}
          className="text-sm text-blue-600 hover:text-blue-800 mt-1"
        >
          ← 返回题目列表
        </button>
      </div>

      <QuestionForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};
