import { supabase } from './supabase';
import { ExamConfig, ExamSession, ExamRecord, Question } from '../types';
import { mapRowToQuestion } from './questionService';
import { selectQuestions } from '../lib/questionSelector';
import { calculateScore } from '../lib/scoring';

/**
 * Create an exam session record in Supabase.
 * Fetches available questions for the subject, uses Fisher-Yates selector,
 * and stores the session with status 'in_progress'.
 */
export async function createSession(config: ExamConfig): Promise<ExamSession> {
  // Fetch available questions for the subject
  const { data: questions, error: fetchError } = await supabase
    .from('questions')
    .select('*')
    .eq('subject', config.subject);

  if (fetchError) {
    throw new Error(`Failed to fetch questions: ${fetchError.message}`);
  }

  if (!questions || questions.length < config.questionCount) {
    throw new Error(
      `Insufficient questions: need ${config.questionCount}, available ${questions?.length ?? 0}`
    );
  }

  // Map DB rows to Question type for the selector using shared mapper
  const mappedQuestions: Question[] = questions.map((q) => mapRowToQuestion(q));

  // Select random questions using Fisher-Yates shuffle
  const selected = selectQuestions(mappedQuestions, config.questionCount);
  const questionIds = selected.map((q) => q.id);

  // Insert exam session record
  const { data, error } = await supabase
    .from('exam_sessions')
    .insert({
      student_name: config.studentName,
      subject: config.subject,
      duration_minutes: config.durationMinutes,
      question_ids: questionIds,
      answers: {},
      status: 'in_progress',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return mapSessionFromDb(data);
}

/**
 * Fetch an exam session by ID with status check.
 * Returns null if not found.
 */
export async function getSession(id: string): Promise<ExamSession | null> {
  const { data, error } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to fetch session: ${error.message}`);
  }

  return mapSessionFromDb(data);
}

/**
 * Check for an active (in_progress) exam session.
 * Used for concurrent session detection — only one in_progress session allowed.
 * Returns the active session or null if none exists.
 */
export async function getActiveSession(): Promise<ExamSession | null> {
  const { data, error } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('status', 'in_progress')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check active session: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapSessionFromDb(data);
}

/**
 * Abandon an exam session by updating its status to 'abandoned'.
 * Does not delete the record — preserves audit trail.
 */
export async function abandonSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('exam_sessions')
    .update({ status: 'abandoned' })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to abandon session: ${error.message}`);
  }
}

/**
 * Save answers for an exam session (answer persistence).
 * Called by the useExamSession hook with debounce.
 */
export async function saveAnswers(
  sessionId: string,
  answers: Record<string, string | string[]>
): Promise<void> {
  const { error } = await supabase
    .from('exam_sessions')
    .update({ answers })
    .eq('id', sessionId)
    .eq('status', 'in_progress');

  if (error) {
    throw new Error(`Failed to save answers: ${error.message}`);
  }
}

/**
 * Submit an exam: calculate score, create exam_records entry,
 * and update session status to 'submitted'.
 * Includes retry logic with localStorage fallback.
 */
export async function submitExam(
  sessionId: string,
  answers: Record<string, string | string[]>
): Promise<ExamRecord> {
  return submitWithRetry(sessionId, answers);
}

/**
 * Private retry logic for exam submission.
 * Retries 3 times with 3s interval. On final failure,
 * saves answers to localStorage as fallback.
 */
async function submitWithRetry(
  sessionId: string,
  answers: Record<string, string | string[]>,
  maxRetries: number = 3,
  retryDelay: number = 3000
): Promise<ExamRecord> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await performSubmit(sessionId, answers);
    } catch (error) {
      if (attempt === maxRetries) {
        // Save to localStorage as fallback
        localStorage.setItem(
          `exam_backup_${sessionId}`,
          JSON.stringify({ answers, timestamp: Date.now() })
        );
        throw new Error(
          '提交失败，答案已保存至本地，网络恢复后可重新提交'
        );
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  // Unreachable, but satisfies TypeScript
  throw new Error('Unreachable');
}

/**
 * Perform the actual exam submission:
 * 1. Fetch the session to get question_ids and started_at
 * 2. Fetch the questions by IDs
 * 3. Calculate the score
 * 4. Create an exam_records entry
 * 5. Update session status to 'submitted'
 */
async function performSubmit(
  sessionId: string,
  answers: Record<string, string | string[]>
): Promise<ExamRecord> {
  // Fetch the session
  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error(
      `Failed to fetch session for submission: ${sessionError?.message ?? 'Session not found'}`
    );
  }

  // Fetch questions by IDs
  const questionIds: string[] = session.question_ids;
  const { data: questionsData, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .in('id', questionIds);

  if (questionsError || !questionsData) {
    throw new Error(
      `Failed to fetch questions: ${questionsError?.message ?? 'No questions found'}`
    );
  }

  // Map DB rows to Question type using shared mapper
  const questions: Question[] = questionsData.map((q) => mapRowToQuestion(q));

  // Calculate score
  const scoreResult = calculateScore(questions, answers);

  // Calculate time used in seconds
  const startedAt = new Date(session.started_at);
  const now = new Date();
  const timeUsedSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

  // Create exam record
  const { data: record, error: recordError } = await supabase
    .from('exam_records')
    .insert({
      session_id: sessionId,
      subject: session.subject,
      student_name: session.student_name,
      total_score: scoreResult.totalScore,
      score: scoreResult.score,
      correct_rate: scoreResult.correctRate,
      time_used_seconds: timeUsedSeconds,
      details: scoreResult.details,
    })
    .select()
    .single();

  if (recordError) {
    throw new Error(`Failed to create exam record: ${recordError.message}`);
  }

  // Update session status to 'submitted'
  const { error: updateError } = await supabase
    .from('exam_sessions')
    .update({
      status: 'submitted',
      submitted_at: now.toISOString(),
      answers,
    })
    .eq('id', sessionId);

  if (updateError) {
    throw new Error(`Failed to update session status: ${updateError.message}`);
  }

  return mapRecordFromDb(record);
}

// --- Mapping helpers ---

function mapSessionFromDb(data: Record<string, unknown>): ExamSession {
  return {
    id: data.id as string,
    studentName: data.student_name as string,
    subject: data.subject as string,
    durationMinutes: data.duration_minutes as number,
    questionIds: data.question_ids as string[],
    answers: (data.answers as Record<string, string | string[]>) ?? {},
    status: data.status as ExamSession['status'],
    startedAt: data.started_at as string,
    submittedAt: data.submitted_at as string | undefined,
  };
}

function mapRecordFromDb(data: Record<string, unknown>): ExamRecord {
  return {
    id: data.id as string,
    sessionId: data.session_id as string,
    subject: data.subject as string,
    totalScore: data.total_score as number,
    score: data.score as number,
    correctRate: data.correct_rate as number,
    durationSeconds: data.time_used_seconds as number,
    details: data.details as ExamRecord['details'],
    createdAt: data.created_at as string,
  };
}
