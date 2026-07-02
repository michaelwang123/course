// src/context/AuthContext.tsx
// Authentication state Context Provider

import { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { getSession, onAuthStateChange, signInWithGoogle, signOut } from '@/lib/auth';

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 初始化时获取当前会话
    getSession()
      .then((currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '获取会话失败');
      })
      .finally(() => {
        setIsLoading(false);
      });

    // 监听认证状态变化
    const { unsubscribe } = onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
      setError(null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : '认证失败';
      setError(message);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    try {
      await signOut();
      setUser(null);
      setSession(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : '退出登录失败';
      setError(message);
    }
  };

  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    error,
    signIn: handleSignIn,
    signOut: handleSignOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
