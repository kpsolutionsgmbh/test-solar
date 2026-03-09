-- =============================================
-- Solarheld: Complete Fresh Database Setup
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- ============================================================================
-- 1. ADMIN USERS
-- ============================================================================
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  company_name TEXT NOT NULL DEFAULT 'Solarheld GmbH',
  company_logo_url TEXT,
  brand_color TEXT DEFAULT '#E97E1C',
  notification_settings JSONB DEFAULT '{"email_on_first_view": true, "email_on_sign": true, "email_on_video": false, "inapp_live": true}',
  has_completed_onboarding BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 2. TEAM MEMBERS
-- ============================================================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'Berater',
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. CUSTOMERS
-- ============================================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID,
  salutation TEXT DEFAULT 'Herr' CHECK (salutation IN ('Herr', 'Frau')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. DEALROOMS
-- ============================================================================
CREATE TABLE dealrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  assigned_member_id UUID REFERENCES team_members(id),
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'signed', 'inactive', 'archived')),
  client_name TEXT NOT NULL,
  client_company TEXT NOT NULL,
  client_position TEXT,
  client_email TEXT,
  client_phone TEXT,
  client_address TEXT,
  client_logo_url TEXT,
  video_url TEXT,
  pandadoc_embed_url TEXT,
  ai_input_text TEXT,
  ai_input_audio_url TEXT,
  generated_content JSONB,
  custom_content JSONB,
  internal_notes JSONB DEFAULT '[]',
  engagement_score INT DEFAULT 0,
  email_unsubscribed BOOLEAN DEFAULT false,
  customer_type TEXT DEFAULT 'private' CHECK (customer_type IN ('private', 'commercial')),
  calculator_data JSONB,
  offers_data JSONB,
  language TEXT NOT NULL DEFAULT 'de' CHECK (language IN ('de', 'en')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

-- ============================================================================
-- 5. TRACKING EVENTS
-- ============================================================================
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

-- ============================================================================
-- 6. REFERENCES
-- ============================================================================
CREATE TABLE "references" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_company TEXT NOT NULL,
  quote TEXT,
  logo_url TEXT,
  result_summary TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 7. TEMPLATES
-- ============================================================================
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id),
  name TEXT NOT NULL,
  description TEXT,
  product_type TEXT,
  content JSONB NOT NULL,
  video_url TEXT,
  pandadoc_embed_url TEXT,
  language TEXT DEFAULT 'de',
  is_active BOOLEAN DEFAULT true,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 8. EMAIL LOGS
-- ============================================================================
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealroom_id UUID NOT NULL REFERENCES dealrooms(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES admin_users(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_preview TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- ============================================================================
-- 9. DEALROOM DOCUMENTS
-- ============================================================================
CREATE TABLE dealroom_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealroom_id UUID NOT NULL REFERENCES dealrooms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INT,
  sort_order INT DEFAULT 0,
  download_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 10. EMAIL FLOWS
-- ============================================================================
CREATE TABLE email_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'manual', 'not_opened', 'opened_not_offer', 'offer_not_signed', 'inactive'
  )),
  trigger_days INT DEFAULT 3,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  max_sends INT DEFAULT 1,
  skip_weekends BOOLEAN DEFAULT true,
  skip_if_signed BOOLEAN DEFAULT true,
  skip_if_inactive BOOLEAN DEFAULT true,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'selected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 11. EMAIL FLOW LOGS
-- ============================================================================
CREATE TABLE email_flow_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES email_flows(id) ON DELETE CASCADE,
  dealroom_id UUID NOT NULL REFERENCES dealrooms(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed', 'skipped')),
  skip_reason TEXT,
  source TEXT DEFAULT 'flow' CHECK (source IN ('manual', 'flow')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- ============================================================================
-- 12. EMAIL FLOW DEALROOMS (junction table)
-- ============================================================================
CREATE TABLE email_flow_dealrooms (
  flow_id UUID NOT NULL REFERENCES email_flows(id) ON DELETE CASCADE,
  dealroom_id UUID NOT NULL REFERENCES dealrooms(id) ON DELETE CASCADE,
  PRIMARY KEY (flow_id, dealroom_id)
);

-- ============================================================================
-- 13. EMAIL TEMPLATES
-- ============================================================================
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- DISABLE RLS ON ALL TABLES (no auth required)
-- ============================================================================
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE dealrooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE "references" DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE dealroom_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_flows DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_flow_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_flow_dealrooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_dealrooms_slug ON dealrooms(slug);
CREATE INDEX idx_dealrooms_status ON dealrooms(status);
CREATE INDEX idx_dealrooms_admin_id ON dealrooms(admin_id);
CREATE INDEX idx_dealrooms_customer_id ON dealrooms(customer_id);
CREATE INDEX idx_tracking_events_dealroom ON tracking_events(dealroom_id, created_at DESC);
CREATE INDEX idx_tracking_events_dealroom_type ON tracking_events(dealroom_id, event_type);
CREATE INDEX idx_references_admin_id ON "references"(admin_id);
CREATE INDEX idx_customers_admin_id ON customers(admin_id);
CREATE INDEX idx_team_members_admin_id ON team_members(admin_id);
CREATE INDEX idx_email_templates_admin ON email_templates(admin_id);
CREATE INDEX idx_email_flow_logs_flow_dealroom ON email_flow_logs(flow_id, dealroom_id);
CREATE INDEX idx_email_flow_dealrooms_flow ON email_flow_dealrooms(flow_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on dealrooms
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dealrooms_updated_at
  BEFORE UPDATE ON dealrooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update updated_at on email_flows
CREATE TRIGGER email_flows_updated_at
  BEFORE UPDATE ON email_flows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Increment template usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE templates SET usage_count = usage_count + 1 WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- Engagement Score calculation
CREATE OR REPLACE FUNCTION calculate_engagement_score(p_dealroom_id UUID)
RETURNS INT AS $$
DECLARE
  score INT := 0;
  event_record RECORD;
  has_page_view BOOLEAN := false;
  has_video_complete BOOLEAN := false;
  has_video_play BOOLEAN := false;
  has_offer_tab BOOLEAN := false;
  has_pandadoc_open BOOLEAN := false;
  has_pandadoc_sign BOOLEAN := false;
  has_deep_scroll BOOLEAN := false;
  doc_downloads INT := 0;
  has_long_session BOOLEAN := false;
  has_repeat_visit BOOLEAN := false;
  has_faq BOOLEAN := false;
  session_count INT := 0;
BEGIN
  FOR event_record IN
    SELECT DISTINCT event_type, event_data, session_id
    FROM tracking_events WHERE dealroom_id = p_dealroom_id
  LOOP
    CASE event_record.event_type
      WHEN 'page_view' THEN has_page_view := true;
      WHEN 'video_complete' THEN has_video_complete := true;
      WHEN 'video_play' THEN has_video_play := true;
      WHEN 'tab_switch' THEN
        IF event_record.event_data->>'tab' = 'offer' THEN has_offer_tab := true; END IF;
      WHEN 'pandadoc_open' THEN has_pandadoc_open := true;
      WHEN 'pandadoc_sign' THEN has_pandadoc_sign := true;
      WHEN 'scroll_depth' THEN
        IF (event_record.event_data->>'depth')::int > 75 THEN has_deep_scroll := true; END IF;
      WHEN 'document_download' THEN doc_downloads := doc_downloads + 1;
      WHEN 'faq_interaction' THEN has_faq := true;
      ELSE NULL;
    END CASE;
  END LOOP;

  SELECT COUNT(DISTINCT session_id) INTO session_count
  FROM tracking_events WHERE dealroom_id = p_dealroom_id;

  IF session_count > 1 THEN has_repeat_visit := true; END IF;

  SELECT EXISTS(
    SELECT 1 FROM (
      SELECT session_id,
        EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) as duration
      FROM tracking_events WHERE dealroom_id = p_dealroom_id
      GROUP BY session_id
    ) s WHERE s.duration > 300
  ) INTO has_long_session;

  IF has_page_view THEN score := score + 15; END IF;
  IF has_video_complete THEN score := score + 20;
  ELSIF has_video_play THEN score := score + 10; END IF;
  IF has_offer_tab THEN score := score + 20; END IF;
  IF has_pandadoc_open THEN score := score + 15; END IF;
  IF has_pandadoc_sign THEN score := score + 25; END IF;
  IF has_deep_scroll THEN score := score + 10; END IF;
  score := score + LEAST(doc_downloads * 10, 20);
  IF has_long_session THEN score := score + 10; END IF;
  IF has_repeat_visit THEN score := score + 15; END IF;
  IF has_faq THEN score := score + 5; END IF;

  score := LEAST(score, 100);
  UPDATE dealrooms SET engagement_score = score WHERE id = p_dealroom_id;
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Trigger: recalculate engagement score on tracking event
CREATE OR REPLACE FUNCTION trigger_update_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_engagement_score(NEW.dealroom_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_engagement_score_on_event
  AFTER INSERT ON tracking_events
  FOR EACH ROW EXECUTE FUNCTION trigger_update_engagement_score();

-- ============================================================================
-- DEFAULT ADMIN USER (so the app works immediately)
-- ============================================================================
INSERT INTO admin_users (email, name, company_name, brand_color, has_completed_onboarding)
VALUES ('admin@solarheld.de', 'Admin', 'Solarheld GmbH', '#E97E1C', true);
