interface RadioOptionProps {
  text: string;
  selected: boolean;
  onClick: () => void;
}

export function RadioOption({ text, selected, onClick }: RadioOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full min-h-[44px] min-w-[44px] flex items-center gap-3 px-4 py-3 rounded-lg border text-left text-base leading-relaxed transition-colors ${
        selected
          ? 'border-green-500 bg-green-50 text-green-800'
          : 'border-gray-300 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50/50'
      }`}
      aria-pressed={selected}
    >
      <span
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selected ? 'border-green-500' : 'border-gray-400'
        }`}
      >
        {selected && <span className="w-2.5 h-2.5 rounded-full bg-green-500" />}
      </span>
      <span className="text-[16px] leading-relaxed">{text}</span>
    </button>
  );
}
