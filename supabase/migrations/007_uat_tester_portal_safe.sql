-- ============================================================================
-- Migration 007: UAT Tester Portal Schema (Safe Version)
-- This version drops existing partial objects before recreating them
-- ============================================================================

-- ============================================================================
-- CLEANUP SECTION - Remove any existing partial migration
-- ============================================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS cycle_tester_workload CASCADE;
DROP VIEW IF EXISTS cross_validation_comparison CASCADE;
DROP VIEW IF EXISTS tester_cycle_assignments CASCADE;
DROP VIEW IF EXISTS uat_cycle_summary CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS has_cycle_acknowledgment(UUID, TEXT);
DROP FUNCTION IF EXISTS get_cv_agreement_status(UUID);

-- Drop columns added to test_executions (if they exist)
ALTER TABLE test_executions DROP COLUMN IF EXISTS cycle_id;
ALTER TABLE test_executions DROP COLUMN IF EXISTS test_patient_id;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS cross_validation_groups CASCADE;
DROP TABLE IF EXISTS cycle_assignments CASCADE;
DROP TABLE IF EXISTS tester_acknowledgments CASCADE;
DROP TABLE IF EXISTS test_patients CASCADE;
DROP TABLE IF EXISTS cycle_testers CASCADE;
DROP TABLE IF EXISTS uat_cycles CASCADE;

-- ============================================================================
-- 1. UAT CYCLES TABLE
-- Central configuration for UAT cycles
-- ============================================================================
CREATE TABLE uat_cycles (
  cycle_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  program_id TEXT NOT NULL REFERENCES programs(program_id),
  status TEXT NOT NULL DEFAULT 'draft',
  distribution_method TEXT NOT NULL DEFAULT 'equal',
  cross_validation_enabled BOOLEAN NOT NULL DEFAULT false,
  cross_validation_percentage INTEGER DEFAULT 20,
  validators_per_test INTEGER DEFAULT 3,
  start_date DATE,
  end_date DATE,
  locked_at TIMESTAMPTZ,
  locked_by TEXT REFERENCES users(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL REFERENCES users(user_id),

  CONSTRAINT valid_cross_validation_percentage CHECK (
    cross_validation_percentage IS NULL OR
    (cross_validation_percentage >= 0 AND cross_validation_percentage <= 100)
  ),
  CONSTRAINT valid_validators_per_test CHECK (
    validators_per_test IS NULL OR validators_per_test >= 2
  )
);

COMMENT ON TABLE uat_cycles IS 'UAT test cycles for organizing testing rounds';
COMMENT ON COLUMN uat_cycles.distribution_method IS 'How to distribute tests: equal (round-robin) or weighted (by tester capacity)';
COMMENT ON COLUMN uat_cycles.cross_validation_percentage IS 'Percentage of tests that should have multiple testers for validation';
COMMENT ON COLUMN uat_cycles.validators_per_test IS 'Number of different testers to assign to cross-validation tests';

-- Indexes for uat_cycles
CREATE INDEX idx_uat_cycles_program_id ON uat_cycles(program_id);
CREATE INDEX idx_uat_cycles_status ON uat_cycles(status);
CREATE INDEX idx_uat_cycles_created_by ON uat_cycles(created_by);

-- ============================================================================
-- 2. CYCLE TESTERS TABLE
-- Tester pool per cycle with capacity weights
-- ============================================================================
CREATE TABLE cycle_testers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES uat_cycles(cycle_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  capacity_weight INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  added_by TEXT NOT NULL REFERENCES users(user_id),

  CONSTRAINT unique_cycle_tester UNIQUE (cycle_id, user_id),
  CONSTRAINT valid_capacity_weight CHECK (capacity_weight > 0 AND capacity_weight <= 100)
);

COMMENT ON TABLE cycle_testers IS 'Testers assigned to a UAT cycle with their capacity weights';
COMMENT ON COLUMN cycle_testers.capacity_weight IS 'Relative capacity: 100 = full load, 50 = half load';

-- Indexes for cycle_testers
CREATE INDEX idx_cycle_testers_cycle_id ON cycle_testers(cycle_id);
CREATE INDEX idx_cycle_testers_user_id ON cycle_testers(user_id);
CREATE INDEX idx_cycle_testers_is_active ON cycle_testers(is_active);

-- ============================================================================
-- 3. TEST PATIENTS TABLE
-- Pre-defined test patients for HIPAA compliance
-- ============================================================================
CREATE TABLE test_patients (
  patient_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id TEXT NOT NULL REFERENCES programs(program_id),
  patient_name TEXT NOT NULL,
  mrn TEXT NOT NULL,
  date_of_birth DATE,
  description TEXT,
  test_data_notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL REFERENCES users(user_id),

  CONSTRAINT unique_program_mrn UNIQUE (program_id, mrn)
);

COMMENT ON TABLE test_patients IS 'Pre-defined test patients for UAT testing (HIPAA compliant synthetic data)';
COMMENT ON COLUMN test_patients.mrn IS 'Medical Record Number - must be unique per program';
COMMENT ON COLUMN test_patients.test_data_notes IS 'Documentation of what test data exists for this patient in the test environment';

-- Indexes for test_patients
CREATE INDEX idx_test_patients_program_id ON test_patients(program_id);
CREATE INDEX idx_test_patients_is_active ON test_patients(is_active);
CREATE INDEX idx_test_patients_mrn ON test_patients(mrn);

-- ============================================================================
-- 4. TESTER ACKNOWLEDGMENTS TABLE
-- Part 11 compliance: Identity and HIPAA acknowledgment per cycle
-- ============================================================================
CREATE TABLE tester_acknowledgments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES uat_cycles(cycle_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(user_id),
  identity_confirmed_at TIMESTAMPTZ NOT NULL,
  identity_method TEXT NOT NULL DEFAULT 'checkbox',
  hipaa_acknowledged_at TIMESTAMPTZ NOT NULL,
  test_data_filter_acknowledged BOOLEAN NOT NULL DEFAULT true,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_cycle_acknowledgment UNIQUE (cycle_id, user_id)
);

COMMENT ON TABLE tester_acknowledgments IS '21 CFR Part 11 compliant acknowledgment records';
COMMENT ON COLUMN tester_acknowledgments.identity_confirmed_at IS 'Timestamp when user confirmed their identity';
COMMENT ON COLUMN tester_acknowledgments.hipaa_acknowledged_at IS 'Timestamp when user acknowledged HIPAA test data requirements';
COMMENT ON COLUMN tester_acknowledgments.ip_address IS 'IP address at time of acknowledgment for audit trail';

-- Indexes for tester_acknowledgments
CREATE INDEX idx_tester_acknowledgments_cycle_id ON tester_acknowledgments(cycle_id);
CREATE INDEX idx_tester_acknowledgments_user_id ON tester_acknowledgments(user_id);

-- ============================================================================
-- 5. CROSS VALIDATION GROUPS TABLE (create before cycle_assignments)
-- Groups test cases for cross-validation comparison
-- ============================================================================
CREATE TABLE cross_validation_groups (
  group_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES uat_cycles(cycle_id) ON DELETE CASCADE,
  test_case_id UUID NOT NULL REFERENCES test_cases(test_case_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_cycle_test_case_group UNIQUE (cycle_id, test_case_id)
);

COMMENT ON TABLE cross_validation_groups IS 'Groups multiple executions of the same test case for cross-validation';

-- Indexes for cross_validation_groups
CREATE INDEX idx_cross_validation_groups_cycle_id ON cross_validation_groups(cycle_id);
CREATE INDEX idx_cross_validation_groups_test_case_id ON cross_validation_groups(test_case_id);

-- ============================================================================
-- 6. CYCLE ASSIGNMENTS TABLE
-- Links executions to cycles with assignment type
-- ============================================================================
CREATE TABLE cycle_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID NOT NULL REFERENCES uat_cycles(cycle_id) ON DELETE CASCADE,
  execution_id UUID NOT NULL REFERENCES test_executions(execution_id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL DEFAULT 'primary',
  cross_validation_group_id UUID REFERENCES cross_validation_groups(group_id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by TEXT NOT NULL REFERENCES users(user_id),

  CONSTRAINT unique_cycle_execution UNIQUE (cycle_id, execution_id),
  CONSTRAINT valid_assignment_type CHECK (assignment_type IN ('primary', 'cross_validation'))
);

COMMENT ON TABLE cycle_assignments IS 'Links test executions to UAT cycles with assignment metadata';
COMMENT ON COLUMN cycle_assignments.assignment_type IS 'primary = single tester, cross_validation = multiple testers validating same test';

-- Indexes for cycle_assignments
CREATE INDEX idx_cycle_assignments_cycle_id ON cycle_assignments(cycle_id);
CREATE INDEX idx_cycle_assignments_execution_id ON cycle_assignments(execution_id);
CREATE INDEX idx_cycle_assignments_type ON cycle_assignments(assignment_type);
CREATE INDEX idx_cycle_assignments_cv_group ON cycle_assignments(cross_validation_group_id);

-- ============================================================================
-- 7. MODIFICATIONS TO EXISTING TABLES
-- ============================================================================

-- Add cycle_id and test_patient_id to test_executions
ALTER TABLE test_executions
ADD COLUMN cycle_id UUID REFERENCES uat_cycles(cycle_id) ON DELETE SET NULL;

ALTER TABLE test_executions
ADD COLUMN test_patient_id UUID REFERENCES test_patients(patient_id) ON DELETE SET NULL;

-- Index for new columns
CREATE INDEX idx_test_executions_cycle_id ON test_executions(cycle_id);
CREATE INDEX idx_test_executions_test_patient_id ON test_executions(test_patient_id);

-- ============================================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE uat_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_testers ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tester_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_validation_groups ENABLE ROW LEVEL SECURITY;

-- UAT Cycles: Managers can manage, testers can read their assigned cycles
CREATE POLICY "uat_cycles_select" ON uat_cycles
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
    OR EXISTS (
      SELECT 1 FROM cycle_testers ct
      WHERE ct.cycle_id = uat_cycles.cycle_id
      AND ct.user_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
      AND ct.is_active = true
    )
  );

CREATE POLICY "uat_cycles_insert" ON uat_cycles
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "uat_cycles_update" ON uat_cycles
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
    AND locked_at IS NULL
  );

CREATE POLICY "uat_cycles_delete" ON uat_cycles
  FOR DELETE TO authenticated
  USING (
    get_user_role() IN ('Admin')
    AND locked_at IS NULL
  );

-- Cycle Testers: Managers can manage
CREATE POLICY "cycle_testers_select" ON cycle_testers
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
    OR user_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "cycle_testers_insert" ON cycle_testers
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "cycle_testers_update" ON cycle_testers
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "cycle_testers_delete" ON cycle_testers
  FOR DELETE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

-- Test Patients: Managers can manage, testers can read
CREATE POLICY "test_patients_select" ON test_patients
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "test_patients_insert" ON test_patients
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "test_patients_update" ON test_patients
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "test_patients_delete" ON test_patients
  FOR DELETE TO authenticated
  USING (
    get_user_role() IN ('Admin')
  );

-- Tester Acknowledgments: Testers can create their own, managers can read all
CREATE POLICY "tester_acknowledgments_select" ON tester_acknowledgments
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
    OR user_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "tester_acknowledgments_insert" ON tester_acknowledgments
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
  );

-- Cycle Assignments: Managers can manage, testers can read their own
CREATE POLICY "cycle_assignments_select" ON cycle_assignments
  FOR SELECT TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
    OR EXISTS (
      SELECT 1 FROM test_executions te
      WHERE te.execution_id = cycle_assignments.execution_id
      AND te.assigned_to = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "cycle_assignments_insert" ON cycle_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "cycle_assignments_update" ON cycle_assignments
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "cycle_assignments_delete" ON cycle_assignments
  FOR DELETE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

-- Cross Validation Groups: Managers can manage
CREATE POLICY "cross_validation_groups_select" ON cross_validation_groups
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "cross_validation_groups_insert" ON cross_validation_groups
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

CREATE POLICY "cross_validation_groups_delete" ON cross_validation_groups
  FOR DELETE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager', 'UAT Manager')
  );

-- ============================================================================
-- 9. UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER update_uat_cycles_updated_at
  BEFORE UPDATE ON uat_cycles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_patients_updated_at
  BEFORE UPDATE ON test_patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. HELPER VIEWS FOR UAT TESTER PORTAL
-- ============================================================================

-- View: Cycle summary with tester counts and progress
CREATE OR REPLACE VIEW uat_cycle_summary AS
SELECT
  c.cycle_id,
  c.name,
  c.description,
  c.program_id,
  p.name AS program_name,
  c.status,
  c.distribution_method,
  c.cross_validation_enabled,
  c.cross_validation_percentage,
  c.validators_per_test,
  c.start_date,
  c.end_date,
  c.locked_at,
  c.created_at,
  c.created_by,
  COUNT(DISTINCT ct.user_id) FILTER (WHERE ct.is_active) AS active_testers,
  COUNT(DISTINCT ca.execution_id) AS total_assignments,
  COUNT(DISTINCT ca.execution_id) FILTER (WHERE ca.assignment_type = 'primary') AS primary_assignments,
  COUNT(DISTINCT ca.execution_id) FILTER (WHERE ca.assignment_type = 'cross_validation') AS cv_assignments,
  COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status IN ('passed', 'verified')) AS completed_count,
  COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status = 'failed') AS failed_count,
  COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status = 'blocked') AS blocked_count,
  COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status IN ('assigned', 'in_progress')) AS pending_count
FROM uat_cycles c
LEFT JOIN programs p ON p.program_id = c.program_id
LEFT JOIN cycle_testers ct ON ct.cycle_id = c.cycle_id
LEFT JOIN cycle_assignments ca ON ca.cycle_id = c.cycle_id
LEFT JOIN test_executions te ON te.execution_id = ca.execution_id
GROUP BY c.cycle_id, c.name, c.description, c.program_id, p.name, c.status,
         c.distribution_method, c.cross_validation_enabled, c.cross_validation_percentage,
         c.validators_per_test, c.start_date, c.end_date, c.locked_at, c.created_at, c.created_by;

-- View: Tester's assignments per cycle
CREATE OR REPLACE VIEW tester_cycle_assignments AS
SELECT
  te.execution_id,
  te.test_case_id,
  te.story_id,
  te.assigned_to,
  te.status,
  te.started_at,
  te.completed_at,
  te.test_patient_id,
  ca.cycle_id,
  ca.assignment_type,
  ca.cross_validation_group_id,
  tc.title AS test_case_title,
  tc.description AS test_case_description,
  tc.test_steps,
  tc.preconditions,
  tc.test_data,
  us.title AS story_title,
  tp.patient_name AS test_patient_name,
  tp.mrn AS test_patient_mrn
FROM test_executions te
INNER JOIN cycle_assignments ca ON ca.execution_id = te.execution_id
INNER JOIN test_cases tc ON tc.test_case_id = te.test_case_id
INNER JOIN user_stories us ON us.story_id = te.story_id
LEFT JOIN test_patients tp ON tp.patient_id = te.test_patient_id;

-- View: Cross-validation comparison
CREATE OR REPLACE VIEW cross_validation_comparison AS
SELECT
  cvg.group_id,
  cvg.cycle_id,
  cvg.test_case_id,
  tc.title AS test_case_title,
  te.execution_id,
  te.assigned_to,
  u.name AS tester_name,
  te.status,
  te.step_results,
  te.completed_at,
  te.notes
FROM cross_validation_groups cvg
INNER JOIN cycle_assignments ca ON ca.cross_validation_group_id = cvg.group_id
INNER JOIN test_executions te ON te.execution_id = ca.execution_id
INNER JOIN test_cases tc ON tc.test_case_id = cvg.test_case_id
INNER JOIN users u ON u.user_id = te.assigned_to
ORDER BY cvg.group_id, te.completed_at;

-- View: Tester workload per cycle
CREATE OR REPLACE VIEW cycle_tester_workload AS
SELECT
  ct.cycle_id,
  ct.user_id,
  u.name AS tester_name,
  ct.capacity_weight,
  ct.is_active,
  COUNT(DISTINCT ca.execution_id) AS total_assigned,
  COUNT(DISTINCT ca.execution_id) FILTER (WHERE ca.assignment_type = 'primary') AS primary_assigned,
  COUNT(DISTINCT ca.execution_id) FILTER (WHERE ca.assignment_type = 'cross_validation') AS cv_assigned,
  COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status = 'assigned') AS not_started,
  COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status = 'in_progress') AS in_progress,
  COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status IN ('passed', 'verified')) AS completed,
  COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status = 'failed') AS failed,
  COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status = 'blocked') AS blocked
FROM cycle_testers ct
INNER JOIN users u ON u.user_id = ct.user_id
LEFT JOIN cycle_assignments ca ON ca.cycle_id = ct.cycle_id
LEFT JOIN test_executions te ON te.execution_id = ca.execution_id AND te.assigned_to = ct.user_id
GROUP BY ct.cycle_id, ct.user_id, u.name, ct.capacity_weight, ct.is_active;

-- ============================================================================
-- 11. HELPER FUNCTIONS
-- ============================================================================

-- Function: Check if user has completed acknowledgment for cycle
CREATE OR REPLACE FUNCTION has_cycle_acknowledgment(p_cycle_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tester_acknowledgments
    WHERE cycle_id = p_cycle_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get cross-validation agreement status for a group
CREATE OR REPLACE FUNCTION get_cv_agreement_status(p_group_id UUID)
RETURNS TABLE (
  group_id UUID,
  test_case_id UUID,
  total_testers INTEGER,
  completed_count INTEGER,
  passed_count INTEGER,
  failed_count INTEGER,
  blocked_count INTEGER,
  has_agreement BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cvg.group_id,
    cvg.test_case_id,
    COUNT(DISTINCT te.assigned_to)::INTEGER AS total_testers,
    COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status IN ('passed', 'failed', 'blocked', 'verified'))::INTEGER AS completed_count,
    COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status IN ('passed', 'verified'))::INTEGER AS passed_count,
    COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status = 'failed')::INTEGER AS failed_count,
    COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status = 'blocked')::INTEGER AS blocked_count,
    (
      COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status IN ('passed', 'failed', 'blocked', 'verified')) = COUNT(DISTINCT te.assigned_to)
      AND (
        COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status IN ('passed', 'verified')) = COUNT(DISTINCT te.assigned_to)
        OR COUNT(DISTINCT te.execution_id) FILTER (WHERE te.status = 'failed') = COUNT(DISTINCT te.assigned_to)
      )
    ) AS has_agreement
  FROM cross_validation_groups cvg
  INNER JOIN cycle_assignments ca ON ca.cross_validation_group_id = cvg.group_id
  INNER JOIN test_executions te ON te.execution_id = ca.execution_id
  WHERE cvg.group_id = p_group_id
  GROUP BY cvg.group_id, cvg.test_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration complete
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Migration 007 completed successfully!';
END $$;
