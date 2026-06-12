import React from 'react';

export interface QuestionNavBarProps {
  /** Total number of questions */
  totalQuestions: number;
  /** Set of answered question IDs */
  answeredQuestions: Set<string>;
  /** Ordered array mapping index to question ID */
  questionIds: string[];
  /** Callback when a question button is clicked */
  onNavigate: (questionId: string, index: number) => void;
}

export const QuestionNavBar: React.FC<QuestionNavBarProps> = ({
  totalQuestions,
  answeredQuestions,
  questionIds,
  onNavigate,
}) => {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      {Array.from({ length: totalQuestions }, (_, index) => {
        const questionId = questionIds[index] ?? '';
        const isAnswered = answeredQuestions.has(questionId);

        return (
          <button
            key={questionId || index}
            type="button"
            onClick={() => onNavigate(questionId, index)}
            className={`w-9 h-9 flex items-center justify-center text-sm font-medium rounded transition-colors ${
              isAnswered
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50'
            }`}
            aria-label={`题目 ${index + 1}${isAnswered ? '（已作答）' : '（未作答）'}`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
};
