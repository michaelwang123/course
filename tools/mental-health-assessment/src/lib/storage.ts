export const STORAGE_KEY = 'mental-health-assessment-progress';

export interface StoredSession {
  sessionId: string;
  scaleId: string;
  participantName: string;
  jobType: '月嫂' | '老人护理';
  answers: Record<string, number>; // itemId -> selectedScore
  currentIndex: number;
  savedAt: string; // ISO timestamp
}

/**
 * 保存测评进度到 localStorage
 */
export function saveProgress(session: StoredSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

/**
 * 验证解析后的数据是否符合 StoredSession 结构
 */
function isValidStoredSession(data: unknown): data is StoredSession {
  if (data == null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.sessionId === 'string' &&
    obj.sessionId.length > 0 &&
    typeof obj.scaleId === 'string' &&
    obj.scaleId.length > 0 &&
    typeof obj.participantName === 'string' &&
    (obj.jobType === '月嫂' || obj.jobType === '老人护理') &&
    typeof obj.answers === 'object' &&
    obj.answers !== null &&
    typeof obj.currentIndex === 'number' &&
    Number.isFinite(obj.currentIndex) &&
    typeof obj.savedAt === 'string'
  );
}

/**
 * 从 localStorage 读取测评进度
 * 返回 null 如果无数据或数据损坏/格式不合法
 */
export function loadProgress(): StoredSession | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return null;
    }
    const parsed: unknown = JSON.parse(data);
    if (!isValidStoredSession(parsed)) {
      // 数据格式损坏，清除无效数据
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * 清除测评进度
 */
export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * 检查是否存在未完成的测评会话
 */
export function hasUnfinishedSession(): boolean {
  return loadProgress() !== null;
}
