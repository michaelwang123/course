import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import RefreshButton from '../../src/components/RefreshButton';

describe('RefreshButton', () => {
  it('renders "换一句" button text', () => {
    render(<RefreshButton onRefresh={() => {}} disabled={false} />);
    expect(screen.getByText('换一句')).toBeInTheDocument();
  });

  it('calls onRefresh when clicked and not disabled', () => {
    const onRefresh = vi.fn();
    render(<RefreshButton onRefresh={onRefresh} disabled={false} />);
    fireEvent.click(screen.getByText('换一句'));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not call onRefresh when disabled', () => {
    const onRefresh = vi.fn();
    render(<RefreshButton onRefresh={onRefresh} disabled={true} />);
    fireEvent.click(screen.getByText('换一句'));
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('shows "已无更多金句" hint when disabled', () => {
    render(<RefreshButton onRefresh={() => {}} disabled={true} />);
    expect(screen.getByText('已无更多金句')).toBeInTheDocument();
  });

  it('does not show "已无更多金句" hint when not disabled', () => {
    render(<RefreshButton onRefresh={() => {}} disabled={false} />);
    expect(screen.queryByText('已无更多金句')).not.toBeInTheDocument();
  });

  it('button has disabled attribute when disabled prop is true', () => {
    render(<RefreshButton onRefresh={() => {}} disabled={true} />);
    const btn = screen.getByText('换一句');
    expect(btn).toBeDisabled();
  });

  it('button does not have disabled attribute when disabled prop is false', () => {
    render(<RefreshButton onRefresh={() => {}} disabled={false} />);
    const btn = screen.getByText('换一句');
    expect(btn).not.toBeDisabled();
  });
});
