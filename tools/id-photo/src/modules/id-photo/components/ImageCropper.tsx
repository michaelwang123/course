import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { usePhotoContext } from '../context/PhotoContext';
import { useCrop } from '../hooks/useCrop';
import { STANDARD_SIZES } from '../constants/photo-sizes';
import type { PhotoSize } from '../../../core/layout-engine';

/**
 * ImageCropper — 证件照裁剪组件
 *
 * 功能:
 * - 标准尺寸选择（一寸、二寸等）
 * - 自定义尺寸输入
 * - 固定比例裁剪框（拖拽移动 + 边缘缩放）
 * - 辅助线（三分线 + 中心十字线）
 * - 旋转/翻转/亮度/对比度调整
 * - 确认裁剪 / 重置操作
 *
 * 旋转方案：生成旋转后的预览图作为裁剪源（而非 CSS transform），
 * 确保裁剪框坐标与视觉内容一致。
 */
export function ImageCropper() {
  const { state, dispatch } = usePhotoContext();
  const { originalImage, selectedSize, customSize } = state;
  const { performCrop, resetCrop, isProcessing } = useCrop();

  const imgRef = useRef<HTMLImageElement | null>(null);

  // Crop state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  // Custom size inputs
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');

  // Rotation, flip, brightness, contrast state
  const [rotation, setRotation] = useState<number>(0);
  const [flipHorizontal, setFlipHorizontal] = useState<boolean>(false);
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);

  // Debounced brightness/contrast for preview performance (avoid recalc on every slider tick)
  const [debouncedBrightness, setDebouncedBrightness] = useState(0);
  const [debouncedContrast, setDebouncedContrast] = useState(0);
  const adjustDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (adjustDebounceRef.current) clearTimeout(adjustDebounceRef.current);
    adjustDebounceRef.current = setTimeout(() => {
      setDebouncedBrightness(brightness);
      setDebouncedContrast(contrast);
    }, 300);
    return () => { if (adjustDebounceRef.current) clearTimeout(adjustDebounceRef.current); };
  }, [brightness, contrast]);

  /**
   * Generate a transformed preview image with rotation/flip/brightness/contrast applied.
   * Caps preview resolution to MAX_PREVIEW_EDGE to prevent memory issues with large images.
   * Returns a data URL of the transformed image.
   */
  const MAX_PREVIEW_EDGE = 2400;

  const transformedPreviewSrc = useMemo(() => {
    if (!originalImage) return null;

    const hasTransforms = rotation !== 0 || flipHorizontal || debouncedBrightness !== 0 || debouncedContrast !== 0;
    if (!hasTransforms) {
      return originalImage.src;
    }

    const srcW = originalImage.naturalWidth || originalImage.width;
    const srcH = originalImage.naturalHeight || originalImage.height;

    // For 90/270 rotation, canvas dimensions are swapped
    const isRotated90 = rotation === 90 || rotation === 270;
    const fullW = isRotated90 ? srcH : srcW;
    const fullH = isRotated90 ? srcW : srcH;

    // Cap preview resolution to avoid huge canvas for 50MP+ images
    const scale = Math.min(1, MAX_PREVIEW_EDGE / Math.max(fullW, fullH));
    const canvasW = Math.round(fullW * scale);
    const canvasH = Math.round(fullH * scale);

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return originalImage.src;

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    if (scale !== 1) ctx.scale(scale, scale);

    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }
    if (flipHorizontal) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(originalImage, -srcW / 2, -srcH / 2, srcW, srcH);
    ctx.restore();

    // Apply brightness/contrast via pixel manipulation (matches export behavior)
    if (debouncedBrightness !== 0 || debouncedContrast !== 0) {
      const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
      const data = imageData.data;
      const brightFactor = (100 + debouncedBrightness * 2) / 100;
      const contrastFactor = (100 + debouncedContrast * 2) / 100;

      for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          let value = data[i + c];
          value = value * brightFactor;
          value = (value - 128) * contrastFactor + 128;
          data[i + c] = Math.max(0, Math.min(255, Math.round(value)));
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }

    return canvas.toDataURL('image/jpeg', 0.85);
  }, [originalImage, rotation, flipHorizontal, debouncedBrightness, debouncedContrast]);

  // Track the dimensions of the transformed image for coordinate mapping
  const transformedDimensions = useMemo(() => {
    if (!originalImage) return { width: 0, height: 0 };
    const srcW = originalImage.naturalWidth || originalImage.width;
    const srcH = originalImage.naturalHeight || originalImage.height;
    const isRotated90 = rotation === 90 || rotation === 270;
    return {
      width: isRotated90 ? srcH : srcW,
      height: isRotated90 ? srcW : srcH,
    };
  }, [originalImage, rotation]);

  // Compute current aspect ratio from selected size or custom size
  const currentAspect = useMemo(() => {
    if (selectedSize) return selectedSize.widthPx / selectedSize.heightPx;
    if (customSize) return customSize.width / customSize.height;
    return undefined;
  }, [selectedSize, customSize]);

  // Get current output dimensions
  function getOutputSize(): { width: number; height: number } | null {
    if (selectedSize) return { width: selectedSize.widthPx, height: selectedSize.heightPx };
    if (customSize) return { width: customSize.width, height: customSize.height };
    return null;
  }

  // Handle standard size selection
  function handleSizeSelect(size: PhotoSize) {
    dispatch({ type: 'SET_SIZE', payload: size });
    setCrop(undefined);
    setCompletedCrop(undefined);
  }

  // Handle custom size confirmation
  function handleCustomSizeApply() {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (w > 0 && h > 0) {
      dispatch({ type: 'SET_SIZE', payload: { width: w, height: h } });
      setCrop(undefined);
      setCompletedCrop(undefined);
    }
  }

  // Initialize crop when image loads
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      imgRef.current = e.currentTarget;
      if (currentAspect) {
        initializeCrop(e.currentTarget, currentAspect);
      }
    },
    [currentAspect],
  );

  // Re-initialize crop when aspect ratio or transform changes
  useEffect(() => {
    if (imgRef.current && currentAspect) {
      initializeCrop(imgRef.current, currentAspect);
    }
  }, [currentAspect, rotation, flipHorizontal]);

  function initializeCrop(img: HTMLImageElement, aspect: number) {
    const imgWidth = img.width;
    const imgHeight = img.height;

    const maxCropWidth = imgWidth * 0.8;
    const maxCropHeight = imgHeight * 0.8;

    let cropWidth: number;
    let cropHeight: number;

    if (maxCropWidth / maxCropHeight > aspect) {
      cropHeight = maxCropHeight;
      cropWidth = cropHeight * aspect;
    } else {
      cropWidth = maxCropWidth;
      cropHeight = cropWidth / aspect;
    }

    const cropX = (imgWidth - cropWidth) / 2;
    const cropY = (imgHeight - cropHeight) / 2;

    setCrop({
      unit: '%',
      x: (cropX / imgWidth) * 100,
      y: (cropY / imgHeight) * 100,
      width: (cropWidth / imgWidth) * 100,
      height: (cropHeight / imgHeight) * 100,
    });
  }

  // Handle crop confirmation
  async function handleConfirmCrop() {
    if (!originalImage || !completedCrop || !imgRef.current) return;

    const outputSize = getOutputSize();
    if (!outputSize) return;

    setError(null);
    try {
      // Map displayed crop coordinates to the transformed image's full resolution
      const displayedImg = imgRef.current;
      const scaleX = transformedDimensions.width / displayedImg.width;
      const scaleY = transformedDimensions.height / displayedImg.height;

      // Since the preview already includes rotation/flip/brightness/contrast,
      // we pass rotation=0, flip=false, brightness=0, contrast=0 to cropImage.
      // The source is the original image with transforms applied via canvas.
      // We create a temporary transformed canvas at full resolution for cropping.
      const srcW = originalImage.naturalWidth || originalImage.width;
      const srcH = originalImage.naturalHeight || originalImage.height;
      const isRotated90 = rotation === 90 || rotation === 270;
      const fullW = isRotated90 ? srcH : srcW;
      const fullH = isRotated90 ? srcW : srcH;

      const transformedCanvas = document.createElement('canvas');
      transformedCanvas.width = fullW;
      transformedCanvas.height = fullH;
      const ctx = transformedCanvas.getContext('2d');
      if (!ctx) throw new Error('无法创建 Canvas 上下文');

      ctx.save();
      ctx.translate(fullW / 2, fullH / 2);
      if (rotation !== 0) ctx.rotate((rotation * Math.PI) / 180);
      if (flipHorizontal) ctx.scale(-1, 1);
      ctx.drawImage(originalImage, -srcW / 2, -srcH / 2, srcW, srcH);
      ctx.restore();

      // Crop from the transformed canvas (no rotation/flip needed in cropImage)
      await performCrop(transformedCanvas, {
        sourceRect: {
          x: completedCrop.x * scaleX,
          y: completedCrop.y * scaleY,
          width: completedCrop.width * scaleX,
          height: completedCrop.height * scaleY,
        },
        outputSize,
        rotation: 0,
        flipHorizontal: false,
        brightness,
        contrast,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '裁剪失败，请重试');
    }
  }

  // Handle reset
  function handleReset() {
    resetCrop();
    setCrop(undefined);
    setCompletedCrop(undefined);
    setRotation(0);
    setFlipHorizontal(false);
    setBrightness(0);
    setContrast(0);
    setError(null);
  }

  // No image uploaded yet
  if (!originalImage) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500 dark:text-gray-400">
        <p>请先上传图片</p>
      </div>
    );
  }

  const hasSize = selectedSize || customSize;

  return (
    <div className="space-y-4">
      {/* Size Selection */}
      <section aria-label="尺寸选择">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          标准尺寸
        </h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {STANDARD_SIZES.map((size) => (
            <button
              key={size.id}
              type="button"
              onClick={() => handleSizeSelect(size)}
              aria-pressed={selectedSize?.id === size.id}
              className={`
                px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${
                  selectedSize?.id === size.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
              `}
            >
              {size.name} ({size.widthMm}×{size.heightMm}mm)
            </button>
          ))}
        </div>

        {/* Custom Size Inputs */}
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          自定义尺寸（像素）
        </h3>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="custom-width">宽度</label>
          <input
            id="custom-width"
            type="number"
            min="1"
            placeholder="宽度"
            value={customWidth}
            onChange={(e) => setCustomWidth(e.target.value)}
            className="w-24 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            aria-label="自定义宽度（像素）"
          />
          <span className="text-gray-500 dark:text-gray-400">×</span>
          <label className="sr-only" htmlFor="custom-height">高度</label>
          <input
            id="custom-height"
            type="number"
            min="1"
            placeholder="高度"
            value={customHeight}
            onChange={(e) => setCustomHeight(e.target.value)}
            className="w-24 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            aria-label="自定义高度（像素）"
          />
          <button
            type="button"
            onClick={handleCustomSizeApply}
            disabled={!customWidth || !customHeight}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            应用
          </button>
        </div>
      </section>

      {/* Crop Area — uses transformed preview image so coordinates match visuals */}
      <section aria-label="裁剪区域" className="relative">
        <div className="relative inline-block max-w-full">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={currentAspect}
            className="max-w-full"
          >
            <img
              ref={imgRef}
              src={transformedPreviewSrc ?? ''}
              alt="待裁剪图片"
              onLoad={onImageLoad}
              className="max-w-full max-h-[60vh] object-contain"
            />
          </ReactCrop>

          {/* Guide Lines Overlay (rule of thirds + center crosshair) */}
          {crop && hasSize && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: `${typeof crop.x === 'number' && crop.unit === '%' ? crop.x : 0}%`,
                top: `${typeof crop.y === 'number' && crop.unit === '%' ? crop.y : 0}%`,
                width: `${typeof crop.width === 'number' && crop.unit === '%' ? crop.width : 0}%`,
                height: `${typeof crop.height === 'number' && crop.unit === '%' ? crop.height : 0}%`,
              }}
              aria-hidden="true"
            >
              <div className="absolute top-0 bottom-0 left-1/3 w-px bg-white/50" />
              <div className="absolute top-0 bottom-0 left-2/3 w-px bg-white/50" />
              <div className="absolute left-0 right-0 top-1/3 h-px bg-white/50" />
              <div className="absolute left-0 right-0 top-2/3 h-px bg-white/50" />
              <div className="absolute top-[45%] bottom-[45%] left-1/2 w-px bg-red-400/70 -translate-x-px" />
              <div className="absolute left-[45%] right-[45%] top-1/2 h-px bg-red-400/70 -translate-y-px" />
            </div>
          )}
        </div>
      </section>

      {/* Adjustments: Rotation, Flip, Brightness, Contrast */}
      <section aria-label="图片调整" className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">图片调整</h3>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setRotation((p) => (p + 90) % 360); setCrop(undefined); setCompletedCrop(undefined); }}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="顺时针旋转90度"
          >
            顺时针旋转
          </button>
          <button
            type="button"
            onClick={() => { setRotation((p) => (p + 270) % 360); setCrop(undefined); setCompletedCrop(undefined); }}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="逆时针旋转90度"
          >
            逆时针旋转
          </button>
          <button
            type="button"
            onClick={() => { setFlipHorizontal((p) => !p); setCrop(undefined); setCompletedCrop(undefined); }}
            aria-pressed={flipHorizontal}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              flipHorizontal
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label="水平翻转"
          >
            水平翻转
          </button>
        </div>

        {/* Brightness slider */}
        <div className="flex items-center gap-3">
          <label htmlFor="brightness-slider" className="text-sm text-gray-600 dark:text-gray-400 w-20 shrink-0">亮度</label>
          <input
            id="brightness-slider"
            type="range"
            min={-50}
            max={50}
            step={1}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            aria-label="亮度调整"
            aria-valuemin={-50}
            aria-valuemax={50}
            aria-valuenow={brightness}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">{brightness}</span>
        </div>

        {/* Contrast slider */}
        <div className="flex items-center gap-3">
          <label htmlFor="contrast-slider" className="text-sm text-gray-600 dark:text-gray-400 w-20 shrink-0">对比度</label>
          <input
            id="contrast-slider"
            type="range"
            min={-50}
            max={50}
            step={1}
            value={contrast}
            onChange={(e) => setContrast(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
            aria-label="对比度调整"
            aria-valuemin={-50}
            aria-valuemax={50}
            aria-valuenow={contrast}
          />
          <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">{contrast}</span>
        </div>
      </section>

      {/* Error display */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>
      )}

      {/* Action Buttons */}
      <section aria-label="操作按钮" className="flex gap-3">
        <button
          type="button"
          onClick={handleConfirmCrop}
          disabled={!completedCrop || !hasSize || isProcessing}
          className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? '处理中...' : '确认裁剪'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-md text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
        >
          重置
        </button>
      </section>
    </div>
  );
}
