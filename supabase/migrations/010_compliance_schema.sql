-- ============================================================================
-- Healthcare Compliance Tracking Schema
-- Migration: 010_compliance_schema.sql
-- Purpose: Create tables, indexes, RLS, triggers for compliance tracking
-- Supports: 21 CFR Part 11, HIPAA, HITRUST, SOC 2
-- ============================================================================

-- Status enum for compliance mappings
CREATE TYPE compliance_status AS ENUM (
  'not_applicable',
  'not_started',
  'planned',
  'in_progress',
  'implemented',
  'verified',
  'deferred'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Master list of compliance frameworks
CREATE TABLE compliance_frameworks (
  framework_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL UNIQUE,  -- CFR11, HIPAA, HITRUST, SOC2
  name VARCHAR(100) NOT NULL,
  description TEXT,
  version VARCHAR(20),               -- e.g., "2024-01" for dated versions
  regulatory_body VARCHAR(100),       -- FDA, HHS, HITRUST Alliance, AICPA
  effective_date DATE,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  metadata JSONB DEFAULT '{}',       -- Additional framework-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual controls within each framework
CREATE TABLE compliance_controls (
  control_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES compliance_frameworks(framework_id) ON DELETE CASCADE,
  control_code VARCHAR(50) NOT NULL,  -- §11.10(a), §164.308(a)(1), etc.
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(100),              -- e.g., "Electronic Records", "Access Control"
  subcategory VARCHAR(100),
  requirement_type VARCHAR(50),       -- required, addressable, recommended
  is_critical BOOLEAN DEFAULT false,  -- Marks critical controls for audits
  applicability_criteria JSONB,       -- For AI suggestion matching
  guidance_notes TEXT,                -- Implementation guidance
  evidence_requirements TEXT,         -- What documentation is needed
  display_order INT DEFAULT 0,
  parent_control_id UUID REFERENCES compliance_controls(control_id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(framework_id, control_code)
);

-- Many-to-many: stories ↔ controls with status tracking
CREATE TABLE story_compliance_mappings (
  mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id VARCHAR(50) NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES compliance_controls(control_id) ON DELETE CASCADE,
  status compliance_status DEFAULT 'not_started',
  implementation_notes TEXT,
  evidence_links JSONB DEFAULT '[]',  -- Array of {url, description, uploaded_at}
  target_date DATE,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES users(user_id),
  verification_notes TEXT,
  risk_assessment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(user_id),
  UNIQUE(story_id, control_id)
);

-- Immutable audit trail (FDA Part 11 compliant)
-- This table is INSERT-ONLY - no updates or deletes allowed
CREATE TABLE compliance_mapping_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mapping_id UUID NOT NULL,  -- No FK - mapping may be deleted
  story_id VARCHAR(50) NOT NULL,
  control_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,  -- created, updated, verified, deleted
  previous_status compliance_status,
  new_status compliance_status,
  previous_data JSONB,
  new_data JSONB,
  change_reason TEXT,
  changed_by UUID NOT NULL,
  changed_by_name VARCHAR(100),  -- Denormalized for audit reports
  changed_by_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Which frameworks apply to each program
CREATE TABLE program_compliance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,
  framework_id UUID NOT NULL REFERENCES compliance_frameworks(framework_id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  effective_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(user_id),
  UNIQUE(program_id, framework_id)
);

-- Generated audit reports for archival
CREATE TABLE compliance_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(program_id),
  framework_id UUID REFERENCES compliance_frameworks(framework_id),
  report_type VARCHAR(50) NOT NULL,  -- summary, detail, gap_analysis, audit_package
  title VARCHAR(200) NOT NULL,
  description TEXT,
  report_data JSONB NOT NULL,        -- Full report content
  file_url TEXT,                     -- If exported to file storage
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID NOT NULL REFERENCES users(user_id),
  parameters JSONB,                  -- Filters/options used to generate
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES users(user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Framework lookups
CREATE INDEX idx_compliance_frameworks_code ON compliance_frameworks(code);
CREATE INDEX idx_compliance_frameworks_active ON compliance_frameworks(is_active) WHERE is_active = true;

-- Control lookups
CREATE INDEX idx_compliance_controls_framework ON compliance_controls(framework_id);
CREATE INDEX idx_compliance_controls_code ON compliance_controls(control_code);
CREATE INDEX idx_compliance_controls_category ON compliance_controls(category);
CREATE INDEX idx_compliance_controls_critical ON compliance_controls(is_critical) WHERE is_critical = true;
CREATE INDEX idx_compliance_controls_parent ON compliance_controls(parent_control_id) WHERE parent_control_id IS NOT NULL;

-- Mapping lookups
CREATE INDEX idx_story_compliance_story ON story_compliance_mappings(story_id);
CREATE INDEX idx_story_compliance_control ON story_compliance_mappings(control_id);
CREATE INDEX idx_story_compliance_status ON story_compliance_mappings(status);
CREATE INDEX idx_story_compliance_verified ON story_compliance_mappings(verified_at) WHERE verified_at IS NOT NULL;

-- History lookups (critical for audits)
CREATE INDEX idx_compliance_history_mapping ON compliance_mapping_history(mapping_id);
CREATE INDEX idx_compliance_history_story ON compliance_mapping_history(story_id);
CREATE INDEX idx_compliance_history_control ON compliance_mapping_history(control_id);
CREATE INDEX idx_compliance_history_date ON compliance_mapping_history(created_at);
CREATE INDEX idx_compliance_history_user ON compliance_mapping_history(changed_by);
CREATE INDEX idx_compliance_history_action ON compliance_mapping_history(action);

-- Program settings
CREATE INDEX idx_program_compliance_program ON program_compliance_settings(program_id);
CREATE INDEX idx_program_compliance_framework ON program_compliance_settings(framework_id);

-- Reports
CREATE INDEX idx_compliance_reports_program ON compliance_reports(program_id);
CREATE INDEX idx_compliance_reports_framework ON compliance_reports(framework_id);
CREATE INDEX idx_compliance_reports_type ON compliance_reports(report_type);
CREATE INDEX idx_compliance_reports_date ON compliance_reports(generated_at);

-- ============================================================================
-- AUDIT TRAIL TRIGGER
-- Auto-logs all mapping changes to history table
-- ============================================================================

CREATE OR REPLACE FUNCTION log_compliance_mapping_change()
RETURNS TRIGGER AS $$
DECLARE
  v_user_name VARCHAR(100);
  v_user_email VARCHAR(255);
  v_action VARCHAR(20);
BEGIN
  -- Get user details for denormalization
  SELECT name, email INTO v_user_name, v_user_email
  FROM users
  WHERE user_id = COALESCE(NEW.created_by, OLD.created_by);

  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    v_action := 'created';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := CASE
      WHEN NEW.verified_at IS NOT NULL AND OLD.verified_at IS NULL THEN 'verified'
      ELSE 'updated'
    END;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'deleted';
  END IF;

  -- Insert history record
  INSERT INTO compliance_mapping_history (
    mapping_id,
    story_id,
    control_id,
    action,
    previous_status,
    new_status,
    previous_data,
    new_data,
    changed_by,
    changed_by_name,
    changed_by_email,
    ip_address,
    session_id
  ) VALUES (
    COALESCE(NEW.mapping_id, OLD.mapping_id),
    COALESCE(NEW.story_id, OLD.story_id),
    COALESCE(NEW.control_id, OLD.control_id),
    v_action,
    CASE WHEN TG_OP != 'INSERT' THEN OLD.status END,
    CASE WHEN TG_OP != 'DELETE' THEN NEW.status END,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    COALESCE(NEW.created_by, OLD.created_by, '00000000-0000-0000-0000-000000000000'::uuid),
    v_user_name,
    v_user_email,
    inet_client_addr(),
    current_setting('app.session_id', true)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for all operations
CREATE TRIGGER trg_compliance_mapping_audit
  AFTER INSERT OR UPDATE OR DELETE ON story_compliance_mappings
  FOR EACH ROW EXECUTE FUNCTION log_compliance_mapping_change();

-- ============================================================================
-- PREVENT HISTORY MODIFICATIONS (Part 11 Compliance)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_history_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Compliance history records cannot be modified or deleted (FDA 21 CFR Part 11 compliance)';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_history_update
  BEFORE UPDATE OR DELETE ON compliance_mapping_history
  FOR EACH ROW EXECUTE FUNCTION prevent_history_modification();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Compliance Matrix: Stories × Controls with status
CREATE OR REPLACE VIEW compliance_matrix AS
SELECT
  us.story_id,
  us.title AS story_title,
  us.program_id,
  p.name AS program_name,
  us.status AS story_status,
  us.category AS story_category,
  cf.framework_id,
  cf.code AS framework_code,
  cf.name AS framework_name,
  cc.control_id,
  cc.control_code,
  cc.title AS control_title,
  cc.category AS control_category,
  cc.is_critical,
  scm.mapping_id,
  scm.status AS compliance_status,
  scm.verified_at,
  scm.verified_by,
  scm.target_date,
  scm.created_at AS mapping_created_at
FROM user_stories us
CROSS JOIN compliance_controls cc
JOIN compliance_frameworks cf ON cc.framework_id = cf.framework_id
LEFT JOIN programs p ON us.program_id::uuid = p.program_id
LEFT JOIN story_compliance_mappings scm ON us.story_id = scm.story_id AND cc.control_id = scm.control_id
WHERE us.deleted_at IS NULL
  AND cf.is_active = true
  AND cc.is_active = true;

-- Summary by framework for dashboard
CREATE OR REPLACE VIEW compliance_summary_by_framework AS
SELECT
  cf.framework_id,
  cf.code AS framework_code,
  cf.name AS framework_name,
  COUNT(DISTINCT cc.control_id) AS total_controls,
  COUNT(DISTINCT CASE WHEN cc.is_critical THEN cc.control_id END) AS critical_controls,
  COUNT(DISTINCT scm.mapping_id) AS mapped_count,
  COUNT(DISTINCT CASE WHEN scm.status = 'verified' THEN scm.mapping_id END) AS verified_count,
  COUNT(DISTINCT CASE WHEN scm.status = 'implemented' THEN scm.mapping_id END) AS implemented_count,
  COUNT(DISTINCT CASE WHEN scm.status = 'in_progress' THEN scm.mapping_id END) AS in_progress_count,
  COUNT(DISTINCT CASE WHEN scm.status = 'not_started' THEN scm.mapping_id END) AS not_started_count,
  COUNT(DISTINCT CASE WHEN scm.status = 'deferred' THEN scm.mapping_id END) AS deferred_count,
  COUNT(DISTINCT CASE WHEN scm.status = 'not_applicable' THEN scm.mapping_id END) AS not_applicable_count
FROM compliance_frameworks cf
LEFT JOIN compliance_controls cc ON cf.framework_id = cc.framework_id AND cc.is_active = true
LEFT JOIN story_compliance_mappings scm ON cc.control_id = scm.control_id
WHERE cf.is_active = true
GROUP BY cf.framework_id, cf.code, cf.name;

-- Gap analysis: Controls without implementation
CREATE OR REPLACE VIEW compliance_gap_analysis AS
SELECT
  cf.framework_id,
  cf.code AS framework_code,
  cf.name AS framework_name,
  cc.control_id,
  cc.control_code,
  cc.title AS control_title,
  cc.category,
  cc.is_critical,
  cc.requirement_type,
  COALESCE(mapping_stats.total_stories, 0) AS stories_count,
  COALESCE(mapping_stats.verified_count, 0) AS verified_count,
  COALESCE(mapping_stats.implemented_count, 0) AS implemented_count,
  CASE
    WHEN COALESCE(mapping_stats.verified_count, 0) = 0
         AND COALESCE(mapping_stats.implemented_count, 0) = 0
    THEN true
    ELSE false
  END AS has_gap
FROM compliance_frameworks cf
JOIN compliance_controls cc ON cf.framework_id = cc.framework_id
LEFT JOIN (
  SELECT
    control_id,
    COUNT(*) AS total_stories,
    COUNT(*) FILTER (WHERE status = 'verified') AS verified_count,
    COUNT(*) FILTER (WHERE status = 'implemented') AS implemented_count
  FROM story_compliance_mappings
  GROUP BY control_id
) mapping_stats ON cc.control_id = mapping_stats.control_id
WHERE cf.is_active = true
  AND cc.is_active = true
ORDER BY cf.display_order, cc.display_order;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE compliance_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_compliance_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_mapping_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_compliance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- Frameworks: Read by all authenticated, write by Admin/PM
CREATE POLICY "compliance_frameworks_select" ON compliance_frameworks
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "compliance_frameworks_insert" ON compliance_frameworks
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('Admin', 'Portfolio Manager'));

CREATE POLICY "compliance_frameworks_update" ON compliance_frameworks
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('Admin', 'Portfolio Manager'));

-- Controls: Read by all authenticated, write by Admin/PM
CREATE POLICY "compliance_controls_select" ON compliance_controls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "compliance_controls_insert" ON compliance_controls
  FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('Admin', 'Portfolio Manager'));

CREATE POLICY "compliance_controls_update" ON compliance_controls
  FOR UPDATE TO authenticated
  USING (get_user_role() IN ('Admin', 'Portfolio Manager'));

-- Mappings: Based on story access
CREATE POLICY "compliance_mappings_select" ON story_compliance_mappings
  FOR SELECT TO authenticated
  USING (
    can_access_story(story_id)
  );

CREATE POLICY "compliance_mappings_insert" ON story_compliance_mappings
  FOR INSERT TO authenticated
  WITH CHECK (
    can_access_story(story_id)
    AND get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager')
  );

CREATE POLICY "compliance_mappings_update" ON story_compliance_mappings
  FOR UPDATE TO authenticated
  USING (
    can_access_story(story_id)
    AND get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager')
  );

CREATE POLICY "compliance_mappings_delete" ON story_compliance_mappings
  FOR DELETE TO authenticated
  USING (
    can_access_story(story_id)
    AND get_user_role() IN ('Admin', 'Portfolio Manager')
  );

-- History: Read-only access based on story access
CREATE POLICY "compliance_history_select" ON compliance_mapping_history
  FOR SELECT TO authenticated
  USING (
    can_access_story(story_id)
  );

-- No INSERT/UPDATE/DELETE policies for history (triggers handle inserts, modifications blocked)

-- Program settings: Based on program access
CREATE POLICY "program_compliance_select" ON program_compliance_settings
  FOR SELECT TO authenticated
  USING (
    program_id::text = ANY(get_user_programs())
    OR get_user_role() IN ('Admin', 'Portfolio Manager')
  );

CREATE POLICY "program_compliance_insert" ON program_compliance_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager')
  );

CREATE POLICY "program_compliance_update" ON program_compliance_settings
  FOR UPDATE TO authenticated
  USING (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager')
  );

-- Reports: Based on program access
CREATE POLICY "compliance_reports_select" ON compliance_reports
  FOR SELECT TO authenticated
  USING (
    program_id IS NULL
    OR program_id::text = ANY(get_user_programs())
    OR get_user_role() IN ('Admin', 'Portfolio Manager')
  );

CREATE POLICY "compliance_reports_insert" ON compliance_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager')
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get compliance summary for a program
CREATE OR REPLACE FUNCTION get_compliance_summary(p_program_id UUID DEFAULT NULL)
RETURNS TABLE (
  framework_code VARCHAR,
  framework_name VARCHAR,
  total_controls BIGINT,
  critical_controls BIGINT,
  stories_mapped BIGINT,
  verified_count BIGINT,
  implemented_count BIGINT,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cf.code::VARCHAR AS framework_code,
    cf.name::VARCHAR AS framework_name,
    COUNT(DISTINCT cc.control_id) AS total_controls,
    COUNT(DISTINCT CASE WHEN cc.is_critical THEN cc.control_id END) AS critical_controls,
    COUNT(DISTINCT scm.story_id) AS stories_mapped,
    COUNT(DISTINCT CASE WHEN scm.status = 'verified' THEN scm.mapping_id END) AS verified_count,
    COUNT(DISTINCT CASE WHEN scm.status = 'implemented' THEN scm.mapping_id END) AS implemented_count,
    CASE
      WHEN COUNT(DISTINCT cc.control_id) = 0 THEN 0
      ELSE ROUND(
        (COUNT(DISTINCT CASE WHEN scm.status IN ('verified', 'implemented') THEN scm.mapping_id END)::NUMERIC /
         COUNT(DISTINCT cc.control_id)::NUMERIC) * 100,
        1
      )
    END AS completion_percentage
  FROM compliance_frameworks cf
  LEFT JOIN compliance_controls cc ON cf.framework_id = cc.framework_id AND cc.is_active = true
  LEFT JOIN story_compliance_mappings scm ON cc.control_id = scm.control_id
  LEFT JOIN user_stories us ON scm.story_id = us.story_id AND us.deleted_at IS NULL
  WHERE cf.is_active = true
    AND (p_program_id IS NULL OR us.program_id::uuid = p_program_id)
  GROUP BY cf.framework_id, cf.code, cf.name
  ORDER BY cf.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log compliance activity (wrapper for activity_log)
CREATE OR REPLACE FUNCTION log_compliance_activity(
  p_activity_type TEXT,
  p_user_id UUID,
  p_story_id VARCHAR DEFAULT NULL,
  p_mapping_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_log (
    activity_type,
    user_id,
    story_id,
    metadata
  ) VALUES (
    p_activity_type::activity_type,
    p_user_id::text,
    p_story_id,
    p_metadata || jsonb_build_object('mapping_id', p_mapping_id)
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
EXCEPTION
  WHEN others THEN
    -- Activity type may not exist in enum, skip logging
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE TRIGGER set_compliance_frameworks_updated_at
  BEFORE UPDATE ON compliance_frameworks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_compliance_controls_updated_at
  BEFORE UPDATE ON compliance_controls
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_story_compliance_mappings_updated_at
  BEFORE UPDATE ON story_compliance_mappings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_program_compliance_settings_updated_at
  BEFORE UPDATE ON program_compliance_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
