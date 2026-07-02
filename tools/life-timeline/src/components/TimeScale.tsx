// src/components/TimeScale.tsx
// 时间刻度组件：暗色主题 + 发光主刻度

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
      className="relative w-full h-10 border-t border-gray-800/60 overflow-hidden select-none bg-dark-900/50"
      role="presentation"
      aria-label="时间刻度"
    >
      {scaleMarks.map((mark, index) => (
        <div
          key={`${mark.label}-${index}`}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: `${mark.position}px` }}
        >
          {/* Tick mark with glow for major */}
          <div
            className={[
              'w-px',
              mark.type === 'major'
                ? 'h-4 bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.5)]'
                : 'h-2.5 bg-gray-700',
            ].join(' ')}
          />
          {/* Label */}
          <span
            className={[
              'text-center whitespace-nowrap mt-0.5',
              mark.type === 'major'
                ? 'text-xs font-semibold text-emerald-300'
                : 'text-[10px] text-gray-600',
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
