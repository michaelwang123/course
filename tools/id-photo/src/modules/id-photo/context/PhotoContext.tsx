import React, { createContext, useContext, useEffect, useReducer, useRef, type ReactNode } from 'react';
import type { PhotoSize } from '../../../core/layout-engine';
import { registerUnloadCleanup } from '../../../utils/privacy-guard';

// ─── State ───────────────────────────────────────────────────────────────────

export interface PhotoState {
  /** 当前步骤 */
  currentStep: 'upload' | 'crop' | 'background' | 'export';
  /** 原始上传图片 */
  originalImage: HTMLImageElement | null;
  /** 原始文件信息 */
  originalFile: { name: string; type: string; size: number } | null;
  /** 预览用缩放 Canvas（最大边 1200px），用于实时交互性能优化 */
  previewCanvas: HTMLCanvasElement | null;
  /** 裁剪后的 Canvas */
  croppedCanvas: HTMLCanvasElement | null;
  /** 背景替换后的 Canvas */
  processedCanvas: HTMLCanvasElement | null;
  /** 选择的标准尺寸 */
  selectedSize: PhotoSize | null;
  /** 自定义尺寸 */
  customSize: { width: number; height: number } | null;
  /** 已解锁的步骤 */
  unlockedSteps: Set<string>;
  /** 是否正在处理 */
  isProcessing: boolean;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export type PhotoAction =
  | { type: 'SET_ORIGINAL_IMAGE'; payload: { image: HTMLImageElement; file: { name: string; type: string; size: number }; previewCanvas?: HTMLCanvasElement } }
  | { type: 'SET_CROPPED'; payload: HTMLCanvasElement }
  | { type: 'SET_PROCESSED'; payload: HTMLCanvasElement }
  | { type: 'SET_SIZE'; payload: PhotoSize | { width: number; height: number } }
  | { type: 'SET_STEP'; payload: PhotoState['currentStep'] }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'RESET_STEP'; payload: PhotoState['currentStep'] }
  | { type: 'RESET_ALL' };

// ─── Initial State ───────────────────────────────────────────────────────────

export const initialState: PhotoState = {
  currentStep: 'upload',
  originalImage: null,
  originalFile: null,
  previewCanvas: null,
  croppedCanvas: null,
  processedCanvas: null,
  selectedSize: null,
  customSize: null,
  unlockedSteps: new Set(['upload']),
  isProcessing: false,
};

// ─── Helper: Release Canvas Memory ──────────────────────────────────────────

/**
 * Release a Canvas's underlying pixel buffer by setting width/height to 0.
 * This signals the browser to free the GPU/RAM backing store.
 */
function releaseCanvas(canvas: HTMLCanvasElement | null): void {
  if (canvas) {
    canvas.width = 0;
    canvas.height = 0;
  }
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

export function photoReducer(state: PhotoState, action: PhotoAction): PhotoState {
  switch (action.type) {
    case 'SET_ORIGINAL_IMAGE': {
      // Unlock crop, background, and export steps
      const unlockedSteps = new Set(state.unlockedSteps);
      unlockedSteps.add('crop');
      unlockedSteps.add('background');
      unlockedSteps.add('export');

      // Release old preview canvas if any
      releaseCanvas(state.previewCanvas);

      return {
        ...state,
        originalImage: action.payload.image,
        originalFile: action.payload.file,
        previewCanvas: action.payload.previewCanvas ?? null,
        unlockedSteps,
      };
    }

    case 'SET_CROPPED': {
      // Release old cropped canvas before replacing
      releaseCanvas(state.croppedCanvas);

      return {
        ...state,
        croppedCanvas: action.payload,
      };
    }

    case 'SET_PROCESSED': {
      // Release old processed canvas before replacing
      releaseCanvas(state.processedCanvas);

      return {
        ...state,
        processedCanvas: action.payload,
      };
    }

    case 'SET_SIZE': {
      const payload = action.payload;
      // Determine if it's a PhotoSize (has 'id' field) or custom dimensions
      if ('id' in payload) {
        return {
          ...state,
          selectedSize: payload as PhotoSize,
          customSize: null,
        };
      }
      return {
        ...state,
        selectedSize: null,
        customSize: payload as { width: number; height: number },
      };
    }

    case 'SET_STEP': {
      return {
        ...state,
        currentStep: action.payload,
      };
    }

    case 'SET_PROCESSING': {
      return {
        ...state,
        isProcessing: action.payload,
      };
    }

    case 'RESET_STEP': {
      const step = action.payload;

      switch (step) {
        case 'crop': {
          // Reset crop clears croppedCanvas AND processedCanvas (downstream)
          releaseCanvas(state.croppedCanvas);
          releaseCanvas(state.processedCanvas);
          return {
            ...state,
            croppedCanvas: null,
            processedCanvas: null,
          };
        }
        case 'background': {
          // Reset background clears processedCanvas only
          releaseCanvas(state.processedCanvas);
          return {
            ...state,
            processedCanvas: null,
          };
        }
        case 'export': {
          // Nothing to reset for export step
          return state;
        }
        default:
          return state;
      }
    }

    case 'RESET_ALL': {
      // Release all canvas references
      releaseCanvas(state.previewCanvas);
      releaseCanvas(state.croppedCanvas);
      releaseCanvas(state.processedCanvas);
      // Revoke object URL used by originalImage (if loaded via createObjectURL)
      if (state.originalImage?.src?.startsWith('blob:')) {
        URL.revokeObjectURL(state.originalImage.src);
      }

      return {
        ...initialState,
        // Create a fresh Set so we don't share reference with initialState
        unlockedSteps: new Set(['upload']),
      };
    }

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface PhotoContextValue {
  state: PhotoState;
  dispatch: React.Dispatch<PhotoAction>;
}

const PhotoContext = createContext<PhotoContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function PhotoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(photoReducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Register privacy cleanup on page unload (Requirements: 8.1, 8.2, 8.4)
  useEffect(() => {
    const unregister = registerUnloadCleanup(() => ({
      croppedCanvas: stateRef.current.croppedCanvas,
      processedCanvas: stateRef.current.processedCanvas,
      previewCanvas: stateRef.current.previewCanvas,
      originalImage: stateRef.current.originalImage,
    }));
    return unregister;
  }, []);

  return (
    <PhotoContext.Provider value={{ state, dispatch }}>
      {children}
    </PhotoContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePhotoContext(): PhotoContextValue {
  const context = useContext(PhotoContext);
  if (!context) {
    throw new Error('usePhotoContext must be used within a PhotoProvider');
  }
  return context;
}
