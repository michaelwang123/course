interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

/**
 * 错误提示组件
 * 显示错误信息，可选重试按钮
 */
export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
        >
          重试
        </button>
      )}
    </div>
  );
}
