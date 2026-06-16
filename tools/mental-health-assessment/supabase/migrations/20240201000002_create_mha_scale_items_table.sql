-- Mental Health Assessment Tool (心理健康度测验工具)
-- Migration: Create mha_scale_items table
-- This table stores individual questions/items for each assessment scale

CREATE TABLE mha_scale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scale_id uuid NOT NULL REFERENCES mha_scales(id) ON DELETE CASCADE,
  item_order integer NOT NULL CHECK (item_order > 0),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  options jsonb NOT NULL,
  is_reverse_scored boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scale_id, item_order)
);

CREATE INDEX idx_mha_scale_items_scale_id ON mha_scale_items(scale_id);
