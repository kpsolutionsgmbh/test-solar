-- Admin Users
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  company_name TEXT NOT NULL DEFAULT 'Gündesli und Kollegen GmbH',
  company_logo_url TEXT,
  brand_color TEXT DEFAULT '#11485e',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin users can view own data"
  ON admin_users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admin users can update own data"
  ON admin_users FOR UPDATE
  USING (auth.uid() = id);

-- Dealrooms
CREATE TABLE dealrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  client_name TEXT NOT NULL,
  client_company TEXT NOT NULL,
  client_position TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  video_url TEXT,
  pandadoc_embed_url TEXT,
  ai_input_text TEXT,
  ai_input_audio_url TEXT,
  generated_content JSONB,
  custom_content JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  language TEXT NOT NULL DEFAULT 'de' CHECK (language IN ('de', 'en'))
);

ALTER TABLE dealrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage own dealrooms"
  ON dealrooms FOR ALL
  USING (auth.uid() = admin_id);

CREATE POLICY "Public can view published dealrooms by slug"
  ON dealrooms FOR SELECT
  USING (status = 'published');

-- Tracking Events
CREATE TABLE tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealroom_id UUID NOT NULL REFERENCES dealrooms(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  visitor_ip TEXT,
  user_agent TEXT,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert tracking events"
  ON tracking_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view tracking for own dealrooms"
  ON tracking_events FOR SELECT
  USING (
    dealroom_id IN (
      SELECT id FROM dealrooms WHERE admin_id = auth.uid()
    )
  );

-- References
CREATE TABLE references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_company TEXT NOT NULL,
  quote TEXT,
  logo_url TEXT,
  result_summary TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE references ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage own references"
  ON references FOR ALL
  USING (auth.uid() = admin_id);

CREATE POLICY "Public can view active references"
  ON references FOR SELECT
  USING (is_active = true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dealrooms_updated_at
  BEFORE UPDATE ON dealrooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Index for slug lookups
CREATE INDEX idx_dealrooms_slug ON dealrooms(slug);
CREATE INDEX idx_tracking_events_dealroom ON tracking_events(dealroom_id, created_at DESC);
