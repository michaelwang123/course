import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { QuestionCard } from '@/components/QuestionCard';

const defaultOptions = [
  { text: '没有或很少时间', score: 1 },
  { text: '小部分时间', score: 2 },
  { text: '相当多时间', score: 3 },
  { text: '绝大部分或全部时间', score: 4 },
];

describe('QuestionCard', () => {
  it('renders question number in format "第 X/Y 题"', () => {
    const { container } = render(
      <QuestionCard
        questionNumber={3}
        totalQuestions={20}
        content="我觉得闷闷不乐，情绪低沉"
        options={defaultOptions}
        onSelect={() => {}}
      />
    );
    expect(container.textContent).toContain('第 3/20 题');
  });

  it('renders question content text', () => {
    const content = '我觉得闷闷不乐，情绪低沉';
    const { container } = render(
      <QuestionCard
        questionNumber={1}
        totalQuestions={20}
        content={content}
        options={defaultOptions}
        onSelect={() => {}}
      />
    );
    expect(container.textContent).toContain(content);
  });

  it('renders all option buttons', () => {
    const { container } = render(
      <QuestionCard
        questionNumber={1}
        totalQuestions={20}
        content="测试题目"
        options={defaultOptions}
        onSelect={() => {}}
      />
    );
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(defaultOptions.length);
    for (const option of defaultOptions) {
      expect(container.textContent).toContain(option.text);
    }
  });

  it('selected option has correct visual state (aria-pressed)', () => {
    const { container } = render(
      <QuestionCard
        questionNumber={1}
        totalQuestions={20}
        content="测试题目"
        options={defaultOptions}
        selectedScore={2}
        onSelect={() => {}}
      />
    );
    const buttons = container.querySelectorAll('button');
    // The button for score=2 ("小部分时间") should be selected
    const selectedButton = Array.from(buttons).find(
      (btn) => btn.getAttribute('aria-pressed') === 'true'
    );
    expect(selectedButton).not.toBeUndefined();
    expect(selectedButton!.textContent).toContain('小部分时间');
  });

  it('calls onSelect with the correct score when an option is clicked', () => {
    const onSelect = vi.fn();
    const { container } = render(
      <QuestionCard
        questionNumber={1}
        totalQuestions={20}
        content="测试题目"
        options={defaultOptions}
        onSelect={onSelect}
      />
    );
    const buttons = container.querySelectorAll('button');
    fireEvent.click(buttons[2]); // click "相当多时间" (score: 3)
    expect(onSelect).toHaveBeenCalledWith(3);
  });

  it('unselected options have aria-pressed="false"', () => {
    const { container } = render(
      <QuestionCard
        questionNumber={1}
        totalQuestions={20}
        content="测试题目"
        options={defaultOptions}
        selectedScore={1}
        onSelect={() => {}}
      />
    );
    const buttons = container.querySelectorAll('button');
    const unselectedButtons = Array.from(buttons).filter(
      (btn) => btn.getAttribute('aria-pressed') === 'false'
    );
    expect(unselectedButtons.length).toBe(3);
  });
});
