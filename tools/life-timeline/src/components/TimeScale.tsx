// src/components/TimeScale.tsx
// 时间刻度组件：暗色主题

import type { ScaleMark } from '@/lib/position-calculator';

interface TimeScaleProps {
  scaleMarks: ScaleMark[];
  containerWidth: number;
}

export function TimeScale({ scaleMarks, containerWidth }: TimeScaleProps) {
  if (scaleMarks.length === 0 || containerWidth <= 0) {
    return null;
  }

  return (
    <div
      className="relative w-full h-8 border-t border-gray-800 overflow-hidden select-none"
      role="presentation"
      aria-label="时间刻度"
    >
      {scaleMarks.map((mark, index) => (
        <div
          key={`${mark.label}-${index}`}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${mark.position}px` }}
        >
          {/* Tick mark */}
          <div
            className={[
              'w-px',
              mark.type === 'major' ? 'h-3 bg-emerald-600' : 'h-2 bg-gray-700',
            ].join(' ')}
          />
          {/* Label */}
          <span
            className={[
              'text-center whitespace-nowrap',
              mark.type === 'major'
                ? 'text-xs font-medium text-emerald-300'
                : 'text-[10px] text-gray-500',
            ].join(' ')}
            style={{ transform: 'translateX(-50%)' }}
          >
            {mark.label}
          </span>
        </div>
      ))}
    </div>
  );
}
