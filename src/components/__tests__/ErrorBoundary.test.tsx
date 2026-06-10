import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ErrorBoundary from '../ErrorBoundary';

// Component that throws on render
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <p>正常内容</p>;
}

describe('ErrorBoundary', () => {
  // Suppress React error boundary console.error noise in tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
    cleanup();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <p>Hello</p>
      </ErrorBoundary>
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('shows default fallback with retry button when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('加载此部分时出错')).toBeInTheDocument();
    expect(screen.getByText('重试')).toBeInTheDocument();
    expect(screen.queryByText('正常内容')).not.toBeInTheDocument();
  });

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<p>自定义错误</p>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('自定义错误')).toBeInTheDocument();
    expect(screen.queryByText('重试')).not.toBeInTheDocument();
  });

  it('hides retry button when showRetry=false', () => {
    render(
      <ErrorBoundary showRetry={false}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('加载此部分时出错')).toBeInTheDocument();
    expect(screen.queryByText('重试')).not.toBeInTheDocument();
  });

  it('recovers when retry button is clicked and error is resolved', () => {
    // Use a variable to control throwing behavior across re-renders
    let shouldThrow = true;

    function ConditionalThrower() {
      if (shouldThrow) throw new Error('Test error');
      return <p>正常内容</p>;
    }

    render(
      <ErrorBoundary>
        <ConditionalThrower />
      </ErrorBoundary>
    );

    expect(screen.getByText('加载此部分时出错')).toBeInTheDocument();

    // Fix the "error" so next render succeeds
    shouldThrow = false;

    // Click retry — this resets ErrorBoundary state, causing re-render
    fireEvent.click(screen.getByText('重试'));

    expect(screen.getByText('正常内容')).toBeInTheDocument();
  });

  it('renders nothing when fallback is explicitly null', () => {
    const { container } = render(
      <ErrorBoundary fallback={null}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(container.innerHTML).toBe('');
  });
});
