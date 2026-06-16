export type GradeLevel = '正常' | '轻度' | '中度' | '重度';

export interface AnswerRecord {
  itemId: string;
  selectedScore: number;
}

export interface AssessmentSession {
  id: string;
  participantName: string;
  jobType: '月嫂' | '老人护理';
  scaleId: string;
  answers: AnswerRecord[] | null;
  rawScore: number | null;
  standardScore: number | null;
  gradeLevel: GradeLevel | null;
  interpretation: string | null;
  startedAt: string;
  completedAt: string | null;
}
