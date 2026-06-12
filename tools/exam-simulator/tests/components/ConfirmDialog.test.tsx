import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    title: '确认删除',
    message: '确定要删除这道题目吗？此操作不可撤销。',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders nothing when open is false', () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} open={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders title and message when open', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('确认删除')).toBeDefined();
    expect(screen.getByText('确定要删除这道题目吗？此操作不可撤销。')).toBeDefined();
  });

  it('renders default confirm and cancel button labels', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('确认')).toBeDefined();
    expect(screen.getByText('取消')).toBeDefined();
  });

  it('renders custom confirm and cancel button labels', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="删除"
        cancelLabel="返回"
      />
    );
    expect(screen.getByText('删除')).toBeDefined();
    expect(screen.getByText('返回')).toBeDefined();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('确认'));
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('取消'));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when backdrop is clicked', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const backdrop = document.querySelector('[aria-hidden="true"]');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Escape key is pressed', () => {
    render(<ConfirmDialog {...defaultProps} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it('has role="dialog" with correct aria attributes', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toContain('confirm-dialog-title');
    expect(dialog.getAttribute('aria-describedby')).toContain('confirm-dialog-message');
  });

  it('applies red variant styling to confirm button', () => {
    render(<ConfirmDialog {...defaultProps} confirmVariant="red" />);
    const confirmBtn = screen.getByText('确认');
    expect(confirmBtn.className).toContain('bg-red-600');
  });

  it('applies blue variant styling to confirm button by default', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const confirmBtn = screen.getByText('确认');
    expect(confirmBtn.className).toContain('bg-blue-600');
  });

  it('traps focus within the dialog on Tab key', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const cancelBtn = screen.getByText('取消');
    const confirmBtn = screen.getByText('确认');

    // Focus on confirm (last element), Tab should cycle to cancel (first element)
    confirmBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(cancelBtn);
  });

  it('traps focus within the dialog on Shift+Tab key', () => {
    render(<ConfirmDialog {...defaultProps} />);
    const cancelBtn = screen.getByText('取消');
    const confirmBtn = screen.getByText('确认');

    // Focus on cancel (first element), Shift+Tab should cycle to confirm (last element)
    cancelBtn.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirmBtn);
  });
});
