import React from 'react';
import { Question, QuestionType } from '../../../types';

export interface QuestionTableProps {
  questions: Question[];
  subjects: string[];
  selectedSubject: string;
  onSubjectFilter: (subject: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const typeLabels: Record<QuestionType, string> = {
  single: '单选',
  multiple: '多选',
  boolean: '判断',
};

function truncateContent(content: string, maxLength: number = 50): string {
  if (content.length <= maxLength) return content;
  return content.slice(0, maxLength) + '...';
}

/**
 * Displays a table of questions with content summary, type, subject, score,
 * and edit/delete action buttons per row. Includes a subject filter dropdown.
 *
 * Requirements: 2.4, 2.7
 */
export const QuestionTable: React.FC<QuestionTableProps> = ({
  questions,
  subjects,
  selectedSubject,
  onSubjectFilter,
  onEdit,
  onDelete,
}) => {
  return (
    <div>
      {/* Subject filter dropdown */}
      <div className="mb-4">
        <label htmlFor="subject-filter" className="text-sm font-medium text-gray-700 mr-2">
          按科目筛选：
        </label>
        <select
          id="subject-filter"
          value={selectedSubject}
          onChange={(e) => onSubjectFilter(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">全部科目</option>
          {subjects.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      {/* Question table */}
      {questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>暂无题目数据</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse bg-white rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 font-medium text-gray-700">题目内容</th>
                <th className="px-4 py-3 font-medium text-gray-700 w-20">类型</th>
                <th className="px-4 py-3 font-medium text-gray-700 w-24">科目</th>
                <th className="px-4 py-3 font-medium text-gray-700 w-16">分值</th>
                <th className="px-4 py-3 font-medium text-gray-700 w-32 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr
                  key={question.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-800" title={question.content}>
                    {truncateContent(question.content)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {typeLabels[question.type]}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {question.subject}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {question.score}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onEdit(question.id)}
                      className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors mr-2"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(question.id)}
                      className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
