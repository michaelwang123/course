// src/components/ErrorBoundary.tsx
// 错误边界：暗色主题

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] 捕获渲染错误:', error);
    console.error('[ErrorBoundary] 组件栈:', errorInfo.componentStack);
  }

  handleReload = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
          <div className="bg-dark-800 rounded-lg shadow-2xl border border-gray-800 p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4" aria-hidden="true">😔</div>
            <h1 className="text-xl font-semibold text-gray-100 mb-2">
              出了点问题
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              页面遇到了意外错误，请尝试重新加载。
            </p>
            <button
              onClick={this.handleReload}
              className="px-6 py-2.5 text-sm text-white bg-emerald-600 hover:bg-emerald-500 rounded-md transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
