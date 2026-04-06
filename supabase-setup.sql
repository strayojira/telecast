-- Run this in Supabase Dashboard > SQL Editor
-- ================================================

-- 1. channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  youtube_channel_id TEXT,
  accent_color TEXT DEFAULT '#c8000a',
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. now_airing table
CREATE TABLE now_airing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  title TEXT,
  thumbnail_url TEXT,
  live_url TEXT,
  viewer_count INTEGER,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- 3. Seed initial channels
INSERT INTO channels (name, youtube_channel_id, accent_color, tags) VALUES
  ('GMA Network',        'UCKL5hAuzgFQsyrsQKgU0Qng', '#c8000a', ARRAY['Drama', 'News', 'Variety']),
  ('Kapamilya Channel',  'UCaLzUKBv5iIAHKYP8hL2zFw', '#0038a8', ARRAY['Drama', 'News']),
  ('TV5',                'UCiFx0kZFjR29u0uJxTSq5MQ', '#f5a800', ARRAY['News', 'Sports']),
  ('GTV',                NULL,                        '#c8000a', ARRAY['Movies', 'Variety']),
  ('PTV',                NULL,                        '#008000', ARRAY['News', 'Government']),
  ('UNTV',               NULL,                        '#6b7280', ARRAY['News', 'Religious']);

-- 4. Enable Row Level Security (read-only public access)
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE now_airing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read channels" ON channels FOR SELECT USING (true);
CREATE POLICY "Public read now_airing" ON now_airing FOR SELECT USING (true);
