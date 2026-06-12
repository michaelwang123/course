export type QuestionType = 'single' | 'multiple' | 'boolean';

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options: string[];
  correctAnswer: string | string[];
  score: number;
  subject: string;
  createdAt: string;
}

export interface QuestionInput {
  type: QuestionType;
  content: string;
  options: string[];
  correctAnswer: string | string[];
  score: number;
  subject: string;
}

export interface ExamConfig {
  studentName: string;
  subject: string;
  durationMinutes: number;
  questionCount: number;
}

/** Alias for ExamConfig — used in validation contexts */
export type ExamConfigInput = ExamConfig;

export interface ExamSession {
  id: string;
  studentName: string;
  subject: string;
  durationMinutes: number;
  questionIds: string[];
  answers: Record<string, string | string[]>;
  status: 'in_progress' | 'submitted' | 'abandoned';
  startedAt: string;
  submittedAt?: string;
}

export interface ExamRecord {
  id: string;
  sessionId: string;
  subject: string;
  totalScore: number;
  score: number;
  correctRate: number;
  durationSeconds: number;
  details: QuestionResult[];
  createdAt: string;
}

export interface QuestionResult {
  questionId: string;
  content: string;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  score: number;
  isCorrect: boolean;
}

export interface ExamRecordDetail extends ExamRecord {
  questions: Question[];
}

export interface ScoreResult {
  totalScore: number;
  score: number;
  correctRate: number;
  details: QuestionResult[];
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export interface HistoryFilter {
  subject?: string;
  startDate?: string;
  endDate?: string;
}
