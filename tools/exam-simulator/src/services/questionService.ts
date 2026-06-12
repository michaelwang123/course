import { supabase } from './supabase';
import { Question, QuestionInput } from '../types';

/**
 * Maps a database row (snake_case) to a TypeScript Question object (camelCase).
 * Exported for reuse in other services that need to map question rows.
 */
export function mapRowToQuestion(row: Record<string, unknown>): Question {
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

/**
 * Maps a TypeScript QuestionInput (camelCase) to database fields (snake_case).
 */
function mapInputToRow(input: QuestionInput): Record<string, unknown> {
  return {
    type: input.type,
    content: input.content,
    options: input.options,
    correct_answer: input.correctAnswer,
    score: input.score,
    subject: input.subject,
  };
}

/**
 * Fetch all questions, optionally filtered by subject.
 */
export async function getAll(filters?: { subject?: string }): Promise<Question[]> {
  let query = supabase.from('questions').select('*');

  if (filters?.subject) {
    query = query.eq('subject', filters.subject);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  return (data || []).map(mapRowToQuestion);
}

/**
 * Fetch a single question by ID.
 */
export async function getById(id: string): Promise<Question | null> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    throw new Error(`Failed to fetch question: ${error.message}`);
  }

  return data ? mapRowToQuestion(data) : null;
}

/**
 * Create a new question.
 */
export async function create(input: QuestionInput): Promise<Question> {
  const row = mapInputToRow(input);

  const { data, error } = await supabase
    .from('questions')
    .insert(row)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create question: ${error.message}`);
  }

  return mapRowToQuestion(data);
}

/**
 * Update an existing question by ID.
 */
export async function update(id: string, input: QuestionInput): Promise<Question> {
  const row = mapInputToRow(input);

  const { data, error } = await supabase
    .from('questions')
    .update(row)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update question: ${error.message}`);
  }

  return mapRowToQuestion(data);
}

/**
 * Delete a question by ID.
 */
export async function remove(id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete question: ${error.message}`);
  }
}

/**
 * Fetch distinct subjects from all questions.
 */
export async function getSubjects(): Promise<string[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('subject');

  if (error) {
    throw new Error(`Failed to fetch subjects: ${error.message}`);
  }

  const subjects = [...new Set((data || []).map((row) => row.subject as string))];
  return subjects.sort();
}

/**
 * Get the count of questions for a specific subject.
 */
export async function getCountBySubject(subject: string): Promise<number> {
  const { count, error } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('subject', subject);

  if (error) {
    throw new Error(`Failed to count questions: ${error.message}`);
  }

  return count ?? 0;
}

/**
 * Fetch questions by an array of IDs, preserving the order of the input array.
 */
export async function getByIds(ids: string[]): Promise<Question[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to fetch questions by IDs: ${error.message}`);
  }

  // Build a map for O(1) lookup, then return in the order of input ids
  const questionMap = new Map<string, Question>();
  (data || []).forEach((row) => {
    questionMap.set(row.id as string, mapRowToQuestion(row));
  });

  return ids
    .map((id) => questionMap.get(id))
    .filter((q): q is Question => q !== undefined);
}
