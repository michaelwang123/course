// src/components/SkeletonLoader.tsx
// 骨架屏加载占位：时间轴加载时显示的占位 UI

interface SkeletonLoaderProps {
  lines?: number;
}

export function SkeletonLoader({ lines = 5 }: SkeletonLoaderProps) {
  return (
    <div className="w-full animate-pulse space-y-4 p-4" aria-label="加载中">
      {/* 时间轴骨架 */}
      <div className="h-2 bg-gray-200 rounded-full w-full" />

      {/* 事件节点骨架 */}
      <div className="flex items-center gap-4 mt-6">
        {Array.from({ length: lines }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="h-3 bg-gray-200 rounded w-16" />
          </div>
        ))}
      </div>

      {/* 底部刻度骨架 */}
      <div className="flex justify-between mt-4">
        {Array.from({ length: Math.min(lines, 6) }, (_, i) => (
          <div key={i} className="h-3 bg-gray-200 rounded w-12" />
        ))}
      </div>
    </div>
  );
}
