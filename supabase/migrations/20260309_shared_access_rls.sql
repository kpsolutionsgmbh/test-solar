-- Shared Access: All authenticated users can access all data
-- Run this in the Supabase Dashboard SQL Editor

-- Drop old per-user restrictive policies
DROP POLICY IF EXISTS "Admin can manage own dealrooms" ON dealrooms;
DROP POLICY IF EXISTS "Admin can manage own customers" ON customers;
DROP POLICY IF EXISTS "Admin can manage own references" ON "references";
DROP POLICY IF EXISTS "Admin can manage own team members" ON team_members;
DROP POLICY IF EXISTS "Admin can read own tracking events" ON tracking_events;
DROP POLICY IF EXISTS "Admin can manage own profile" ON admin_users;

-- Dealrooms: Any authenticated user can manage all dealrooms
CREATE POLICY "Authenticated can manage all dealrooms" ON dealrooms
  FOR ALL USING (auth.role() = 'authenticated');

-- Customers: Any authenticated user can manage all customers
CREATE POLICY "Authenticated can manage all customers" ON customers
  FOR ALL USING (auth.role() = 'authenticated');

-- References: Any authenticated user can manage all references
CREATE POLICY "Authenticated can manage all references" ON "references"
  FOR ALL USING (auth.role() = 'authenticated');

-- Team Members: Any authenticated user can manage all team members
CREATE POLICY "Authenticated can manage all team members" ON team_members
  FOR ALL USING (auth.role() = 'authenticated');

-- Tracking Events: Any authenticated user can read all tracking events
CREATE POLICY "Authenticated can read all tracking events" ON tracking_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin Users: Any authenticated user can read all admin profiles
CREATE POLICY "Authenticated can read all profiles" ON admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin Users: Users can still only update their own profile
CREATE POLICY "Admin can update own profile" ON admin_users
  FOR UPDATE USING (id = auth.uid());

-- Templates: Enable RLS and allow shared access
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can manage own templates" ON templates;
CREATE POLICY "Authenticated can manage all templates" ON templates
  FOR ALL USING (auth.role() = 'authenticated');

-- Email Flows: Enable RLS and allow shared access
ALTER TABLE email_flows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin can manage own email flows" ON email_flows;
CREATE POLICY "Authenticated can manage all email flows" ON email_flows
  FOR ALL USING (auth.role() = 'authenticated');
