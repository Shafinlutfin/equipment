-- ==========================================================================
-- EZ3 FOOTBALL ACADEMY EQUIPMENT TRACKER - SUPABASE / POSTGRESQL SCHEMA
-- ==========================================================================

-- 1. Create Master Equipment Table with Category Support
CREATE TABLE IF NOT EXISTS inventory_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  total_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial items with categories
INSERT INTO inventory_master (item_name, category, total_count) VALUES
  ('ISL Ball', 'Balls', 10),
  ('Normal Ball', 'Balls', 15),
  ('Markers', 'Markers & Cones', 50),
  ('Cone', 'Markers & Cones', 30),
  ('Balancing Ball', 'Gym & Agility', 10),
  ('Bosu Ball', 'Gym & Agility', 5),
  ('Small Hurdles', 'Gym & Agility', 12),
  ('Medium Hurdles', 'Gym & Agility', 12),
  ('Gym Ball', 'Gym & Agility', 6)
ON CONFLICT (item_name) DO NOTHING;

-- 2. Create Session Logs Table with Discrepancy Tracking
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session_type TEXT NOT NULL, -- 'Morning' or 'Evening'
  logged_by TEXT NOT NULL,
  items_taken JSONB NOT NULL,
  items_returned JSONB,
  missing_items JSONB,
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE' or 'COMPLETED'
  has_discrepancy BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_session_logs_date ON session_logs (log_date);
CREATE INDEX IF NOT EXISTS idx_session_logs_discrepancy ON session_logs (has_discrepancy);
