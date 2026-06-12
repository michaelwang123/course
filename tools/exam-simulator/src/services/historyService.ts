import { supabase } from './supabase';
import { ExamRecord, ExamRecordDetail, Question, QuestionResult } from '../types';

const MAX_PAGE_SIZE = 20;

interface GetRecordsParams {
  page: number;
  pageSize: number;
  subject?: string;
  startDate?: string;
  endDate?: string;
}

interface GetRecordsResult {
  records: ExamRecord[];
  total: number;
}

function mapRecordRow(row: Record<string, unknown>): ExamRecord {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    subject: row.subject as string,
    totalScore: row.total_score as number,
    score: row.score as number,
    correctRate: row.correct_rate as number,
    durationSeconds: row.time_used_seconds as number,
    details: row.details as QuestionResult[],
    createdAt: row.created_at as string,
  };
}

function mapQuestionRow(row: Record<string, unknown>): Question {
  return {
    id: row.id as string,
    type: row.type as Question['type'],
    content: row.content as string,
    options: row.options as string[],
    correctAnswer: row.correct_answer as string | string[],
    score: row.score as number,
    subject: row.subject as string,
    createdAt: row.created_at as string,
  };
}

export async function getRecords(params: GetRecordsParams): Promise<GetRecordsResult> {
  const pageSize = Math.min(params.pageSize, MAX_PAGE_SIZE);
  const page = Math.max(1, params.page);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('exam_records')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.subject) {
    query = query.eq('subject', params.subject);
  }

  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch exam records: ${error.message}`);
  }

  const records = (data || []).map(mapRecordRow);

  return {
    records,
    total: count ?? 0,
  };
}

export async function getRecordDetail(id: string): Promise<ExamRecordDetail | null> {
  const { data: recordData, error: recordError } = await supabase
    .from('exam_records')
    .select('*')
    .eq('id', id)
    .single();

  if (recordError) {
    if (recordError.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    throw new Error(`Failed to fetch exam record: ${recordError.message}`);
  }

  if (!recordData) {
    return null;
  }

  const record = mapRecordRow(recordData);

  // Extract question IDs from the details to fetch associated questions
  const questionIds = record.details.map((d) => d.questionId);

  const { data: questionsData, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .in('id', questionIds);

  if (questionsError) {
    throw new Error(`Failed to fetch questions: ${questionsError.message}`);
  }

  const questions = (questionsData || []).map(mapQuestionRow);

  return {
    ...record,
    questions,
  };
}
