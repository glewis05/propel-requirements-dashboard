-- ============================================================================
-- Migration: Interactive Dashboard Schema Updates
-- Project: Propel Health Requirements Dashboard Upgrade
-- Date: 2026-01-23
-- Description: Adds tables and columns for interactive features including
--              comments, approvals, versioning, and role-based access control
-- ============================================================================

-- ============================================================================
-- SECTION 1: Users Table Modifications
-- ============================================================================

-- Add role column for RBAC
ALTER TABLE users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Developer'
CHECK (role IN ('Portfolio Manager', 'Program Manager', 'Developer', 'Admin'));

COMMENT ON COLUMN users.role IS 'User role for access control: Portfolio Manager, Program Manager, Developer, Admin';

-- Add assigned_programs array for Program Manager scope
ALTER TABLE users
ADD COLUMN IF NOT EXISTS assigned_programs TEXT[] DEFAULT '{}';

COMMENT ON COLUMN users.assigned_programs IS 'Array of program_ids this user can access (for Program Managers)';

-- Add avatar_url for profile pictures
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture';

-- Add last_login_at for activity tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

COMMENT ON COLUMN users.last_login_at IS 'Timestamp of last user login';

-- Add auth_id to link to Supabase Auth (auth.users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;

COMMENT ON COLUMN users.auth_id IS 'Foreign key to auth.users for Supabase Auth integration';

-- ============================================================================
-- SECTION 2: User Stories Table Modifications
-- ============================================================================

-- Add stakeholder approval tracking
ALTER TABLE user_stories
ADD COLUMN IF NOT EXISTS stakeholder_approved_by UUID;

COMMENT ON COLUMN user_stories.stakeholder_approved_by IS 'User ID of stakeholder who approved (references auth.users)';

ALTER TABLE user_stories
ADD COLUMN IF NOT EXISTS stakeholder_approved_at TIMESTAMPTZ;

COMMENT ON COLUMN user_stories.stakeholder_approved_at IS 'Timestamp when stakeholder approved';

-- Add optimistic locking for concurrent edit prevention
ALTER TABLE user_stories
ADD COLUMN IF NOT EXISTS locked_by UUID;

COMMENT ON COLUMN user_stories.locked_by IS 'User ID holding edit lock (references auth.users)';

ALTER TABLE user_stories
ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;

COMMENT ON COLUMN user_stories.locked_at IS 'Timestamp when lock was acquired';

-- ============================================================================
-- SECTION 3: New Table - story_comments
-- Enables threaded discussions on user stories
-- ============================================================================

CREATE TABLE IF NOT EXISTS story_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_comment_id UUID REFERENCES story_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_question BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE story_comments IS 'Threaded comments and discussions on user stories';
COMMENT ON COLUMN story_comments.id IS 'Auto-generated unique identifier';
COMMENT ON COLUMN story_comments.story_id IS 'Reference to user_stories.story_id';
COMMENT ON COLUMN story_comments.user_id IS 'Reference to auth.users (who posted the comment)';
COMMENT ON COLUMN story_comments.parent_comment_id IS 'For threaded replies (nullable for top-level comments)';
COMMENT ON COLUMN story_comments.content IS 'Comment content (markdown supported)';
COMMENT ON COLUMN story_comments.is_question IS 'Flag for developer questions requiring answers';
COMMENT ON COLUMN story_comments.resolved IS 'Whether question has been answered';

-- Index for fast lookup by story
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON story_comments(story_id);

-- Index for finding unresolved questions
CREATE INDEX IF NOT EXISTS idx_story_comments_unresolved ON story_comments(story_id)
WHERE is_question = TRUE AND resolved = FALSE;

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_story_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS story_comments_updated_at ON story_comments;
CREATE TRIGGER story_comments_updated_at
    BEFORE UPDATE ON story_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_story_comments_updated_at();

-- ============================================================================
-- SECTION 4: New Table - story_approvals
-- Tracks approval history for compliance audit trail (FDA 21 CFR Part 11)
-- ============================================================================

CREATE TABLE IF NOT EXISTS story_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
    approved_by UUID NOT NULL,
    approval_type TEXT NOT NULL CHECK (approval_type IN ('internal_review', 'stakeholder', 'portfolio')),
    status TEXT NOT NULL CHECK (status IN ('approved', 'rejected', 'needs_discussion')),
    previous_status TEXT,
    notes TEXT,
    approved_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    session_id TEXT
);

COMMENT ON TABLE story_approvals IS 'Immutable approval history for compliance audit trail';
COMMENT ON COLUMN story_approvals.id IS 'Auto-generated unique identifier';
COMMENT ON COLUMN story_approvals.story_id IS 'Reference to user_stories.story_id';
COMMENT ON COLUMN story_approvals.approved_by IS 'Reference to auth.users (who took the action)';
COMMENT ON COLUMN story_approvals.approval_type IS 'Type: internal_review, stakeholder, portfolio';
COMMENT ON COLUMN story_approvals.status IS 'Action taken: approved, rejected, needs_discussion';
COMMENT ON COLUMN story_approvals.previous_status IS 'Status before this approval action';
COMMENT ON COLUMN story_approvals.notes IS 'Approval comments or rejection reason';
COMMENT ON COLUMN story_approvals.approved_at IS 'Timestamp when approval action occurred';
COMMENT ON COLUMN story_approvals.ip_address IS 'Client IP for audit compliance';
COMMENT ON COLUMN story_approvals.session_id IS 'Session identifier for traceability';

-- Index for fast lookup by story
CREATE INDEX IF NOT EXISTS idx_story_approvals_story_id ON story_approvals(story_id);

-- Index for audit trail queries by user
CREATE INDEX IF NOT EXISTS idx_story_approvals_approved_by ON story_approvals(approved_by);

-- Index for time-based audit queries
CREATE INDEX IF NOT EXISTS idx_story_approvals_approved_at ON story_approvals(approved_at DESC);

-- ============================================================================
-- SECTION 5: New Table - story_versions
-- Tracks version history for all story changes (immutable)
-- ============================================================================

CREATE TABLE IF NOT EXISTS story_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    snapshot JSONB NOT NULL,
    changed_fields TEXT[],
    change_summary TEXT,
    changed_by UUID NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    is_baseline BOOLEAN DEFAULT FALSE,
    baseline_name TEXT
);

COMMENT ON TABLE story_versions IS 'Immutable version history for all story changes';
COMMENT ON COLUMN story_versions.id IS 'Auto-generated unique identifier';
COMMENT ON COLUMN story_versions.story_id IS 'Reference to user_stories.story_id';
COMMENT ON COLUMN story_versions.version_number IS 'Sequential version number for this story';
COMMENT ON COLUMN story_versions.snapshot IS 'Complete story data at this version (JSONB)';
COMMENT ON COLUMN story_versions.changed_fields IS 'Array of field names that changed';
COMMENT ON COLUMN story_versions.change_summary IS 'Human-readable change description';
COMMENT ON COLUMN story_versions.changed_by IS 'Reference to auth.users (who made the change)';
COMMENT ON COLUMN story_versions.changed_at IS 'Timestamp when this version was created';
COMMENT ON COLUMN story_versions.is_baseline IS 'Whether this is a release baseline';
COMMENT ON COLUMN story_versions.baseline_name IS 'Name of baseline (e.g., Q1 2026 Release)';

-- Unique constraint on story_id + version_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_story_versions_unique
ON story_versions(story_id, version_number);

-- Index for finding baselines
CREATE INDEX IF NOT EXISTS idx_story_versions_baselines
ON story_versions(story_id) WHERE is_baseline = TRUE;

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_story_versions_changed_at
ON story_versions(changed_at DESC);

-- ============================================================================
-- SECTION 6: Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_versions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Helper function to get current user's role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM users
        WHERE auth_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Helper function to get current user's assigned programs
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_programs()
RETURNS TEXT[] AS $$
BEGIN
    RETURN (
        SELECT COALESCE(assigned_programs, '{}') FROM users
        WHERE auth_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- Helper function to check if user can access a story
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION can_access_story(p_story_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_programs TEXT[];
    v_story_program TEXT;
    v_story_status TEXT;
BEGIN
    SELECT role, COALESCE(assigned_programs, '{}') INTO v_role, v_programs
    FROM users WHERE auth_id = auth.uid();

    SELECT program_id, status INTO v_story_program, v_story_status
    FROM user_stories WHERE story_id = p_story_id;

    -- Admin and Portfolio Manager can see everything
    IF v_role IN ('Admin', 'Portfolio Manager') THEN
        RETURN TRUE;
    END IF;

    -- Program Manager can see stories in their assigned programs
    IF v_role = 'Program Manager' AND v_story_program = ANY(v_programs) THEN
        RETURN TRUE;
    END IF;

    -- Developer can only see approved stories
    IF v_role = 'Developer' AND v_story_status = 'Approved' THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- story_comments policies
-- ----------------------------------------------------------------------------

-- SELECT: Based on story access
CREATE POLICY story_comments_select ON story_comments
    FOR SELECT
    USING (can_access_story(story_id));

-- INSERT: Anyone who can access the story can comment (Developers only questions)
CREATE POLICY story_comments_insert ON story_comments
    FOR INSERT
    WITH CHECK (
        can_access_story(story_id) AND
        (get_user_role() != 'Developer' OR is_question = TRUE)
    );

-- UPDATE: Only comment author or Admin can edit
CREATE POLICY story_comments_update ON story_comments
    FOR UPDATE
    USING (
        user_id = auth.uid() OR
        get_user_role() = 'Admin'
    );

-- DELETE: Only Admin can delete comments
CREATE POLICY story_comments_delete ON story_comments
    FOR DELETE
    USING (get_user_role() = 'Admin');

-- ----------------------------------------------------------------------------
-- story_approvals policies (immutable - no UPDATE/DELETE for non-admins)
-- ----------------------------------------------------------------------------

-- SELECT: Based on story access
CREATE POLICY story_approvals_select ON story_approvals
    FOR SELECT
    USING (can_access_story(story_id));

-- INSERT: Only authorized roles can create approvals
CREATE POLICY story_approvals_insert ON story_approvals
    FOR INSERT
    WITH CHECK (
        get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager')
    );

-- No UPDATE policy - approvals are immutable

-- DELETE: Only Admin (for data correction only)
CREATE POLICY story_approvals_delete ON story_approvals
    FOR DELETE
    USING (get_user_role() = 'Admin');

-- ----------------------------------------------------------------------------
-- story_versions policies (immutable)
-- ----------------------------------------------------------------------------

-- SELECT: Based on story access
CREATE POLICY story_versions_select ON story_versions
    FOR SELECT
    USING (can_access_story(story_id));

-- INSERT: System-generated on story changes (Admin/service role)
CREATE POLICY story_versions_insert ON story_versions
    FOR INSERT
    WITH CHECK (get_user_role() = 'Admin');

-- No UPDATE policy - versions are immutable

-- DELETE: Only Admin (for data correction only)
CREATE POLICY story_versions_delete ON story_versions
    FOR DELETE
    USING (get_user_role() = 'Admin');

-- ============================================================================
-- SECTION 7: Trigger for automatic version tracking
-- ============================================================================

CREATE OR REPLACE FUNCTION create_story_version()
RETURNS TRIGGER AS $$
DECLARE
    v_version_number INTEGER;
    v_changed_fields TEXT[];
    v_change_summary TEXT;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM story_versions WHERE story_id = NEW.story_id;

    -- Determine which fields changed (for updates only)
    IF TG_OP = 'UPDATE' THEN
        v_changed_fields := ARRAY[]::TEXT[];

        IF OLD.title IS DISTINCT FROM NEW.title THEN
            v_changed_fields := array_append(v_changed_fields, 'title');
        END IF;
        IF OLD.user_story IS DISTINCT FROM NEW.user_story THEN
            v_changed_fields := array_append(v_changed_fields, 'user_story');
        END IF;
        IF OLD.acceptance_criteria IS DISTINCT FROM NEW.acceptance_criteria THEN
            v_changed_fields := array_append(v_changed_fields, 'acceptance_criteria');
        END IF;
        IF OLD.priority IS DISTINCT FROM NEW.priority THEN
            v_changed_fields := array_append(v_changed_fields, 'priority');
        END IF;
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            v_changed_fields := array_append(v_changed_fields, 'status');
        END IF;
        IF OLD.roadmap_target IS DISTINCT FROM NEW.roadmap_target THEN
            v_changed_fields := array_append(v_changed_fields, 'roadmap_target');
        END IF;

        -- Generate change summary
        IF array_length(v_changed_fields, 1) > 0 THEN
            v_change_summary := 'Updated: ' || array_to_string(v_changed_fields, ', ');
        ELSE
            v_change_summary := 'Minor update';
        END IF;
    ELSE
        v_changed_fields := NULL;
        v_change_summary := 'Initial creation';
    END IF;

    -- Insert version record
    INSERT INTO story_versions (
        story_id,
        version_number,
        snapshot,
        changed_fields,
        change_summary,
        changed_by,
        changed_at
    ) VALUES (
        NEW.story_id,
        v_version_number,
        to_jsonb(NEW),
        v_changed_fields,
        v_change_summary,
        auth.uid(),
        NOW()
    );

    -- Update version number on the story
    NEW.version := v_version_number;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS user_stories_version_trigger ON user_stories;
CREATE TRIGGER user_stories_version_trigger
    BEFORE INSERT OR UPDATE ON user_stories
    FOR EACH ROW
    EXECUTE FUNCTION create_story_version();

-- ============================================================================
-- SECTION 8: Lock management functions
-- ============================================================================

-- Function to acquire edit lock on a story
CREATE OR REPLACE FUNCTION acquire_story_lock(p_story_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_lock UUID;
    v_lock_time TIMESTAMPTZ;
BEGIN
    -- Check for existing lock
    SELECT locked_by, locked_at INTO v_current_lock, v_lock_time
    FROM user_stories WHERE story_id = p_story_id;

    -- If locked by someone else within last 5 minutes, deny
    IF v_current_lock IS NOT NULL
       AND v_current_lock != auth.uid()
       AND v_lock_time > NOW() - INTERVAL '5 minutes' THEN
        RETURN FALSE;
    END IF;

    -- Acquire lock
    UPDATE user_stories
    SET locked_by = auth.uid(), locked_at = NOW()
    WHERE story_id = p_story_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release edit lock
CREATE OR REPLACE FUNCTION release_story_lock(p_story_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE user_stories
    SET locked_by = NULL, locked_at = NULL
    WHERE story_id = p_story_id AND locked_by = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if story is locked by another user
CREATE OR REPLACE FUNCTION is_story_locked(p_story_id TEXT)
RETURNS TABLE(is_locked BOOLEAN, locked_by_name TEXT, locked_since TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT
        us.locked_by IS NOT NULL AND us.locked_by != auth.uid() AND us.locked_at > NOW() - INTERVAL '5 minutes',
        u.name,
        us.locked_at
    FROM user_stories us
    LEFT JOIN users u ON u.auth_id = us.locked_by
    WHERE us.story_id = p_story_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 9: Seed initial admin user (update with actual auth_id after first login)
-- ============================================================================

-- Update existing Glen Lewis user to Admin role
UPDATE users
SET role = 'Admin'
WHERE name = 'Glen Lewis' OR email ILIKE '%glen%lewis%';

-- ============================================================================
-- Migration complete
-- ============================================================================
