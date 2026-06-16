interface ProgressBarProps {
  /** 进度百分比 0-100 */
  percentage: number;
}

export function ProgressBar({ percentage }: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full bg-gray-200 rounded-full h-3" role="progressbar" aria-valuenow={clampedPercentage} aria-valuemin={0} aria-valuemax={100} aria-label={`测评进度 ${clampedPercentage}%`}>
      <div
        className="bg-green-500 h-3 rounded-full transition-all duration-300"
        style={{ width: `${clampedPercentage}%` }}
      />
    </div>
  );
}
