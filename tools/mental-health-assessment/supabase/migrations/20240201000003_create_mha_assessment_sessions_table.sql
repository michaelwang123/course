-- Mental Health Assessment Tool (心理健康度测验工具)
-- Migration: Create mha_assessment_sessions table
-- This table stores individual assessment session records including answers and results

CREATE TABLE mha_assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_name text NOT NULL CHECK (char_length(participant_name) BETWEEN 1 AND 20),
  job_type text NOT NULL CHECK (job_type IN ('月嫂', '老人护理')),
  scale_id uuid NOT NULL REFERENCES mha_scales(id),
  answers jsonb,
  raw_score integer,
  standard_score integer,
  grade_level text CHECK (grade_level IN ('正常', '轻度', '中度', '重度')),
  interpretation text,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_mha_sessions_participant ON mha_assessment_sessions(participant_name);
CREATE INDEX idx_mha_sessions_scale ON mha_assessment_sessions(scale_id);
CREATE INDEX idx_mha_sessions_completed ON mha_assessment_sessions(completed_at DESC);
CREATE INDEX idx_mha_sessions_participant_completed ON mha_assessment_sessions(participant_name, completed_at DESC);
