-- ============================================================================
-- Healthcare Compliance Controls Seed Data
-- Migration: 010b_compliance_controls_seed.sql
-- Purpose: Seed 21 CFR Part 11 and HIPAA controls
-- ============================================================================

-- ============================================================================
-- COMPLIANCE FRAMEWORKS
-- ============================================================================

INSERT INTO compliance_frameworks (code, name, description, version, regulatory_body, effective_date, display_order, metadata)
VALUES
  (
    'CFR11',
    '21 CFR Part 11',
    'FDA regulations on electronic records and electronic signatures. Establishes criteria for acceptance of electronic records, electronic signatures, and handwritten signatures executed to electronic records.',
    '2024-01',
    'FDA (Food and Drug Administration)',
    '1997-03-20',
    1,
    '{"scope": "Electronic Records, Electronic Signatures", "industry": "Pharmaceutical, Medical Devices, Biologics", "enforcement_level": "mandatory"}'
  ),
  (
    'HIPAA',
    'HIPAA Security Rule',
    'Health Insurance Portability and Accountability Act Security Rule. Establishes national standards to protect individuals'' electronic personal health information.',
    '2024-01',
    'HHS (Department of Health and Human Services)',
    '2003-04-14',
    2,
    '{"scope": "Protected Health Information (PHI)", "industry": "Healthcare, Health Insurance", "enforcement_level": "mandatory"}'
  ),
  (
    'HITRUST',
    'HITRUST CSF',
    'HITRUST Common Security Framework. A certifiable framework that provides organizations with a comprehensive, flexible and efficient approach to regulatory compliance and risk management.',
    'v11.2',
    'HITRUST Alliance',
    '2024-01-01',
    3,
    '{"scope": "Information Security", "industry": "Healthcare, Financial Services", "enforcement_level": "voluntary_certification"}'
  ),
  (
    'SOC2',
    'SOC 2 Type II',
    'Service Organization Control 2. Trust Services Criteria for security, availability, processing integrity, confidentiality, and privacy.',
    '2017',
    'AICPA (American Institute of CPAs)',
    '2017-01-01',
    4,
    '{"scope": "Service Organizations", "industry": "Technology, SaaS, Cloud Services", "enforcement_level": "voluntary_audit"}'
  )
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  regulatory_body = EXCLUDED.regulatory_body,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================================================
-- 21 CFR PART 11 CONTROLS
-- ============================================================================

-- Get the framework_id for CFR11
WITH cfr11 AS (
  SELECT framework_id FROM compliance_frameworks WHERE code = 'CFR11'
)
INSERT INTO compliance_controls (framework_id, control_code, title, description, category, subcategory, requirement_type, is_critical, applicability_criteria, guidance_notes, evidence_requirements, display_order)
SELECT
  cfr11.framework_id,
  v.control_code,
  v.title,
  v.description,
  v.category,
  v.subcategory,
  v.requirement_type,
  v.is_critical,
  v.applicability_criteria::jsonb,
  v.guidance_notes,
  v.evidence_requirements,
  v.display_order
FROM cfr11, (VALUES
  -- Subpart B - Electronic Records
  ('§11.10(a)', 'System Validation', 'Validation of systems to ensure accuracy, reliability, consistent intended performance, and the ability to discern invalid or altered records.', 'Electronic Records', 'Controls for Closed Systems', 'required', true,
   '{"categories": ["System", "Compliance", "Security"], "keywords": ["validation", "IQ", "OQ", "PQ", "testing", "verification"]}',
   'Requires documented validation protocols (IQ, OQ, PQ), test scripts, traceability matrix, and validation summary reports.',
   'Validation Master Plan, IQ/OQ/PQ protocols, executed test scripts, deviation reports, validation summary report',
   1),

  ('§11.10(b)', 'Legible Record Copies', 'The ability to generate accurate and complete copies of records in both human readable and electronic form suitable for inspection, review, and copying by the agency.', 'Electronic Records', 'Controls for Closed Systems', 'required', false,
   '{"categories": ["Functional", "Compliance"], "keywords": ["export", "report", "print", "PDF", "copy"]}',
   'System must be able to produce complete, accurate copies of electronic records in both electronic (e.g., PDF) and paper formats.',
   'Export functionality documentation, sample exports demonstrating completeness and accuracy',
   2),

  ('§11.10(c)', 'Record Protection', 'Protection of records to enable their accurate and ready retrieval throughout the records retention period.', 'Electronic Records', 'Controls for Closed Systems', 'required', true,
   '{"categories": ["Security", "System", "Non-Functional"], "keywords": ["backup", "retention", "archive", "storage", "disaster recovery"]}',
   'Implement backup procedures, disaster recovery plans, and data retention policies that ensure records are protected and retrievable.',
   'Backup procedures, disaster recovery plan, retention policy, backup verification logs, restoration test results',
   3),

  ('§11.10(d)', 'System Access Control', 'Limiting system access to authorized individuals.', 'Electronic Records', 'Controls for Closed Systems', 'required', true,
   '{"categories": ["Security", "Access Control"], "keywords": ["authentication", "authorization", "access control", "user management", "roles"]}',
   'Implement role-based access control (RBAC), user provisioning/deprovisioning procedures, and access reviews.',
   'User access matrix, role definitions, access provisioning procedures, periodic access reviews',
   4),

  ('§11.10(e)', 'Audit Trail', 'Use of secure, computer-generated, time-stamped audit trails to independently record the date and time of operator entries and actions that create, modify, or delete electronic records.', 'Electronic Records', 'Controls for Closed Systems', 'required', true,
   '{"categories": ["Security", "Compliance", "System"], "keywords": ["audit", "trail", "log", "history", "tracking", "timestamp"]}',
   'CRITICAL CONTROL: Audit trails must be secure, computer-generated, time-stamped, and capture who, what, when. Changes must not obscure previously recorded information.',
   'Audit trail configuration, sample audit logs, evidence that trails cannot be modified, retention of audit records',
   5),

  ('§11.10(f)', 'Operational System Checks', 'Use of operational system checks to enforce permitted sequencing of steps and events, as appropriate.', 'Electronic Records', 'Controls for Closed Systems', 'required', false,
   '{"categories": ["Functional", "System"], "keywords": ["workflow", "sequence", "steps", "validation", "state machine"]}',
   'Implement workflow controls that enforce proper sequencing of operations where required by the process.',
   'Workflow documentation, sequence enforcement test results',
   6),

  ('§11.10(g)', 'Authority Checks', 'Use of authority checks to ensure that only authorized individuals can use the system, electronically sign a record, access the operation or computer system input or output device, alter a record, or perform the operation at hand.', 'Electronic Records', 'Controls for Closed Systems', 'required', true,
   '{"categories": ["Security", "Access Control"], "keywords": ["authorization", "permissions", "privileges", "RBAC"]}',
   'Implement granular authorization controls that restrict actions based on user role and privileges.',
   'Authorization matrix, role permission documentation, authorization test results',
   7),

  ('§11.10(h)', 'Device Checks', 'Use of device (e.g., terminal) checks to determine, as appropriate, the validity of the source of data input or operational instruction.', 'Electronic Records', 'Controls for Closed Systems', 'addressable', false,
   '{"categories": ["Security", "System"], "keywords": ["device", "terminal", "input validation", "source verification"]}',
   'Where applicable, implement device identification and validation for data input sources.',
   'Device validation procedures (if applicable)',
   8),

  ('§11.10(i)', 'Training', 'Determination that persons who develop, maintain, or use electronic record/electronic signature systems have the education, training, and experience to perform their assigned tasks.', 'Electronic Records', 'Controls for Closed Systems', 'required', false,
   '{"categories": ["Compliance", "Usability"], "keywords": ["training", "education", "qualification", "competency"]}',
   'Establish training programs and maintain training records for all personnel involved with the system.',
   'Training curriculum, training records, competency assessments',
   9),

  ('§11.10(j)', 'Written Policies', 'The establishment of, and adherence to, written policies that hold individuals accountable and responsible for actions initiated under their electronic signatures.', 'Electronic Records', 'Controls for Closed Systems', 'required', false,
   '{"categories": ["Compliance"], "keywords": ["policy", "procedure", "SOP", "accountability"]}',
   'Develop and maintain written policies establishing accountability for electronic signature use.',
   'Electronic signature policy, acknowledgment forms, policy review records',
   10),

  ('§11.10(k)(1)', 'Documentation Controls - Distribution', 'Appropriate controls over the distribution of, access to, and use of documentation for system operation and maintenance.', 'Electronic Records', 'Controls for Closed Systems', 'required', false,
   '{"categories": ["Compliance", "System"], "keywords": ["documentation", "SOP", "distribution", "version control"]}',
   'Implement document control procedures ensuring proper distribution and access to system documentation.',
   'Document control procedures, distribution lists, access logs',
   11),

  ('§11.10(k)(2)', 'Documentation Controls - Revision', 'Revision and change control procedures to maintain an audit trail that documents time-sequenced development and modification of systems documentation.', 'Electronic Records', 'Controls for Closed Systems', 'required', false,
   '{"categories": ["Compliance", "System"], "keywords": ["change control", "revision", "version", "document history"]}',
   'Maintain version control and change history for all system documentation.',
   'Document revision history, change control records',
   12),

  -- Subpart B - Signature Manifestations
  ('§11.50(a)', 'Signature Manifestation - Name', 'Signed electronic records shall contain information associated with the signing that clearly indicates the printed name of the signer.', 'Electronic Signatures', 'Signature Manifestations', 'required', true,
   '{"categories": ["Compliance", "Security"], "keywords": ["signature", "name", "identity", "signing"]}',
   'Electronic signatures must display the printed name of the signer.',
   'Signature display configuration, sample signed records showing name',
   13),

  ('§11.50(a)', 'Signature Manifestation - Date/Time', 'Signed electronic records shall contain information associated with the signing that clearly indicates the date and time when the signature was executed.', 'Electronic Signatures', 'Signature Manifestations', 'required', true,
   '{"categories": ["Compliance", "Security"], "keywords": ["signature", "timestamp", "date", "time"]}',
   'Electronic signatures must display the date and time of signing.',
   'Signature display configuration, sample signed records showing timestamp',
   14),

  ('§11.50(a)', 'Signature Manifestation - Meaning', 'Signed electronic records shall contain information associated with the signing that clearly indicates the meaning associated with the signature (such as review, approval, responsibility, or authorship).', 'Electronic Signatures', 'Signature Manifestations', 'required', true,
   '{"categories": ["Compliance", "Security"], "keywords": ["signature", "meaning", "purpose", "approval", "review"]}',
   'Electronic signatures must indicate the meaning/purpose of the signature (e.g., "Approved", "Reviewed", "Authored").',
   'Signature meaning configuration, sample signed records showing meaning',
   15),

  ('§11.70', 'Signature/Record Linking', 'Electronic signatures and handwritten signatures executed to electronic records shall be linked to their respective electronic records to ensure that the signatures cannot be excised, copied, or otherwise transferred to falsify an electronic record by ordinary means.', 'Electronic Signatures', 'Signature/Record Linking', 'required', true,
   '{"categories": ["Security", "Compliance"], "keywords": ["signature", "linking", "binding", "integrity", "tamper"]}',
   'Signatures must be cryptographically or otherwise securely linked to records to prevent separation or falsification.',
   'Signature linking mechanism documentation, integrity verification test results',
   16),

  -- Subpart C - Electronic Signatures
  ('§11.100(a)', 'Signature Uniqueness', 'Each electronic signature shall be unique to one individual and shall not be reused by, or reassigned to, anyone else.', 'Electronic Signatures', 'General Requirements', 'required', true,
   '{"categories": ["Security", "Compliance"], "keywords": ["unique", "individual", "identity", "user ID"]}',
   'Electronic signature credentials must be unique per individual and never shared or reassigned.',
   'User ID management procedures, evidence of uniqueness enforcement',
   17),

  ('§11.100(b)', 'Identity Verification', 'Before an organization establishes, assigns, certifies, or otherwise sanctions an individual''s electronic signature, or any element of such electronic signature, the organization shall verify the identity of the individual.', 'Electronic Signatures', 'General Requirements', 'required', false,
   '{"categories": ["Security", "Compliance"], "keywords": ["identity", "verification", "onboarding", "provisioning"]}',
   'Verify user identity before issuing electronic signature credentials.',
   'Identity verification procedures, verification records',
   18),

  ('§11.200(a)(1)', 'Signature Components - Identification', 'Electronic signatures that are not based upon biometrics shall employ at least two distinct identification components such as an identification code and password.', 'Electronic Signatures', 'Electronic Signature Components', 'required', true,
   '{"categories": ["Security", "Compliance"], "keywords": ["authentication", "password", "two-factor", "identification"]}',
   'Non-biometric electronic signatures require at least two components (e.g., user ID + password).',
   'Authentication configuration, evidence of two-component requirement',
   19),

  ('§11.200(a)(2)', 'Continuous Session Signatures', 'When an individual executes a series of signings during a single, continuous period of controlled system access, the first signing shall be executed using all electronic signature components; subsequent signings shall be executed using at least one electronic signature component.', 'Electronic Signatures', 'Electronic Signature Components', 'required', false,
   '{"categories": ["Security", "Compliance"], "keywords": ["session", "continuous", "re-authentication"]}',
   'First signature in a session requires full authentication; subsequent signatures may use reduced authentication.',
   'Session management documentation, re-authentication configuration',
   20),

  ('§11.300(a)', 'Password Uniqueness', 'Persons who use electronic signatures based upon use of identification codes in combination with passwords shall employ controls to ensure their uniqueness.', 'Electronic Signatures', 'Controls for ID Codes/Passwords', 'required', false,
   '{"categories": ["Security"], "keywords": ["password", "unique", "policy"]}',
   'Enforce password uniqueness through password history and complexity requirements.',
   'Password policy, password history configuration',
   21),

  ('§11.300(b)', 'Password Confidentiality', 'Ensuring that identification code and password issuances are periodically checked, recalled, or revised.', 'Electronic Signatures', 'Controls for ID Codes/Passwords', 'required', false,
   '{"categories": ["Security"], "keywords": ["password", "expiration", "rotation", "review"]}',
   'Implement periodic password changes and credential reviews.',
   'Password expiration policy, credential review records',
   22),

  ('§11.300(d)', 'Unauthorized Use Detection', 'Use of transaction safeguards to prevent unauthorized use of passwords and/or identification codes, and to detect and report in an immediate and urgent manner any attempts at their unauthorized use to the system security unit.', 'Electronic Signatures', 'Controls for ID Codes/Passwords', 'required', true,
   '{"categories": ["Security"], "keywords": ["intrusion", "detection", "monitoring", "alert", "unauthorized"]}',
   'Implement monitoring and alerting for unauthorized access attempts.',
   'Security monitoring configuration, alert procedures, sample alerts',
   23)
) AS v(control_code, title, description, category, subcategory, requirement_type, is_critical, applicability_criteria, guidance_notes, evidence_requirements, display_order)
ON CONFLICT (framework_id, control_code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  requirement_type = EXCLUDED.requirement_type,
  is_critical = EXCLUDED.is_critical,
  applicability_criteria = EXCLUDED.applicability_criteria,
  guidance_notes = EXCLUDED.guidance_notes,
  evidence_requirements = EXCLUDED.evidence_requirements,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================================
-- HIPAA SECURITY RULE CONTROLS
-- ============================================================================

-- Get the framework_id for HIPAA
WITH hipaa AS (
  SELECT framework_id FROM compliance_frameworks WHERE code = 'HIPAA'
)
INSERT INTO compliance_controls (framework_id, control_code, title, description, category, subcategory, requirement_type, is_critical, applicability_criteria, guidance_notes, evidence_requirements, display_order)
SELECT
  hipaa.framework_id,
  v.control_code,
  v.title,
  v.description,
  v.category,
  v.subcategory,
  v.requirement_type,
  v.is_critical,
  v.applicability_criteria::jsonb,
  v.guidance_notes,
  v.evidence_requirements,
  v.display_order
FROM hipaa, (VALUES
  -- Administrative Safeguards
  ('§164.308(a)(1)(i)', 'Security Management Process', 'Implement policies and procedures to prevent, detect, contain, and correct security violations.', 'Administrative Safeguards', 'Security Management Process', 'required', true,
   '{"categories": ["Security", "Compliance"], "keywords": ["security", "policy", "risk", "management"]}',
   'Establish comprehensive security management program including risk analysis, risk management, sanction policy, and information system activity review.',
   'Security policies, risk analysis documentation, sanction policy, activity review procedures',
   1),

  ('§164.308(a)(1)(ii)(A)', 'Risk Analysis', 'Conduct an accurate and thorough assessment of the potential risks and vulnerabilities to the confidentiality, integrity, and availability of electronic protected health information held by the covered entity.', 'Administrative Safeguards', 'Security Management Process', 'required', true,
   '{"categories": ["Security", "Compliance"], "keywords": ["risk", "assessment", "vulnerability", "analysis"]}',
   'Perform periodic risk assessments covering all systems that create, receive, maintain, or transmit ePHI.',
   'Risk assessment methodology, risk assessment reports, vulnerability scans',
   2),

  ('§164.308(a)(1)(ii)(B)', 'Risk Management', 'Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level.', 'Administrative Safeguards', 'Security Management Process', 'required', true,
   '{"categories": ["Security", "Compliance"], "keywords": ["risk", "mitigation", "remediation", "treatment"]}',
   'Develop and implement risk treatment plans addressing identified risks.',
   'Risk treatment plan, remediation tracking, residual risk acceptance',
   3),

  ('§164.308(a)(3)(i)', 'Workforce Security', 'Implement policies and procedures to ensure that all members of its workforce have appropriate access to electronic protected health information.', 'Administrative Safeguards', 'Workforce Security', 'required', false,
   '{"categories": ["Security", "Access Control"], "keywords": ["workforce", "access", "authorization", "clearance"]}',
   'Implement workforce authorization and clearance procedures, and termination procedures.',
   'Authorization procedures, clearance procedures, termination checklist',
   4),

  ('§164.308(a)(4)(i)', 'Information Access Management', 'Implement policies and procedures for authorizing access to electronic protected health information.', 'Administrative Safeguards', 'Information Access Management', 'required', true,
   '{"categories": ["Security", "Access Control"], "keywords": ["access", "authorization", "isolation", "minimum necessary"]}',
   'Implement access authorization, establishment, and modification policies consistent with minimum necessary standard.',
   'Access authorization policy, access request/approval workflow, access modification records',
   5),

  ('§164.308(a)(5)(i)', 'Security Awareness Training', 'Implement a security awareness and training program for all members of its workforce.', 'Administrative Safeguards', 'Security Awareness and Training', 'addressable', false,
   '{"categories": ["Compliance", "Security"], "keywords": ["training", "awareness", "education", "phishing"]}',
   'Provide security awareness training including security reminders, protection from malicious software, log-in monitoring, and password management.',
   'Training curriculum, training records, awareness communications',
   6),

  ('§164.308(a)(6)(i)', 'Security Incident Procedures', 'Implement policies and procedures to address security incidents.', 'Administrative Safeguards', 'Security Incident Procedures', 'required', true,
   '{"categories": ["Security", "Compliance"], "keywords": ["incident", "response", "breach", "reporting"]}',
   'Establish incident response and reporting procedures covering identification, documentation, and mitigation of incidents.',
   'Incident response plan, incident log, post-incident reports',
   7),

  ('§164.308(a)(7)(i)', 'Contingency Plan', 'Establish (and implement as needed) policies and procedures for responding to an emergency or other occurrence that damages systems containing ePHI.', 'Administrative Safeguards', 'Contingency Plan', 'required', true,
   '{"categories": ["Security", "System"], "keywords": ["disaster", "recovery", "backup", "contingency", "BCP"]}',
   'Develop data backup plan, disaster recovery plan, emergency mode operation plan, and testing/revision procedures.',
   'Contingency plan, backup procedures, DR test results, BCP documentation',
   8),

  -- Technical Safeguards
  ('§164.312(a)(1)', 'Access Control', 'Implement technical policies and procedures for electronic information systems that maintain electronic protected health information to allow access only to those persons or software programs that have been granted access rights.', 'Technical Safeguards', 'Access Control', 'required', true,
   '{"categories": ["Security", "Access Control"], "keywords": ["access", "control", "authentication", "RBAC"]}',
   'Implement unique user identification, emergency access procedures, automatic logoff, and encryption/decryption as appropriate.',
   'Access control configuration, user ID procedures, automatic logoff settings, encryption documentation',
   9),

  ('§164.312(a)(2)(i)', 'Unique User Identification', 'Assign a unique name and/or number for identifying and tracking user identity.', 'Technical Safeguards', 'Access Control', 'required', true,
   '{"categories": ["Security", "Access Control"], "keywords": ["user ID", "unique", "identification", "tracking"]}',
   'Each user must have a unique identifier that is never shared or reassigned.',
   'User provisioning procedures, evidence of unique ID enforcement',
   10),

  ('§164.312(a)(2)(iii)', 'Automatic Logoff', 'Implement electronic procedures that terminate an electronic session after a predetermined time of inactivity.', 'Technical Safeguards', 'Access Control', 'addressable', false,
   '{"categories": ["Security"], "keywords": ["session", "timeout", "logoff", "inactivity"]}',
   'Configure automatic session termination after period of inactivity.',
   'Session timeout configuration, timeout testing results',
   11),

  ('§164.312(b)', 'Audit Controls', 'Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use electronic protected health information.', 'Technical Safeguards', 'Audit Controls', 'required', true,
   '{"categories": ["Security", "Compliance"], "keywords": ["audit", "log", "monitoring", "examination"]}',
   'CRITICAL CONTROL: Implement comprehensive audit logging capturing access, modifications, and other activities involving ePHI.',
   'Audit log configuration, sample logs, log review procedures, log retention policy',
   12),

  ('§164.312(c)(1)', 'Integrity Controls', 'Implement policies and procedures to protect electronic protected health information from improper alteration or destruction.', 'Technical Safeguards', 'Integrity', 'required', true,
   '{"categories": ["Security"], "keywords": ["integrity", "tampering", "alteration", "validation"]}',
   'Implement mechanisms to authenticate ePHI and detect unauthorized alterations.',
   'Integrity control mechanisms, validation procedures',
   13),

  ('§164.312(d)', 'Person or Entity Authentication', 'Implement procedures to verify that a person or entity seeking access to electronic protected health information is the one claimed.', 'Technical Safeguards', 'Person or Entity Authentication', 'required', true,
   '{"categories": ["Security", "Access Control"], "keywords": ["authentication", "verification", "identity", "MFA"]}',
   'Implement authentication mechanisms appropriate to the risk (password, token, biometric, etc.).',
   'Authentication configuration, MFA implementation (if applicable)',
   14),

  ('§164.312(e)(1)', 'Transmission Security', 'Implement technical security measures to guard against unauthorized access to electronic protected health information that is being transmitted over an electronic communications network.', 'Technical Safeguards', 'Transmission Security', 'required', true,
   '{"categories": ["Security"], "keywords": ["encryption", "transmission", "TLS", "network", "transit"]}',
   'Implement encryption and integrity controls for ePHI in transit.',
   'Encryption configuration (TLS), network security controls',
   15),

  ('§164.312(e)(2)(ii)', 'Encryption', 'Implement a mechanism to encrypt electronic protected health information whenever deemed appropriate.', 'Technical Safeguards', 'Transmission Security', 'addressable', true,
   '{"categories": ["Security"], "keywords": ["encryption", "at-rest", "AES", "cryptography"]}',
   'Encrypt ePHI at rest and in transit using industry-standard encryption (AES-256, TLS 1.2+).',
   'Encryption standards documentation, encryption configuration',
   16),

  -- Physical Safeguards
  ('§164.310(a)(1)', 'Facility Access Controls', 'Implement policies and procedures to limit physical access to its electronic information systems and the facility or facilities in which they are housed.', 'Physical Safeguards', 'Facility Access Controls', 'required', false,
   '{"categories": ["Security"], "keywords": ["physical", "facility", "access", "datacenter"]}',
   'Implement facility security plan, access control procedures, and maintenance records.',
   'Facility security plan, access control records, maintenance logs',
   17),

  ('§164.310(d)(1)', 'Device and Media Controls', 'Implement policies and procedures that govern the receipt and removal of hardware and electronic media that contain electronic protected health information.', 'Physical Safeguards', 'Device and Media Controls', 'required', false,
   '{"categories": ["Security"], "keywords": ["device", "media", "disposal", "sanitization"]}',
   'Implement media disposal, reuse, accountability, and data backup/storage procedures.',
   'Media handling policy, disposal records, asset inventory',
   18)
) AS v(control_code, title, description, category, subcategory, requirement_type, is_critical, applicability_criteria, guidance_notes, evidence_requirements, display_order)
ON CONFLICT (framework_id, control_code) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  requirement_type = EXCLUDED.requirement_type,
  is_critical = EXCLUDED.is_critical,
  applicability_criteria = EXCLUDED.applicability_criteria,
  guidance_notes = EXCLUDED.guidance_notes,
  evidence_requirements = EXCLUDED.evidence_requirements,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================================
-- VERIFY SEED DATA
-- ============================================================================

DO $$
DECLARE
  v_framework_count INT;
  v_control_count INT;
BEGIN
  SELECT COUNT(*) INTO v_framework_count FROM compliance_frameworks;
  SELECT COUNT(*) INTO v_control_count FROM compliance_controls;

  RAISE NOTICE 'Compliance seed complete: % frameworks, % controls', v_framework_count, v_control_count;
END $$;
