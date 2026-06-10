import React, { Component } from 'react';

interface ErrorBoundaryProps {
  /** Custom fallback UI. If not provided, a default retry message is shown. */
  fallback?: React.ReactNode;
  /** Whether to show a retry button in the default fallback. Default: true */
  showRetry?: boolean;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic React Error Boundary.
 * Catches rendering errors in child components and shows a fallback UI
 * with an optional retry button instead of crashing the entire page.
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      // Custom fallback takes priority
      if (this.props.fallback !== undefined) {
        return this.props.fallback;
      }

      // Default fallback with optional retry button
      const showRetry = this.props.showRetry !== false;
      return (
        <div
          className="error-boundary-fallback"
          style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--color-text-muted, #9ca3af)',
            fontSize: '0.875rem',
          }}
        >
          <p style={{ margin: '0 0 0.5rem' }}>加载此部分时出错</p>
          {showRetry && (
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--color-brand, #00ffaa)',
                background: 'transparent',
                color: 'var(--color-brand, #00ffaa)',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              重试
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
