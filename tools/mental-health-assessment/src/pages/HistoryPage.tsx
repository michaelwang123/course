import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateParticipantName } from '@/lib/validators';
import { supabase } from '@/lib/supabase';
import { useHistory } from '@/hooks/useHistory';
import { GradeTag } from '@/components/GradeTag';
import { Pagination } from '@/components/Pagination';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

const SCALE_TYPE_OPTIONS = ['全部', '抑郁', '焦虑', '综合症状', '一般健康'] as const;

/**
 * 历史记录查询页面
 * 路由: /history
 * 测评者输入姓名查询自己的测评历史，支持按量表类型筛选
 */
export function HistoryPage() {
  const navigate = useNavigate();

  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [queriedName, setQueriedName] = useState('');
  const [scaleTypeFilter, setScaleTypeFilter] = useState<string>('全部');
  const [page, setPage] = useState(1);
  const [scaleNames, setScaleNames] = useState<Record<string, string>>({});

  // 使用 ref 跟踪已有的 scaleNames 避免 useEffect 无限循环
  const scaleNamesRef = useRef<Record<string, string>>(scaleNames);
  scaleNamesRef.current = scaleNames;

  const activeScaleType = scaleTypeFilter === '全部' ? null : scaleTypeFilter;
  const { records, loading, error, total } = useHistory(queriedName, activeScaleType, page, 20);
  const totalPages = Math.ceil(total / 20);

  // 在 records 变化时获取缺失的量表名称（放入 useEffect 而非 render body）
  useEffect(() => {
    if (records.length === 0) return;

    const missingIds = records
      .map((r) => r.scaleId)
      .filter((id) => !scaleNamesRef.current[id]);

    // 去重
    const uniqueMissingIds = [...new Set(missingIds)];
    if (uniqueMissingIds.length === 0) return;

    let cancelled = false;

    async function fetchNames() {
      const { data } = await supabase
        .from('mha_scales')
        .select('id, name')
        .in('id', uniqueMissingIds);

      if (cancelled || !data) return;

      const newNames: Record<string, string> = {};
      data.forEach((s: { id: string; name: string }) => {
        newNames[s.id] = s.name;
      });
      setScaleNames((prev) => ({ ...prev, ...newNames }));
    }

    fetchNames();

    return () => {
      cancelled = true;
    };
  }, [records]);

  function handleQuery() {
    const validation = validateParticipantName(nameInput);
    if (!validation.valid) {
      setNameError(validation.errors[0]?.message ?? '输入格式错误');
      return;
    }
    setNameError(null);
    setPage(1);
    setQueriedName(nameInput.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      handleQuery();
    }
  }

  function handleFilterChange(newFilter: string) {
    setScaleTypeFilter(newFilter);
    setPage(1);
  }

  function handleRowClick(sessionId: string) {
    navigate(`/history/${sessionId}`);
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return '-';
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-900">测评历史记录</h1>
        <p className="mt-1 text-sm text-gray-600">输入姓名查询您的测评记录</p>
      </div>

      {/* 查询区域 */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="history-name-input"
              className="block text-sm font-medium text-gray-700"
            >
              姓名
            </label>
            <input
              id="history-name-input"
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value);
                if (nameError) setNameError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="请输入姓名"
              maxLength={20}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-base shadow-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              aria-describedby={nameError ? 'name-error' : undefined}
              aria-invalid={!!nameError}
            />
            {nameError && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">
                {nameError}
              </p>
            )}
          </div>
          <button
            onClick={handleQuery}
            className="rounded-lg bg-green-600 px-6 py-2 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            查询
          </button>
        </div>
      </div>

      {/* 筛选器 — 仅在有查询结果时显示 */}
      {queriedName && (
        <div className="flex items-center gap-2 overflow-x-auto" role="group" aria-label="量表类型筛选">
          <span className="shrink-0 text-sm text-gray-600">量表类型:</span>
          {SCALE_TYPE_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => handleFilterChange(opt)}
              aria-pressed={scaleTypeFilter === opt}
              className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                scaleTypeFilter === opt
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* 结果区域 */}
      {queriedName && (
        <div className="space-y-3">
          {loading && <LoadingSpinner />}

          {error && <ErrorMessage message={error} onRetry={handleQuery} />}

          {!loading && !error && records.length === 0 && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
              <p className="text-gray-500">
                {activeScaleType
                  ? '该筛选条件下无测评记录'
                  : '未找到该姓名的测评记录'}
              </p>
            </div>
          )}

          {!loading && !error && records.length > 0 && (
            <>
              <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white shadow-sm">
                {records.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => handleRowClick(record.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                    aria-label={`查看${formatDate(record.completedAt)}的测评详情`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {scaleNames[record.scaleId] ?? '加载中...'}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatDate(record.completedAt)}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-3">
                      {record.standardScore !== null && (
                        <span className="text-sm font-semibold text-gray-700">
                          {record.standardScore}分
                        </span>
                      )}
                      {record.gradeLevel && <GradeTag level={record.gradeLevel} />}
                    </div>
                  </button>
                ))}
              </div>

              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
