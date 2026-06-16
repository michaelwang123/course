/**
 * 加载指示器组件
 */
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-green-600" />
      <span className="ml-3 text-green-700">加载中...</span>
    </div>
  );
}
