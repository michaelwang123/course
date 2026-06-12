-- Migration: Create exam_sessions table
-- Requirements: 1.1, 10.5

CREATE TABLE exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL CHECK (char_length(student_name) BETWEEN 1 AND 20),
  subject text NOT NULL,
  duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 5 AND 120),
  question_ids jsonb NOT NULL,
  answers jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned')),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);

-- Partial index for quickly finding active sessions
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status) WHERE status = 'in_progress';
