import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestions } from '../../hooks/useQuestions';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { QuestionTable } from './components/QuestionTable';
import * as questionService from '../../services/questionService';

/**
 * QuestionListPage - Admin page for viewing, filtering, and managing questions.
 * Integrates QuestionTable with useQuestions hook, implements delete with ConfirmDialog,
 * and provides navigation to create/edit pages.
 *
 * Requirements: 2.4, 2.5, 2.7
 */
const QuestionListPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { questions, loading, error, subject, setSubject, refresh } = useQuestions();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch available subjects for the filter dropdown
  useEffect(() => {
    questionService.getSubjects().then(setSubjects).catch(() => {
      // Silently fail - subjects filter just won't be populated
    });
  }, []);

  const handleEdit = useCallback(
    (id: string) => {
      navigate(`/admin/questions/${id}/edit`);
    },
    [navigate]
  );

  const handleDeleteClick = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await questionService.remove(deleteTarget);
      showToast('success', '题目已删除');
      refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除失败';
      showToast('error', message);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, showToast, refresh]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleCreate = useCallback(() => {
    navigate('/admin/questions/new');
  }, [navigate]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">题目管理</h1>
        <button
          type="button"
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          新建题目
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12 text-gray-500">
          <p>加载中...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            type="button"
            onClick={refresh}
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
          >
            重试
          </button>
        </div>
      )}

      {/* Question table */}
      {!loading && !error && (
        <QuestionTable
          questions={questions}
          subjects={subjects}
          selectedSubject={subject ?? ''}
          onSubjectFilter={(value) => setSubject(value === '' ? undefined : value)}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="确认删除"
        message="确定要删除这道题目吗？此操作不可撤销。"
        confirmLabel={deleting ? '删除中...' : '删除'}
        cancelLabel="取消"
        confirmVariant="red"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default QuestionListPage;
