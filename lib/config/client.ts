/**
 * Client Configuration
 *
 * Per-deployment settings that can vary by client.
 * Override via environment variables for different deployments.
 */

export interface ClientConfig {
  /** Unique client identifier */
  clientId: string

  /** Display name */
  clientName: string

  /** Enabled modules */
  modules: {
    requirements: boolean
    uat: boolean
    riskAssessment: boolean
    reports: boolean
  }

  /** Feature toggles */
  features: {
    /** Enable AI features (test generation, suggestions) */
    aiEnabled: boolean

    /** Allow external testers via magic link */
    externalTesters: boolean

    /** Require HIPAA acknowledgment for testers */
    hipaaAcknowledgment: boolean

    /** Auto-generate test cases on story approval */
    autoGenerateTestCases: boolean

    /** Enable cross-validation in UAT cycles */
    crossValidation: boolean

    /** Enable email notifications */
    emailNotifications: boolean
  }

  /** Branding */
  branding: {
    primaryColor: string
    accentColor: string
    logoUrl?: string
  }

  /** Compliance settings */
  compliance: {
    /** Require signature for approvals (FDA 21 CFR Part 11) */
    requireSignature: boolean

    /** Audit log retention in days (default: 7 years = 2555 days) */
    auditRetentionDays: number

    /** Require identity confirmation for testers */
    requireIdentityConfirmation: boolean
  }
}

/**
 * Load client configuration from environment
 */
function loadClientConfig(): ClientConfig {
  return {
    clientId: process.env.CLIENT_ID || 'default',
    clientName: process.env.CLIENT_NAME || 'Propel Health',

    modules: {
      requirements: process.env.MODULE_REQUIREMENTS !== 'false',
      uat: process.env.MODULE_UAT !== 'false',
      riskAssessment: process.env.MODULE_RISK_ASSESSMENT === 'true',
      reports: process.env.MODULE_REPORTS !== 'false',
    },

    features: {
      aiEnabled: process.env.FEATURE_AI_ENABLED !== 'false' && !!process.env.ANTHROPIC_API_KEY,
      externalTesters: process.env.FEATURE_EXTERNAL_TESTERS !== 'false',
      hipaaAcknowledgment: process.env.FEATURE_HIPAA_ACKNOWLEDGMENT !== 'false',
      autoGenerateTestCases: process.env.FEATURE_AUTO_GENERATE_TEST_CASES !== 'false',
      crossValidation: process.env.FEATURE_CROSS_VALIDATION !== 'false',
      emailNotifications: process.env.FEATURE_EMAIL_NOTIFICATIONS !== 'false' && !!process.env.RESEND_API_KEY,
    },

    branding: {
      primaryColor: process.env.BRAND_PRIMARY_COLOR || '#0C8181',
      accentColor: process.env.BRAND_ACCENT_COLOR || '#F9BC15',
      logoUrl: process.env.BRAND_LOGO_URL,
    },

    compliance: {
      requireSignature: process.env.COMPLIANCE_REQUIRE_SIGNATURE !== 'false',
      auditRetentionDays: parseInt(process.env.COMPLIANCE_AUDIT_RETENTION_DAYS || '2555', 10),
      requireIdentityConfirmation: process.env.COMPLIANCE_REQUIRE_IDENTITY !== 'false',
    },
  }
}

/** Cached client configuration */
let cachedConfig: ClientConfig | null = null

/**
 * Get client configuration
 *
 * Configuration is loaded once and cached for the lifetime of the process.
 */
export function getClientConfig(): ClientConfig {
  if (!cachedConfig) {
    cachedConfig = loadClientConfig()
  }
  return cachedConfig
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof ClientConfig['features']): boolean {
  return getClientConfig().features[feature]
}

/**
 * Check if a module is enabled
 */
export function isModuleEnabled(module: keyof ClientConfig['modules']): boolean {
  return getClientConfig().modules[module]
}
