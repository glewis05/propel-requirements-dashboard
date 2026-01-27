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
- `(dashboard)/` - Protected routes with sidebar layout (`/dashboard`, `/stories`, `/approvals`, `/admin/*`)

### Authentication Flow
1. User enters email on `/login`
2. Magic link sent via Supabase Auth
3. Link redirects to `/auth/callback` which exchanges code for session
4. Middleware (`lib/supabase/middleware.ts`) refreshes sessions and protects routes
5. Dashboard layout fetches user profile by matching `auth_id` to `users.auth_id`

### Role-Based Access Control
Four roles with hierarchical permissions:
- **Admin:** Full access, can delete anything
- **Portfolio Manager:** View/edit all programs, approve stories
- **Program Manager:** View/edit assigned programs only (`users.assigned_programs` array)
- **Developer:** View approved stories only, can post questions

### Database Schema (Key Tables)
- `users` - User profiles with `role`, `auth_id` (links to Supabase Auth), `assigned_programs`
- `user_stories` - Requirements with status workflow, locking for concurrent edits
- `programs` - Program/project containers (NOTE: uses `name` column, not `program_name`)
- `story_comments` - Threaded discussions (RLS enforced)
- `story_approvals` - Immutable approval audit trail (RLS enforced)
- `story_versions` - Automatic version history via trigger (RLS enforced)

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

The dashboard uses Propel Health brand styling with "Powered by Propel Health Platform" tagline.

**Brand Colors:**
- Primary Teal: #0C8181
- Gold (accent/CTAs): #F9BC15
- Navy (sidebar/dark backgrounds): #34353F

**Brand Font:** Montserrat (Google Fonts)

**Key Branding Locations:**
- Login page: Navy background, gold accents
- Sidebar: Navy background, gold logo icon
- Mobile nav: Navy background, gold logo icon
- Footer tagline: "Powered by Propel Health Platform"

## Multi-Client Considerations
Future requirement to support multiple clients (e.g., Providence, Kaiser):
- Approach TBD - options include:
  - Separate deployments per client with different branding/config
  - Single multi-tenant app with client isolation
  - White-label solution with configurable theming
- Keep branding tokens/colors in centralized config for easy swapping (currently in tailwind.config.ts and globals.css)
- Design database schema with client isolation in mind

## Current Phase
Phase 4: Approval Workflow (Current)
- [ ] Status transition component with validation
- [ ] Approval action modal with notes
- [ ] Email notifications for status changes
- [ ] Bulk approval functionality
- [ ] Approval history timeline

**Upcoming Phases:**
- Phase 5: AI Features (Relationship Suggestions, Risk Advisor)
- Phase 6: Collaboration Features (Threading, @mentions, Activity Feed)
- Phase 7: Reporting & Traceability
- Phase 8: Polish & Launch

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

## Story Relationships (Database Fields)
- `parent_story_id` TEXT - References parent story for hierarchy (one level)
- `related_stories` JSONB - Array of linked story IDs for similar stories

## Key Components

### Stories
- `components/stories/stories-list.tsx` - Client component with filtering, search, mobile card view, and virtual scrolling (50+ items)
- `components/stories/stories-list-realtime.tsx` - Wrapper that adds real-time subscriptions to StoriesList
- `components/stories/collapsible-section.tsx` - Reusable expand/collapse section with icon, badge support
- `components/stories/comments-section.tsx` - Real-time comments with submission form
- `components/stories/story-form.tsx` - Reusable form for create/edit with react-hook-form + Zod validation
- `components/stories/story-actions.tsx` - Edit/Delete buttons with confirmation dialog
- `components/stories/version-history.tsx` - Expandable version list with diff comparison
- `components/stories/related-stories-selector.tsx` - Search and select related/linked stories
- `components/stories/story-relationships-display.tsx` - Display parent, child, and related story links

### Hooks (Real-time Subscriptions)
- `hooks/use-realtime-subscription.ts` - Generic Supabase real-time subscription hook with cleanup
- `hooks/use-stories-subscription.ts` - Stories list subscription (INSERT/UPDATE/DELETE)
- `hooks/use-comments-subscription.ts` - Comments subscription filtered by story_id

### UI
- `components/ui/skeleton.tsx` - Skeleton loaders (Skeleton, SkeletonText, SkeletonCard, SkeletonTableRow, SkeletonStoriesTable, SkeletonStatsGrid)
- `components/ui/loading-spinner.tsx` - Loading spinner with sizes (sm, md, lg) and LoadingPage component

### Layout
- `components/layout/sidebar.tsx` - Role-based navigation (desktop)
- `components/layout/header.tsx` - User menu, notifications, mobile menu trigger
- `components/layout/mobile-nav.tsx` - Slide-out drawer navigation for mobile/tablet

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

## Known Technical Debt

1. **TypeScript checking disabled in builds** - `next.config.js` has `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. Need to fix Supabase type inference and re-enable.

## Future Features (Backlog)

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
