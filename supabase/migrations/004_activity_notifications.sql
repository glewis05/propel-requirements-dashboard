-- Migration: Activity Feed and In-App Notifications
-- Phase 5: Collaboration Features
-- Created: January 27, 2026

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================
-- Stores all activity events for the activity feed
-- This provides a centralized view of what's happening across the system

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What happened
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'story_created',
    'story_updated',
    'story_deleted',
    'status_changed',
    'comment_added',
    'comment_resolved',
    'question_asked',
    'question_answered',
    'approval_granted',
    'approval_rejected',
    'story_linked',
    'story_unlinked'
  )),

  -- Who did it
  user_id TEXT NOT NULL REFERENCES users(user_id),

  -- What it relates to
  story_id TEXT REFERENCES user_stories(story_id) ON DELETE SET NULL,
  comment_id UUID REFERENCES story_comments(id) ON DELETE SET NULL,

  -- Context data (flexible JSON for activity-specific details)
  metadata JSONB DEFAULT '{}',
  -- Examples:
  -- status_changed: {"from": "Draft", "to": "Internal Review"}
  -- comment_added: {"is_question": true, "parent_comment_id": null}
  -- story_linked: {"linked_story_id": "US-042", "link_type": "related"}

  -- When it happened
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX idx_activity_log_story_id ON activity_log(story_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);

-- ============================================
-- IN-APP NOTIFICATIONS TABLE
-- ============================================
-- Personal notifications for each user (bell icon)

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who receives the notification
  user_id TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,

  -- Notification content
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- What type of notification
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'mention',
    'reply',
    'status_change',
    'approval_needed',
    'approval_result',
    'question_answered',
    'assigned'
  )),

  -- Link to related content
  story_id TEXT REFERENCES user_stories(story_id) ON DELETE CASCADE,
  comment_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,

  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_notifications_user_unread ON user_notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_user_notifications_user_created ON user_notifications(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- Activity Log: All authenticated users can read
CREATE POLICY "Authenticated users can read activity log"
  ON activity_log FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Activity Log: System inserts (via triggers/functions)
-- For now, allow authenticated users to insert their own activities
CREATE POLICY "Users can insert own activities"
  ON activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT u.user_id FROM users u WHERE u.auth_id = auth.uid())
  );

-- Notifications: Users can only see their own
CREATE POLICY "Users can read own notifications"
  ON user_notifications FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT u.user_id FROM users u WHERE u.auth_id = auth.uid())
  );

-- Notifications: Users can update their own (mark as read)
CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  TO authenticated
  USING (
    user_id IN (SELECT u.user_id FROM users u WHERE u.auth_id = auth.uid())
  )
  WITH CHECK (
    user_id IN (SELECT u.user_id FROM users u WHERE u.auth_id = auth.uid())
  );

-- Notifications: System can insert for any user
-- Using service role or allowing authenticated users to create notifications for others
CREATE POLICY "Authenticated users can create notifications"
  ON user_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notifications: Users can delete their own
CREATE POLICY "Users can delete own notifications"
  ON user_notifications FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT u.user_id FROM users u WHERE u.auth_id = auth.uid())
  );

-- ============================================
-- HELPER FUNCTION: Log Activity
-- ============================================

CREATE OR REPLACE FUNCTION log_activity(
  p_activity_type TEXT,
  p_user_id TEXT,
  p_story_id TEXT DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO activity_log (activity_type, user_id, story_id, comment_id, metadata)
  VALUES (p_activity_type, p_user_id, p_story_id, p_comment_id, p_metadata)
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- HELPER FUNCTION: Create Notification
-- ============================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id TEXT,
  p_title TEXT,
  p_message TEXT,
  p_notification_type TEXT,
  p_story_id TEXT DEFAULT NULL,
  p_comment_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO user_notifications (user_id, title, message, notification_type, story_id, comment_id)
  VALUES (p_user_id, p_title, p_message, p_notification_type, p_story_id, p_comment_id)
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- UPDATE story_comments FOR Q&A WORKFLOW
-- ============================================
-- Add fields to support answer acceptance

ALTER TABLE story_comments
ADD COLUMN IF NOT EXISTS accepted_answer BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS accepted_by TEXT REFERENCES users(user_id);

-- Index for finding accepted answers
CREATE INDEX IF NOT EXISTS idx_story_comments_accepted ON story_comments(parent_comment_id, accepted_answer) WHERE accepted_answer = TRUE;

-- ============================================
-- COMMENTS
-- ============================================
-- Run this migration after 003_notification_preferences.sql
--
-- Tables created:
-- - activity_log: Centralized activity feed
-- - user_notifications: Per-user in-app notifications
--
-- New columns on story_comments:
-- - accepted_answer: Boolean for Q&A workflow
-- - accepted_at: When answer was accepted
-- - accepted_by: Who accepted the answer
--
-- Functions created:
-- - log_activity(): Helper to create activity log entries
-- - create_notification(): Helper to create user notifications
