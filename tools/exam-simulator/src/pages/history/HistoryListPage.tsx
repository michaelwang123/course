import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecords } from '../../services/historyService';
import { getSubjects } from '../../services/questionService';
import { formatTime } from '../../lib/timerUtils';
import { ExamRecord } from '../../types';

const PAGE_SIZE = 20;

const HistoryListPage: React.FC = () => {
  const navigate = useNavigate();

  // Data state
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Track if any filter has ever been applied (to distinguish empty vs no-match)
  const [hasAppliedFilter, setHasAppliedFilter] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRecords({
        page: currentPage,
        pageSize: PAGE_SIZE,
        subject: selectedSubject || undefined,
        startDate: startDate || undefined,
        endDate: endDate ? `${endDate}T23:59:59.999Z` : undefined,
      });
      setRecords(result.records);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载记录失败');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedSubject, startDate, endDate]);

  // Load subjects for the filter dropdown
  useEffect(() => {
    async function loadSubjects() {
      try {
        const subjectList = await getSubjects();
        setSubjects(subjectList);
      } catch {
        // Non-critical; filter will just be unavailable
      }
    }
    loadSubjects();
  }, []);

  // Fetch records when page or filters change
  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSubjectChange = (value: string) => {
    setSelectedSubject(value);
    setCurrentPage(1);
    setHasAppliedFilter(true);
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setCurrentPage(1);
    setHasAppliedFilter(true);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    setCurrentPage(1);
    setHasAppliedFilter(true);
  };

  const handleRowClick = (id: string) => {
    navigate(`/history/${id}`);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isFiltering = selectedSubject || startDate || endDate;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">考试记录</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        {/* Subject filter */}
        <div className="flex flex-col">
          <label htmlFor="subject-filter" className="text-sm text-gray-600 mb-1">
            科目
          </label>
          <select
            id="subject-filter"
            value={selectedSubject}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部科目</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* Start date filter */}
        <div className="flex flex-col">
          <label htmlFor="start-date-filter" className="text-sm text-gray-600 mb-1">
            开始日期
          </label>
          <input
            id="start-date-filter"
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* End date filter */}
        <div className="flex flex-col">
          <label htmlFor="end-date-filter" className="text-sm text-gray-600 mb-1">
            结束日期
          </label>
          <input
            id="end-date-filter"
            type="date"
            value={endDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={fetchRecords}
            className="ml-4 text-red-700 underline hover:text-red-900"
          >
            重试
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12 text-gray-500">加载中...</div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Empty state - no records at all */}
          {total === 0 && !isFiltering && !hasAppliedFilter && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">暂无考试记录</p>
              <p className="text-gray-400 text-sm mt-2">完成一次考试后，记录将显示在这里</p>
            </div>
          )}

          {/* No match state - filters applied but no results */}
          {total === 0 && (isFiltering || hasAppliedFilter) && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">无匹配结果</p>
              <p className="text-gray-400 text-sm mt-2">尝试调整筛选条件</p>
            </div>
          )}

          {/* Records table */}
          {total > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse bg-white rounded-lg shadow-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        日期
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        科目
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        得分
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        正确率
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                        用时
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        onClick={() => handleRowClick(record.id)}
                        className="border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatDate(record.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {record.subject}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {record.score}/{record.totalScore}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {record.correctRate.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatTime(record.durationSeconds)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  <span className="text-sm text-gray-600">
                    第 {currentPage} / {totalPages} 页
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryListPage;
