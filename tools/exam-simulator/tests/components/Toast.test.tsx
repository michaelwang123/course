import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../../src/components/Toast';

// Helper component to trigger toasts in tests
function ToastTrigger({ type, message }: { type: 'success' | 'error'; message: string }) {
  const { showToast } = useToast();
  return (
    <button onClick={() => showToast(type, message)}>
      Trigger
    </button>
  );
}

describe('Toast', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders success toast with green background', () => {
    const { container } = render(
      <ToastProvider>
        <ToastTrigger type="success" message="操作成功" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger'));

    const alert = container.querySelector('[role="alert"]') as HTMLElement;
    expect(alert).toBeDefined();
    expect(alert.className).toContain('bg-green-500');
    expect(screen.getByText('操作成功')).toBeDefined();
  });

  it('renders error toast with red background', () => {
    const { container } = render(
      <ToastProvider>
        <ToastTrigger type="error" message="保存失败" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger'));

    const alert = container.querySelector('[role="alert"]') as HTMLElement;
    expect(alert).toBeDefined();
    expect(alert.className).toContain('bg-red-500');
    expect(screen.getByText('保存失败')).toBeDefined();
  });

  it('supports stackable notifications', () => {
    function MultiTrigger() {
      const { showToast } = useToast();
      return (
        <>
          <button onClick={() => showToast('success', 'First')}>First</button>
          <button onClick={() => showToast('error', 'Second')}>Second</button>
        </>
      );
    }

    const { container } = render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('First'));
    fireEvent.click(screen.getByText('Second'));

    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts.length).toBe(2);
    expect(alerts[0].textContent).toContain('First');
    expect(alerts[1].textContent).toContain('Second');
  });

  it('auto-dismisses after 3 seconds', () => {
    vi.useFakeTimers();

    render(
      <ToastProvider>
        <ToastTrigger type="success" message="Will disappear" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger'));
    expect(screen.getByText('Will disappear')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Will disappear')).toBeNull();

    vi.useRealTimers();
  });

  it('can be manually dismissed via close button', () => {
    render(
      <ToastProvider>
        <ToastTrigger type="success" message="Dismiss me" />
      </ToastProvider>
    );

    fireEvent.click(screen.getByText('Trigger'));
    expect(screen.getByText('Dismiss me')).toBeDefined();

    fireEvent.click(screen.getByLabelText('关闭通知'));
    expect(screen.queryByText('Dismiss me')).toBeNull();
  });

  it('throws error when useToast is used outside ToastProvider', () => {
    function Orphan() {
      useToast();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow(
      'useToast must be used within a ToastProvider'
    );
  });
});
