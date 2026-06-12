import { useState, useEffect, useCallback } from 'react';
import { Question } from '../types';
import * as questionService from '../services/questionService';

export interface UseQuestionsResult {
  questions: Question[];
  loading: boolean;
  error: string | null;
  subject: string | undefined;
  setSubject: (subject: string | undefined) => void;
  refresh: () => void;
}

/**
 * Hook for managing questions state with subject filtering and refresh support.
 * Fetches questions from the question service and provides loading/error states.
 *
 * Requirements: 2.4, 2.7, 3.1
 */
export function useQuestions(initialSubject?: string): UseQuestionsResult {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | undefined>(initialSubject);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = subject ? { subject } : undefined;
      const data = await questionService.getAll(filters);
      setQuestions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载题目失败';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [subject]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const refresh = useCallback(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    loading,
    error,
    subject,
    setSubject,
    refresh,
  };
}
