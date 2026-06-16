import { RadioOption } from './RadioOption';

interface QuestionCardProps {
  /** 当前题号（从1开始） */
  questionNumber: number;
  /** 总题数 */
  totalQuestions: number;
  /** 题干内容 */
  content: string;
  /** 选项列表 */
  options: Array<{ text: string; score: number }>;
  /** 当前选中的分值（undefined 表示未作答） */
  selectedScore?: number;
  /** 选项选择回调 */
  onSelect: (score: number) => void;
}

export function QuestionCard({
  questionNumber,
  totalQuestions,
  content,
  options,
  selectedScore,
  onSelect,
}: QuestionCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="text-sm text-gray-500 mb-2">
        第 {questionNumber}/{totalQuestions} 题
      </div>
      <p className="text-[18px] leading-relaxed text-gray-900 mb-6">{content}</p>
      <div className="flex flex-col gap-3">
        {options.map((option) => (
          <RadioOption
            key={option.score}
            text={option.text}
            selected={selectedScore === option.score}
            onClick={() => onSelect(option.score)}
          />
        ))}
      </div>
    </div>
  );
}
