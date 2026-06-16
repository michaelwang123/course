import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessmentContext } from '@/context/AssessmentContext';
import { calculateProgress, countUnanswered } from '@/lib/validators';
import { saveProgress, loadProgress, clearProgress } from '@/lib/storage';
import { calculateScore } from '@/lib/scoring-engine';
import { supabase } from '@/lib/supabase';
import { useScaleItems } from '@/hooks/useScaleItems';
import { ProgressBar } from '@/components/ProgressBar';
import { QuestionCard } from '@/components/QuestionCard';
import { Disclaimer } from '@/components/Disclaimer';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { AnswerRecord } from '@/types';

/**
 * 测评答题页面
 * 单题模式展示，支持自动跳转、进度保存、会话恢复
 */
export function AssessmentPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAssessmentContext();
  const { sessionId, scaleId, scaleName, participantName, jobType, items, answers, currentIndex, isSubmitting, error } = state;

  // 会话恢复后需要重新加载题目（localStorage 不存储 items）
  const { items: fetchedItems, loading: itemsLoading } = useScaleItems(
    scaleId && items.length === 0 ? scaleId : null
  );

  // 题目加载完成后写入 context
  useEffect(() => {
    if (fetchedItems.length > 0 && items.length === 0 && scaleId) {
      dispatch({
        type: 'INIT_SESSION',
        payload: {
          sessionId: sessionId!,
          scaleId,
          scaleName: scaleName || '',
          participantName,
          jobType: jobType!,
          items: fetchedItems,
        },
      });
      // 恢复已有的 answers 和 currentIndex
      const stored = loadProgress();
      if (stored && stored.sessionId === sessionId) {
        dispatch({
          type: 'RESTORE_SESSION',
          payload: {
            sessionId: stored.sessionId,
            scaleId: stored.scaleId,
            scaleName: scaleName || '',
            participantName: stored.participantName,
            jobType: stored.jobType,
            answers: stored.answers,
            currentIndex: stored.currentIndex,
          },
        });
      }
    }
  }, [fetchedItems, items.length, scaleId, sessionId, scaleName, participantName, jobType, dispatch]);

  // Session recovery state
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoveryChecked, setRecoveryChecked] = useState(false);

  // Unanswered confirmation dialog
  const [showUnansweredDialog, setShowUnansweredDialog] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);

  // Auto-save debounce timer
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-advance timer
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check for unfinished session on mount
  useEffect(() => {
    if (recoveryChecked) return;

    const stored = loadProgress();
    if (stored && !sessionId) {
      // There's a stored session but no active session — show recovery prompt
      setShowRecoveryPrompt(true);
    }
    setRecoveryChecked(true);
  }, [sessionId, recoveryChecked]);

  // Auto-save to localStorage (debounced 2 seconds after answer change)
  const autoSave = useCallback(() => {
    if (!sessionId || !scaleId || !participantName || !jobType) return;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(() => {
      saveProgress({
        sessionId,
        scaleId,
        participantName,
        jobType,
        answers,
        currentIndex,
        savedAt: new Date().toISOString(),
      });
    }, 2000);
  }, [sessionId, scaleId, participantName, jobType, answers, currentIndex]);

  // Trigger auto-save when answers or currentIndex change
  useEffect(() => {
    if (sessionId) {
      autoSave();
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // 组件卸载时立即保存一次进度，避免丢失最后几秒的作答
      if (sessionId && scaleId && participantName && jobType) {
        saveProgress({
          sessionId,
          scaleId,
          participantName,
          jobType,
          answers,
          currentIndex,
          savedAt: new Date().toISOString(),
        });
      }
    };
  }, [answers, currentIndex, autoSave, sessionId]);

  // Cleanup advance timer on unmount
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
    };
  }, []);

  // Handle session recovery
  function handleResumeSession() {
    const stored = loadProgress();
    if (stored) {
      dispatch({
        type: 'RESTORE_SESSION',
        payload: {
          sessionId: stored.sessionId,
          scaleId: stored.scaleId,
          scaleName: '', // 将在 items 加载后从 Supabase 获取
          participantName: stored.participantName,
          jobType: stored.jobType,
          answers: stored.answers,
          currentIndex: stored.currentIndex,
        },
      });
    }
    setShowRecoveryPrompt(false);
  }

  function handleRestartSession() {
    clearProgress();
    setShowRecoveryPrompt(false);
  }

  // Handle answer selection
  function handleSelectAnswer(score: number) {
    if (!currentItem) return;

    dispatch({
      type: 'SET_ANSWER',
      payload: { itemId: currentItem.id, score },
    });

    // Auto-advance to next question after 300ms (except last question)
    if (currentIndex < items.length - 1) {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      advanceTimerRef.current = setTimeout(() => {
        dispatch({ type: 'GO_NEXT' });
      }, 300);
    }
  }

  // Handle navigation
  function handlePrev() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    dispatch({ type: 'GO_PREV' });
  }

  function handleNext() {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    dispatch({ type: 'GO_NEXT' });
  }

  // Handle submit
  function handleSubmitClick() {
    const unanswered = countUnanswered(answers, items.length);
    if (unanswered > 0) {
      setUnansweredCount(unanswered);
      setShowUnansweredDialog(true);
    } else {
      submitAssessment();
    }
  }

  function handleUnansweredConfirm() {
    setShowUnansweredDialog(false);
    submitAssessment();
  }

  function handleUnansweredCancel() {
    setShowUnansweredDialog(false);
    // Go back to the first unanswered question
    const firstUnansweredIndex = items.findIndex(
      (item) => answers[item.id] === undefined
    );
    if (firstUnansweredIndex >= 0) {
      dispatch({ type: 'GO_TO', payload: firstUnansweredIndex });
    }
  }

  async function submitAssessment() {
    if (!sessionId || !scaleId) return;

    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Fetch scale scoring info from Supabase
      const { data: scaleData, error: scaleError } = await supabase
        .from('mha_scales')
        .select('scoring_rule, grade_thresholds')
        .eq('id', scaleId)
        .single();

      if (scaleError || !scaleData) {
        dispatch({ type: 'SET_ERROR', payload: '获取评分规则失败，请重试' });
        dispatch({ type: 'SET_SUBMITTING', payload: false });
        return;
      }

      // Convert answers from Record<string, number> to AnswerRecord[]
      const answerRecords: AnswerRecord[] = Object.entries(answers).map(
        ([itemId, selectedScore]) => ({ itemId, selectedScore })
      );

      // Calculate score
      const result = calculateScore({
        answers: answerRecords,
        items,
        scoringRule: scaleData.scoring_rule,
        gradeThresholds: scaleData.grade_thresholds,
      });

      // Save results to Supabase
      const { error: updateError } = await supabase
        .from('mha_assessment_sessions')
        .update({
          answers: answerRecords,
          raw_score: result.rawScore,
          standard_score: result.standardScore,
          grade_level: result.gradeLevel,
          interpretation: result.interpretation,
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      if (updateError) {
        // Still navigate to result - results can be shown even if save fails
        console.warn('Failed to save assessment results:', updateError.message);
      }

      // Clear localStorage progress
      clearProgress();

      // Navigate to results page
      navigate(`/result/${sessionId}`);
    } catch {
      dispatch({ type: 'SET_ERROR', payload: '提交失败，您的作答已保存，请重新提交' });
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }

  // If no session is active and no recovery prompt, redirect to home
  if (!sessionId && recoveryChecked && !showRecoveryPrompt) {
    return (
      <div className="space-y-6 text-center py-8">
        <p className="text-gray-600">当前没有进行中的测评</p>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-green-600 px-6 py-3 text-base font-medium text-white hover:bg-green-700"
        >
          返回首页
        </button>
      </div>
    );
  }

  // Recovery prompt
  if (showRecoveryPrompt) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6 text-center space-y-4">
          <h2 className="text-lg font-bold text-gray-900">发现未完成的测评</h2>
          <p className="text-gray-600">检测到您有一份未完成的测评记录，是否继续？</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleResumeSession}
              className="w-full min-h-[44px] rounded-lg bg-green-600 px-6 py-3 text-base font-medium text-white hover:bg-green-700"
            >
              继续测评
            </button>
            <button
              onClick={handleRestartSession}
              className="w-full min-h-[44px] rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
            >
              重新开始
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state (items not yet loaded)
  if (items.length === 0 || itemsLoading) {
    return <LoadingSpinner />;
  }

  const currentItem = items[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const percentage = calculateProgress(answeredCount, items.length);
  const isLastQuestion = currentIndex === items.length - 1;
  const isFirstQuestion = currentIndex === 0;

  return (
    <div className="space-y-6">
      {/* Header with scale name and progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">{scaleName}</h1>
          <span className="text-sm text-gray-500">
            {answeredCount}/{items.length} 已答
          </span>
        </div>
        <ProgressBar percentage={percentage} />
      </div>

      {/* Question card */}
      {currentItem && (
        <QuestionCard
          questionNumber={currentIndex + 1}
          totalQuestions={items.length}
          content={currentItem.content}
          options={currentItem.options}
          selectedScore={answers[currentItem.id]}
          onSelect={handleSelectAnswer}
        />
      )}

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {!isFirstQuestion && (
          <button
            onClick={handlePrev}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] rounded-lg border border-gray-300 px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            上一题
          </button>
        )}

        {!isLastQuestion && (
          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-base font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
          >
            下一题
          </button>
        )}

        {isLastQuestion && (
          <button
            onClick={handleSubmitClick}
            disabled={isSubmitting}
            className="flex-1 min-h-[44px] rounded-lg bg-green-600 px-4 py-3 text-base font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isSubmitting ? '提交中...' : '提交测评'}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={handleSubmitClick}
            className="mt-3 rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
          >
            重新提交
          </button>
        </div>
      )}

      {/* Disclaimer at bottom */}
      <div className="pt-4 border-t border-gray-100">
        <Disclaimer />
      </div>

      {/* Unanswered questions confirmation dialog */}
      {showUnansweredDialog && (
        <ConfirmDialog
          title="有未答题目"
          message={`还有 ${unansweredCount} 道题未作答，是否仍然提交？`}
          onConfirm={handleUnansweredConfirm}
          onCancel={handleUnansweredCancel}
        />
      )}
    </div>
  );
}
