-- V14: RLS Policies for all tables
-- Run this in the Supabase Dashboard SQL Editor

-- Enable RLS on all tables (idempotent)
ALTER TABLE dealrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE references ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (idempotent)
DROP POLICY IF EXISTS "Admin can manage own dealrooms" ON dealrooms;
DROP POLICY IF EXISTS "Public can read published dealrooms" ON dealrooms;
DROP POLICY IF EXISTS "Admin can manage own customers" ON customers;
DROP POLICY IF EXISTS "Anyone can read active references" ON references;
DROP POLICY IF EXISTS "Admin can manage own references" ON references;
DROP POLICY IF EXISTS "Admin can manage own team members" ON team_members;
DROP POLICY IF EXISTS "Anyone can insert tracking events" ON tracking_events;
DROP POLICY IF EXISTS "Admin can read own tracking events" ON tracking_events;
DROP POLICY IF EXISTS "Admin can manage own profile" ON admin_users;

-- Dealrooms: Admin can manage their own
CREATE POLICY "Admin can manage own dealrooms" ON dealrooms
  FOR ALL USING (admin_id = auth.uid());

-- Dealrooms: Public can read published/signed (for /d/[slug] pages)
CREATE POLICY "Public can read published dealrooms" ON dealrooms
  FOR SELECT USING (status IN ('published', 'signed'));

-- Customers: Admin can manage their own
CREATE POLICY "Admin can manage own customers" ON customers
  FOR ALL USING (admin_id = auth.uid());

-- References: Public can read active ones (shown on dealroom pages)
CREATE POLICY "Anyone can read active references" ON references
  FOR SELECT USING (is_active = true);

-- References: Admin can manage their own
CREATE POLICY "Admin can manage own references" ON references
  FOR ALL USING (admin_id = auth.uid());

-- Team Members: Admin can manage their own
CREATE POLICY "Admin can manage own team members" ON team_members
  FOR ALL USING (admin_id = auth.uid());

-- Tracking Events: Anyone can insert (tracking from dealroom page)
CREATE POLICY "Anyone can insert tracking events" ON tracking_events
  FOR INSERT WITH CHECK (true);

-- Tracking Events: Admin can read events for their dealrooms
CREATE POLICY "Admin can read own tracking events" ON tracking_events
  FOR SELECT USING (
    dealroom_id IN (SELECT id FROM dealrooms WHERE admin_id = auth.uid())
  );

-- Admin Users: Admin can manage their own profile
CREATE POLICY "Admin can manage own profile" ON admin_users
  FOR ALL USING (id = auth.uid());
