// src/components/AuthGuard.tsx
// 路由守卫：检查登录状态，未登录重定向到 /login，会话过期提示

import { useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { onAuthStateChange } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const hadSession = useRef(false);

  // 跟踪用户是否曾经有过会话（用于区分"未登录"和"会话过期"）
  useEffect(() => {
    if (user) {
      hadSession.current = true;
    }
  }, [user]);

  // 监听会话过期事件
  useEffect(() => {
    const { unsubscribe } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' && hadSession.current) {
        // 会话过期：之前有会话，现在签出了
        hadSession.current = false;
        navigate('/login?expired=true', { replace: true });
      }
      if (event === 'TOKEN_REFRESHED' && !session) {
        // token 刷新失败，会话过期
        hadSession.current = false;
        navigate('/login?expired=true', { replace: true });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate]);

  // 加载中显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-900">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  // 未登录时重定向到登录页
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
