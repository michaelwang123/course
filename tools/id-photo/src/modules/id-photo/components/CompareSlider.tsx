import { useState, useRef, useCallback, useEffect } from 'react';

interface CompareSliderProps {
  /** data URL or object URL for "before" image */
  beforeImage: string;
  /** data URL or object URL for "after" image */
  afterImage: string;
  /** Label for the before image, default "原图" */
  beforeLabel?: string;
  /** Label for the after image, default "处理后" */
  afterLabel?: string;
}

type ViewMode = 'slider' | 'side-by-side';

/**
 * CompareSlider — 处理前后对比组件
 *
 * 功能:
 * - 滑动对比模式（默认）：两张图叠加，垂直分割线可拖拽
 * - 并排对比模式：两张图左右并排显示
 * - 顶部切换按钮在两种模式间切换
 * - 支持鼠标和触摸事件
 * - ARIA 无障碍支持
 */
export function CompareSlider({
  beforeImage,
  afterImage,
  beforeLabel = '原图',
  afterLabel = '处理后',
}: CompareSliderProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('slider');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate slider position from pointer event
  const getPositionFromEvent = useCallback(
    (clientX: number): number => {
      if (!containerRef.current) return sliderPosition;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      return Math.max(0, Math.min(100, percentage));
    },
    [sliderPosition],
  );

  // Mouse event handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setSliderPosition(getPositionFromEvent(e.clientX));
    },
    [getPositionFromEvent],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setSliderPosition(getPositionFromEvent(e.clientX));
    },
    [isDragging, getPositionFromEvent],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch event handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      setIsDragging(true);
      const touch = e.touches[0];
      setSliderPosition(getPositionFromEvent(touch.clientX));
    },
    [getPositionFromEvent],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      setSliderPosition(getPositionFromEvent(touch.clientX));
    },
    [isDragging, getPositionFromEvent],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard support for ARIA slider
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let newPosition: number | null = null;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        newPosition = Math.max(0, sliderPosition - 1);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        newPosition = Math.min(100, sliderPosition + 1);
        break;
      case 'Home':
        newPosition = 0;
        break;
      case 'End':
        newPosition = 100;
        break;
      default:
        return;
    }
    if (newPosition !== null) {
      e.preventDefault();
      setSliderPosition(newPosition);
    }
  }, [sliderPosition]);

  // Register global mouse/touch events when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div className="space-y-3">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setViewMode('slider')}
          aria-pressed={viewMode === 'slider'}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${
              viewMode === 'slider'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          滑动对比
        </button>
        <button
          type="button"
          onClick={() => setViewMode('side-by-side')}
          aria-pressed={viewMode === 'side-by-side'}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-colors
            ${
              viewMode === 'side-by-side'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          并排对比
        </button>
      </div>

      {/* Slider View */}
      {viewMode === 'slider' && (
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 select-none"
          style={{ cursor: isDragging ? 'col-resize' : 'default' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          aria-label="图片对比滑块"
        >
          {/* After Image (full width, below) */}
          <div className="relative w-full">
            <img
              src={afterImage}
              alt={afterLabel}
              className="block w-full h-auto"
              draggable={false}
            />
          </div>

          {/* Before Image (clipped by slider position) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={beforeImage}
              alt={beforeLabel}
              className="block w-full h-auto"
              draggable={false}
            />
          </div>

          {/* Labels */}
          <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {beforeLabel}
          </div>
          <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
            {afterLabel}
          </div>

          {/* Split Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
            style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          >
            {/* Circular Handle */}
            <div
              role="slider"
              tabIndex={0}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(sliderPosition)}
              aria-label="对比滑块位置"
              onKeyDown={handleKeyDown}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border-2 border-gray-300 shadow-md flex items-center justify-center pointer-events-auto cursor-col-resize focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {/* Arrow indicators */}
              <svg
                className="w-4 h-4 text-gray-500"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M4 8l3-3v6l-3-3zM12 8l-3-3v6l3-3z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side View */}
      {viewMode === 'side-by-side' && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="relative">
            <img
              src={beforeImage}
              alt={beforeLabel}
              className="block w-full h-auto"
            />
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
              {beforeLabel}
            </div>
          </div>
          <div className="relative">
            <img
              src={afterImage}
              alt={afterLabel}
              className="block w-full h-auto"
            />
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none">
              {afterLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
