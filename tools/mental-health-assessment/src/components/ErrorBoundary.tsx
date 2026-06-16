import React from 'react';
import { checkConnection } from '@/lib/supabase';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  connectionWarning: boolean;
}

/**
 * 全局错误边界组件
 * - 捕获渲染异常时显示降级 UI
 * - Supabase 连接失败时显示警告 toast（不阻断应用）
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      connectionWarning: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidMount() {
    this.checkSupabaseConnection();
  }

  private async checkSupabaseConnection() {
    const connected = await checkConnection();
    if (!connected) {
      // 仅显示警告，不阻断应用渲染
      this.setState({ connectionWarning: true });
    }
  }

  private handleDismissWarning = () => {
    this.setState({ connectionWarning: false });
  };

  render() {
    // 渲染错误时显示降级 UI
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-green-50 px-4">
          <div className="rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-medium text-gray-700">
              页面出现异常
            </p>
            <p className="mt-2 text-sm text-gray-500">
              请刷新页面重试
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* 连接警告 toast — 不阻断子组件渲染 */}
        {this.state.connectionWarning && (
          <div
            className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 shadow-md"
            role="alert"
          >
            <div className="flex items-center gap-3">
              <p className="text-sm text-yellow-800">
                网络连接异常，部分功能可能不可用
              </p>
              <button
                onClick={this.handleDismissWarning}
                className="shrink-0 text-yellow-600 hover:text-yellow-800"
                aria-label="关闭警告"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        {this.props.children}
      </>
    );
  }
}
