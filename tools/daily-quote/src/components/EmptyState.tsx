interface EmptyStateProps {
  type: 'no-data' | 'no-filter-results' | 'loading';
  onResetFilter?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onResetFilter }) => {
  if (type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <p className="text-lg text-[#5C5650] animate-pulse">
          正在加载金句...
        </p>
      </div>
    );
  }

  if (type === 'no-data') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-md mx-auto">
        <p className="text-xl text-[#2D2A26] font-serif mb-4">
          暂无可用金句
        </p>
        <p className="text-sm text-[#5C5650] leading-relaxed">
          金句数据来源于 <code className="px-1 py-0.5 bg-amber-50 rounded text-amber-800 text-xs">docs/book_read/</code> 目录下的 Markdown 文件。请确认该目录中包含含有金句表格的读书笔记，并重新运行构建。
        </p>
      </div>
    );
  }

  // type === 'no-filter-results'
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-lg text-[#2D2A26] font-serif mb-4">
        当前筛选条件下没有金句
      </p>
      {onResetFilter && (
        <button
          onClick={onResetFilter}
          className="px-5 py-2 text-sm bg-amber-700 text-white rounded-md hover:bg-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 transition-colors"
        >
          重置筛选
        </button>
      )}
    </div>
  );
};

export default EmptyState;
