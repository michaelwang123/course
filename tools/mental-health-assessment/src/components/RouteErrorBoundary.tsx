import React from 'react';

interface RouteErrorBoundaryProps {
  children: React.ReactNode;
  /** 出错时显示的回退路径文字，如 "返回首页" */
  fallbackLabel?: string;
  /** 出错时的回退路径 */
  fallbackPath?: string;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
}

/**
 * 路由级错误边界
 * 当单个路由内组件崩溃时，仅该路由显示错误 UI，不影响全局导航
 */
export class RouteErrorBoundary extends React.Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): Partial<RouteErrorBoundaryState> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RouteErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    const path = this.props.fallbackPath || '/';
    window.location.href = path;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center shadow-sm max-w-sm">
            <p className="text-base font-medium text-red-800">
              该页面出现异常
            </p>
            <p className="mt-2 text-sm text-red-600">
              请尝试刷新页面或返回
            </p>
            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                刷新
              </button>
              <button
                onClick={this.handleReset}
                className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                {this.props.fallbackLabel || '返回首页'}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
