-- ============================================================================
-- Migration 006: UAT (User Acceptance Testing) Schema
-- Adds test_cases, test_executions, and defects tables for UAT management
-- ============================================================================

-- ============================================================================
-- 1. TEST CASES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS test_cases (
  test_case_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES programs(program_id),
  title TEXT NOT NULL,
  description TEXT,
  preconditions TEXT,
  test_data TEXT,
  test_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each step: { step_number: number, action: string, expected_result: string, notes?: string }
  expected_results TEXT,
  test_type TEXT NOT NULL DEFAULT 'functional',
  -- functional, regression, integration, smoke, boundary, security, accessibility
  priority TEXT NOT NULL DEFAULT 'medium',
  -- critical, high, medium, low
  is_ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_model_used TEXT,
  human_reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by TEXT REFERENCES users(user_id),
  reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  -- draft, ready, in_progress, completed, deprecated
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL REFERENCES users(user_id),
  is_archived BOOLEAN NOT NULL DEFAULT false
);

-- Indexes for test_cases
CREATE INDEX IF NOT EXISTS idx_test_cases_story_id ON test_cases(story_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_program_id ON test_cases(program_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_status ON test_cases(status);
CREATE INDEX IF NOT EXISTS idx_test_cases_created_by ON test_cases(created_by);
CREATE INDEX IF NOT EXISTS idx_test_cases_is_archived ON test_cases(is_archived);

-- ============================================================================
-- 2. TEST EXECUTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS test_executions (
  execution_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_case_id UUID NOT NULL REFERENCES test_cases(test_case_id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
  assigned_to TEXT NOT NULL REFERENCES users(user_id),
  assigned_by TEXT NOT NULL REFERENCES users(user_id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'assigned',
  -- assigned, in_progress, passed, failed, blocked, verified
  step_results JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Each result: { step_number: number, status: string, actual_result: string, notes?: string, executed_at: string }
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_by TEXT REFERENCES users(user_id),
  verified_at TIMESTAMPTZ,
  environment TEXT,
  browser_device TEXT,
  cycle_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for test_executions
CREATE INDEX IF NOT EXISTS idx_test_executions_test_case_id ON test_executions(test_case_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_story_id ON test_executions(story_id);
CREATE INDEX IF NOT EXISTS idx_test_executions_assigned_to ON test_executions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_test_executions_status ON test_executions(status);
CREATE INDEX IF NOT EXISTS idx_test_executions_cycle_name ON test_executions(cycle_name);

-- ============================================================================
-- 3. DEFECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS defects (
  defect_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID REFERENCES test_executions(execution_id) ON DELETE SET NULL,
  test_case_id UUID REFERENCES test_cases(test_case_id) ON DELETE SET NULL,
  story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES programs(program_id),
  title TEXT NOT NULL,
  description TEXT,
  steps_to_reproduce TEXT,
  expected_behavior TEXT,
  actual_behavior TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  -- critical, high, medium, low
  status TEXT NOT NULL DEFAULT 'open',
  -- open, confirmed, in_progress, fixed, verified, closed
  reported_by TEXT NOT NULL REFERENCES users(user_id),
  assigned_to TEXT REFERENCES users(user_id),
  resolved_by TEXT REFERENCES users(user_id),
  resolved_at TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]'::jsonb,
  -- Each attachment: { name: string, url: string, type: string, uploaded_at: string }
  environment TEXT,
  failed_step_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for defects
CREATE INDEX IF NOT EXISTS idx_defects_execution_id ON defects(execution_id);
CREATE INDEX IF NOT EXISTS idx_defects_test_case_id ON defects(test_case_id);
CREATE INDEX IF NOT EXISTS idx_defects_story_id ON defects(story_id);
CREATE INDEX IF NOT EXISTS idx_defects_program_id ON defects(program_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_defects_reported_by ON defects(reported_by);
CREATE INDEX IF NOT EXISTS idx_defects_assigned_to ON defects(assigned_to);

-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE defects ENABLE ROW LEVEL SECURITY;

-- Test Cases: All authenticated users can read, managers can create/update
CREATE POLICY "test_cases_select" ON test_cases
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "test_cases_insert" ON test_cases
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "test_cases_update" ON test_cases
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "test_cases_delete" ON test_cases
  FOR DELETE TO authenticated
  USING (
    get_user_role() IN ('Admin')
  );

-- Test Executions: All authenticated can read, managers assign, testers can update their own
CREATE POLICY "test_executions_select" ON test_executions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "test_executions_insert" ON test_executions
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "test_executions_update" ON test_executions
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
    OR (
      get_user_role() IN ('UAT Tester')
      AND assigned_to = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
  );

-- Defects: All authenticated can read, most roles can create/update
CREATE POLICY "defects_select" ON defects
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "defects_insert" ON defects
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager', 'UAT Tester')
  );

CREATE POLICY "defects_update" ON defects
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
    OR (
      get_user_role() IN ('UAT Tester')
      AND reported_by = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
  );

-- ============================================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_test_cases_updated_at
  BEFORE UPDATE ON test_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_executions_updated_at
  BEFORE UPDATE ON test_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_defects_updated_at
  BEFORE UPDATE ON defects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. HELPER VIEWS FOR UAT DASHBOARD
-- ============================================================================

-- View: Test case summary per story
CREATE OR REPLACE VIEW uat_story_summary AS
SELECT
  us.story_id,
  us.title AS story_title,
  us.status AS story_status,
  us.program_id,
  COUNT(DISTINCT tc.test_case_id) AS total_test_cases,
  COUNT(DISTINCT te.execution_id) AS total_executions,
  COUNT(DISTINCT CASE WHEN te.status = 'passed' THEN te.execution_id END) AS passed_count,
  COUNT(DISTINCT CASE WHEN te.status = 'failed' THEN te.execution_id END) AS failed_count,
  COUNT(DISTINCT CASE WHEN te.status = 'blocked' THEN te.execution_id END) AS blocked_count,
  COUNT(DISTINCT CASE WHEN te.status = 'verified' THEN te.execution_id END) AS verified_count,
  COUNT(DISTINCT CASE WHEN te.status IN ('assigned', 'in_progress') THEN te.execution_id END) AS pending_count,
  COUNT(DISTINCT d.defect_id) AS open_defects
FROM user_stories us
LEFT JOIN test_cases tc ON tc.story_id = us.story_id AND tc.is_archived = false
LEFT JOIN test_executions te ON te.test_case_id = tc.test_case_id
LEFT JOIN defects d ON d.story_id = us.story_id AND d.status NOT IN ('verified', 'closed')
WHERE us.status = 'In UAT'
GROUP BY us.story_id, us.title, us.status, us.program_id;

-- View: Tester workload
CREATE OR REPLACE VIEW uat_tester_workload AS
SELECT
  u.user_id,
  u.name AS tester_name,
  COUNT(DISTINCT te.execution_id) AS total_assigned,
  COUNT(DISTINCT CASE WHEN te.status = 'assigned' THEN te.execution_id END) AS not_started,
  COUNT(DISTINCT CASE WHEN te.status = 'in_progress' THEN te.execution_id END) AS in_progress,
  COUNT(DISTINCT CASE WHEN te.status = 'passed' THEN te.execution_id END) AS passed,
  COUNT(DISTINCT CASE WHEN te.status = 'failed' THEN te.execution_id END) AS failed,
  COUNT(DISTINCT CASE WHEN te.status = 'blocked' THEN te.execution_id END) AS blocked
FROM users u
INNER JOIN test_executions te ON te.assigned_to = u.user_id
WHERE u.role IN ('UAT Tester', 'UAT Manager')
GROUP BY u.user_id, u.name;
