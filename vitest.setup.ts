import "@testing-library/jest-dom"
import { vi } from "vitest"

// ============================================================================
// NEXT.JS MOCKS
// ============================================================================

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}))

// Mock Next.js Link - using createElement to avoid JSX in .ts file
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: unknown; href: string }) => {
    const React = require("react")
    return React.createElement("a", { href, ...props }, children)
  },
}))

// ============================================================================
// SUPABASE MOCKS
// ============================================================================

// Default mock for Supabase client
const createMockQueryBuilder = () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((resolve: (value: { data: null; error: null }) => void) => {
      resolve({ data: null, error: null })
      return builder
    }),
  }
  return builder
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => createMockQueryBuilder()),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    })),
  })),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => createMockQueryBuilder()),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  })),
}))

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

vi.stubEnv("ANTHROPIC_API_KEY", "test-api-key")
vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co")
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key")

// ============================================================================
// WINDOW MOCKS
// ============================================================================

// Mock matchMedia for responsive tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  root = null
  rootMargin = ""
  thresholds = []
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

// Mock scrollTo
window.scrollTo = vi.fn()

// ============================================================================
// DATE MOCKS (for consistent time-based tests)
// ============================================================================

// Optionally freeze time for tests that need it
// vi.useFakeTimers()
// vi.setSystemTime(new Date('2025-01-29T12:00:00Z'))

// ============================================================================
// CONSOLE SUPPRESSION
// ============================================================================

const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress specific React warnings during tests
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning: ReactDOM.render") ||
        args[0].includes("act(...)") ||
        args[0].includes("Warning: An update to") ||
        args[0].includes("Warning: Cannot update a component"))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: unknown[]) => {
    // Suppress specific warnings
    if (
      typeof args[0] === "string" &&
      (args[0].includes("React Router") ||
        args[0].includes("componentWillReceiveProps"))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// ============================================================================
// CLEANUP
// ============================================================================

afterEach(() => {
  vi.clearAllMocks()
})
