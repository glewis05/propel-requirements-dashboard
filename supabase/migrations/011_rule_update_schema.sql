-- Migration: Rule Update Story Type
-- Adds support for NCCN/TC rule update stories with structured test cases

-- 1. Add story_type column to user_stories
ALTER TABLE user_stories
ADD COLUMN story_type TEXT NOT NULL DEFAULT 'user_story'
CHECK (story_type IN ('user_story', 'rule_update'));

-- 2. Create rule_update_details table (1:1 with story)
CREATE TABLE rule_update_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('NCCN', 'TC')),
    target_rule TEXT NOT NULL,
    change_id TEXT NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('MODIFIED', 'NEW', 'DEPRECATED')),
    quarter TEXT NOT NULL,
    effective_date DATE,
    rule_description TEXT,
    change_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(story_id)
);

-- Index for quick lookup by story
CREATE INDEX idx_rule_update_details_story_id ON rule_update_details(story_id);

-- Index for searching by rule
CREATE INDEX idx_rule_update_details_target_rule ON rule_update_details(target_rule);

-- 3. Create rule_update_test_cases table (1:many per story)
CREATE TABLE rule_update_test_cases (
    test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
    profile_id TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('P4M', 'Px4M')),
    test_type TEXT NOT NULL CHECK (test_type IN ('POS', 'NEG')),
    sequence_number INT NOT NULL,
    patient_conditions JSONB NOT NULL DEFAULT '{}',
    expected_result TEXT,
    cross_trigger_check TEXT,
    test_steps JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'passed', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for quick lookup by story
CREATE INDEX idx_rule_test_cases_story_id ON rule_update_test_cases(story_id);

-- Index for profile_id lookups
CREATE INDEX idx_rule_test_cases_profile_id ON rule_update_test_cases(profile_id);

-- Index for filtering by platform and test type
CREATE INDEX idx_rule_test_cases_platform_type ON rule_update_test_cases(platform, test_type);

-- 4. Create rule_update_history table (immutable audit trail)
CREATE TABLE rule_update_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id TEXT NOT NULL,
    test_id UUID,
    action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'test_added', 'test_modified', 'test_deleted', 'details_updated')),
    previous_data JSONB,
    new_data JSONB,
    changed_by UUID NOT NULL,
    changed_by_name TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for story history lookup
CREATE INDEX idx_rule_update_history_story_id ON rule_update_history(story_id);

-- Index for test case history lookup
CREATE INDEX idx_rule_update_history_test_id ON rule_update_history(test_id);

-- Index for chronological queries
CREATE INDEX idx_rule_update_history_created_at ON rule_update_history(created_at DESC);

-- 5. Function to generate profile_id for test cases
CREATE OR REPLACE FUNCTION generate_rule_test_profile_id(
    p_story_id TEXT,
    p_platform TEXT,
    p_test_type TEXT
) RETURNS TEXT AS $$
DECLARE
    v_target_rule TEXT;
    v_rule_code TEXT;
    v_next_seq INT;
    v_profile_id TEXT;
BEGIN
    -- Get the target rule from rule_update_details
    SELECT target_rule INTO v_target_rule
    FROM rule_update_details
    WHERE story_id = p_story_id;

    IF v_target_rule IS NULL THEN
        RAISE EXCEPTION 'No rule update details found for story %', p_story_id;
    END IF;

    -- Extract rule code: NCCN-PROS-007 -> PROS007
    v_rule_code := REGEXP_REPLACE(
        REGEXP_REPLACE(v_target_rule, '^(NCCN|TC)-', ''),
        '-', '', 'g'
    );

    -- Get next sequence number for this platform/type combination
    SELECT COALESCE(MAX(sequence_number), 0) + 1 INTO v_next_seq
    FROM rule_update_test_cases
    WHERE story_id = p_story_id
      AND platform = p_platform
      AND test_type = p_test_type;

    -- Generate profile_id: TP-{RULE_CODE}-{TEST_TYPE}-{SEQ}-{PLATFORM}
    v_profile_id := 'TP-' || v_rule_code || '-' || p_test_type || '-' ||
                    LPAD(v_next_seq::TEXT, 2, '0') || '-' || p_platform;

    RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Function to get next sequence number (for client-side preview)
CREATE OR REPLACE FUNCTION get_next_test_sequence(
    p_story_id TEXT,
    p_platform TEXT,
    p_test_type TEXT
) RETURNS INT AS $$
BEGIN
    RETURN COALESCE(
        (SELECT MAX(sequence_number) + 1
         FROM rule_update_test_cases
         WHERE story_id = p_story_id
           AND platform = p_platform
           AND test_type = p_test_type),
        1
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to update updated_at on rule_update_details
CREATE OR REPLACE FUNCTION update_rule_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_rule_update_details_updated_at
    BEFORE UPDATE ON rule_update_details
    FOR EACH ROW
    EXECUTE FUNCTION update_rule_details_updated_at();

-- 8. Trigger to update updated_at on rule_update_test_cases
CREATE TRIGGER tr_rule_update_test_cases_updated_at
    BEFORE UPDATE ON rule_update_test_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_rule_details_updated_at();

-- 9. Enable RLS on new tables
ALTER TABLE rule_update_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_update_test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_update_history ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for rule_update_details
CREATE POLICY "Users can view rule update details"
    ON rule_update_details FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert rule update details"
    ON rule_update_details FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update rule update details"
    ON rule_update_details FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete rule update details"
    ON rule_update_details FOR DELETE
    TO authenticated
    USING (true);

-- 11. RLS Policies for rule_update_test_cases
CREATE POLICY "Users can view rule test cases"
    ON rule_update_test_cases FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert rule test cases"
    ON rule_update_test_cases FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update rule test cases"
    ON rule_update_test_cases FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Users can delete rule test cases"
    ON rule_update_test_cases FOR DELETE
    TO authenticated
    USING (true);

-- 12. RLS Policies for rule_update_history (read-only for users)
CREATE POLICY "Users can view rule update history"
    ON rule_update_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert rule update history"
    ON rule_update_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- History is immutable - no update or delete policies

-- 13. Comment on tables and columns for documentation
COMMENT ON TABLE rule_update_details IS 'Stores NCCN/TC rule update details for rule_update story types';
COMMENT ON TABLE rule_update_test_cases IS 'Stores structured test cases for validating rule updates';
COMMENT ON TABLE rule_update_history IS 'Immutable audit trail for all rule update changes';

COMMENT ON COLUMN user_stories.story_type IS 'Type of story: user_story (traditional) or rule_update (NCCN/TC rules)';
COMMENT ON COLUMN rule_update_details.rule_type IS 'NCCN or TC (Tyrer-Cuzick)';
COMMENT ON COLUMN rule_update_details.target_rule IS 'Rule identifier, e.g., NCCN-PROS-007';
COMMENT ON COLUMN rule_update_details.change_id IS 'Change tracking ID, e.g., 25Q4R-01';
COMMENT ON COLUMN rule_update_details.change_type IS 'Type of change: MODIFIED, NEW, or DEPRECATED';
COMMENT ON COLUMN rule_update_test_cases.profile_id IS 'Auto-generated: TP-{RULE}-{TYPE}-{SEQ}-{PLATFORM}';
COMMENT ON COLUMN rule_update_test_cases.platform IS 'P4M (Preventione4ME) or Px4M (Precision4ME)';
COMMENT ON COLUMN rule_update_test_cases.test_type IS 'POS (positive) or NEG (negative) test';
COMMENT ON COLUMN rule_update_test_cases.patient_conditions IS 'JSON object with PHX, FDR, SDR conditions';
COMMENT ON COLUMN rule_update_test_cases.test_steps IS 'Array of step objects with step_number, navigation_path, action, note';
