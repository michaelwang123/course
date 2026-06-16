interface OptionEditorProps {
  itemIndex: number;
  optionIndex: number;
  text: string;
  score: number;
  canRemove: boolean;
  textError?: string;
  scoreError?: string;
  onTextChange: (text: string) => void;
  onScoreChange: (score: number) => void;
  onRemove: () => void;
}

/**
 * 单个选项编辑器
 * 包含选项文本和分值输入
 */
export function OptionEditor({
  itemIndex,
  optionIndex,
  text,
  score,
  canRemove,
  textError,
  scoreError,
  onTextChange,
  onScoreChange,
  onRemove,
}: OptionEditorProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        maxLength={100}
        placeholder={`选项${optionIndex + 1}文本`}
        className={`flex-1 rounded-md border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 ${
          textError ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
        aria-label={`第 ${itemIndex + 1} 题选项 ${optionIndex + 1} 文本`}
        aria-invalid={!!textError}
      />
      <input
        type="number"
        value={score}
        onChange={(e) => onScoreChange(parseInt(e.target.value) || 0)}
        min={0}
        max={10}
        className={`w-16 rounded-md border px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500 ${
          scoreError ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
        aria-label={`第 ${itemIndex + 1} 题选项 ${optionIndex + 1} 分值`}
        aria-invalid={!!scoreError}
      />
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded border border-red-200 px-1.5 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors"
          aria-label={`删除第 ${itemIndex + 1} 题选项 ${optionIndex + 1}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
