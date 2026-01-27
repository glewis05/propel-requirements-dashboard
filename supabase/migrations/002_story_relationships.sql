-- ============================================================================
-- Story Relationships Migration
-- Adds parent-child hierarchy and related story linking
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Ensure relationship columns exist
-- ----------------------------------------------------------------------------

-- Add parent_story_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_stories' AND column_name = 'parent_story_id'
    ) THEN
        ALTER TABLE user_stories ADD COLUMN parent_story_id TEXT;
    END IF;
END $$;

-- Add related_stories JSONB column if it doesn't exist (default empty array)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_stories' AND column_name = 'related_stories'
    ) THEN
        ALTER TABLE user_stories ADD COLUMN related_stories JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Add foreign key constraint for parent_story_id
-- ----------------------------------------------------------------------------

-- Drop existing constraint if it exists (to recreate cleanly)
ALTER TABLE user_stories DROP CONSTRAINT IF EXISTS fk_parent_story;

-- Add foreign key constraint
ALTER TABLE user_stories
ADD CONSTRAINT fk_parent_story
FOREIGN KEY (parent_story_id) REFERENCES user_stories(story_id)
ON DELETE SET NULL;

-- ----------------------------------------------------------------------------
-- 3. Add indexes for efficient queries
-- ----------------------------------------------------------------------------

-- Index on parent_story_id for finding child stories
CREATE INDEX IF NOT EXISTS idx_user_stories_parent_story_id
ON user_stories(parent_story_id)
WHERE parent_story_id IS NOT NULL;

-- GIN index on related_stories for JSONB array queries
CREATE INDEX IF NOT EXISTS idx_user_stories_related_stories
ON user_stories USING GIN (related_stories);

-- ----------------------------------------------------------------------------
-- 4. Add constraint: story cannot be its own parent
-- ----------------------------------------------------------------------------

ALTER TABLE user_stories DROP CONSTRAINT IF EXISTS chk_no_self_parent;

ALTER TABLE user_stories
ADD CONSTRAINT chk_no_self_parent
CHECK (parent_story_id IS NULL OR parent_story_id != story_id);

-- ----------------------------------------------------------------------------
-- 5. Function to validate same-program constraint for parent
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION validate_parent_same_program()
RETURNS TRIGGER AS $$
DECLARE
    parent_program_id TEXT;
BEGIN
    -- Only validate if parent_story_id is being set
    IF NEW.parent_story_id IS NOT NULL THEN
        -- Get the parent story's program_id
        SELECT program_id INTO parent_program_id
        FROM user_stories
        WHERE story_id = NEW.parent_story_id;

        -- Validate parent exists and is in the same program
        IF parent_program_id IS NULL THEN
            RAISE EXCEPTION 'Parent story % does not exist', NEW.parent_story_id;
        END IF;

        IF parent_program_id != NEW.program_id THEN
            RAISE EXCEPTION 'Parent story must be in the same program. Parent is in program %, but this story is in program %', parent_program_id, NEW.program_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_validate_parent_same_program ON user_stories;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trg_validate_parent_same_program
BEFORE INSERT OR UPDATE OF parent_story_id, program_id ON user_stories
FOR EACH ROW
EXECUTE FUNCTION validate_parent_same_program();

-- ----------------------------------------------------------------------------
-- 6. Function to enforce one-level hierarchy
-- (parent can't have a parent, story with children can't become a child)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION enforce_one_level_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    parent_has_parent BOOLEAN;
    has_children BOOLEAN;
BEGIN
    -- Only validate if parent_story_id is being set
    IF NEW.parent_story_id IS NOT NULL THEN
        -- Check if the proposed parent already has a parent
        SELECT EXISTS (
            SELECT 1 FROM user_stories
            WHERE story_id = NEW.parent_story_id
            AND parent_story_id IS NOT NULL
        ) INTO parent_has_parent;

        IF parent_has_parent THEN
            RAISE EXCEPTION 'Cannot set parent: the selected parent story already has a parent (only one level of hierarchy allowed)';
        END IF;

        -- Check if this story already has children
        SELECT EXISTS (
            SELECT 1 FROM user_stories
            WHERE parent_story_id = NEW.story_id
        ) INTO has_children;

        IF has_children THEN
            RAISE EXCEPTION 'Cannot set parent: this story already has child stories (only one level of hierarchy allowed)';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_enforce_one_level_hierarchy ON user_stories;

-- Create trigger for INSERT and UPDATE
CREATE TRIGGER trg_enforce_one_level_hierarchy
BEFORE INSERT OR UPDATE OF parent_story_id ON user_stories
FOR EACH ROW
EXECUTE FUNCTION enforce_one_level_hierarchy();

-- ----------------------------------------------------------------------------
-- 7. RPC function to remove a story from all related_stories arrays
-- (called when deleting a story to clean up references)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION remove_story_from_related(p_story_id TEXT)
RETURNS VOID AS $$
BEGIN
    -- Update all stories that have this story in their related_stories array
    UPDATE user_stories
    SET related_stories = (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(related_stories) AS elem
        WHERE elem::text != ('"' || p_story_id || '"')
    )
    WHERE related_stories @> to_jsonb(ARRAY[p_story_id]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION remove_story_from_related(TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- 8. Helper function to get stories that link TO a given story
-- (for bidirectional relationship display)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_stories_linking_to(p_story_id TEXT)
RETURNS TABLE (
    story_id TEXT,
    title TEXT,
    program_id TEXT,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        us.story_id,
        us.title,
        us.program_id,
        us.status
    FROM user_stories us
    WHERE us.related_stories @> to_jsonb(ARRAY[p_story_id])
    AND us.story_id != p_story_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_stories_linking_to(TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- Comments for documentation
-- ----------------------------------------------------------------------------

COMMENT ON COLUMN user_stories.parent_story_id IS 'Reference to parent story for one-level hierarchy. Must be in the same program.';
COMMENT ON COLUMN user_stories.related_stories IS 'JSONB array of related story IDs for bidirectional linking across programs.';
COMMENT ON FUNCTION remove_story_from_related(TEXT) IS 'Removes a story ID from all related_stories arrays. Call when deleting a story.';
COMMENT ON FUNCTION get_stories_linking_to(TEXT) IS 'Returns stories that have the given story in their related_stories array.';
