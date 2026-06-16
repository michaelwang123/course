import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';

// Mock useScales hook
const mockUseScales = vi.fn();
vi.mock('@/hooks/useScales', () => ({
  useScales: (...args: unknown[]) => mockUseScales(...args),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders available scales from hook', () => {
    mockUseScales.mockReturnValue({
      scales: [
        {
          id: 'scale-1',
          name: 'SDS 抑郁自评量表',
          description: '用于评估抑郁情绪的标准化量表',
          itemCount: 20,
          estimatedMinutes: 10,
        },
        {
          id: 'scale-2',
          name: 'SAS 焦虑自评量表',
          description: '用于评估焦虑情绪的标准化量表',
          itemCount: 20,
          estimatedMinutes: 10,
        },
      ],
      loading: false,
      error: null,
      total: 2,
    });

    renderHomePage();

    expect(screen.getByText('SDS 抑郁自评量表')).toBeInTheDocument();
    expect(screen.getByText('SAS 焦虑自评量表')).toBeInTheDocument();
    expect(screen.getByText('用于评估抑郁情绪的标准化量表')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseScales.mockReturnValue({
      scales: [],
      loading: true,
      error: null,
      total: 0,
    });

    renderHomePage();

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseScales.mockReturnValue({
      scales: [],
      loading: false,
      error: 'Network error',
      total: 0,
    });

    renderHomePage();

    expect(screen.getByText('当前无法加载测评量表，请稍后重试')).toBeInTheDocument();
  });

  it('shows empty state when no scales available', () => {
    mockUseScales.mockReturnValue({
      scales: [],
      loading: false,
      error: null,
      total: 0,
    });

    renderHomePage();

    expect(screen.getByText('当前暂无可用测评')).toBeInTheDocument();
  });

  it('navigates to info page when scale card is clicked', async () => {
    mockUseScales.mockReturnValue({
      scales: [
        {
          id: 'scale-1',
          name: 'SDS 抑郁自评量表',
          description: '用于评估抑郁情绪的标准化量表',
          itemCount: 20,
          estimatedMinutes: 10,
        },
      ],
      loading: false,
      error: null,
      total: 1,
    });

    renderHomePage();

    const user = userEvent.setup();
    const scaleCard = screen.getByText('SDS 抑郁自评量表');
    await user.click(scaleCard);

    expect(mockNavigate).toHaveBeenCalledWith('/info/scale-1');
  });
});
