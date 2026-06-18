import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock quotes.json to return empty array for empty state testing
vi.mock('../../src/data/quotes.json', () => ({
  default: [],
}));

// Import App AFTER mock is set up
import App from '../../src/App';

describe('App Integration Tests - Empty State', () => {
  // Validates: Requirement 7.5 - Quote_Pool 为空时显示空状态
  it('displays empty state when no quotes are available', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('暂无可用金句')).toBeInTheDocument();
    });

    // Should show guidance text about adding quotes
    expect(screen.getByText(/docs\/book_read/)).toBeInTheDocument();
  });

  // Validates: Requirement 7.5 - 空状态不显示筛选面板和操作按钮
  it('does not show filter panel or action buttons in empty state', () => {
    render(<App />);

    // No filter panel should be visible
    expect(screen.queryByText('全部')).not.toBeInTheDocument();

    // No copy or refresh buttons
    expect(screen.queryByRole('button', { name: '复制金句到剪贴板' })).not.toBeInTheDocument();
    expect(screen.queryByText('换一句')).not.toBeInTheDocument();
  });
});
