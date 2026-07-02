// src/lib/auth.ts
// Authentication service wrapping Supabase Auth (Google OAuth)

import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * 发起 Google OAuth 登录
 * 使用 Supabase Auth 的 signInWithOAuth 方法，配置 redirectTo 为当前域名根路径
 */
export async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    throw error;
  }
}

/**
 * 退出登录
 * 清除当前用户会话
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

/**
 * 获取当前会话
 * 返回当前活跃的 Session 对象，若未登录则返回 null
 */
export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

/**
 * 监听认证状态变化
 * 返回 unsubscribe 方法用于取消监听
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
): { unsubscribe: () => void } {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return { unsubscribe: () => data.subscription.unsubscribe() };
}
