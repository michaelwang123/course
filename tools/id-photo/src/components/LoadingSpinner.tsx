interface LoadingSpinnerProps {
  /** Optional message to display below the spinner */
  message?: string;
}

export function LoadingSpinner({ message = '加载中...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8" role="status" aria-live="polite">
      <div className="w-8 h-8 border-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
