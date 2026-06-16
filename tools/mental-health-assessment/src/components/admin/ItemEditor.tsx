import { OptionEditor } from './OptionEditor';

interface FormOption {
  text: string;
  score: number;
}

interface ItemEditorProps {
  index: number;
  content: string;
  options: FormOption[];
  isReverseScored: boolean;
  errors: Record<string, string | undefined>;
  onContentChange: (content: string) => void;
  onReverseScoredChange: (value: boolean) => void;
  onOptionTextChange: (optionIndex: number, text: string) => void;
  onOptionScoreChange: (optionIndex: number, score: number) => void;
  onAddOption: () => void;
  onRemoveOption: (optionIndex: number) => void;
  onRemove: () => void;
}

/**
 * 单个题目编辑器
 * 包含题干、反向计分、选项列表
 */
export function ItemEditor({
  index,
  content,
  options,
  isReverseScored,
  errors,
  onContentChange,
  onReverseScoredChange,
  onOptionTextChange,
  onOptionScoreChange,
  onAddOption,
  onRemoveOption,
  onRemove,
}: ItemEditorProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      {/* Item header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          第 {index + 1} 题
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
          aria-label={`删除第 ${index + 1} 题`}
        >
          删除
        </button>
      </div>

      {/* Content */}
      <div className="mb-3">
        <label
          htmlFor={`item-content-${index}`}
          className="mb-1 block text-xs font-medium text-gray-600"
        >
          题干内容
        </label>
        <input
          id={`item-content-${index}`}
          type="text"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          maxLength={200}
          placeholder="请输入题干内容（最多200字符）"
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
            errors[`item_${index}_content`] ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          aria-invalid={!!errors[`item_${index}_content`]}
        />
        {errors[`item_${index}_content`] && (
          <p className="mt-1 text-xs text-red-600">{errors[`item_${index}_content`]}</p>
        )}
      </div>

      {/* Reverse scoring checkbox */}
      <div className="mb-3">
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={isReverseScored}
            onChange={(e) => onReverseScoredChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          反向计分
        </label>
      </div>

      {/* Options */}
      <div className="mb-2">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            选项 ({options.length})
          </span>
          {options.length < 10 && (
            <button
              type="button"
              onClick={onAddOption}
              className="rounded border border-green-300 px-2 py-0.5 text-xs text-green-700 hover:bg-green-50 transition-colors"
            >
              添加选项
            </button>
          )}
        </div>

        {errors[`item_${index}_options`] && (
          <p className="mb-2 text-xs text-red-600">{errors[`item_${index}_options`]}</p>
        )}

        <div className="space-y-2">
          {options.map((option, optIndex) => (
            <OptionEditor
              key={optIndex}
              itemIndex={index}
              optionIndex={optIndex}
              text={option.text}
              score={option.score}
              canRemove={options.length > 2}
              textError={errors[`item_${index}_option_${optIndex}_text`]}
              scoreError={errors[`item_${index}_option_${optIndex}_score`]}
              onTextChange={(text) => onOptionTextChange(optIndex, text)}
              onScoreChange={(score) => onOptionScoreChange(optIndex, score)}
              onRemove={() => onRemoveOption(optIndex)}
            />
          ))}
        </div>

        {/* Show option-level errors */}
        {options.map((_, optIndex) => (
          <div key={optIndex}>
            {errors[`item_${index}_option_${optIndex}_text`] && (
              <p className="mt-1 text-xs text-red-600">
                {errors[`item_${index}_option_${optIndex}_text`]}
              </p>
            )}
            {errors[`item_${index}_option_${optIndex}_score`] && (
              <p className="mt-1 text-xs text-red-600">
                {errors[`item_${index}_option_${optIndex}_score`]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
