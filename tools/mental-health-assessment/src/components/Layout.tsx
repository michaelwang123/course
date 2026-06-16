import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * 全局布局组件
 * 绿白配色，响应式容器，最小字体 16px
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-green-50 text-gray-800" style={{ fontSize: '16px' }}>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
