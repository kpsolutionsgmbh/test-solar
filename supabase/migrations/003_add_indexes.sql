-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_dealrooms_admin_id ON dealrooms(admin_id);
CREATE INDEX IF NOT EXISTS idx_dealrooms_slug ON dealrooms(slug);
CREATE INDEX IF NOT EXISTS idx_dealrooms_status ON dealrooms(status);
CREATE INDEX IF NOT EXISTS idx_tracking_events_dealroom_id ON tracking_events(dealroom_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON tracking_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_references_admin_id ON references(admin_id);
CREATE INDEX IF NOT EXISTS idx_references_active ON references(admin_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_team_members_admin_id ON team_members(admin_id);
