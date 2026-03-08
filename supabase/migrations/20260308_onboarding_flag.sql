-- Add onboarding flag to admin_users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false;
