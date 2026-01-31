# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Propel Health Requirements Dashboard - an interactive Next.js 14 application for managing user stories with stakeholder approval workflows, role-based access control, and FDA 21 CFR Part 11 compliance audit trails. Upgrading from a static GitHub Pages site to a database-backed application with real-time collaboration.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Tech Stack
- **Framework:** Next.js 14 with App Router
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **Auth:** Supabase Auth with magic link (passwordless)
- **Styling:** Tailwind CSS with Propel Health branding (teal #0C8181, gold #F9BC15, navy #34353F, Montserrat font)
- **Icons:** Lucide React

### Supabase Client Usage
- **Server Components/Route Handlers:** Use `createClient()` from `@/lib/supabase/server` (async, uses cookies)
- **Client Components:** Use `createClient()` from `@/lib/supabase/client` (browser client)
- Both clients are typed with `Database` from `@/types/database.ts`

### Route Groups
- `(auth)/` - Login page and auth callback (`/login`, `/auth/callback`)
- `(dashboard)/` - Protected admin routes with sidebar layout (`/dashboard`, `/stories`, `/approvals`, `/admin/*`, `/validation/*`, `/clarify/*`, `/compliance/*`)
- `(tester)/` - External UAT tester portal (`/my-tests`, `/execute/*`, `/acknowledge/*`, `/my-defects/*`)

**Route Renames (Jan 30, 2026):**
- `/uat/*` → `/validation/*` (Test cases, executions, defects management)
- `/questions/*` → `/clarify/*` (Q&A workflow)

## Module Architecture & Boundaries

This is a **modular monolith** with clear boundaries between modules. Modules can share code through designated shared locations but should not import directly from each other.

### Module Structure

```
app/
├── (auth)/           # Authentication module
├── (dashboard)/      # Admin/Manager dashboard module
│   ├── stories/      # Requirements management
│   ├── uat/          # UAT management (manager view)
│   ├── reports/      # Reporting
│   └── ...
├── (tester)/         # External tester portal module
│   ├── my-tests/     # Tester's assigned tests
│   ├── execute/      # Test execution
│   └── acknowledge/  # HIPAA acknowledgment
└── api/              # API routes (shared)

lib/                  # ✅ SHARED - Business logic, utilities
components/           # ✅ SHARED - Reusable UI components
hooks/                # ✅ SHARED - React hooks
types/                # ✅ SHARED - TypeScript types
```

### Import Rules (ENFORCED BY ESLINT)

| From Module | Can Import From |
|-------------|----------------|
| `(dashboard)/*` | `lib/`, `components/`, `hooks/`, `types/`, `app/api/` |
| `(tester)/*` | `lib/`, `components/`, `hooks/`, `types/`, `app/api/` |
| `(auth)/*` | `lib/`, `components/`, `hooks/`, `types/` |
| `lib/*` | `types/` only |
| `components/*` | `lib/`, `hooks/`, `types/` |

### ❌ Forbidden Imports

```typescript
// WRONG: Dashboard importing from tester module
import { something } from "@/app/(tester)/my-tests/actions"

// WRONG: Tester importing from dashboard module
import { something } from "@/app/(dashboard)/uat/actions"

// WRONG: Cross-module action imports
import { createStory } from "@/app/(dashboard)/stories/actions"  // from tester module
```

### ✅ Correct Pattern: Use Shared Code

```typescript
// CORRECT: Both modules import from shared lib
import { createClient } from "@/lib/supabase/server"
import { TEST_CASE_GENERATION_PROMPT } from "@/lib/ai/prompts"

// CORRECT: Use shared components
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// CORRECT: Use shared types
import type { TestCaseStatus } from "@/types/database"
```

### When Code Needs to Be Shared

If both `(dashboard)` and `(tester)` need the same functionality:

1. **Business logic** → Move to `lib/` (e.g., `lib/uat/test-execution.ts`)
2. **UI components** → Move to `components/` (e.g., `components/uat/test-step-executor.tsx`)
3. **React hooks** → Move to `hooks/` (e.g., `hooks/use-execution-timer.ts`)
4. **Types** → Already in `types/database.ts`

### Module-Specific Components

Each module can have its own components that are NOT shared:

```
components/
├── dashboard/        # Dashboard-only components
├── tester/           # Tester portal-only components
├── ui/               # ✅ Shared UI primitives
├── stories/          # ✅ Shared story components
└── uat/              # ✅ Shared UAT components
```

### Server Actions Boundaries

Server actions should be module-scoped:

| Module | Actions Location | Used By |
|--------|-----------------|---------|
| Dashboard | `app/(dashboard)/*/actions.ts` | Dashboard pages only |
| Tester | `app/(tester)/*/actions.ts` | Tester pages only |
| Shared | `lib/actions/*.ts` | Both modules |

**Example:** Test execution logic used by both modules should be in `lib/uat/execution-service.ts`, with thin action wrappers in each module.

### Data Protection Rules

1. **Soft-deleted stories** must be filtered with `.is("deleted_at", null)` in ALL queries
2. **Approved stories** (status = "Approved", "In Development", "In UAT") cannot be deleted
3. **All deletions** must log to `activity_log` before soft-delete

## Service Layer Architecture

The service layer (`lib/services/`) contains business logic that can be shared between modules.

### Directory Structure

```
lib/
├── config/              # Client/deployment configuration
│   ├── client.ts        # Per-client settings (env vars)
│   ├── modules.ts       # Module registry
│   └── features.ts      # Feature flag definitions
├── contracts/           # Interface definitions
│   ├── story-contract.ts
│   ├── test-case-contract.ts
│   ├── execution-contract.ts
│   └── notification-contract.ts
├── services/            # Service implementations
│   ├── test-case-service.ts
│   └── notification-service.ts
└── ...existing code...
```

### Using Services

```typescript
import { createClient } from '@/lib/supabase/server'
import { TestCaseService, getTestCaseGenerator } from '@/lib/services'

// In a server action or API route:
const supabase = await createClient()
const testCaseService = new TestCaseService(supabase)

// Check if story has test cases
const { data: hasTests } = await testCaseService.hasTestCases(storyId)

// Generate test cases (respects feature flags)
const generator = getTestCaseGenerator()
if (await generator.isAvailable()) {
  const result = await generator.generate({ title, description })
}
```

### Configuration System

Client configuration is loaded from environment variables:

```bash
# .env.local
CLIENT_ID=providence
CLIENT_NAME="Providence Health"

# Feature toggles
FEATURE_AI_ENABLED=true
FEATURE_AUTO_GENERATE_TEST_CASES=true
FEATURE_CROSS_VALIDATION=true

# Compliance
COMPLIANCE_REQUIRE_SIGNATURE=true
```

```typescript
import { isFeatureEnabled, isModuleEnabled } from '@/lib/config'

// Check features
if (isFeatureEnabled('autoGenerateTestCases')) {
  // Trigger auto-generation
}

// Check modules
if (isModuleEnabled('riskAssessment')) {
  // Show risk nav item
}
```

### Adding New Services

1. Define contract in `lib/contracts/new-contract.ts`
2. Implement in `lib/services/new-service.ts`
3. Export from `lib/services/index.ts`
4. Use in both `(dashboard)` and `(tester)` modules

### Authentication Flow
1. User enters email on `/login`
2. Magic link sent via Supabase Auth
3. Link redirects to `/auth/callback` which exchanges code for session
4. Middleware (`lib/supabase/middleware.ts`) refreshes sessions and protects routes
5. Dashboard layout fetches user profile by matching `auth_id` to `users.auth_id`

### Role-Based Middleware Routing

The middleware (`lib/supabase/middleware.ts`) implements automatic role-based routing:

**Tester Routes** (UAT Tester only):
- `/my-tests`, `/execute`, `/acknowledge`, `/my-defects`, `/tester-help`

**Admin Routes** (blocked for UAT Testers):
- `/dashboard`, `/stories`, `/approvals`, `/admin`, `/validation`, `/clarify`, `/compliance`, `/reports`, `/activity`, `/settings`

**Routing Logic:**
1. UAT Testers accessing admin routes → Redirected to `/my-tests`
2. UAT Testers accessing `/` or `/login` (when authenticated) → Redirected to `/my-tests`
3. Non-testers accessing `/` or `/login` (when authenticated) → Redirected to `/dashboard`
4. Non-testers can still access tester routes (for debugging/testing purposes)

This enables a single Vercel deployment to serve both the admin dashboard and tester portal based on user role.

### Role-Based Access Control
Four roles with hierarchical permissions:
- **Admin:** Full access, can delete anything
- **Portfolio Manager:** View/edit all programs, approve stories
- **Program Manager:** View/edit assigned programs only (`users.assigned_programs` array)
- **Developer:** View approved stories only, can post questions

### Database Schema (Key Tables)
- `users` - User profiles with `role`, `auth_id` (links to Supabase Auth), `assigned_programs`
- `user_stories` - Requirements with status workflow, locking for concurrent edits, `story_type` ('user_story' | 'rule_update')
- `programs` - Program/project containers (NOTE: uses `name` column, not `program_name`)
- `story_comments` - Threaded discussions (RLS enforced)
- `story_approvals` - Immutable approval audit trail (RLS enforced)
- `story_versions` - Automatic version history via trigger (RLS enforced)

### Rule Update Tables (Healthcare Rule Engine)
- `rule_update_details` - 1:1 with user_stories for rule updates (rule_type, target_rule, change_id, change_type, quarter, effective_date, rule_description, change_summary)
- `rule_update_test_cases` - Test cases for rule validation (profile_id auto-generated, platform P4M/Px4M, test_type POS/NEG, patient_conditions JSONB, test_steps JSONB)
- `rule_update_history` - Immutable audit trail for FDA 21 CFR Part 11 compliance (action, previous_data, new_data, changed_by, ip_address)

### Programs Table Schema
| Column | Type | Notes |
|--------|------|-------|
| program_id | TEXT (PK) | Unique identifier |
| name | TEXT | Display name (NOT program_name) |
| prefix | TEXT | Short code (e.g., P4M, GRXC) |
| description | TEXT | Optional description |
| client_id | TEXT (FK) | Reference to clients |
| status | TEXT | 'Active', etc. |

### Database Functions (call via `supabase.rpc()`)
- `acquire_story_lock(p_story_id)` - Get 5-minute edit lock
- `release_story_lock(p_story_id)` - Release edit lock
- `is_story_locked(p_story_id)` - Check if another user holds lock
- `get_user_role()` / `get_user_programs()` - Used by RLS policies
- `create_story_version()` - Called by trigger to create version records

### Database Triggers
- `trigger_user_stories_updated_at` - BEFORE UPDATE: Sets `updated_at` timestamp
- `user_stories_version_trigger` - **AFTER** INSERT OR UPDATE: Creates version record in `story_versions`

**IMPORTANT:** The version trigger MUST be AFTER INSERT/UPDATE, not BEFORE. If set to BEFORE, it will fail with foreign key errors because the story doesn't exist yet.

### Story Status Workflow
`Draft` → `Internal Review` → `Pending Client Review` → `Approved` → `In Development` → `In UAT`

Special statuses: `Needs Discussion`, `Out of Scope`

**Protected Statuses:** Stories with client approval (`stakeholder_approved_at` set) in `Approved`, `In Development`, or `In UAT` status cannot be deleted.

## Path Aliases
`@/*` maps to project root (e.g., `@/lib/supabase/server`, `@/types/database`)

## Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## CI/CD Strategy
Building with CI/CD in mind from the start:
- GitHub Actions for automated testing and deployment
- Vercel for hosting with automatic preview deployments on PRs
- Environment separation: development, staging, production

## Branding

The application is branded as **TraceWell** with the tagline "The Compliance Backbone for Healthcare Innovation".

**Logo:** Helix Check - DNA helix integrated with checkmark (`components/ui/tracewell-logo.tsx`)
- Teal helix strand (#0C8181)
- Gold checkmark (#F9BC15)
- White interweave strand

**Brand Colors:**
- Primary Teal: #0C8181
- Gold (accent/CTAs): #F9BC15
- Navy (sidebar/dark backgrounds): #34353F

**Brand Font:** Montserrat (Google Fonts)

**Key Branding Locations:**
- Login page: Navy background with TracewellLogo, gold accents, tagline
- Sidebar: Navy background, TracewellLogo, "TraceWell" title with "Compliance Backbone" subtitle
- Mobile nav: Navy background, TracewellLogo, gold left border on active nav item
- App metadata: "TraceWell | Compliance Backbone"

## Multi-Client Considerations
Future requirement to support multiple clients (e.g., Providence, Kaiser):
- Approach TBD - options include:
  - Separate deployments per client with different branding/config
  - Single multi-tenant app with client isolation
  - White-label solution with configurable theming
- Keep branding tokens/colors in centralized config for easy swapping (currently in tailwind.config.ts and globals.css)
- Design database schema with client isolation in mind

## Current Phase
Phase 9: Rule Update Story Type ✅ COMPLETE (Jan 30, 2026)
- [x] Database migration for rule update tables (011_rule_update_schema.sql) ✅
- [x] TypeScript types and Zod validation schemas ✅
- [x] Constants module for platforms, rule types, change types ✅
- [x] Server actions for rule update CRUD operations ✅
- [x] Story type selector component ✅
- [x] Rule update form with collapsible sections ✅
- [x] Test case editor with patient conditions builder ✅
- [x] Test steps editor ✅
- [x] Rule update detail view ✅
- [x] Stories list type filter and NCCN/TC badges ✅
- [x] Conditional rendering in story detail page ✅
- [x] New story wrapper with type selection flow ✅

**Previous Phase:**
Phase 8.5: UAT Fixes ✅ COMPLETE (Jan 29, 2026)
- [x] Grouped sidebar navigation (Core / Workflow / Admin) ✅
- [x] Gold left border indicator on active nav items ✅
- [x] Fixed duplicate heading bug in header ✅
- [x] Active filter chips with individual dismiss ✅
- [x] Enhanced search placeholder text ✅
- [x] More prominent New Story button ✅
- [x] Enhanced empty states with icons and CTA buttons ✅
- [x] Accessible badge icons on status/priority badges ✅
- [x] Shared navigation config (lib/navigation.ts) ✅
- [x] Shared badge config (lib/badge-config.ts) ✅
- [x] UAT nav entry added (was missing from mobile nav) ✅

**Upcoming Phases:**
- Phase 9: Polish & Launch

**Completed:**
- Phase 1 - Foundation & Authentication ✅
- Phase 2 - Core Dashboard & Data Display ✅ (Jan 26, 2026)
  - Mobile navigation drawer, responsive card/table views
  - Virtual scrolling for 50+ items (@tanstack/react-virtual)
- Phase 3 - CRUD Operations & Versioning ✅ (Jan 26, 2026)
  - Story creation form with validation (react-hook-form + Zod)
  - Story edit page with optimistic locking
  - Story deletion with confirmation dialog (Admin only)
  - Version history diff viewer with compare mode
  - Comment submission with real-time updates
- Phase 3.5 - Story Relationships ✅ (Jan 26, 2026)
  - Linked stories UI with related stories selector
  - Parent-child hierarchy (one level deep)
  - Visual relationship display on story detail page
  - Database migration for story relationships
- Phase 4 - Approval Workflow ✅ (Jan 27, 2026)
  - Status transition component with role-based permissions
  - Approval modal with notes
  - Email notifications via Resend (role-based, opt-in/opt-out)
  - Notification settings page (/settings/notifications)
  - Approval history timeline on story detail page
- Phase 5 - Collaboration Features ✅ (Jan 27, 2026)
  - Comment threading (replies up to 3 levels deep)
  - @mentions with autocomplete and notifications
  - Activity feed page (/activity)
  - Questions page with Q&A workflow (/questions)
  - Accept/unaccept answer functionality
  - In-app notification center (bell icon dropdown)
- Phase 6 - Reporting & Traceability ✅ (Jan 27, 2026)
  - Requirements table schema update (added id, status, category columns)
  - Requirement-story mapping table for traceability
  - Traceability matrix view (requirement → story mapping)
  - Program summary report with status/priority breakdown
  - Coverage reports (requirements and stories)
  - Approval history audit trail report
  - CSV export for all reports
  - Database views: traceability_matrix, requirement_coverage_summary, story_coverage
- Phase 7 - AI Features ✅ (Jan 27, 2026)
  - AI relationship suggestions using Claude API
  - AI acceptance criteria generation
- Phase 8 - UX Improvements ✅ (Jan 28, 2026)
  - Grouped sidebar navigation with section labels
  - Active nav gold border indicator
  - Duplicate header heading fix (accessibility)
  - Active filter chips with individual dismiss
  - Enhanced search placeholder and empty states
  - Accessible status/priority badge icons
  - Shared navigation and badge config modules

## Story Relationships (Database Fields)
- `parent_story_id` TEXT - References parent story for hierarchy (one level)
- `related_stories` JSONB - Array of linked story IDs for similar stories

## Email Notifications
- **Service:** Resend (requires `RESEND_API_KEY` env var)
- **Settings Page:** `/settings/notifications`
- **User Preferences:** Stored in `users.notification_preferences` (JSONB)
- **Notification Types:** status_changes, comments, approvals, mentions
- **Role-Based Rules:** Defined in `lib/notifications/config.ts`

## Key Components

### Shared Config Modules
- `lib/navigation.ts` - Grouped navigation config (Core / Workflow / Admin) with `getFilteredGroups(userRole)` helper. Single source of truth for sidebar and mobile nav.
- `lib/badge-config.ts` - Status and priority badge config with lucide icons and color classes. Exports `getStatusBadge()` and `getPriorityBadge()` helpers.
- `lib/rule-update/constants.ts` - Constants for rule update feature: STORY_TYPES, RULE_TYPES (NCCN, TC), PLATFORMS (P4M, Px4M), CHANGE_TYPES (MODIFIED, NEW, DEPRECATED), TEST_TYPES (POS, NEG), TEST_STATUSES.
- `lib/validations/rule-update.ts` - Zod schemas for rule update forms, test cases, and test steps. Includes `extractRuleCode()` and `formatProfileId()` helpers.
- `types/rule-update.ts` - TypeScript interfaces: RuleUpdateDetails, RuleTestCase, RuleUpdateHistoryEntry, RuleTestStep, PatientConditions.

### Stories
- `components/stories/stories-list.tsx` - Client component with filtering, search, filter chips, mobile card view, virtual scrolling (50+ items), badge icons, enhanced empty states
- `components/stories/stories-list-realtime.tsx` - Wrapper that adds real-time subscriptions to StoriesList
- `components/stories/collapsible-section.tsx` - Reusable expand/collapse section with icon, badge support
- `components/stories/comments-section.tsx` - Threaded comments with @mentions, real-time updates, replies up to 3 levels deep
- `components/stories/story-form.tsx` - Reusable form for create/edit with react-hook-form + Zod validation
- `components/stories/story-actions.tsx` - Edit/Delete buttons with confirmation dialog
- `components/stories/version-history.tsx` - Expandable version list with diff comparison
- `components/stories/related-stories-selector.tsx` - Search and select related/linked stories
- `components/stories/story-relationships-display.tsx` - Display parent, child, and related story links
- `components/stories/ai-acceptance-criteria.tsx` - AI-powered acceptance criteria generation
- `components/stories/ai-relationship-suggestions.tsx` - AI-powered story relationship suggestions (works in both create and edit modes)
- `components/stories/status-transition.tsx` - Interactive status dropdown with transition modal
- `components/stories/approval-history-timeline.tsx` - Visual timeline of approvals and changes
- `components/stories/story-type-selector.tsx` - User Story vs Rule Update selection UI
- `components/stories/new-story-wrapper.tsx` - Client wrapper for type selection and conditional form rendering
- `components/stories/rule-update-form.tsx` - Main form for creating/editing rule updates with collapsible sections
- `components/stories/rule-update-detail-view.tsx` - Detail page component for rule update stories
- `components/stories/rule-test-case-editor.tsx` - Modal form for adding/editing test cases with patient conditions
- `components/stories/rule-test-case-list.tsx` - Display and manage test cases grouped by platform
- `components/stories/rule-test-steps-editor.tsx` - Editor for test steps array with navigation paths and actions

### Settings
- `components/settings/notification-settings-form.tsx` - Email notification opt-in/opt-out toggles

### Activity
- `components/activity/activity-feed.tsx` - Activity timeline with icons and story links

### Notifications
- `components/notifications/notification-bell.tsx` - Header dropdown with unread count, mark as read

### Hooks (Real-time Subscriptions)
- `hooks/use-realtime-subscription.ts` - Generic Supabase real-time subscription hook with cleanup
- `hooks/use-stories-subscription.ts` - Stories list subscription (INSERT/UPDATE/DELETE)
- `hooks/use-comments-subscription.ts` - Comments subscription filtered by story_id

### UI
- `components/ui/skeleton.tsx` - Skeleton loaders (Skeleton, SkeletonText, SkeletonCard, SkeletonTableRow, SkeletonStoriesTable, SkeletonStatsGrid)
- `components/ui/mention-input.tsx` - @mentions autocomplete textarea with user search
- `components/ui/loading-spinner.tsx` - Loading spinner with sizes (sm, md, lg) and LoadingPage component
- `components/ui/tracewell-logo.tsx` - TraceWell Helix Check logo with size variants (sm, md, lg)

### Layout
- `components/layout/sidebar.tsx` - Role-based grouped navigation (desktop) with gold active indicator
- `components/layout/header.tsx` - User menu, notifications, mobile menu trigger (uses `<p aria-hidden>` instead of `<h1>` to avoid duplicate headings)
- `components/layout/mobile-nav.tsx` - Slide-out drawer navigation for mobile/tablet with grouped nav

## Sidebar Navigation Groups
Navigation items are grouped into three sections, defined in `lib/navigation.ts`:
- **Core:** Overview, Stories, Activity
- **Workflow:** Clarify, Validation, Approvals, Compliance
- **Admin:** Reports, Users, Settings, Notifications

Items are filtered by user role. Active items display a gold (`border-propel-gold`) left border.

**Navigation Label Updates (Jan 30, 2026):**
- Dashboard → Overview
- User Stories → Stories
- Questions → Clarify
- UAT → Validation

## User Setup (Important)

New users must have a record in the `users` table linked to their Supabase Auth account:

```sql
INSERT INTO users (user_id, name, email, role, auth_id, status, created_at, updated_at)
VALUES (
  'user-[unique-id]',
  '[Full Name]',
  '[email]',
  '[Admin|Portfolio Manager|Program Manager|Developer]',
  '[supabase-auth-uuid-from-auth.users]',
  'Active',  -- Must be exactly 'Active', 'Inactive', or 'Terminated'
  NOW(),
  NOW()
)
RETURNING *;
```

**Get Auth UUID:** Supabase Dashboard → Authentication → Users → Copy User UID

## RLS Policies (Required)

All tables have RLS enabled. These policies are required for the app to function:

### `users` Table
```sql
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth_id = auth.uid());
```

### `programs` Table
```sql
CREATE POLICY "Anyone can read programs" ON programs FOR SELECT USING (true);
```

### `user_stories` Table
```sql
-- SELECT: Authenticated users can read
CREATE POLICY "Authenticated users can read stories" ON user_stories
FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Users can create stories for their assigned programs (Admin/Portfolio Manager for any)
CREATE POLICY "Users can insert stories for assigned programs" ON user_stories
FOR INSERT TO authenticated
WITH CHECK (
  program_id IN (
    SELECT unnest(assigned_programs) FROM users WHERE auth_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('Admin', 'Portfolio Manager')
  )
);

-- UPDATE: Users can update stories for their assigned programs
CREATE POLICY "Users can update stories for assigned programs" ON user_stories
FOR UPDATE TO authenticated
USING (
  program_id IN (
    SELECT unnest(assigned_programs) FROM users WHERE auth_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('Admin', 'Portfolio Manager')
  )
)
WITH CHECK (
  program_id IN (
    SELECT unnest(assigned_programs) FROM users WHERE auth_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('Admin', 'Portfolio Manager')
  )
);

-- DELETE: Admins only, cannot delete client-approved stories in protected statuses
CREATE POLICY "Admins can delete non-protected stories" ON user_stories
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'Admin'
  )
  AND NOT (
    stakeholder_approved_at IS NOT NULL
    AND status IN ('Approved', 'In Development', 'In UAT')
  )
);
```

### `story_comments`, `story_approvals`, `story_versions` Tables
```sql
-- DELETE: Admins only (for cascading deletes when deleting stories)
CREATE POLICY "Admins can delete story comments" ON story_comments
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Admins can delete story approvals" ON story_approvals
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'Admin'));

CREATE POLICY "Admins can delete story versions" ON story_versions
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'Admin'));
```

Without these policies, the app shows empty tables even when data exists.

## Supabase Realtime Configuration

Real-time subscriptions require enabling Realtime on tables:

1. Go to Supabase Dashboard → **Database** → **Replication**
2. Under "Supabase Realtime", add tables:
   - `user_stories` - For stories list live updates
   - `story_comments` - For comments live updates

Or via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE user_stories;
ALTER PUBLICATION supabase_realtime ADD TABLE story_comments;
```

## Lessons Learned

### Route Renaming (Jan 30, 2026)

When renaming route directories (e.g., `uat` → `validation`), multiple layers must be updated:

1. **Route directories** - Rename `app/(dashboard)/uat/` to `app/(dashboard)/validation/`
2. **Component imports** - Update all `@/app/(dashboard)/uat/` imports to `@/app/(dashboard)/validation/`
3. **Shared lib files** - If `lib/uat/` exists with shared utilities, either:
   - Move to `lib/validation/` (preferred for consistency)
   - Or update all imports to continue using old path
4. **Navigation config** - Update `lib/navigation.ts` route paths
5. **Middleware** - Update route arrays in `lib/supabase/middleware.ts`
6. **revalidatePath calls** - Server actions often call `revalidatePath("/uat/...")` - must update these too
7. **Link hrefs** - Update any hardcoded `href="/uat/..."` in components

**Common pitfall:** Updating app route imports but forgetting shared lib imports causes Vercel build to fail with "Module not found" errors even though local dev works (due to cached .next directory).

### Codebase Audit Best Practices (Jan 31, 2026)

After iterative development, codebases accumulate inconsistencies. Run comprehensive audits to find:

**Critical Issues to Check:**
1. **Duplicate directories** - Watch for old/new route directories both existing (e.g., `/app/tester/` vs `/app/(tester)/`)
2. **Stale revalidatePath calls** - Server actions cache invalidation must use current route names
3. **Duplicate component files** - Different naming conventions (PascalCase vs kebab-case) can create two files
4. **Broken imports** - Non-existent packages (e.g., `@hookform/resolvers-v4/zod` doesn't exist)
5. **ESLint errors** - Unescaped characters in JSX cause build failures

**Audit Commands:**
```bash
# Find stale revalidatePath calls
grep -r 'revalidatePath("/old-route' app/

# Find duplicate component imports
grep -r 'ComponentName' --include="*.tsx" -l | sort

# Check for module resolution issues
npm run build 2>&1 | grep "Module not found"

# Find all files with certain imports
grep -r '@/lib/old-path' --include="*.ts" --include="*.tsx" -l
```

**Prevention:**
- Run full build (`npm run build`) locally before pushing after major refactors
- Use search-and-replace across entire codebase when renaming routes
- Delete old directories/files immediately after migration, don't leave duplicates
- Standardize file naming (prefer kebab-case for files, PascalCase for components)

### Vercel Deployment Cache Issues

When routes are renamed but old routes still appear in production:
1. Go to Vercel Dashboard → Project → Settings → Data Cache
2. Purge all caches (CDN Cache + Data Cache)
3. Redeploy without cache: `vercel --force`
4. Add environment variable `VERCEL_FORCE_NO_BUILD_CACHE=1` to skip build cache permanently

### Route Groups and Vercel Build (Jan 31, 2026)

**Problem:** Vercel build failed with:
```
ENOENT: no such file or directory, lstat '/vercel/path0/.next/server/app/(tester)/page_client-reference-manifest.js'
```

**Root Cause:** A `page.tsx` file in a Next.js Route Group (directories with parentheses like `(tester)`) was causing Vercel's build to fail when generating client reference manifests. This happened even though:
- The local build succeeded
- GitHub Actions CI passed
- The code was valid Next.js

**What Didn't Work:**
- Converting to async server component with `redirect()`
- Adding `return null` after redirect
- Converting to `"use client"` component with `useRouter`
- Clearing Vercel build cache
- Setting `VERCEL_FORCE_NO_BUILD_CACHE=1`
- Redeploying with cache unchecked

**What Fixed It:**
Delete the `page.tsx` file from the route group entirely:
```bash
rm app/(tester)/page.tsx
```

**Why This Works:**
Route Groups (directories with parentheses) don't add URL segments. A `page.tsx` at `app/(tester)/page.tsx` would create a route at `/` (root), not `/tester`. Since the route group is just for organization, it doesn't need a root page - users access sub-routes directly (`/my-tests`, `/execute/[id]`, etc.).

**Key Takeaway:**
- Route Groups are for **organization only**, not for creating routes
- Don't add `page.tsx` to route group root directories unless you specifically want a root route
- If you need a redirect from the group "root", handle it in middleware or `next.config.js` redirects instead

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| User shows as "Developer" instead of actual role | Missing RLS policy or no user record | Add RLS policies, verify user record exists with correct auth_id |
| INSERT succeeds but SELECT returns nothing | RLS blocking read | Run as superuser or add SELECT policy |
| Status constraint error | Wrong case | Use 'Active' not 'active' |
| Queries fail with syntax errors in Supabase SQL Editor | Editor appending metadata | Use "No limit" setting or single-line queries |
| Build fails with "type 'never'" errors | Supabase type inference issue | Temporarily: `ignoreBuildErrors: true` in next.config.js. Properly: regenerate types with `supabase gen types typescript` |
| Stories/programs table shows empty | RLS blocking SELECT | Add SELECT policies for `programs` and `user_stories` tables |
| Version trigger fails on INSERT | No authenticated user | Disable trigger: `ALTER TABLE user_stories DISABLE TRIGGER user_stories_version_trigger;` then re-enable after |
| "violates foreign key constraint story_versions_story_id_fkey" on story creation | Version trigger set to BEFORE INSERT instead of AFTER INSERT | Fix trigger: `DROP TRIGGER user_stories_version_trigger ON user_stories; CREATE TRIGGER user_stories_version_trigger AFTER INSERT OR UPDATE ON user_stories FOR EACH ROW EXECUTE FUNCTION create_story_version();` |
| Story create/update/delete silently fails | Missing RLS policy for that operation | Add INSERT/UPDATE/DELETE policies to `user_stories` table (see RLS Policies section) |
| Delete appears to succeed but story still exists | Missing DELETE RLS policy | Add DELETE policy for Admins on `user_stories` and related tables |
| "column 'id' referenced in foreign key constraint does not exist" | Existing table missing the column referenced by new foreign key | Add the column with UNIQUE constraint before creating referencing table |
| "no unique constraint matching given keys for referenced table" | Foreign key references column without PRIMARY KEY or UNIQUE constraint | Add `UNIQUE` constraint: `ALTER TABLE x ADD CONSTRAINT x_id_unique UNIQUE (id);` |
| "cannot drop constraint X because other objects depend on it" | Trying to change primary key that other tables reference | Keep existing primary key, add UNIQUE constraint on new column instead |
| Migration fails on index creation for missing column | `CREATE INDEX` on column that doesn't exist in legacy table | Use conditional index creation in DO block, or add columns first |
| Vercel build fails with "Module not found" after route rename | App route imports updated but `lib/` shared files not moved | Move `lib/uat/` to `lib/validation/` OR update imports to continue using old path |
| Old routes still visible on Vercel after rename | CDN/Data cache serving stale content | Purge all caches in Vercel dashboard, redeploy with `--force` |
| Vercel build fails with `page_client-reference-manifest.js` ENOENT | `page.tsx` in Route Group root causing manifest generation issues | Delete the `page.tsx` from route group root - route groups don't need root pages |

## Known Technical Debt

1. **TypeScript checking disabled in builds** - `next.config.js` has `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. Need to fix Supabase type inference and re-enable.

2. **Components importing server actions directly** - Several shared components import server actions from `app/` instead of receiving them as props. This violates module boundaries but is currently allowed as warnings. Files to refactor:
   - `components/stories/status-transition.tsx` → Pass `transitionStoryStatus` as prop
   - `components/stories/story-actions.tsx` → Pass `deleteStory` as prop
   - `components/stories/comments-section.tsx` → Pass comment actions as props
   - `components/stories/ai-*.tsx` → Pass AI actions as props
   - `components/uat/executions/*.tsx` → Pass execution actions as props
   - `components/notifications/notification-bell.tsx` → Pass notification actions as props
   - `components/settings/notification-settings-form.tsx` → Pass settings actions as props
   - `components/activity/activity-feed.tsx` → Pass `getRecentActivities` as prop
   - `components/tester/*.tsx` → Pass tester actions as props

   **Proper pattern:** Create `lib/actions/` for shared server actions, or pass actions as props from page components.

3. ~~**Legacy `/tester` route (no parentheses)**~~ - **RESOLVED (Jan 31, 2026)** - Deleted `app/tester/` directory and `lib/uat/` duplicate. All tester routes now use `app/(tester)/` with proper middleware protection.

## Changelog

The project maintains a changelog at `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/) format. Update this file when making significant changes:
- **Added** for new features
- **Changed** for changes in existing functionality
- **Fixed** for bug fixes
- **Removed** for removed features
- **Security** for security fixes

## Future Features (Backlog)

### UAT System Enhancements (Priority: High)
**Full Roadmap:** `docs/UAT_ENHANCEMENTS_ROADMAP.md`

Enable self-service, asynchronous testing for external testers:
1. **Tester Portal** - Focused "My Executions" interface
2. **Self-Service Invitation** - Magic link onboarding for external testers
3. **Shareable Links** - Direct links to test assignments
4. **Auto-Generate on Approval** - AI creates test cases when stories approved
5. **AI Assignment Suggestions** - Smart test distribution

Compliance: FDA 21 CFR Part 11, HIPAA, HITRUST

---

### Risk Assessment Tool with AI Advisor
Help users without software risk management experience evaluate requirements for prioritization and scheduling.

**Full Design Document:** `docs/AI_Risk_Advisor_Design.md`

**Key Features:**
- AI-powered risk analysis using Claude API
- Risk scoring matrix (likelihood × impact, 1-25 scale)
- Program goals management with alignment tracking
- Conversational Q&A interface for follow-up questions
- Visual risk indicators on story cards
- Risk-adjusted priority recommendations
- FDA 21 CFR Part 11 compliant audit trail

**New Database Tables:**
- `program_goals` - Strategic goals by program/quarter
- `story_risk_assessments` - Immutable assessment records
- `risk_conversations` - AI chat history
- `goal_story_alignments` - Goal-to-story mapping
- `risk_factors_catalog` - Configurable risk categories

**Implementation Timeline:** ~12 weeks (after Phase 4 Approval Workflow)

See `Project_Progress.md` and `docs/AI_Risk_Advisor_Design.md` for full details.
