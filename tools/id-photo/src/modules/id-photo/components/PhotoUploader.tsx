import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { usePhotoContext } from '../context/PhotoContext';
import { validateImageFile } from '../../../utils/file-validators';
import { loadImageFromFile, scaleImageForPreview } from '../../../utils/image-helpers';

/**
 * PhotoUploader — Handles image upload via click-to-select, drag-and-drop,
 * and clipboard paste. Validates files and dispatches SET_ORIGINAL_IMAGE on success.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 */
export default function PhotoUploader() {
  const { state, dispatch } = usePhotoContext();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Process a selected/dropped/pasted file:
   * 1. Validate format and size
   * 2. Load as HTMLImageElement
   * 3. Dispatch to context
   */
  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.message ?? '文件验证失败');
        return;
      }

      setIsLoading(true);
      try {
        const image = await loadImageFromFile(file);
        // Generate scaled preview (max edge 1200px) for real-time interaction performance
        const previewCanvas = scaleImageForPreview(image, 1200);
        dispatch({
          type: 'SET_ORIGINAL_IMAGE',
          payload: {
            image,
            file: { name: file.name, type: file.type, size: file.size },
            previewCanvas,
          },
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '图片加载失败，请重试');
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  // ─── Click to select ────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ─── Drag and drop ──────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  // ─── Clipboard paste ────────────────────────────────────────────────────────

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
            return;
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handleFile]);

  // ─── Preview image source ──────────────────────────────────────────────────

  const previewSrc = state.originalImage?.src ?? null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  // If an image is already loaded, show the preview
  if (previewSrc) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <img
            src={previewSrc}
            alt="已上传的照片预览"
            className="w-full h-auto object-contain max-h-96"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            dispatch({ type: 'RESET_ALL' });
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="重新上传照片"
        >
          重新选择照片
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="点击或拖拽上传照片"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          w-full max-w-md p-8 flex flex-col items-center justify-center gap-3
          border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
          ${isLoading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        {/* Upload icon */}
        <svg
          className={`w-12 h-12 ${isDragging ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16"
          />
        </svg>

        {isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">正在加载图片...</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDragging ? '释放以上传图片' : '点击选择或拖拽图片到此处'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              支持 JPEG、PNG、WebP 格式，最大 10MB
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              也可使用 Ctrl+V / Cmd+V 粘贴图片
            </p>
          </>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
