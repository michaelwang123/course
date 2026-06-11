export const SUPPORTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type SupportedFormat = (typeof SUPPORTED_FORMATS)[number];

export interface ValidationResult {
  valid: boolean;
  error?: 'UNSUPPORTED_FORMAT' | 'FILE_TOO_LARGE';
  message?: string;
}

export function validateImageFile(file: File): ValidationResult {
  // Check format first
  if (!SUPPORTED_FORMATS.includes(file.type as SupportedFormat)) {
    return {
      valid: false,
      error: 'UNSUPPORTED_FORMAT',
      message: '不支持该文件格式，请上传 JPEG、PNG 或 WebP 图片',
    };
  }

  // Check size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'FILE_TOO_LARGE',
      message: '文件大小超过 10MB，请压缩后重试',
    };
  }

  return { valid: true };
}
