import { useState, useCallback, useRef } from 'react';
import { usePhotoContext } from '../context/PhotoContext';
import { canvasToBlob } from '../../../core/canvas-processor';
import { generateBatchLayout, calculateLayout } from '../../../core/layout-engine';
import { generateExportFilename } from '../../../utils/image-helpers';

type ExportFormat = 'jpeg' | 'png';

/**
 * PhotoExporter component
 *
 * Provides export controls for single photo, batch layout, and PDF export.
 * - Format selector (JPEG/PNG)
 * - JPEG quality slider (60%-100%)
 * - Single export with auto-generated filename
 * - Batch layout export (A4 arrangement)
 * - PDF export (300 DPI) using jsPDF
 *
 * Export priority chain: processedCanvas > croppedCanvas > originalImage
 */
export default function PhotoExporter() {
  const { state } = usePhotoContext();
  const { processedCanvas, croppedCanvas, originalImage, selectedSize } = state;

  const [format, setFormat] = useState<ExportFormat>('jpeg');
  const [quality, setQuality] = useState(0.92);
  const [showBatchPreview, setShowBatchPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const batchPreviewRef = useRef<HTMLCanvasElement | null>(null);
  const originalCanvasCacheRef = useRef<HTMLCanvasElement | null>(null);
  // Invalidate cache when originalImage changes
  const cachedImageRef = useRef<HTMLImageElement | null>(null);

  /**
   * Get the source canvas for export using priority chain:
   * processedCanvas > croppedCanvas > (canvas from originalImage, cached)
   */
  const getSourceCanvas = useCallback((): HTMLCanvasElement | null => {
    if (processedCanvas) return processedCanvas;
    if (croppedCanvas) return croppedCanvas;
    if (originalImage) {
      // Use cached canvas if originalImage hasn't changed
      if (cachedImageRef.current === originalImage && originalCanvasCacheRef.current) {
        return originalCanvasCacheRef.current;
      }
      const canvas = document.createElement('canvas');
      canvas.width = originalImage.naturalWidth || originalImage.width;
      canvas.height = originalImage.naturalHeight || originalImage.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(originalImage, 0, 0);
      originalCanvasCacheRef.current = canvas;
      cachedImageRef.current = originalImage;
      return canvas;
    }
    // Clear cache if no image
    originalCanvasCacheRef.current = null;
    cachedImageRef.current = null;
    return null;
  }, [processedCanvas, croppedCanvas, originalImage]);

  /**
   * Trigger download using a temporary <a> element with blob URL.
   * Revokes the URL after download.
   */
  const triggerDownload = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  /**
   * Export single photo
   */
  const handleSingleExport = useCallback(async () => {
    const sourceCanvas = getSourceCanvas();
    if (!sourceCanvas) return;

    setIsExporting(true);
    setExportError(null);
    try {
      const mimeType: 'image/jpeg' | 'image/png' = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const blob = await canvasToBlob(sourceCanvas, mimeType, format === 'jpeg' ? quality : undefined);

      let filename: string;
      if (selectedSize) {
        filename = generateExportFilename(
          selectedSize.name,
          selectedSize.widthMm,
          selectedSize.heightMm,
          format
        );
      } else {
        const ext = format === 'jpeg' ? 'jpg' : 'png';
        filename = `证件照_自定义.${ext}`;
      }

      triggerDownload(blob, filename);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : '导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [getSourceCanvas, format, quality, selectedSize, triggerDownload]);

  /**
   * Export batch layout (A4 arrangement)
   */
  const handleBatchExport = useCallback(async () => {
    const sourceCanvas = getSourceCanvas();
    if (!sourceCanvas || !selectedSize) return;

    setIsExporting(true);
    setExportError(null);
    try {
      const layoutResult = generateBatchLayout(sourceCanvas, selectedSize);
      const mimeType: 'image/jpeg' | 'image/png' = format === 'jpeg' ? 'image/jpeg' : 'image/png';
      const blob = await canvasToBlob(layoutResult.canvas, mimeType, format === 'jpeg' ? quality : undefined);

      const ext = format === 'jpeg' ? 'jpg' : 'png';
      const filename = `证件照_${selectedSize.name}_${selectedSize.widthMm}x${selectedSize.heightMm}mm_排版.${ext}`;

      triggerDownload(blob, filename);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : '批量排版导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [getSourceCanvas, selectedSize, format, quality, triggerDownload]);

  /**
   * Export batch layout as PDF (300 DPI)
   */
  const handlePdfExport = useCallback(async () => {
    const sourceCanvas = getSourceCanvas();
    if (!sourceCanvas || !selectedSize) return;

    setIsExporting(true);
    setExportError(null);
    try {
      const layoutResult = generateBatchLayout(sourceCanvas, selectedSize);
      const dataUrl = layoutResult.canvas.toDataURL('image/jpeg', quality);

      // Dynamically import jsPDF to reduce initial bundle size (~48KB gzip savings)
      const { jsPDF } = await import('jspdf');

      // Create A4 PDF (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Add the layout image to fill the entire A4 page
      pdf.addImage(dataUrl, 'JPEG', 0, 0, 210, 297);

      const filename = `证件照_${selectedSize.name}_${selectedSize.widthMm}x${selectedSize.heightMm}mm_排版.pdf`;
      pdf.save(filename);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'PDF 导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  }, [getSourceCanvas, selectedSize, quality]);

  /**
   * Toggle batch preview and render the preview canvas
   */
  const handleToggleBatchPreview = useCallback(() => {
    if (!showBatchPreview) {
      const sourceCanvas = getSourceCanvas();
      if (!sourceCanvas || !selectedSize) return;

      try {
        const layoutResult = generateBatchLayout(sourceCanvas, selectedSize);
        batchPreviewRef.current = layoutResult.canvas;
      } catch {
        batchPreviewRef.current = null;
      }
    }
    setShowBatchPreview((prev) => !prev);
  }, [showBatchPreview, getSourceCanvas, selectedSize]);

  // Check if there's any exportable content
  const hasExportableContent = !!(processedCanvas || croppedCanvas || originalImage);
  const hasBatchCapability = !!(selectedSize && hasExportableContent);

  // Get layout info for display
  const layoutInfo = selectedSize ? calculateLayout(selectedSize) : null;

  if (!hasExportableContent) {
    return (
      <div className="p-6 text-center" role="status" aria-label="无可导出内容">
        <p className="text-gray-500 dark:text-gray-400">无可导出的图片</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          请先上传并处理图片
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        导出设置
      </h3>

      {/* Format selector */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
          导出格式
        </legend>
        <div className="flex gap-4" role="radiogroup" aria-label="导出格式选择">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="export-format"
              value="jpeg"
              checked={format === 'jpeg'}
              onChange={() => setFormat('jpeg')}
              className="text-blue-600 focus:ring-blue-500"
              aria-label="JPEG 格式"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">JPEG</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="export-format"
              value="png"
              checked={format === 'png'}
              onChange={() => setFormat('png')}
              className="text-blue-600 focus:ring-blue-500"
              aria-label="PNG 格式"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">PNG</span>
          </label>
        </div>
      </fieldset>

      {/* JPEG quality slider - only shown when JPEG is selected */}
      {format === 'jpeg' && (
        <div className="space-y-2">
          <label
            htmlFor="quality-slider"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            JPEG 质量: {Math.round(quality * 100)}%
          </label>
          <input
            id="quality-slider"
            type="range"
            min="0.6"
            max="1.0"
            step="0.01"
            value={quality}
            onChange={(e) => setQuality(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            aria-label={`JPEG 质量 ${Math.round(quality * 100)}%`}
            aria-valuemin={60}
            aria-valuemax={100}
            aria-valuenow={Math.round(quality * 100)}
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>60%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Export error message */}
      {exportError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {exportError}
        </p>
      )}

      {/* Single photo export */}
      <div className="space-y-3">
        <button
          onClick={handleSingleExport}
          disabled={isExporting}
          className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="导出单张照片"
        >
          {isExporting ? '导出中...' : '导出照片'}
        </button>
      </div>

      {/* Batch layout section */}
      {hasBatchCapability && (
        <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              批量排版 (A4)
            </h4>
            {layoutInfo && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {layoutInfo.columns}×{layoutInfo.rows} = {layoutInfo.totalPhotos}张
              </span>
            )}
          </div>

          {/* Batch preview toggle */}
          <button
            onClick={handleToggleBatchPreview}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-expanded={showBatchPreview}
            aria-label="预览排版效果"
          >
            {showBatchPreview ? '隐藏排版预览' : '预览排版效果'}
          </button>

          {/* Batch preview canvas */}
          {showBatchPreview && batchPreviewRef.current && (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-900">
              <canvas
                ref={(el) => {
                  if (el && batchPreviewRef.current) {
                    const previewCanvas = batchPreviewRef.current;
                    // Scale down for preview display
                    const maxWidth = el.parentElement?.clientWidth ?? 300;
                    const scale = Math.min(1, (maxWidth - 16) / previewCanvas.width);
                    el.width = Math.round(previewCanvas.width * scale);
                    el.height = Math.round(previewCanvas.height * scale);
                    const ctx = el.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(previewCanvas, 0, 0, el.width, el.height);
                    }
                  }
                }}
                className="w-full"
                aria-label="A4 排版预览"
              />
            </div>
          )}

          {/* Batch export buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleBatchExport}
              disabled={isExporting}
              className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              aria-label="导出排版图片"
            >
              {isExporting ? '导出中...' : '导出排版图片'}
            </button>
            <button
              onClick={handlePdfExport}
              disabled={isExporting}
              className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              aria-label="导出 PDF"
            >
              {isExporting ? '导出中...' : '导出 PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
