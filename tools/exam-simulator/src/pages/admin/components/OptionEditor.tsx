import React from 'react';
import { QuestionType } from '../../../types';

interface OptionEditorProps {
  type: QuestionType;
  options: string[];
  correctAnswer: string | string[];
  onOptionsChange: (options: string[]) => void;
  onCorrectAnswerChange: (answer: string | string[]) => void;
  errors?: { options?: string; correctAnswer?: string };
}

export const OptionEditor: React.FC<OptionEditorProps> = ({
  type,
  options,
  correctAnswer,
  onOptionsChange,
  onCorrectAnswerChange,
  errors,
}) => {
  const isBoolean = type === 'boolean';
  const isSingle = type === 'single';
  const isMultiple = type === 'multiple';

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    onOptionsChange(newOptions);
  };

  const handleAddOption = () => {
    if (options.length < 10) {
      onOptionsChange([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    const minOptions = isMultiple ? 3 : 2;
    if (options.length > minOptions) {
      const removedOption = options[index];
      const newOptions = options.filter((_, i) => i !== index);
      onOptionsChange(newOptions);

      // Clean up correctAnswer if removed option was selected
      if (isSingle && correctAnswer === removedOption) {
        onCorrectAnswerChange('');
      } else if (isMultiple && Array.isArray(correctAnswer)) {
        onCorrectAnswerChange(correctAnswer.filter((a) => a !== removedOption));
      }
    }
  };

  const handleSingleAnswerChange = (option: string) => {
    onCorrectAnswerChange(option);
  };

  const handleMultipleAnswerChange = (option: string, checked: boolean) => {
    const currentAnswers = Array.isArray(correctAnswer) ? correctAnswer : [];
    if (checked) {
      onCorrectAnswerChange([...currentAnswers, option]);
    } else {
      onCorrectAnswerChange(currentAnswers.filter((a) => a !== option));
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        选项 {isMultiple && <span className="text-blue-600 text-xs ml-1">(多选题)</span>}
      </label>

      {options.map((option, index) => (
        <div key={index} className="flex items-center gap-2">
          {/* Correct answer selector */}
          {(isSingle || isBoolean) && (
            <input
              type="radio"
              name="correctAnswer"
              checked={correctAnswer === option}
              onChange={() => handleSingleAnswerChange(option)}
              disabled={isBoolean && !option}
              className="h-4 w-4 text-blue-600 border-gray-300"
              aria-label={`选择 "${option}" 为正确答案`}
            />
          )}
          {isMultiple && (
            <input
              type="checkbox"
              checked={Array.isArray(correctAnswer) && correctAnswer.includes(option)}
              onChange={(e) => handleMultipleAnswerChange(option, e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded"
              aria-label={`选择 "${option}" 为正确答案`}
            />
          )}

          {/* Option text input */}
          <input
            type="text"
            value={option}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            disabled={isBoolean}
            placeholder={`选项 ${index + 1}`}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            maxLength={200}
          />

          {/* Remove button */}
          {!isBoolean && options.length > (isMultiple ? 3 : 2) && (
            <button
              type="button"
              onClick={() => handleRemoveOption(index)}
              className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
              aria-label={`删除选项 ${index + 1}`}
            >
              删除
            </button>
          )}
        </div>
      ))}

      {/* Add option button */}
      {!isBoolean && options.length < 10 && (
        <button
          type="button"
          onClick={handleAddOption}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + 添加选项
        </button>
      )}

      {/* Error messages */}
      {errors?.options && (
        <p className="text-red-500 text-xs mt-1">{errors.options}</p>
      )}
      {errors?.correctAnswer && (
        <p className="text-red-500 text-xs mt-1">{errors.correctAnswer}</p>
      )}
    </div>
  );
};
