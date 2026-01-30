-- Migration: Soft Delete for User Stories
-- Implements audit trail for story deletions
-- Created: January 30, 2026

-- ============================================
-- ADD SOFT DELETE COLUMNS
-- ============================================

ALTER TABLE user_stories
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by TEXT REFERENCES users(user_id);

COMMENT ON COLUMN user_stories.deleted_at IS
  'Timestamp when story was soft-deleted. NULL means active.';
COMMENT ON COLUMN user_stories.deleted_by IS
  'User ID of who deleted the story';

-- Index for efficiently filtering out deleted stories
CREATE INDEX IF NOT EXISTS idx_user_stories_deleted_at
  ON user_stories(deleted_at)
  WHERE deleted_at IS NULL;

-- ============================================
-- UPDATE ACTIVITY LOG FOR DELETION METADATA
-- ============================================
-- The activity_log table already supports story_deleted type
-- and has ON DELETE SET NULL for story_id, so deleted story
-- activities will be preserved with null story_id.
--
-- We store deletion context in metadata:
-- {
--   "story_title": "...",
--   "story_status": "...",
--   "program_id": "...",
--   "reason": "..." (optional)
-- }

-- ============================================
-- VIEW: Active Stories Only
-- ============================================
-- Optional convenience view for queries that only want active stories

CREATE OR REPLACE VIEW active_user_stories AS
SELECT * FROM user_stories WHERE deleted_at IS NULL;

COMMENT ON VIEW active_user_stories IS
  'View of user_stories excluding soft-deleted records';

-- ============================================
-- UPDATE RLS POLICIES
-- ============================================
-- Existing policies will still work, but queries should filter
-- by deleted_at IS NULL to exclude soft-deleted stories.
-- The application layer handles this filtering.
