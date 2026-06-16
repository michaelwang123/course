-- Mental Health Assessment Tool (心理健康度测验工具)
-- Migration: Create mha_scales table
-- This table stores assessment scale definitions (e.g., SDS, SAS, GHQ-12)

CREATE TABLE mha_scales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 100),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 500),
  scale_type text NOT NULL CHECK (scale_type IN ('抑郁', '焦虑', '综合症状', '一般健康')),
  target_audience text NOT NULL CHECK (char_length(target_audience) BETWEEN 1 AND 200),
  item_count integer NOT NULL CHECK (item_count BETWEEN 1 AND 500),
  estimated_minutes integer NOT NULL CHECK (estimated_minutes BETWEEN 1 AND 180),
  scoring_rule jsonb NOT NULL,
  grade_thresholds jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
