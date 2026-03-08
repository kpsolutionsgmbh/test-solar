-- Fix: Manual emails (flow_id = NULL) were invisible in history
-- because RLS policy only checked flow_id IN email_flows
-- Now also allows reading logs where dealroom belongs to the admin

DROP POLICY IF EXISTS "Admin can view own flow logs" ON email_flow_logs;

CREATE POLICY "Admin can view own email logs"
  ON email_flow_logs FOR SELECT
  USING (
    -- Flow-based emails: check via flow ownership
    flow_id IN (SELECT id FROM email_flows WHERE admin_id = auth.uid())
    OR
    -- Manual emails (flow_id is NULL): check via dealroom ownership
    (flow_id IS NULL AND dealroom_id IN (SELECT id FROM dealrooms WHERE admin_id = auth.uid()))
  );
