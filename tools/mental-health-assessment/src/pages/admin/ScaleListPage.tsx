import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScales } from '@/hooks/useScales';
import { supabase } from '@/lib/supabase';
import { Pagination } from '@/components/Pagination';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import type { Scale } from '@/types/scale';

const PAGE_SIZE = 20;

/**
 * 量表列表页面
 * 展示所有已录入的量表，提供新建、编辑、删除操作
 * 按创建时间倒序排列，每页最多展示 20 条记录
 */
export function ScaleListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { scales, loading, error, total } = useScales(page, PAGE_SIZE);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // 删除确认对话框状态
  const [deleteTarget, setDeleteTarget] = useState<Scale | null>(null);
  const [relatedRecordCount, setRelatedRecordCount] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * 点击删除按钮，检查关联记录数量后显示确认对话框
   */
  async function handleDeleteClick(scale: Scale) {
    setDeleteError(null);
    try {
      const { count, error: countError } = await supabase
        .from('mha_assessment_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('scale_id', scale.id);

      if (countError) {
        setDeleteError('无法检查关联记录，请重试');
        return;
      }

      setRelatedRecordCount(count ?? 0);
      setDeleteTarget(scale);
    } catch {
      setDeleteError('无法检查关联记录，请重试');
    }
  }

  /**
   * 确认删除量表
   */
  async function handleConfirmDelete() {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { error: deleteErr } = await supabase
        .from('mha_scales')
        .delete()
        .eq('id', deleteTarget.id);

      if (deleteErr) {
        setDeleteError('删除失败，请重试');
      } else {
        // 删除成功后刷新页面（重新触发 useScales）
        setDeleteTarget(null);
        // Force re-render by resetting page if needed
        if (scales.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          // Trigger refetch by toggling page
          setPage(0);
          setTimeout(() => setPage(page), 0);
        }
      }
    } catch {
      setDeleteError('删除失败，请重试');
    } finally {
      setIsDeleting(false);
    }
  }

  /**
   * 取消删除
   */
  function handleCancelDelete() {
    setDeleteTarget(null);
    setRelatedRecordCount(0);
  }

  // 构建删除确认消息
  function getDeleteMessage(): string {
    if (!deleteTarget) return '';
    if (relatedRecordCount > 0) {
      return `该量表"${deleteTarget.name}"已有 ${relatedRecordCount} 条测评记录，删除后相关记录也将被移除。确认删除？`;
    }
    return `确认删除量表"${deleteTarget.name}"及其所有题目？此操作不可撤销。`;
  }

  return (
    <div>
      {/* 页面标题和新建按钮 */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">量表管理</h2>
        <button
          onClick={() => navigate('/admin/scales/new')}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          新建量表
        </button>
      </div>

      {/* 删除错误提示 */}
      {deleteError && (
        <div className="mb-4">
          <ErrorMessage message={deleteError} />
        </div>
      )}

      {/* 加载状态 */}
      {loading && <LoadingSpinner />}

      {/* 错误状态 */}
      {!loading && error && (
        <ErrorMessage
          message="加载量表列表失败，请稍后重试"
          onRetry={() => {
            setPage(0);
            setTimeout(() => setPage(1), 0);
          }}
        />
      )}

      {/* 空状态 */}
      {!loading && !error && scales.length === 0 && (
        <div className="rounded-lg border border-green-200 bg-white p-8 text-center">
          <p className="text-gray-500">暂无量表数据</p>
          <button
            onClick={() => navigate('/admin/scales/new')}
            className="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            创建第一个量表
          </button>
        </div>
      )}

      {/* 量表列表 */}
      {!loading && !error && scales.length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border border-green-200 bg-white shadow-sm">
            {/* 表头 - 桌面端显示 */}
            <div className="hidden border-b border-green-100 bg-green-50 px-4 py-3 sm:grid sm:grid-cols-12 sm:gap-4">
              <span className="col-span-3 text-sm font-medium text-green-800">量表名称</span>
              <span className="col-span-2 text-sm font-medium text-green-800">类型</span>
              <span className="col-span-2 text-sm font-medium text-green-800">题目数量</span>
              <span className="col-span-2 text-sm font-medium text-green-800">预计时间</span>
              <span className="col-span-3 text-sm font-medium text-green-800 text-right">操作</span>
            </div>

            {/* 列表项 */}
            <ul className="divide-y divide-green-100">
              {scales.map((scale) => (
                <li
                  key={scale.id}
                  className="px-4 py-4 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                >
                  {/* 量表名称 */}
                  <div className="col-span-3">
                    <p className="font-medium text-gray-900">{scale.name}</p>
                  </div>

                  {/* 类型 */}
                  <div className="col-span-2 mt-1 sm:mt-0">
                    <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {scale.scaleType}
                    </span>
                  </div>

                  {/* 题目数量 */}
                  <div className="col-span-2 mt-1 sm:mt-0">
                    <span className="text-sm text-gray-600">{scale.itemCount} 题</span>
                  </div>

                  {/* 预计时间 */}
                  <div className="col-span-2 mt-1 sm:mt-0">
                    <span className="text-sm text-gray-600">{scale.estimatedMinutes} 分钟</span>
                  </div>

                  {/* 操作按钮 */}
                  <div className="col-span-3 mt-3 flex items-center justify-end gap-2 sm:mt-0">
                    <button
                      onClick={() => navigate(`/admin/scales/${scale.id}/edit`)}
                      className="rounded-md border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDeleteClick(scale)}
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      删除
                    </button>
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

      {/* 删除确认对话框 */}
      {deleteTarget && (
        <ConfirmDialog
          title="删除量表"
          message={getDeleteMessage()}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}
