import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '缺少 Supabase 环境变量，请确保 .env 中正确配置了 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY'
  );
}

// 与 exam-simulator 共享同一 Supabase 实例，本工具表使用 mha_ 前缀
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * 检查 Supabase 连接是否可用
 * 用于全局错误边界初始化检测
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('mha_scales').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
