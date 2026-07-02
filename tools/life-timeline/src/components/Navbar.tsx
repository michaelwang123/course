// src/components/Navbar.tsx
// 顶部导航栏：用户头像、名称、退出按钮

import type { User } from '@supabase/supabase-js';
import { CATEGORY_COLORS } from '@/types/event';

interface NavbarProps {
  user: User;
  onSignOut: () => void;
}

/** 从分类颜色中选一个作为默认头像背景色 */
const AVATAR_COLORS = Object.values(CATEGORY_COLORS);

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function getDisplayName(user: User): string {
  const meta = user.user_metadata;
  if (meta?.full_name) return meta.full_name;
  if (meta?.name) return meta.name;
  if (user.email) return user.email;
  return '用户';
}

function getAvatarUrl(user: User): string | null {
  const meta = user.user_metadata;
  if (meta?.avatar_url) return meta.avatar_url;
  if (meta?.picture) return meta.picture;
  return null;
}

export function Navbar({ user, onSignOut }: NavbarProps) {
  const displayName = getDisplayName(user);
  const avatarUrl = getAvatarUrl(user);
  const firstChar = displayName.charAt(0).toUpperCase();
  const avatarBgColor = getAvatarColor(displayName);

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-800">人生时光线</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={`${displayName}的头像`}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
              style={{ backgroundColor: avatarBgColor }}
              aria-label={`${displayName}的头像`}
            >
              {firstChar}
            </div>
          )}
          <span className="text-sm text-gray-700 hidden sm:inline">
            {displayName}
          </span>
        </div>

        <button
          onClick={onSignOut}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="退出登录"
        >
          退出
        </button>
      </div>
    </nav>
  );
}
