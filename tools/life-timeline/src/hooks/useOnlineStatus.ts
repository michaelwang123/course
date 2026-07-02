// src/hooks/useOnlineStatus.ts
// Browser online/offline status detection hook

import { useState, useEffect } from 'react';

export interface UseOnlineStatusReturn {
  isOnline: boolean;
}

/**
 * 检测浏览器在线状态
 * 返回当前网络连接状态，用于离线行为控制
 * 离线时：已加载数据可只读浏览，写操作（创建/编辑/删除）失败并提示网络错误
 */
export function useOnlineStatus(): UseOnlineStatusReturn {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline };
}
