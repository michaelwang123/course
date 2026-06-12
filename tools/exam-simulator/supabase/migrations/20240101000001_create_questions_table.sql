-- Migration: Create questions table
-- Requirements: 1.1, 1.2

CREATE TABLE questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('single', 'multiple', 'boolean')),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  options jsonb NOT NULL,
  correct_answer jsonb NOT NULL,
  score integer NOT NULL CHECK (score BETWEEN 1 AND 100),
  subject text NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 50),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for filtering questions by subject
CREATE INDEX idx_questions_subject ON questions(subject);
