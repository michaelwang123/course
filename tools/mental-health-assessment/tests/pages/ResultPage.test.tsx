import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AssessmentProvider } from '@/context/AssessmentContext';
import { ResultPage } from '@/pages/ResultPage';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock storage
vi.mock('@/lib/storage', () => ({
  clearProgress: vi.fn(),
  loadProgress: vi.fn(() => null),
  saveProgress: vi.fn(),
}));

// Mock supabase - return completed session data
const mockSupabaseFrom = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockSupabaseFrom(...args),
  },
}));

function renderResultPage(sessionId: string = 'session-123') {
  return render(
    <MemoryRouter initialEntries={[`/result/${sessionId}`]}>
      <AssessmentProvider>
        <Routes>
          <Route path="/result/:sessionId" element={<ResultPage />} />
        </Routes>
      </AssessmentProvider>
    </MemoryRouter>
  );
}

describe('ResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: return a completed session from Supabase
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === 'mha_assessment_sessions') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: 'session-123',
                    participant_name: '李四',
                    job_type: '老人护理',
                    scale_id: 'scale-1',
                    answers: [
                      { itemId: 'item-1', selectedScore: 2 },
                      { itemId: 'item-2', selectedScore: 3 },
                    ],
                    raw_score: 40,
                    standard_score: 50,
                    grade_level: '正常',
                    interpretation: '您的情绪状态良好，请继续保持。',
                    started_at: '2024-01-15T10:00:00.000Z',
                    completed_at: '2024-01-15T10:30:00.000Z',
                  },
                  error: null,
                }),
            }),
          }),
          update: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        };
      }
      if (table === 'mha_scales') {
        return {
          select: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: {
                    id: 'scale-1',
                    name: 'SDS 抑郁自评量表',
                    description: '抑郁自评量表',
                    scale_type: '抑郁',
                    target_audience: '家政从业人员',
                    item_count: 20,
                    estimated_minutes: 10,
                    scoring_rule: { type: 'multiply', factor: 1.25, maxOptionScore: 4 },
                    grade_thresholds: [
                      { level: '正常', minScore: 0, maxScore: 52, interpretation: '您的情绪状态良好' },
                      { level: '轻度', minScore: 53, maxScore: 62, interpretation: '轻度抑郁' },
                    ],
                    created_at: '2024-01-01T00:00:00.000Z',
                  },
                  error: null,
                }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      };
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('displays score and grade level', async () => {
    renderResultPage();

    await waitFor(() => {
      expect(screen.getByText('测评结果')).toBeInTheDocument();
    });

    // Check score display
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('正常')).toBeInTheDocument();
  });

  it('shows participant info', async () => {
    renderResultPage();

    await waitFor(() => {
      expect(screen.getByText('测评结果')).toBeInTheDocument();
    });

    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('老人护理')).toBeInTheDocument();
    expect(screen.getByText('SDS 抑郁自评量表')).toBeInTheDocument();
  });

  it('shows navigation buttons', async () => {
    renderResultPage();

    await waitFor(() => {
      expect(screen.getByText('测评结果')).toBeInTheDocument();
    });

    expect(screen.getByText('返回首页')).toBeInTheDocument();
    expect(screen.getByText('再次测评')).toBeInTheDocument();
  });

  it('navigates home when "返回首页" is clicked', async () => {
    renderResultPage();

    await waitFor(() => {
      expect(screen.getByText('测评结果')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('返回首页'));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('navigates to home for another assessment when "再次测评" is clicked', async () => {
    renderResultPage();

    await waitFor(() => {
      expect(screen.getByText('测评结果')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText('再次测评'));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('shows interpretation text', async () => {
    renderResultPage();

    await waitFor(() => {
      expect(screen.getByText('您的情绪状态良好，请继续保持。')).toBeInTheDocument();
    });
  });
});
