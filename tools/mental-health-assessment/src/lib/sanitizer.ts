/**
 * XSS 输入净化模块
 * 对用户输入进行 HTML 特殊字符转义，防止 XSS 攻击
 */

/**
 * HTML 特殊字符转义映射
 * 注意：& 必须最先转义，避免双重转义
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

/**
 * 匹配所有需要转义的 HTML 特殊字符
 */
const HTML_SPECIAL_CHARS_REGEX = /[&<>"']/g;

/**
 * 对用户输入进行 HTML 特殊字符转义
 * 转义字符：& < > " '
 *
 * @param input - 原始用户输入字符串
 * @returns 转义后的安全字符串
 */
export function sanitizeInput(input: string): string {
  return input.replace(HTML_SPECIAL_CHARS_REGEX, (char) => HTML_ESCAPE_MAP[char]);
}

/**
 * 对显示内容进行安全处理
 * 用于将文本安全地渲染到页面上，防止 XSS 注入
 *
 * @param text - 需要显示的文本内容
 * @returns 安全的显示文本
 */
export function sanitizeForDisplay(text: string): string {
  return sanitizeInput(text);
}
