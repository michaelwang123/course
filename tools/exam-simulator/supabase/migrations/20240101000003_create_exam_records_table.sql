-- Migration: Create exam_records table
-- Requirements: 1.1, 1.2

CREATE TABLE exam_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES exam_sessions(id),
  subject text NOT NULL,
  total_score integer NOT NULL,
  score integer NOT NULL,
  correct_rate numeric(4,1) NOT NULL,
  duration_seconds integer NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for sorting records by creation date (most recent first)
CREATE INDEX idx_exam_records_created_at ON exam_records(created_at DESC);

-- Index for filtering records by subject
CREATE INDEX idx_exam_records_subject ON exam_records(subject);
