-- ============================================================
-- Life Timeline Events Table Migration
-- 
-- 注意：此 SQL 文件需手动在 Supabase Dashboard 的 SQL Editor 中执行，
-- 或使用 `supabase db push`（需 Supabase CLI）
-- ============================================================

-- 创建 life_timeline_events 表
CREATE TABLE life_timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
  description text DEFAULT '' CHECK (char_length(description) <= 2000),
  event_date date NOT NULL CHECK (
    event_date >= '1900-01-01' AND
    event_date <= (CURRENT_DATE + INTERVAL '10 years')::date
  ),
  category text NOT NULL CHECK (
    category IN ('education', 'work', 'life', 'achievement', 'health', 'travel', 'other')
  ),
  sentiment text NOT NULL CHECK (
    sentiment IN ('positive', 'neutral', 'negative')
  ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_life_timeline_events_user_id ON life_timeline_events(user_id);
CREATE INDEX idx_life_timeline_events_user_date ON life_timeline_events(user_id, event_date);

-- Row Level Security
ALTER TABLE life_timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see own events"
  ON life_timeline_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own events"
  ON life_timeline_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own events"
  ON life_timeline_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only delete own events"
  ON life_timeline_events FOR DELETE
  USING (auth.uid() = user_id);

-- 事件数量上限检查函数（每用户5000条）
CREATE OR REPLACE FUNCTION check_life_timeline_event_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM life_timeline_events WHERE user_id = NEW.user_id) >= 5000 THEN
    RAISE EXCEPTION 'Event limit reached: maximum 5000 events per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_life_timeline_event_limit
  BEFORE INSERT ON life_timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION check_life_timeline_event_limit();

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_life_timeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_life_timeline_updated_at
  BEFORE UPDATE ON life_timeline_events
  FOR EACH ROW
  EXECUTE FUNCTION update_life_timeline_updated_at();
