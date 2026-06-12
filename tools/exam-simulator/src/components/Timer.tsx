import React from 'react';

interface TimerProps {
  remainingSeconds: number;
  formattedTime: string;
  isWarning: boolean;
  isCritical: boolean;
}

/**
 * Timer component displays the exam countdown with color-coded urgency.
 *
 * - Default: normal text color
 * - Warning (< 5 minutes): orange text
 * - Critical (< 60 seconds): red text
 */
export const Timer: React.FC<TimerProps> = ({
  formattedTime,
  isWarning,
  isCritical,
}) => {
  const colorClass = isCritical
    ? 'text-red-600'
    : isWarning
      ? 'text-orange-500'
      : 'text-gray-800';

  return (
    <div className={`font-mono text-lg font-semibold ${colorClass}`}>
      剩余时间：{formattedTime}
    </div>
  );
};

export default Timer;
