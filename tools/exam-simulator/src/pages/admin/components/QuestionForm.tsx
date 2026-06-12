import React, { useState, useEffect } from 'react';
import { QuestionInput, QuestionType, ValidationResult } from '../../../types';
import { validateQuestion } from '../../../lib/validation';
import { OptionEditor } from './OptionEditor';

interface QuestionFormProps {
  initialData?: QuestionInput;
  onSubmit: (data: QuestionInput) => Promise<void>;
  isSubmitting?: boolean;
}

const DEFAULT_BOOLEAN_OPTIONS = ['正确', '错误'];
const DEFAULT_SINGLE_OPTIONS = ['', ''];
const DEFAULT_MULTIPLE_OPTIONS = ['', '', ''];

function getDefaultFormData(type: QuestionType = 'single'): QuestionInput {
  if (type === 'boolean') {
    return {
      type: 'boolean',
      content: '',
      options: [...DEFAULT_BOOLEAN_OPTIONS],
      correctAnswer: '',
      score: 10,
      subject: '',
    };
  }
  if (type === 'multiple') {
    return {
      type: 'multiple',
      content: '',
      options: [...DEFAULT_MULTIPLE_OPTIONS],
      correctAnswer: [],
      score: 10,
      subject: '',
    };
  }
  return {
    type: 'single',
    content: '',
    options: [...DEFAULT_SINGLE_OPTIONS],
    correctAnswer: '',
    score: 10,
    subject: '',
  };
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState<QuestionInput>(
    initialData || getDefaultFormData()
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleTypeChange = (newType: QuestionType) => {
    if (newType === formData.type) return;

    // Reset options and correctAnswer based on new type
    if (newType === 'boolean') {
      setFormData({
        ...formData,
        type: newType,
        options: [...DEFAULT_BOOLEAN_OPTIONS],
        correctAnswer: '',
      });
    } else if (newType === 'multiple') {
      setFormData({
        ...formData,
        type: newType,
        options: formData.type === 'boolean' ? [...DEFAULT_MULTIPLE_OPTIONS] : formData.options.length >= 3 ? formData.options : [...DEFAULT_MULTIPLE_OPTIONS],
        correctAnswer: [],
      });
    } else {
      setFormData({
        ...formData,
        type: newType,
        options: formData.type === 'boolean' ? [...DEFAULT_SINGLE_OPTIONS] : formData.options.length >= 2 ? formData.options : [...DEFAULT_SINGLE_OPTIONS],
        correctAnswer: '',
      });
    }
    setErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result: ValidationResult = validateQuestion(formData);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Question Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          题目类型
        </label>
        <select
          value={formData.type}
          onChange={(e) => handleTypeChange(e.target.value as QuestionType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="single">单选题</option>
          <option value="multiple">多选题</option>
          <option value="boolean">判断题</option>
        </select>
        {errors.type && (
          <p className="text-red-500 text-xs mt-1">{errors.type}</p>
        )}
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          科目
        </label>
        <input
          type="text"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          placeholder="如：数学、语文、英语"
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          maxLength={50}
        />
        {errors.subject && (
          <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
        )}
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          题目内容
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          placeholder="请输入题目内容"
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          maxLength={2000}
        />
        <p className="text-xs text-gray-400 mt-1">
          {formData.content.length}/2000
        </p>
        {errors.content && (
          <p className="text-red-500 text-xs mt-1">{errors.content}</p>
        )}
      </div>

      {/* Score */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          分值
        </label>
        <input
          type="number"
          value={formData.score}
          onChange={(e) =>
            setFormData({ ...formData, score: parseInt(e.target.value) || 0 })
          }
          min={1}
          max={100}
          className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        />
        {errors.score && (
          <p className="text-red-500 text-xs mt-1">{errors.score}</p>
        )}
      </div>

      {/* Options and Correct Answer */}
      <OptionEditor
        type={formData.type}
        options={formData.options}
        correctAnswer={formData.correctAnswer}
        onOptionsChange={(options) => setFormData({ ...formData, options })}
        onCorrectAnswerChange={(correctAnswer) =>
          setFormData({ ...formData, correctAnswer })
        }
        errors={{ options: errors.options, correctAnswer: errors.correctAnswer }}
      />

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          {isSubmitting ? '保存中...' : '保存题目'}
        </button>
      </div>
    </form>
  );
};
