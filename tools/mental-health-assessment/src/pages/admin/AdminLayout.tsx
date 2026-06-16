import { NavLink, Outlet } from 'react-router-dom';

/**
 * 管理页面布局
 * 包含侧边导航（移动端为顶部导航）和内容区域
 */
export function AdminLayout() {
  return (
    <div className="min-h-screen bg-green-50 text-gray-800" style={{ fontSize: '16px' }}>
      {/* 顶部导航栏 */}
      <header className="border-b border-green-200 bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <h1 className="text-lg font-semibold text-green-800">
              心理测评管理后台
            </h1>
            <nav className="flex items-center gap-1">
              <NavLink
                to="/admin/scales"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                  }`
                }
              >
                量表管理
              </NavLink>
              <NavLink
                to="/admin/records"
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-green-100 text-green-800'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                  }`
                }
              >
                测评记录
              </NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* 内容区域 */}
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
