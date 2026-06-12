import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QuestionNavBar } from '../../src/components/QuestionNavBar';

afterEach(() => {
  cleanup();
});

describe('QuestionNavBar', () => {
  const questionIds = ['q1', 'q2', 'q3', 'q4', 'q5'];

  it('renders numbered buttons for each question', () => {
    const onNavigate = vi.fn();
    render(
      <QuestionNavBar
        totalQuestions={5}
        answeredQuestions={new Set<string>()}
        questionIds={questionIds}
        onNavigate={onNavigate}
      />
    );

    for (let i = 1; i <= 5; i++) {
      expect(screen.getByText(String(i))).toBeDefined();
    }
  });

  it('applies filled background for answered questions (Set)', () => {
    const onNavigate = vi.fn();
    render(
      <QuestionNavBar
        totalQuestions={5}
        answeredQuestions={new Set(['q1', 'q3'])}
        questionIds={questionIds}
        onNavigate={onNavigate}
      />
    );

    const btn1 = screen.getByText('1');
    const btn2 = screen.getByText('2');
    const btn3 = screen.getByText('3');

    // Answered buttons have filled blue background
    expect(btn1.className).toContain('bg-blue-600');
    expect(btn3.className).toContain('bg-blue-600');

    // Unanswered buttons have outline border
    expect(btn2.className).toContain('border-2');
    expect(btn2.className).toContain('border-blue-600');
  });

  it('applies filled background for answered questions (array)', () => {
    const onNavigate = vi.fn();
    render(
      <QuestionNavBar
        totalQuestions={5}
        answeredQuestions={new Set(['q2', 'q4'])}
        questionIds={questionIds}
        onNavigate={onNavigate}
      />
    );

    const btn2 = screen.getByText('2');
    const btn4 = screen.getByText('4');
    const btn5 = screen.getByText('5');

    expect(btn2.className).toContain('bg-blue-600');
    expect(btn4.className).toContain('bg-blue-600');
    expect(btn5.className).toContain('border-2');
  });

  it('calls onNavigate with question ID and index on click', () => {
    const onNavigate = vi.fn();
    render(
      <QuestionNavBar
        totalQuestions={5}
        answeredQuestions={new Set<string>()}
        questionIds={questionIds}
        onNavigate={onNavigate}
      />
    );

    fireEvent.click(screen.getByText('3'));
    expect(onNavigate).toHaveBeenCalledWith('q3', 2);

    fireEvent.click(screen.getByText('1'));
    expect(onNavigate).toHaveBeenCalledWith('q1', 0);
  });

  it('has accessible aria-labels', () => {
    const onNavigate = vi.fn();
    render(
      <QuestionNavBar
        totalQuestions={3}
        answeredQuestions={new Set(['q1'])}
        questionIds={['q1', 'q2', 'q3']}
        onNavigate={onNavigate}
      />
    );

    expect(screen.getByLabelText('题目 1（已作答）')).toBeDefined();
    expect(screen.getByLabelText('题目 2（未作答）')).toBeDefined();
    expect(screen.getByLabelText('题目 3（未作答）')).toBeDefined();
  });
});
