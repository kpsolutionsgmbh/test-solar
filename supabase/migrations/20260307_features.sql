-- Migration: 20260307_features.sql
-- Description: Add templates, email logs, dealroom documents, internal notes,
--              notification settings, and related RLS policies.

-- ============================================================================
-- 1. Templates table
-- ============================================================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id),
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
-- 2. Email logs table
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealroom_id UUID NOT NULL REFERENCES dealrooms(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admin_users(id),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_preview TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- ============================================================================
-- 3. Dealroom documents table
-- ============================================================================
CREATE TABLE IF NOT EXISTS dealroom_documents (
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
-- 4. Add internal_notes JSONB column to dealrooms
-- ============================================================================
ALTER TABLE dealrooms ADD COLUMN IF NOT EXISTS internal_notes JSONB DEFAULT '[]';

-- ============================================================================
-- 5. Add notification_settings JSONB column to admin_users
-- ============================================================================
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email_on_first_view": true, "email_on_sign": true, "email_on_video": false, "inapp_live": true}';

-- ============================================================================
-- 6. Tracking event types
-- ============================================================================
-- NOTE: The tracking_events table does not use a CHECK constraint on event_type,
-- so the new event types 'email_sent' and 'document_download' can be inserted
-- without any schema change. Application code should handle these new types.

-- ============================================================================
-- 7. Function to increment template usage count
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE templates SET usage_count = usage_count + 1 WHERE id = template_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. Storage bucket for documents
-- ============================================================================
-- NOTE: Create a public storage bucket named 'documents' via the Supabase
-- dashboard or the Supabase Management API. This cannot be done in a SQL
-- migration. Ensure the bucket has appropriate public/private access settings.

-- ============================================================================
-- 9. Enable RLS on new tables
-- ============================================================================
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealroom_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. RLS Policies — Templates (admin can CRUD their own)
-- ============================================================================
CREATE POLICY "templates_select_own"
  ON templates FOR SELECT
  USING (admin_id = auth.uid());

CREATE POLICY "templates_insert_own"
  ON templates FOR INSERT
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "templates_update_own"
  ON templates FOR UPDATE
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "templates_delete_own"
  ON templates FOR DELETE
  USING (admin_id = auth.uid());

-- ============================================================================
-- 11. RLS Policies — Email logs (admin can read/insert their own)
-- ============================================================================
CREATE POLICY "email_logs_select_own"
  ON email_logs FOR SELECT
  USING (admin_id = auth.uid());

CREATE POLICY "email_logs_insert_own"
  ON email_logs FOR INSERT
  WITH CHECK (admin_id = auth.uid());

-- ============================================================================
-- 12. RLS Policies — Dealroom documents (admin can CRUD for their own dealrooms)
-- ============================================================================
CREATE POLICY "dealroom_documents_select_own"
  ON dealroom_documents FOR SELECT
  USING (
    dealroom_id IN (
      SELECT id FROM dealrooms WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "dealroom_documents_insert_own"
  ON dealroom_documents FOR INSERT
  WITH CHECK (
    dealroom_id IN (
      SELECT id FROM dealrooms WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "dealroom_documents_update_own"
  ON dealroom_documents FOR UPDATE
  USING (
    dealroom_id IN (
      SELECT id FROM dealrooms WHERE admin_id = auth.uid()
    )
  )
  WITH CHECK (
    dealroom_id IN (
      SELECT id FROM dealrooms WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "dealroom_documents_delete_own"
  ON dealroom_documents FOR DELETE
  USING (
    dealroom_id IN (
      SELECT id FROM dealrooms WHERE admin_id = auth.uid()
    )
  );
