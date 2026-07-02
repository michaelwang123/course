// src/components/Navbar.tsx
// 顶部导航栏：Grafana 风格暗色毛玻璃 + 渐变标题 + 动态效果

import type { User } from '@supabase/supabase-js';
import { CATEGORY_COLORS } from '@/types/event';

interface NavbarProps {
  user: User;
  onSignOut: () => void;
}

const AVATAR_COLORS = Object.values(CATEGORY_COLORS);

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getDisplayName(user: User): string {
  const meta = user.user_metadata;
  return meta?.full_name || meta?.name || user.email || '用户';
}

function getAvatarUrl(user: User): string | null {
  const meta = user.user_metadata;
  return meta?.avatar_url || meta?.picture || null;
}

export function Navbar({ user, onSignOut }: NavbarProps) {
  const displayName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);
  const firstChar = displayName.charAt(0).toUpperCase();
  const avatarBgColor = getAvatarColor(displayName);

  return (
    <nav className="relative flex items-center justify-between px-6 py-4 bg-dark-800/70 backdrop-blur-xl border-b border-gray-800/80">
      {/* Subtle top highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      <div className="flex items-center gap-3">
        {/* Animated logo icon */}
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center animate-float shadow-lg shadow-emerald-500/20">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-200 to-emerald-400 bg-clip-text text-transparent neon-text">
            人生时光线
          </h1>
          <p className="text-[10px] text-gray-500 font-mono tracking-wider">LIFE TIMELINE</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${displayName}的头像`}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-dark-800 transition-all hover:ring-emerald-400/60"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-dark-800"
              style={{ backgroundColor: avatarBgColor }}
              aria-label={`${displayName}的头像`}
            >
              {firstChar}
            </div>
          )}
          <div className="hidden sm:block">
            <span className="text-sm text-gray-200 font-medium">{displayName}</span>
            <span className="block text-[10px] text-gray-500">已登录</span>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="px-3.5 py-1.5 text-xs text-gray-400 hover:text-white bg-dark-700 hover:bg-red-900/30 rounded-lg transition-all border border-gray-700/50 hover:border-red-700/50"
          aria-label="退出登录"
        >
          退出
        </button>
      </div>
    </nav>
  );
}
