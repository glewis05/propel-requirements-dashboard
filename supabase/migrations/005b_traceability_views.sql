-- Migration 005b v2: Traceability mapping table and views
-- Run this AFTER 005a_fix_requirements_table_v3.sql

-- ============================================
-- MAPPING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS requirement_story_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
  coverage_type TEXT DEFAULT 'full' CHECK (coverage_type IN ('full', 'partial', 'derived')),
  coverage_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT REFERENCES users(user_id),
  UNIQUE(requirement_id, story_id)
);

-- ============================================
-- INDEXES (only create if column exists)
-- ============================================

DO $$
BEGIN
  -- Index on program_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requirements' AND column_name = 'program_id') THEN
    CREATE INDEX IF NOT EXISTS idx_requirements_program ON requirements(program_id);
  END IF;

  -- Index on status
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requirements' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements(status);
  END IF;

  -- Index on category
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requirements' AND column_name = 'category') THEN
    CREATE INDEX IF NOT EXISTS idx_requirements_category ON requirements(category);
  END IF;

  -- Index on requirement_id
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'requirements' AND column_name = 'requirement_id') THEN
    CREATE INDEX IF NOT EXISTS idx_requirements_requirement_id ON requirements(requirement_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_req_story_mapping_requirement ON requirement_story_mapping(requirement_id);
CREATE INDEX IF NOT EXISTS idx_req_story_mapping_story ON requirement_story_mapping(story_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_story_mapping ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read requirements" ON requirements;
DROP POLICY IF EXISTS "Admins and Portfolio Managers can manage requirements" ON requirements;
DROP POLICY IF EXISTS "Authenticated users can read requirement mappings" ON requirement_story_mapping;
DROP POLICY IF EXISTS "Users can manage requirement mappings for accessible stories" ON requirement_story_mapping;

CREATE POLICY "Authenticated users can read requirements"
  ON requirements FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and Portfolio Managers can manage requirements"
  ON requirements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('Admin', 'Portfolio Manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('Admin', 'Portfolio Manager')));

CREATE POLICY "Authenticated users can read requirement mappings"
  ON requirement_story_mapping FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage requirement mappings for accessible stories"
  ON requirement_story_mapping FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_stories s ON s.story_id = requirement_story_mapping.story_id
      WHERE u.auth_id = auth.uid()
      AND (u.role IN ('Admin', 'Portfolio Manager') OR s.program_id = ANY(u.assigned_programs))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN user_stories s ON s.story_id = requirement_story_mapping.story_id
      WHERE u.auth_id = auth.uid()
      AND (u.role IN ('Admin', 'Portfolio Manager') OR s.program_id = ANY(u.assigned_programs))
    )
  );

-- ============================================
-- VIEWS (use COALESCE for potentially missing columns)
-- ============================================

CREATE OR REPLACE VIEW traceability_matrix AS
SELECT
  r.id as requirement_uuid,
  r.requirement_id,
  r.dis_number,
  r.title as requirement_title,
  r.category as requirement_category,
  r.priority as requirement_priority,
  r.status as requirement_status,
  r.program_id,
  p.name as program_name,
  s.story_id,
  s.title as story_title,
  s.status as story_status,
  s.priority as story_priority,
  m.coverage_type,
  m.coverage_notes,
  CASE
    WHEN m.id IS NULL THEN 'Not Covered'
    WHEN s.status IN ('Approved', 'In Development', 'In UAT') THEN 'In Progress'
    WHEN s.status = 'Approved' AND s.stakeholder_approved_at IS NOT NULL THEN 'Verified'
    ELSE 'Mapped'
  END as coverage_status
FROM requirements r
LEFT JOIN programs p ON r.program_id = p.program_id
LEFT JOIN requirement_story_mapping m ON r.id = m.requirement_id
LEFT JOIN user_stories s ON m.story_id = s.story_id
ORDER BY r.program_id, r.requirement_id;

CREATE OR REPLACE VIEW requirement_coverage_summary AS
SELECT
  r.program_id,
  p.name as program_name,
  COUNT(DISTINCT r.id) as total_requirements,
  COUNT(DISTINCT CASE WHEN m.id IS NOT NULL THEN r.id END) as covered_requirements,
  COUNT(DISTINCT CASE WHEN m.id IS NULL THEN r.id END) as uncovered_requirements,
  COUNT(DISTINCT CASE WHEN r.is_critical AND m.id IS NULL THEN r.id END) as uncovered_critical,
  ROUND(
    COUNT(DISTINCT CASE WHEN m.id IS NOT NULL THEN r.id END)::NUMERIC /
    NULLIF(COUNT(DISTINCT r.id), 0) * 100, 1
  ) as coverage_percentage
FROM requirements r
LEFT JOIN programs p ON r.program_id = p.program_id
LEFT JOIN requirement_story_mapping m ON r.id = m.requirement_id
GROUP BY r.program_id, p.name;

CREATE OR REPLACE VIEW story_coverage AS
SELECT
  s.story_id,
  s.title,
  s.program_id,
  p.name as program_name,
  s.status,
  s.priority,
  CASE
    WHEN m.id IS NOT NULL THEN TRUE
    WHEN s.requirement_id IS NOT NULL THEN TRUE
    ELSE FALSE
  END as has_requirement,
  COALESCE(r.requirement_id, s.requirement_id) as linked_requirement_id
FROM user_stories s
LEFT JOIN programs p ON s.program_id = p.program_id
LEFT JOIN requirement_story_mapping m ON s.story_id = m.story_id
LEFT JOIN requirements r ON m.requirement_id = r.id
ORDER BY s.program_id, s.story_id;

-- ============================================
-- TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS requirements_updated_at ON requirements;
CREATE TRIGGER requirements_updated_at
  BEFORE UPDATE ON requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_requirements_updated_at();

-- Done!
SELECT 'Migration 005b complete!' as status;
