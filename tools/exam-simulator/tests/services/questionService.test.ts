import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Question, QuestionInput } from '../../src/types';

// Mock Supabase client
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

// Build chainable mock query builder
function createQueryBuilder() {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  };

  // Each method returns the builder for chaining
  for (const fn of Object.values(builder)) {
    fn.mockReturnValue(builder);
  }

  return builder;
}

const queryBuilder = createQueryBuilder();

vi.mock('../../src/services/supabase', () => ({
  supabase: {
    from: vi.fn(() => queryBuilder),
  },
}));

import {
  getAll,
  getById,
  create,
  update,
  remove,
  getSubjects,
  getCountBySubject,
} from '../../src/services/questionService';

// --- Test Data ---

const mockDbRow = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  type: 'single',
  content: 'What is 2+2?',
  options: ['2', '3', '4', '5'],
  correct_answer: '4',
  score: 10,
  subject: '数学',
  created_at: '2024-01-15T10:00:00Z',
};

const expectedQuestion: Question = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  type: 'single',
  content: 'What is 2+2?',
  options: ['2', '3', '4', '5'],
  correctAnswer: '4',
  score: 10,
  subject: '数学',
  createdAt: '2024-01-15T10:00:00Z',
};

const mockInput: QuestionInput = {
  type: 'single',
  content: 'What is 3+3?',
  options: ['3', '5', '6', '7'],
  correctAnswer: '6',
  score: 5,
  subject: '数学',
};

beforeEach(() => {
  vi.clearAllMocks();
  // Reset chainable mocks
  for (const fn of Object.values(queryBuilder)) {
    fn.mockReturnValue(queryBuilder);
  }
});

// --- getAll ---

describe('getAll', () => {
  it('fetches all questions and maps snake_case to camelCase', async () => {
    mockOrder.mockResolvedValueOnce({ data: [mockDbRow], error: null });

    const result = await getAll();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expectedQuestion);
    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('applies subject filter when provided', async () => {
    mockOrder.mockResolvedValueOnce({ data: [mockDbRow], error: null });

    await getAll({ subject: '数学' });

    expect(mockEq).toHaveBeenCalledWith('subject', '数学');
  });

  it('does not apply subject filter when not provided', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    await getAll();

    // eq should not be called for subject filter (only from chain setup)
    expect(mockEq).not.toHaveBeenCalledWith('subject', expect.any(String));
  });

  it('returns empty array when no data', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: null });

    const result = await getAll();

    expect(result).toEqual([]);
  });

  it('throws error on Supabase failure', async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'connection timeout' },
    });

    await expect(getAll()).rejects.toThrow('Failed to fetch questions: connection timeout');
  });
});

// --- getById ---

describe('getById', () => {
  it('fetches a question by ID and maps fields correctly', async () => {
    mockSingle.mockResolvedValueOnce({ data: mockDbRow, error: null });

    const result = await getById('123e4567-e89b-12d3-a456-426614174000');

    expect(result).toEqual(expectedQuestion);
    expect(mockEq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
  });

  it('returns null when question not found (PGRST116)', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'No rows found' },
    });

    const result = await getById('nonexistent-id');

    expect(result).toBeNull();
  });

  it('throws error on other database errors', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST000', message: 'server error' },
    });

    await expect(getById('some-id')).rejects.toThrow('Failed to fetch question: server error');
  });

  it('returns null when data is null without error', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await getById('some-id');

    expect(result).toBeNull();
  });
});

// --- create ---

describe('create', () => {
  it('creates a question and maps camelCase input to snake_case', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'new-uuid',
        type: mockInput.type,
        content: mockInput.content,
        options: mockInput.options,
        correct_answer: mockInput.correctAnswer,
        score: mockInput.score,
        subject: mockInput.subject,
        created_at: '2024-02-01T12:00:00Z',
      },
      error: null,
    });

    const result = await create(mockInput);

    expect(result.id).toBe('new-uuid');
    expect(result.correctAnswer).toBe('6');
    expect(result.createdAt).toBe('2024-02-01T12:00:00Z');
    expect(mockInsert).toHaveBeenCalledWith({
      type: 'single',
      content: 'What is 3+3?',
      options: ['3', '5', '6', '7'],
      correct_answer: '6',
      score: 5,
      subject: '数学',
    });
  });

  it('maps multiple-choice correctAnswer array to correct_answer', async () => {
    const multiInput: QuestionInput = {
      type: 'multiple',
      content: 'Select all primes',
      options: ['2', '3', '4', '5'],
      correctAnswer: ['2', '3', '5'],
      score: 15,
      subject: '数学',
    };

    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'multi-uuid',
        type: 'multiple',
        content: 'Select all primes',
        options: ['2', '3', '4', '5'],
        correct_answer: ['2', '3', '5'],
        score: 15,
        subject: '数学',
        created_at: '2024-02-01T12:00:00Z',
      },
      error: null,
    });

    const result = await create(multiInput);

    expect(result.correctAnswer).toEqual(['2', '3', '5']);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ correct_answer: ['2', '3', '5'] })
    );
  });

  it('throws error on creation failure', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'duplicate key' },
    });

    await expect(create(mockInput)).rejects.toThrow('Failed to create question: duplicate key');
  });
});

// --- update ---

describe('update', () => {
  it('updates a question and returns mapped result', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        type: mockInput.type,
        content: mockInput.content,
        options: mockInput.options,
        correct_answer: mockInput.correctAnswer,
        score: mockInput.score,
        subject: mockInput.subject,
        created_at: '2024-01-15T10:00:00Z',
      },
      error: null,
    });

    const result = await update('123e4567-e89b-12d3-a456-426614174000', mockInput);

    expect(result.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(result.content).toBe('What is 3+3?');
    expect(mockUpdate).toHaveBeenCalledWith({
      type: 'single',
      content: 'What is 3+3?',
      options: ['3', '5', '6', '7'],
      correct_answer: '6',
      score: 5,
      subject: '数学',
    });
    expect(mockEq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
  });

  it('throws error on update failure', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'not found' },
    });

    await expect(update('bad-id', mockInput)).rejects.toThrow(
      'Failed to update question: not found'
    );
  });
});

// --- remove ---

describe('remove', () => {
  it('deletes a question by ID', async () => {
    mockEq.mockResolvedValueOnce({ error: null });

    await remove('123e4567-e89b-12d3-a456-426614174000');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
  });

  it('throws error on delete failure', async () => {
    mockEq.mockResolvedValueOnce({
      error: { message: 'foreign key constraint' },
    });

    await expect(remove('some-id')).rejects.toThrow(
      'Failed to delete question: foreign key constraint'
    );
  });
});

// --- getSubjects ---

describe('getSubjects', () => {
  it('returns sorted unique subjects', async () => {
    mockSelect.mockResolvedValueOnce({
      data: [
        { subject: '语文' },
        { subject: '数学' },
        { subject: '数学' },
        { subject: '英语' },
        { subject: '语文' },
      ],
      error: null,
    });

    const result = await getSubjects();

    expect(result).toEqual(['数学', '英语', '语文']);
  });

  it('returns empty array when no questions exist', async () => {
    mockSelect.mockResolvedValueOnce({ data: [], error: null });

    const result = await getSubjects();

    expect(result).toEqual([]);
  });

  it('handles null data gracefully', async () => {
    mockSelect.mockResolvedValueOnce({ data: null, error: null });

    const result = await getSubjects();

    expect(result).toEqual([]);
  });

  it('throws error on failure', async () => {
    mockSelect.mockResolvedValueOnce({
      data: null,
      error: { message: 'timeout' },
    });

    await expect(getSubjects()).rejects.toThrow('Failed to fetch subjects: timeout');
  });
});

// --- getCountBySubject ---

describe('getCountBySubject', () => {
  it('returns count for a given subject', async () => {
    mockEq.mockResolvedValueOnce({ count: 15, error: null });

    const result = await getCountBySubject('数学');

    expect(result).toBe(15);
    expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(mockEq).toHaveBeenCalledWith('subject', '数学');
  });

  it('returns 0 when count is null', async () => {
    mockEq.mockResolvedValueOnce({ count: null, error: null });

    const result = await getCountBySubject('物理');

    expect(result).toBe(0);
  });

  it('throws error on failure', async () => {
    mockEq.mockResolvedValueOnce({
      count: null,
      error: { message: 'permission denied' },
    });

    await expect(getCountBySubject('数学')).rejects.toThrow(
      'Failed to count questions: permission denied'
    );
  });
});

// --- Field Mapping Tests ---

describe('field mapping (snake_case ↔ camelCase)', () => {
  it('correctly maps all snake_case database fields to camelCase', async () => {
    const dbRow = {
      id: 'test-id',
      type: 'boolean',
      content: 'Is the sky blue?',
      options: ['正确', '错误'],
      correct_answer: '正确',
      score: 2,
      subject: '科学',
      created_at: '2024-06-15T08:30:00Z',
    };

    mockOrder.mockResolvedValueOnce({ data: [dbRow], error: null });

    const result = await getAll();

    expect(result[0]).toEqual({
      id: 'test-id',
      type: 'boolean',
      content: 'Is the sky blue?',
      options: ['正确', '错误'],
      correctAnswer: '正确',
      score: 2,
      subject: '科学',
      createdAt: '2024-06-15T08:30:00Z',
    });
  });

  it('correctly maps camelCase input to snake_case for insert', async () => {
    const input: QuestionInput = {
      type: 'boolean',
      content: 'Is water wet?',
      options: ['正确', '错误'],
      correctAnswer: '正确',
      score: 3,
      subject: '科学',
    };

    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'new-id',
        type: 'boolean',
        content: 'Is water wet?',
        options: ['正确', '错误'],
        correct_answer: '正确',
        score: 3,
        subject: '科学',
        created_at: '2024-06-15T09:00:00Z',
      },
      error: null,
    });

    await create(input);

    expect(mockInsert).toHaveBeenCalledWith({
      type: 'boolean',
      content: 'Is water wet?',
      options: ['正确', '错误'],
      correct_answer: '正确',
      score: 3,
      subject: '科学',
    });
  });

  it('maps multiple-choice correct_answer array correctly on read', async () => {
    const dbRow = {
      id: 'multi-id',
      type: 'multiple',
      content: 'Select even numbers',
      options: ['1', '2', '3', '4'],
      correct_answer: ['2', '4'],
      score: 20,
      subject: '数学',
      created_at: '2024-03-01T00:00:00Z',
    };

    mockOrder.mockResolvedValueOnce({ data: [dbRow], error: null });

    const result = await getAll();

    expect(result[0].correctAnswer).toEqual(['2', '4']);
    expect(Array.isArray(result[0].correctAnswer)).toBe(true);
  });
});
