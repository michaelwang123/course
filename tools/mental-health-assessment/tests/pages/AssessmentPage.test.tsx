import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AssessmentProvider, useAssessmentContext } from '@/context/AssessmentContext';
import { AssessmentPage } from '@/pages/AssessmentPage';
import type { ScaleItem } from '@/types';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: {
              scoring_rule: { type: 'multiply', factor: 1.25, maxOptionScore: 4 },
              grade_thresholds: [
                { level: '正常', minScore: 0, maxScore: 52, interpretation: '情绪正常' },
                { level: '轻度', minScore: 53, maxScore: 62, interpretation: '轻度抑郁' },
              ],
            },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

// Mock localStorage storage
vi.mock('@/lib/storage', () => ({
  saveProgress: vi.fn(),
  loadProgress: vi.fn(() => null),
  clearProgress: vi.fn(),
  hasUnfinishedSession: vi.fn(() => false),
}));

const mockItems: ScaleItem[] = [
  {
    id: 'item-1',
    scaleId: 'scale-1',
    itemOrder: 1,
    content: '我感到情绪沮丧、郁闷',
    options: [
      { text: '没有或很少时间', score: 1 },
      { text: '小部分时间', score: 2 },
      { text: '相当多时间', score: 3 },
      { text: '绝大部分或全部时间', score: 4 },
    ],
    isReverseScored: false,
  },
  {
    id: 'item-2',
    scaleId: 'scale-1',
    itemOrder: 2,
    content: '我觉得一天之中早晨最好',
    options: [
      { text: '没有或很少时间', score: 1 },
      { text: '小部分时间', score: 2 },
      { text: '相当多时间', score: 3 },
      { text: '绝大部分或全部时间', score: 4 },
    ],
    isReverseScored: true,
  },
  {
    id: 'item-3',
    scaleId: 'scale-1',
    itemOrder: 3,
    content: '我觉得活着没有什么意义',
    options: [
      { text: '没有或很少时间', score: 1 },
      { text: '小部分时间', score: 2 },
      { text: '相当多时间', score: 3 },
      { text: '绝大部分或全部时间', score: 4 },
    ],
    isReverseScored: false,
  },
];

// A wrapper component that initializes the session before rendering AssessmentPage
function InitializedAssessmentPage({ items }: { items: ScaleItem[] }) {
  const { dispatch } = useAssessmentContext();
  const initialized = React.useRef(false);

  React.useEffect(() => {
    if (!initialized.current) {
      dispatch({
        type: 'INIT_SESSION',
        payload: {
          sessionId: 'session-123',
          scaleId: 'scale-1',
          scaleName: 'SDS 抑郁自评量表',
          participantName: '张三',
          jobType: '月嫂' as const,
          items,
        },
      });
      initialized.current = true;
    }
  }, [dispatch, items]);

  return <AssessmentPage />;
}

function renderAssessmentPage(items: ScaleItem[] = mockItems) {
  return render(
    <MemoryRouter>
      <AssessmentProvider>
        <InitializedAssessmentPage items={items} />
      </AssessmentProvider>
    </MemoryRouter>
  );
}

describe('AssessmentPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the first question with options', async () => {
    renderAssessmentPage();

    await waitFor(() => {
      expect(screen.getByText('我感到情绪沮丧、郁闷')).toBeInTheDocument();
    });

    expect(screen.getByText('第 1/3 题')).toBeInTheDocument();
    expect(screen.getByText('没有或很少时间')).toBeInTheDocument();
    expect(screen.getByText('小部分时间')).toBeInTheDocument();
    expect(screen.getByText('相当多时间')).toBeInTheDocument();
    expect(screen.getByText('绝大部分或全部时间')).toBeInTheDocument();
  });

  it('auto-advances to next question after answer selection', async () => {
    renderAssessmentPage();

    await waitFor(() => {
      expect(screen.getByText('我感到情绪沮丧、郁闷')).toBeInTheDocument();
    });

    // Select an answer
    screen.getByText('小部分时间').click();

    // Wait for auto-advance (300ms delay)
    await waitFor(() => {
      expect(screen.getByText('我觉得一天之中早晨最好')).toBeInTheDocument();
    }, { timeout: 1000 });

    expect(screen.getByText('第 2/3 题')).toBeInTheDocument();
  });

  it('previous button navigates backward while preserving answers', async () => {
    renderAssessmentPage();

    await waitFor(() => {
      expect(screen.getByText('我感到情绪沮丧、郁闷')).toBeInTheDocument();
    });

    // Select answer on first question
    screen.getByText('小部分时间').click();

    // Wait for auto-advance to second question
    await waitFor(() => {
      expect(screen.getByText('我觉得一天之中早晨最好')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Click previous button
    screen.getByText('上一题').click();

    // Should be back on first question with answer preserved
    await waitFor(() => {
      expect(screen.getByText('我感到情绪沮丧、郁闷')).toBeInTheDocument();
    });

    // The previously selected option should still be selected (aria-pressed="true")
    const selectedOption = screen.getByText('小部分时间').closest('button');
    expect(selectedOption).toHaveAttribute('aria-pressed', 'true');
  });

  it('progress bar updates correctly as answers are given', async () => {
    renderAssessmentPage();

    await waitFor(() => {
      expect(screen.getByText('我感到情绪沮丧、郁闷')).toBeInTheDocument();
    });

    // Initially 0/3 answered
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');

    // Select answer on first question
    screen.getByText('没有或很少时间').click();

    // Now 1/3 answered = 33%
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
    });
  });

  it('shows submit button on last question', async () => {
    renderAssessmentPage();

    await waitFor(() => {
      expect(screen.getByText('我感到情绪沮丧、郁闷')).toBeInTheDocument();
    });

    // Navigate to last question by answering
    screen.getByText('没有或很少时间').click();

    await waitFor(() => {
      expect(screen.getByText('我觉得一天之中早晨最好')).toBeInTheDocument();
    }, { timeout: 1000 });

    screen.getByText('小部分时间').click();

    await waitFor(() => {
      expect(screen.getByText('我觉得活着没有什么意义')).toBeInTheDocument();
    }, { timeout: 1000 });

    // On last question, submit button should be visible
    expect(screen.getByText('提交测评')).toBeInTheDocument();
  });

  it('shows unanswered confirmation dialog when submitting with unanswered questions', async () => {
    renderAssessmentPage();

    await waitFor(() => {
      expect(screen.getByText('我感到情绪沮丧、郁闷')).toBeInTheDocument();
    });

    // Answer first question
    screen.getByText('没有或很少时间').click();

    await waitFor(() => {
      expect(screen.getByText('我觉得一天之中早晨最好')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Answer second question to advance to third
    screen.getByText('相当多时间').click();

    await waitFor(() => {
      expect(screen.getByText('我觉得活着没有什么意义')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Click submit without answering last question
    screen.getByText('提交测评').click();

    // Should show unanswered dialog
    await waitFor(() => {
      expect(screen.getByText('有未答题目')).toBeInTheDocument();
      expect(screen.getByText(/还有 1 道题未作答/)).toBeInTheDocument();
    });
  });
});
