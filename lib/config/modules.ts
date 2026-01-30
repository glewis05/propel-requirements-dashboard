/**
 * Module Registry
 *
 * Defines available modules and their routes.
 * Used for navigation filtering and access control.
 */

export interface ModuleDefinition {
  /** Unique module identifier */
  id: string

  /** Display name */
  name: string

  /** Module description */
  description: string

  /** Routes belonging to this module */
  routes: string[]

  /** Required role to access (minimum) */
  requiredRole?: string[]

  /** Feature flags that affect this module */
  relatedFeatures: string[]
}

/**
 * All available modules in the system
 */
export const MODULE_DEFINITIONS: Record<string, ModuleDefinition> = {
  requirements: {
    id: 'requirements',
    name: 'Requirements Management',
    description: 'Manage user stories, approvals, and traceability',
    routes: ['/dashboard', '/stories', '/approvals', '/clarify', '/activity'],
    relatedFeatures: ['aiEnabled'],
  },

  validation: {
    id: 'validation',
    name: 'Validation Management',
    description: 'Manage test cases, executions, and defects',
    routes: ['/validation', '/validation/test-cases', '/validation/executions', '/validation/defects', '/validation/cycles'],
    relatedFeatures: ['aiEnabled', 'crossValidation', 'autoGenerateTestCases'],
  },

  testerPortal: {
    id: 'testerPortal',
    name: 'Tester Portal',
    description: 'External tester interface for test execution',
    routes: ['/my-tests', '/execute', '/acknowledge', '/my-defects'],
    requiredRole: ['UAT Tester', 'UAT Manager', 'Admin'],
    relatedFeatures: ['externalTesters', 'hipaaAcknowledgment'],
  },

  riskAssessment: {
    id: 'riskAssessment',
    name: 'Risk Assessment',
    description: 'AI-powered risk analysis and prioritization',
    routes: ['/risk', '/risk/assess', '/risk/goals'],
    relatedFeatures: ['aiEnabled'],
  },

  reports: {
    id: 'reports',
    name: 'Reports',
    description: 'Program summaries, traceability, and compliance reports',
    routes: ['/reports', '/reports/program-summary', '/reports/traceability', '/reports/coverage', '/reports/approvals'],
    requiredRole: ['Admin', 'Portfolio Manager', 'Program Manager'],
    relatedFeatures: [],
  },

  admin: {
    id: 'admin',
    name: 'Administration',
    description: 'User management and system settings',
    routes: ['/admin', '/admin/users', '/settings'],
    requiredRole: ['Admin'],
    relatedFeatures: [],
  },
}

/**
 * Get module definition by ID
 */
export function getModule(moduleId: string): ModuleDefinition | undefined {
  return MODULE_DEFINITIONS[moduleId]
}

/**
 * Get module for a given route
 */
export function getModuleForRoute(route: string): ModuleDefinition | undefined {
  return Object.values(MODULE_DEFINITIONS).find(moduleDef =>
    moduleDef.routes.some(r => route.startsWith(r))
  )
}

/**
 * Check if user role can access a module
 */
export function canAccessModule(
  moduleId: string,
  userRole: string
): boolean {
  const moduleDef = MODULE_DEFINITIONS[moduleId]
  if (!moduleDef) return false

  // If no role restriction, allow all
  if (!moduleDef.requiredRole || moduleDef.requiredRole.length === 0) {
    return true
  }

  return moduleDef.requiredRole.includes(userRole)
}
