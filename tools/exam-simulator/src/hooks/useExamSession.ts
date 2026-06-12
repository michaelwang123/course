import { useState, useEffect, useCallback, useRef } from 'react';
import { ExamSession, ExamRecord } from '../types';
import * as examService from '../services/examService';
import { debounce } from '../lib/debounce';

interface UseExamSessionResult {
  session: ExamSession | null;
  answers: Record<string, string | string[]>;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  submit: () => Promise<ExamRecord>;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for managing an exam session.
 *
 * Responsibilities:
 * - Fetches session data on mount (session recovery)
 * - Manages answers state locally
 * - Debounces answer persistence to server (2s delay)
 * - Provides submit function that calls examService.submitExam
 * - Cancels debounce on unmount
 *
 * Requirements: 4.10, 5.6, 5.7
 */
export function useExamSession(sessionId: string): UseExamSessionResult {
  const [session, setSession] = useState<ExamSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use ref to always hold the latest answers for submit (avoids stale closure)
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Ref to hold the debounced save function so it persists across renders
  const debouncedSaveRef = useRef<
    ((sid: string, ans: Record<string, string | string[]>) => void) & { cancel: () => void } | null
  >(null);

  // Initialize debounced save function
  useEffect(() => {
    const saveFn = (sid: string, ans: Record<string, string | string[]>) => {
      examService.saveAnswers(sid, ans).catch((err) => {
        console.error('Failed to persist answers:', err);
      });
    };

    const debouncedSave = debounce(saveFn, 2000);
    debouncedSaveRef.current = debouncedSave;

    // Cancel debounce on unmount
    return () => {
      debouncedSave.cancel();
    };
  }, []);

  // Session recovery on mount: restore answers from server
  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      setLoading(true);
      setError(null);

      try {
        const fetchedSession = await examService.getSession(sessionId);

        if (cancelled) return;

        if (!fetchedSession) {
          setError('考试会话未找到');
          setLoading(false);
          return;
        }

        setSession(fetchedSession);
        // Restore previously saved answers from server
        setAnswers(fetchedSession.answers ?? {});
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : '加载考试会话失败'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  // setAnswer: update local state and trigger debounced persistence
  const setAnswer = useCallback(
    (questionId: string, answer: string | string[]) => {
      setAnswers((prev) => {
        const updated = { ...prev, [questionId]: answer };

        // Trigger debounced save to server
        if (debouncedSaveRef.current) {
          debouncedSaveRef.current(sessionId, updated);
        }

        return updated;
      });
    },
    [sessionId]
  );

  // submit: call examService.submitExam with the LATEST answers via ref
  const submit = useCallback(async (): Promise<ExamRecord> => {
    // Cancel any pending debounced save before submitting
    if (debouncedSaveRef.current) {
      debouncedSaveRef.current.cancel();
    }

    // Use answersRef.current to always get the latest answers (no stale closure)
    const record = await examService.submitExam(sessionId, answersRef.current);
    return record;
  }, [sessionId]);

  return {
    session,
    answers,
    setAnswer,
    submit,
    loading,
    error,
  };
}
