import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePhotoContext } from '../context/PhotoContext';
import { useBackgroundReplace } from '../hooks/useBackgroundReplace';
import { CompareSlider } from './CompareSlider';
import type { RGB } from '../../../core/color-engine';

/**
 * BackgroundChanger — Provides background color replacement UI with
 * preset colors, custom color picker, tolerance slider, and live preview.
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.8, 7.6
 */

interface PresetColor {
  label: string;
  hex: string;
  rgb: RGB;
}

const PRESET_COLORS: PresetColor[] = [
  { label: '白色', hex: '#FFFFFF', rgb: { r: 255, g: 255, b: 255 } },
  { label: '红色', hex: '#FF0000', rgb: { r: 255, g: 0, b: 0 } },
  { label: '蓝色', hex: '#438EDB', rgb: { r: 67, g: 142, b: 219 } },
];

/** Convert hex string (#RRGGBB) to RGB object */
function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');
  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  };
}

export default function BackgroundChanger() {
  const { state } = usePhotoContext();
  const { performReplace, resetBackground, isProcessing } = useBackgroundReplace();

  const [targetColor, setTargetColor] = useState<RGB>(PRESET_COLORS[0].rgb);
  const [tolerance, setTolerance] = useState<number>(30);
  const [customColor, setCustomColor] = useState<string>('#FFFFFF');
  const [replacedPercentage, setReplacedPercentage] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beforeImageRef = useRef<string | null>(null);

  // ─── Source canvas: prefer croppedCanvas, fallback to previewCanvas or originalImage canvas ──
  // For real-time interaction, use previewCanvas (max 1200px edge) for performance.
  // Export step uses the full-resolution processedCanvas/croppedCanvas/originalImage.

  const sourceCanvas = useMemo(() => {
    if (state.croppedCanvas) {
      return state.croppedCanvas;
    }
    // Use preview canvas for performance when no crop has been applied
    if (state.previewCanvas) {
      return state.previewCanvas;
    }
    if (state.originalImage) {
      const canvas = document.createElement('canvas');
      canvas.width = state.originalImage.naturalWidth;
      canvas.height = state.originalImage.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(state.originalImage, 0, 0);
      }
      return canvas;
    }
    return null;
  }, [state.croppedCanvas, state.previewCanvas, state.originalImage]);

  // ─── Perform background replacement ────────────────────────────────────────

  const doReplace = useCallback(
    async (color: RGB, tol: number) => {
      if (!sourceCanvas) return;

      const ctx = sourceCanvas.getContext('2d');
      if (!ctx) return;

      const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);

      try {
        setError(null);
        const result = await performReplace(imageData, {
          targetColor: color,
          tolerance: tol,
        });
        setReplacedPercentage(result.replacedPercentage);
      } catch (err) {
        setError(err instanceof Error ? err.message : '背景替换失败，请重试');
        setReplacedPercentage(null);
      }
    },
    [sourceCanvas, performReplace]
  );

  // ─── Debounced trigger for replacement when color or tolerance changes ─────
  // Debounce 250ms to avoid firing on every slider tick during drag

  useEffect(() => {
    if (!sourceCanvas || !targetColor) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      doReplace(targetColor, tolerance);
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [targetColor, tolerance, sourceCanvas, doReplace]);

  // ─── Generate "before" image data URL for CompareSlider ─────────────────────

  useEffect(() => {
    if (sourceCanvas && !beforeImageRef.current) {
      beforeImageRef.current = sourceCanvas.toDataURL('image/jpeg', 0.8);
    }
  }, [sourceCanvas]);

  // Memoize the "after" image URL to avoid recalculating toDataURL on every render
  const afterImageUrl = useMemo(() => {
    if (!state.processedCanvas) return null;
    return state.processedCanvas.toDataURL('image/jpeg', 0.8);
  }, [state.processedCanvas]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handlePresetClick = useCallback((preset: PresetColor) => {
    setTargetColor(preset.rgb);
    setCustomColor(preset.hex);
  }, []);

  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    setCustomColor(hex);
    setTargetColor(hexToRgb(hex));
  }, []);

  const handleToleranceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTolerance(Number(e.target.value));
  }, []);

  const handleReset = useCallback(() => {
    resetBackground();
    setReplacedPercentage(null);
  }, [resetBackground]);

  // ─── No source available ───────────────────────────────────────────────────

  if (!sourceCanvas) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">请先上传图片</p>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 w-full max-w-lg mx-auto">
      {/* Preset color buttons */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          预设底色
        </label>
        <div className="flex gap-3">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.hex}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-md border transition-colors
                ${
                  customColor.toUpperCase() === preset.hex
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                }
              `}
              aria-label={`选择${preset.label}背景`}
              aria-pressed={customColor.toUpperCase() === preset.hex}
            >
              <span
                className="inline-block w-5 h-5 rounded-full border border-gray-300 dark:border-gray-500"
                style={{ backgroundColor: preset.hex }}
                aria-hidden="true"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom color picker */}
      <div>
        <label
          htmlFor="custom-color-picker"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          自定义颜色
        </label>
        <div className="flex items-center gap-3">
          <input
            id="custom-color-picker"
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="w-10 h-10 rounded cursor-pointer border border-gray-300 dark:border-gray-600"
            aria-label="自定义背景颜色选择器"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {customColor.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tolerance slider */}
      <div>
        <label
          htmlFor="tolerance-slider"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          容差值: {tolerance}
        </label>
        <input
          id="tolerance-slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={tolerance}
          onChange={handleToleranceChange}
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={tolerance}
          aria-label="背景容差调节"
        />
        <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
          <span>0</span>
          <span>100</span>
        </div>
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-3" role="status" aria-live="polite">
          <svg
            className="animate-spin h-5 w-5 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-sm text-gray-600 dark:text-gray-400">处理中...</span>
        </div>
      )}

      {/* Error message */}
      {error && !isProcessing && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {/* Detection quality warning */}
      {replacedPercentage !== null && replacedPercentage < 10 && !isProcessing && (
        <div
          className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md"
          role="alert"
        >
          <svg
            className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            背景检测效果不理想，请尝试调高容差值
          </p>
        </div>
      )}

      {/* Before/After comparison using CompareSlider */}
      {state.processedCanvas && !isProcessing && beforeImageRef.current && afterImageUrl && (
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            效果对比
          </label>
          <CompareSlider
            beforeImage={beforeImageRef.current}
            afterImage={afterImageUrl}
            beforeLabel="原图"
            afterLabel="换底色后"
          />
        </div>
      )}

      {/* Reset button */}
      <button
        type="button"
        onClick={handleReset}
        disabled={isProcessing}
        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="重置背景更换"
      >
        重置
      </button>

      {/* Technical tip */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        该功能对纯色或接近纯色的背景效果最佳
      </p>
    </div>
  );
}
