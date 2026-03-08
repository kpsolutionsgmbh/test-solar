-- =============================================
-- Migration: Email Flows + Engagement Score
-- Date: 2026-03-08
-- =============================================

-- 1. New fields on dealrooms
ALTER TABLE dealrooms ADD COLUMN IF NOT EXISTS engagement_score INT DEFAULT 0;
ALTER TABLE dealrooms ADD COLUMN IF NOT EXISTS email_unsubscribed BOOLEAN DEFAULT false;

-- 2. Email Flows table
CREATE TABLE IF NOT EXISTS email_flows (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID        NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT,
  trigger_type    TEXT        NOT NULL CHECK (trigger_type IN (
    'manual',
    'not_opened',
    'opened_not_offer',
    'offer_not_signed',
    'inactive'
  )),
  trigger_days    INT         DEFAULT 3,
  subject_template TEXT       NOT NULL,
  body_template   TEXT        NOT NULL,
  is_active       BOOLEAN     DEFAULT false,
  max_sends       INT         DEFAULT 1,
  skip_weekends   BOOLEAN     DEFAULT true,
  skip_if_signed  BOOLEAN     DEFAULT true,
  skip_if_inactive BOOLEAN    DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. Email Flow Logs table
CREATE TABLE IF NOT EXISTS email_flow_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id         UUID        NOT NULL REFERENCES email_flows(id) ON DELETE CASCADE,
  dealroom_id     UUID        NOT NULL REFERENCES dealrooms(id) ON DELETE CASCADE,
  recipient_email TEXT        NOT NULL,
  subject         TEXT        NOT NULL,
  status          TEXT        DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed', 'skipped')),
  skip_reason     TEXT,
  sent_at         TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS Policies for email_flows
ALTER TABLE email_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage own email flows"
  ON email_flows FOR ALL
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- 5. RLS Policies for email_flow_logs
ALTER TABLE email_flow_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view own flow logs"
  ON email_flow_logs FOR SELECT
  USING (
    flow_id IN (SELECT id FROM email_flows WHERE admin_id = auth.uid())
  );

-- Allow service role to insert logs (no RLS restriction needed for service role)

-- 6. Auto-update updated_at on email_flows
CREATE OR REPLACE FUNCTION update_email_flows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER email_flows_updated_at
  BEFORE UPDATE ON email_flows
  FOR EACH ROW
  EXECUTE FUNCTION update_email_flows_updated_at();

-- 7. Engagement Score calculation function
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
    FROM tracking_events
    WHERE dealroom_id = p_dealroom_id
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

-- 8. Trigger: recalculate score on each new tracking event
CREATE OR REPLACE FUNCTION trigger_update_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_engagement_score(NEW.dealroom_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_engagement_score_on_event ON tracking_events;
CREATE TRIGGER update_engagement_score_on_event
  AFTER INSERT ON tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_engagement_score();

-- 9. Helper RPCs for cron job: find eligible dealrooms per trigger type

CREATE OR REPLACE FUNCTION get_dealrooms_not_opened(p_admin_id UUID, p_days_ago INT)
RETURNS TABLE(id UUID, client_email TEXT, client_name TEXT, client_company TEXT, slug TEXT, status TEXT, customer_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.client_email, d.client_name, d.client_company, d.slug, d.status::TEXT, d.customer_id
  FROM dealrooms d
  WHERE d.admin_id = p_admin_id
    AND d.status = 'published'
    AND d.email_unsubscribed = false
    AND d.published_at IS NOT NULL
    AND d.published_at <= now() - (p_days_ago || ' days')::INTERVAL
    AND NOT EXISTS (
      SELECT 1 FROM tracking_events te
      WHERE te.dealroom_id = d.id AND te.event_type = 'page_view'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_dealrooms_opened_not_offer(p_admin_id UUID, p_days_ago INT)
RETURNS TABLE(id UUID, client_email TEXT, client_name TEXT, client_company TEXT, slug TEXT, status TEXT, customer_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.client_email, d.client_name, d.client_company, d.slug, d.status::TEXT, d.customer_id
  FROM dealrooms d
  WHERE d.admin_id = p_admin_id
    AND d.status = 'published'
    AND d.email_unsubscribed = false
    AND EXISTS (
      SELECT 1 FROM tracking_events te
      WHERE te.dealroom_id = d.id AND te.event_type = 'page_view'
      AND te.created_at <= now() - (p_days_ago || ' days')::INTERVAL
    )
    AND NOT EXISTS (
      SELECT 1 FROM tracking_events te
      WHERE te.dealroom_id = d.id AND te.event_type = 'tab_switch'
      AND (te.event_data->>'tab') = 'offer'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_dealrooms_offer_not_signed(p_admin_id UUID, p_days_ago INT)
RETURNS TABLE(id UUID, client_email TEXT, client_name TEXT, client_company TEXT, slug TEXT, status TEXT, customer_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.client_email, d.client_name, d.client_company, d.slug, d.status::TEXT, d.customer_id
  FROM dealrooms d
  WHERE d.admin_id = p_admin_id
    AND d.status = 'published'
    AND d.email_unsubscribed = false
    AND EXISTS (
      SELECT 1 FROM tracking_events te
      WHERE te.dealroom_id = d.id AND te.event_type = 'pandadoc_open'
      AND te.created_at <= now() - (p_days_ago || ' days')::INTERVAL
    )
    AND NOT EXISTS (
      SELECT 1 FROM tracking_events te
      WHERE te.dealroom_id = d.id AND te.event_type = 'pandadoc_sign'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_dealrooms_inactive(p_admin_id UUID, p_days_ago INT)
RETURNS TABLE(id UUID, client_email TEXT, client_name TEXT, client_company TEXT, slug TEXT, status TEXT, customer_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT d.id, d.client_email, d.client_name, d.client_company, d.slug, d.status::TEXT, d.customer_id
  FROM dealrooms d
  WHERE d.admin_id = p_admin_id
    AND d.status = 'published'
    AND d.email_unsubscribed = false
    AND EXISTS (
      SELECT 1 FROM tracking_events te WHERE te.dealroom_id = d.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM tracking_events te
      WHERE te.dealroom_id = d.id
      AND te.created_at > now() - (p_days_ago || ' days')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql;

-- 10. Index for faster tracking queries
CREATE INDEX IF NOT EXISTS idx_tracking_events_dealroom_type
  ON tracking_events(dealroom_id, event_type);

CREATE INDEX IF NOT EXISTS idx_email_flow_logs_flow_dealroom
  ON email_flow_logs(flow_id, dealroom_id);
