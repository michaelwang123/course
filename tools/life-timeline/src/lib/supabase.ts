// src/lib/supabase.ts
// Supabase client initialization with runtime environment variable validation

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl) {
  console.error(
    '[Life Timeline] 缺少环境变量 VITE_SUPABASE_URL。请在 .env 文件中配置 Supabase 项目 URL。'
  );
}

if (!supabaseAnonKey) {
  console.error(
    '[Life Timeline] 缺少环境变量 VITE_SUPABASE_ANON_KEY。请在 .env 文件中配置 Supabase 匿名密钥。'
  );
}

export const supabase = createClient(
  supabaseUrl ?? '',
  supabaseAnonKey ?? ''
);
