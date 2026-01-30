-- Add tracking field to user_stories for auto-generated test cases
ALTER TABLE user_stories
ADD COLUMN IF NOT EXISTS test_cases_auto_generated_at TIMESTAMPTZ;

COMMENT ON COLUMN user_stories.test_cases_auto_generated_at IS
  'Timestamp when AI test cases were auto-generated on approval';
