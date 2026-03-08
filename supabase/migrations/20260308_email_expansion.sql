-- =============================================
-- Migration: Email System Expansion
-- Date: 2026-03-08
-- =============================================

-- 1. Email Templates (for single email composer)
CREATE TABLE IF NOT EXISTS email_templates (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID        NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  subject_template TEXT       NOT NULL,
  body_template   TEXT        NOT NULL,
  is_default      BOOLEAN     DEFAULT false,
  sort_order      INT         DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage own email templates"
  ON email_templates FOR ALL
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- 2. Flow-Dealroom assignment (for "only selected dealrooms")
ALTER TABLE email_flows ADD COLUMN IF NOT EXISTS applies_to TEXT DEFAULT 'all'
  CHECK (applies_to IN ('all', 'selected'));

CREATE TABLE IF NOT EXISTS email_flow_dealrooms (
  flow_id         UUID        NOT NULL REFERENCES email_flows(id) ON DELETE CASCADE,
  dealroom_id     UUID        NOT NULL REFERENCES dealrooms(id) ON DELETE CASCADE,
  PRIMARY KEY (flow_id, dealroom_id)
);

ALTER TABLE email_flow_dealrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage flow dealroom assignments"
  ON email_flow_dealrooms FOR ALL
  USING (
    flow_id IN (SELECT id FROM email_flows WHERE admin_id = auth.uid())
  )
  WITH CHECK (
    flow_id IN (SELECT id FROM email_flows WHERE admin_id = auth.uid())
  );

-- 3. Make flow_id nullable for manual emails
ALTER TABLE email_flow_logs ALTER COLUMN flow_id DROP NOT NULL;

-- 4. Extend email_flow_logs for manual emails and tracking
ALTER TABLE email_flow_logs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'flow'
  CHECK (source IN ('manual', 'flow'));
ALTER TABLE email_flow_logs ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE email_flow_logs ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;

-- 4. Seed default email templates for every admin
-- (done via API on first load, not in migration)

-- 5. Index for faster template queries
CREATE INDEX IF NOT EXISTS idx_email_templates_admin
  ON email_templates(admin_id);

CREATE INDEX IF NOT EXISTS idx_email_flow_dealrooms_flow
  ON email_flow_dealrooms(flow_id);
