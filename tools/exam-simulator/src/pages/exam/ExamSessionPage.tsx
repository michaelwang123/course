import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExamSession } from '../../hooks/useExamSession';
import { useTimer } from '../../hooks/useTimer';
import { Timer } from '../../components/Timer';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';
import { Question } from '../../types';
import { QuestionNavBar } from '../../components/QuestionNavBar';
import * as questionService from '../../services/questionService';

// --- Sub-components for readability ---

interface ExamHeaderProps {
  studentName: string;
  timer: {
    remainingSeconds: number;
    formattedTime: string;
    isWarning: boolean;
    isCritical: boolean;
  };
}

const ExamHeader: React.FC<ExamHeaderProps> = ({ studentName, timer }) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white min-h-[48px] flex items-center px-4 shadow-md">
    <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
      <h1 className="text-lg font-bold">在线考试系统</h1>
      <div className="flex items-center gap-4">
        <span className="text-sm text-blue-100">考试中，请勿离开页面</span>
        <div className="bg-white/10 px-3 py-1 rounded">
          <Timer
            remainingSeconds={timer.remainingSeconds}
            formattedTime={timer.formattedTime}
            isWarning={timer.isWarning}
            isCritical={timer.isCritical}
          />
        </div>
      </div>
      <span className="text-sm">考生：{studentName}</span>
    </div>
  </header>
);

interface QuestionItemProps {
  question: Question;
  index: number;
  currentAnswer: string | string[] | undefined;
  onRadioChange: (questionId: string, value: string) => void;
  onCheckboxChange: (questionId: string, value: string, checked: boolean) => void;
}

const QuestionItem = React.memo<QuestionItemProps>(({
  question,
  index,
  currentAnswer,
  onRadioChange,
  onCheckboxChange,
}) => (
  <div
    id={`question-${index}`}
    className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
  >
    <div className="flex items-start gap-2 mb-4">
      <span className="font-bold text-blue-600 whitespace-nowrap">{index + 1}.</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-gray-900">{question.content}</span>
          {question.type === 'multiple' && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium">
              多选题
            </span>
          )}
        </div>
        <span className="text-xs text-gray-400 mt-1 block">（{question.score}分）</span>
      </div>
    </div>

    <div className="ml-6 space-y-2">
      {question.type === 'multiple' ? (
        question.options.map((option, optIndex) => {
          const answers = (currentAnswer as string[]) || [];
          const isChecked = answers.includes(option);
          return (
            <label key={optIndex} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                name={`question-${question.id}`}
                value={option}
                checked={isChecked}
                onChange={(e) => onCheckboxChange(question.id, option, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          );
        })
      ) : (
        question.options.map((option, optIndex) => {
          const isSelected = currentAnswer === option;
          return (
            <label key={optIndex} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={isSelected}
                onChange={() => onRadioChange(question.id, option)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="text-gray-700">{option}</span>
            </label>
          );
        })
      )}
    </div>
  </div>
));
QuestionItem.displayName = 'QuestionItem';

// --- Main Page Component ---

const ExamSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { session, answers, setAnswer, submit, loading, error } = useExamSession(id || '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Anti-cheat: disable right-click, block Ctrl+C/A/U, beforeunload warning
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && ['c', 'C', 'a', 'A', 'u', 'U'].includes(e.key)) {
        e.preventDefault();
      }
    };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Auto-submit handler when timer reaches 0
  const handleTimeout = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      const record = await submit();
      showToast('error', '考试时间已结束');
      navigate(`/exam/result/${record.id}`);
    } catch {
      showToast('error', '自动提交失败，请手动提交');
      isSubmittingRef.current = false;
    }
  }, [submit, showToast, navigate]);

  // Timer hook — only enabled when session is loaded
  const timer = useTimer({
    startTime: session?.startedAt ?? '',
    durationMinutes: session?.durationMinutes ?? 30,
    onTimeout: handleTimeout,
    enabled: session !== null,
  });

  // Fetch questions via service layer once session is loaded
  useEffect(() => {
    if (!session || session.questionIds.length === 0) {
      setQuestionsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchQuestions() {
      setQuestionsLoading(true);
      setQuestionsError(null);

      try {
        const ordered = await questionService.getByIds(session!.questionIds);
        if (cancelled) return;
        setQuestions(ordered);
      } catch (err) {
        if (cancelled) return;
        setQuestionsError(err instanceof Error ? err.message : '加载题目失败');
      } finally {
        if (!cancelled) {
          setQuestionsLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => { cancelled = true; };
  }, [session]);

  // Use ref for answers in checkbox handler to avoid breaking QuestionItem memo
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Stable handlers wrapped in useCallback for QuestionItem memo
  const handleRadioChange = useCallback((questionId: string, value: string) => {
    setAnswer(questionId, value);
  }, [setAnswer]);

  const handleCheckboxChange = useCallback((questionId: string, value: string, checked: boolean) => {
    const current = (answersRef.current[questionId] as string[]) || [];
    const updated = checked
      ? [...current, value]
      : current.filter((v) => v !== value);
    setAnswer(questionId, updated);
  }, [setAnswer]);

  // Track answered questions for navigation bar
  const answeredQuestions = useMemo(() => {
    const answered = new Set<string>();
    if (session) {
      for (const qId of session.questionIds) {
        const answer = answers[qId];
        if (answer !== undefined && answer !== '' && !(Array.isArray(answer) && answer.length === 0)) {
          answered.add(qId);
        }
      }
    }
    return answered;
  }, [answers, session]);

  // Smooth scroll navigation
  const handleNavigate = useCallback((_questionId: string, index: number) => {
    document.getElementById(`question-${index}`)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSubmitClick = useCallback(() => setShowSubmitDialog(true), []);
  const handleSubmitCancel = useCallback(() => setShowSubmitDialog(false), []);

  const handleSubmitConfirm = useCallback(async () => {
    setShowSubmitDialog(false);
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {
      const record = await submit();
      navigate(`/exam/result/${record.id}`);
    } catch {
      showToast('error', '提交失败，请重试');
      isSubmittingRef.current = false;
    }
  }, [submit, navigate, showToast]);

  // --- Render states ---

  if (loading || questionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">正在加载考试...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">加载失败</h2>
          <p className="mt-2 text-gray-600">{error || '考试会话未找到'}</p>
        </div>
      </div>
    );
  }

  if (questionsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600">题目加载失败</h2>
          <p className="mt-2 text-gray-600">{questionsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 select-none">
      <ExamHeader studentName={session.studentName} timer={timer} />

      <main className="pt-[48px] bg-white min-h-screen">
        {/* Sticky navigation bar */}
        <div className="sticky top-[48px] z-40 bg-gray-50 border-b border-gray-200 px-4 py-2">
          <div className="max-w-4xl mx-auto">
            <QuestionNavBar
              totalQuestions={session.questionIds.length}
              answeredQuestions={answeredQuestions}
              questionIds={session.questionIds}
              onNavigate={handleNavigate}
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="space-y-8">
            {questions.map((question, index) => (
              <QuestionItem
                key={question.id}
                question={question}
                index={index}
                currentAnswer={answers[question.id]}
                onRadioChange={handleRadioChange}
                onCheckboxChange={handleCheckboxChange}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleSubmitClick}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              提交试卷
            </button>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={showSubmitDialog}
        title="确认提交"
        message={`已答 ${answeredQuestions.size} 题，未答 ${session.questionIds.length - answeredQuestions.size} 题，确定提交？`}
        confirmLabel="确定提交"
        cancelLabel="继续答题"
        onConfirm={handleSubmitConfirm}
        onCancel={handleSubmitCancel}
      />
    </div>
  );
};

export default ExamSessionPage;
