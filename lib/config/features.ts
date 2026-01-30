/**
 * Feature Flag Definitions
 *
 * Defines all feature flags and their metadata.
 * Actual values come from client config or database.
 */

export interface FeatureDefinition {
  /** Unique feature identifier */
  id: string

  /** Display name */
  name: string

  /** Description of what the feature does */
  description: string

  /** Module(s) this feature affects */
  affectsModules: string[]

  /** Whether this can be toggled per-program (vs deployment-wide) */
  programLevel: boolean

  /** Default value if not configured */
  defaultValue: boolean
}

/**
 * All available feature flags
 */
export const FEATURE_DEFINITIONS: Record<string, FeatureDefinition> = {
  aiEnabled: {
    id: 'aiEnabled',
    name: 'AI Features',
    description: 'Enable AI-powered features like test generation and suggestions',
    affectsModules: ['requirements', 'uat', 'riskAssessment'],
    programLevel: false, // Deployment-wide (requires API key)
    defaultValue: false,
  },

  autoGenerateTestCases: {
    id: 'autoGenerateTestCases',
    name: 'Auto-Generate Test Cases',
    description: 'Automatically generate test cases when stories are approved',
    affectsModules: ['uat'],
    programLevel: true, // Can be toggled per program
    defaultValue: true,
  },

  crossValidation: {
    id: 'crossValidation',
    name: 'Cross-Validation',
    description: 'Enable cross-validation testing in UAT cycles',
    affectsModules: ['uat', 'testerPortal'],
    programLevel: true,
    defaultValue: true,
  },

  externalTesters: {
    id: 'externalTesters',
    name: 'External Testers',
    description: 'Allow external testers to access the tester portal via magic link',
    affectsModules: ['testerPortal'],
    programLevel: false,
    defaultValue: true,
  },

  hipaaAcknowledgment: {
    id: 'hipaaAcknowledgment',
    name: 'HIPAA Acknowledgment',
    description: 'Require testers to acknowledge HIPAA compliance before testing',
    affectsModules: ['testerPortal'],
    programLevel: false,
    defaultValue: true,
  },

  emailNotifications: {
    id: 'emailNotifications',
    name: 'Email Notifications',
    description: 'Send email notifications for status changes and mentions',
    affectsModules: ['requirements', 'uat'],
    programLevel: false, // Deployment-wide (requires email API key)
    defaultValue: false,
  },

  aiRelationshipSuggestions: {
    id: 'aiRelationshipSuggestions',
    name: 'AI Relationship Suggestions',
    description: 'Suggest related stories using AI analysis',
    affectsModules: ['requirements'],
    programLevel: true,
    defaultValue: true,
  },

  aiAcceptanceCriteria: {
    id: 'aiAcceptanceCriteria',
    name: 'AI Acceptance Criteria',
    description: 'Generate acceptance criteria suggestions using AI',
    affectsModules: ['requirements'],
    programLevel: true,
    defaultValue: true,
  },
}

/**
 * Get feature definition by ID
 */
export function getFeatureDefinition(featureId: string): FeatureDefinition | undefined {
  return FEATURE_DEFINITIONS[featureId]
}

/**
 * Get all features that affect a module
 */
export function getFeaturesForModule(moduleId: string): FeatureDefinition[] {
  return Object.values(FEATURE_DEFINITIONS).filter(
    feature => feature.affectsModules.includes(moduleId)
  )
}

/**
 * Get all program-level features (can be toggled per program)
 */
export function getProgramLevelFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_DEFINITIONS).filter(
    feature => feature.programLevel
  )
}
