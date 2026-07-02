// src/components/TimeScale.tsx
// 时间刻度组件：年/月/日刻度标记，随缩放级别适配（完整实现见 task 8.3）

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
      className="relative w-full h-8 border-t border-gray-200 overflow-hidden select-none"
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
              'w-px bg-gray-300',
              mark.type === 'major' ? 'h-3' : 'h-2',
            ].join(' ')}
          />
          {/* Label */}
          <span
            className={[
              'text-center whitespace-nowrap',
              mark.type === 'major'
                ? 'text-xs font-medium text-gray-700'
                : 'text-[10px] text-gray-400',
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
