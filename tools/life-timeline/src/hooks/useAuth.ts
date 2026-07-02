// src/hooks/useAuth.ts
// Authentication state management hook

import type { User, Session } from '@supabase/supabase-js';
import { useAuthContext } from '@/context/AuthContext';

export interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * 认证状态管理 Hook
 * 提供当前用户、会话信息、加载状态、错误信息及登录/退出方法
 */
export function useAuth(): UseAuthReturn {
  const { user, session, isLoading, error, signIn, signOut } = useAuthContext();

  return {
    user,
    session,
    isLoading,
    error,
    signIn,
    signOut,
  };
}
