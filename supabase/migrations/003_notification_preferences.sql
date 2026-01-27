-- Migration: Add notification preferences to users table
-- Date: 2026-01-27
-- Purpose: Allow users to opt-in/opt-out of email notifications

-- Add notification_preferences column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email_enabled": true,
  "status_changes": true,
  "comments": true,
  "approvals": true,
  "mentions": true
}'::jsonb;

-- Add index for querying users with notifications enabled
CREATE INDEX IF NOT EXISTS idx_users_notifications_enabled
ON users ((notification_preferences->>'email_enabled'))
WHERE notification_preferences->>'email_enabled' = 'true';

-- Comment for documentation
COMMENT ON COLUMN users.notification_preferences IS 'JSON object containing user notification preferences: email_enabled, status_changes, comments, approvals, mentions';
