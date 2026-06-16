/**
 * 请求超时工具
 * 为 Promise 或 Thenable 添加超时机制，超时后自动拒绝
 */

const DEFAULT_TIMEOUT_MS = 15000; // 15 秒

/**
 * 为任意 Promise/Thenable 添加超时限制
 * @param promiseOrThenable - 原始 Promise 或 Thenable（如 Supabase query builder）
 * @param timeoutMs - 超时毫秒数，默认 15000ms
 * @param message - 超时错误信息
 * @returns 带超时的 Promise
 */
export function withTimeout<T>(
  promiseOrThenable: PromiseLike<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  message: string = '请求超时，请检查网络后重试'
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);
  });

  // 使用 Promise.resolve 将 Thenable 转为标准 Promise
  return Promise.race([Promise.resolve(promiseOrThenable), timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
