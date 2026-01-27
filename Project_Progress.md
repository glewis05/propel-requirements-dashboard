# Requirements Dashboard - Development Status

**Last Updated:** January 26, 2026
**Session:** Phase 3 - CRUD Operations & Versioning (Testing & Bug Fixes)

---

## Project Overview

Upgrading the Propel Health Requirements Dashboard from a static GitHub Pages site to an interactive, database-backed Next.js application with real-time collaboration, stakeholder approval workflows, and role-based access control.

**Full Project Plan:** `Requirements_Dashboard_Upgrade_Project_Plan.md`

---

## Completed Work

### 1. Supabase Database Schema Updates ✅

**Migration file:** `supabase/migrations/001_interactive_dashboard_schema.sql`

**New Tables Created:**
| Table | Purpose |
|-------|---------|
| `story_comments` | Threaded discussions on user stories |
| `story_approvals` | Immutable approval history for FDA 21 CFR Part 11 compliance |
| `story_versions` | Full version history with JSONB snapshots |

**Columns Added to `users` table:**
- `role` (TEXT) - User role: Portfolio Manager, Program Manager, Developer, Admin
- `assigned_programs` (TEXT[]) - Array of program IDs for Program Managers
- `avatar_url` (TEXT) - Profile picture URL
- `last_login_at` (TIMESTAMPTZ) - Activity tracking
- `auth_id` (UUID) - Link to Supabase Auth

**Columns Added to `user_stories` table:**
- `stakeholder_approved_by` (UUID) - Who gave stakeholder approval
- `stakeholder_approved_at` (TIMESTAMPTZ) - When approved
- `locked_by` (UUID) - Optimistic locking for concurrent edits
- `locked_at` (TIMESTAMPTZ) - When lock acquired

**Row Level Security (RLS):**
- 10 policies created for new tables
- Helper functions: `get_user_role()`, `get_user_programs()`, `can_access_story()`
- Enforces permission matrix from project plan

**Database Functions:**
- `create_story_version()` - Automatic version tracking trigger
- `acquire_story_lock()` - Acquire edit lock on story
- `release_story_lock()` - Release edit lock
- `is_story_locked()` - Check lock status

### 2. Next.js 14 Project Initialized ✅

**Tech Stack:**
- Next.js 14 (App Router)
- TypeScript 5.x
- Tailwind CSS with Propel Health branding
- Supabase SSR client
- Lucide React icons

**Project Structure:**
```
propel-requirements-dashboard/
├── app/
│   ├── globals.css              # Tailwind + Propel branding
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Redirect logic
│   ├── (auth)/
│   │   ├── login/page.tsx       # Magic link login UI
│   │   └── auth/callback/route.ts
│   └── (dashboard)/
│       ├── layout.tsx           # Sidebar + header layout
│       ├── dashboard/
│       │   ├── page.tsx         # Stats overview
│       │   ├── loading.tsx      # Dashboard loading skeleton
│       │   └── error.tsx        # Dashboard error boundary
│       ├── stories/
│       │   ├── page.tsx         # Story list with filters
│       │   ├── loading.tsx      # Stories loading skeleton
│       │   ├── error.tsx        # Stories error boundary
│       │   └── [id]/page.tsx    # Story detail with collapsible sections
│       ├── error.tsx            # Global dashboard error boundary
│       ├── approvals/page.tsx   # Approval queue
│       ├── reports/page.tsx     # Reports placeholder
│       └── admin/users/page.tsx # User management
├── components/layout/
│   ├── sidebar.tsx              # Role-based navigation
│   └── header.tsx               # User menu, notifications
├── components/stories/
│   ├── stories-list.tsx         # Client-side filtering & search
│   ├── stories-list-realtime.tsx # Real-time wrapper for stories list
│   ├── collapsible-section.tsx  # Reusable expand/collapse component
│   └── comments-section.tsx     # Real-time comments section
├── components/ui/
│   ├── loading-spinner.tsx      # Loading spinner with sizes
│   └── skeleton.tsx             # Skeleton loaders for loading states
├── hooks/
│   ├── use-realtime-subscription.ts  # Generic Supabase subscription hook
│   ├── use-stories-subscription.ts   # Stories list subscription
│   └── use-comments-subscription.ts  # Comments subscription
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Browser client
│   │   ├── server.ts            # Server client
│   │   └── middleware.ts        # Session refresh
│   └── utils.ts                 # cn() helper
├── types/
│   └── database.ts              # Full TypeScript types
├── middleware.ts                # Route protection
├── .env.local                   # Environment variables (configured)
├── tailwind.config.ts           # Propel branding colors
└── package.json
```

### 3. Authentication Setup ✅

- Magic link (passwordless) authentication configured
- Supabase Auth integration via `@supabase/ssr`
- Protected routes middleware
- Auth callback handler updates `last_login_at`
- Login page with Propel branding

### 4. Propel Health Branding ✅ (Updated Jan 26, 2026)

**Colors configured in Tailwind:**
- Primary: Propel Teal (#0C8181)
- Secondary/Gold: Propel Gold (#F9BC15)
- Navy: Dark Navy (#34353F)
- Teal Medium: #21B5B5
- Cyan: #30D9D8
- Cyan Light: #A0F1F1
- Light Blue: #8DAFCD
- Background: Light Gray (#F8FAFB)
- Success: Green (#059669)
- Warning: Gold (#F9BC15) - matches brand
- Destructive: Red (#DC2626)

**Fonts:**
- Headings/Body: Montserrat (Google Fonts)
- Code/IDs: JetBrains Mono

**Branding Applied To:**
- Login page (navy background, gold accents)
- Sidebar navigation (navy background, gold logo icon)
- Mobile navigation drawer (navy background, gold logo icon)
- "Powered by Propel Health Platform" tagline in sidebar and login

**Files Updated:**
- `tailwind.config.ts` - Propel color palette and Montserrat font
- `app/globals.css` - Google Fonts import, CSS variables
- `components/layout/sidebar.tsx` - Navy background, gold accents, PHP tagline
- `components/layout/mobile-nav.tsx` - Navy background, gold accents, PHP tagline
- `app/(auth)/login/page.tsx` - Navy background, gold accents, PHP tagline

### 5. Loading States & Error Boundaries ✅ (Jan 25, 2026)

**Loading Skeletons:**
- `components/ui/skeleton.tsx` - Reusable skeleton components (Skeleton, SkeletonText, SkeletonCard, SkeletonTableRow, SkeletonStoriesTable, SkeletonStatsGrid)
- `components/ui/loading-spinner.tsx` - Spinner with sizes (sm, md, lg) and LoadingPage component
- `app/(dashboard)/dashboard/loading.tsx` - Dashboard loading skeleton
- `app/(dashboard)/stories/loading.tsx` - Stories list loading skeleton

**Error Boundaries:**
- `app/(dashboard)/error.tsx` - Global dashboard error boundary
- `app/(dashboard)/dashboard/error.tsx` - Dashboard-specific error boundary
- `app/(dashboard)/stories/error.tsx` - Stories-specific error boundary

All error boundaries include retry functionality and navigation back to dashboard.

### 6. Story Detail View Improvements ✅ (Jan 25, 2026)

**Collapsible Section Component:**
- `components/stories/collapsible-section.tsx` - Reusable expand/collapse component with icons, badges, and animation

**Story Detail Page Features:**
- Header with story ID, status badge, priority badge, technical indicator
- Program name lookup (fetches from programs table instead of showing ID)
- Collapsible sections for:
  - User Story (with role/capability/benefit breakdown)
  - Acceptance Criteria
  - Success Metrics
  - Internal Notes (admin view)
  - Meeting Context
  - Client Feedback
  - Comments with add comment form
- Sidebar with:
  - Details card (Program, Category, Roadmap Target, Version, Created, Updated)
  - Approval Info (when applicable)
  - Version History (last 5 versions)
- Edit Story link button

### 7. Real-time Subscriptions ✅ (Jan 25, 2026)

**Architecture:** Wrapper component pattern - server components fetch initial data, client wrappers add real-time subscriptions.

**Hooks Created:**
- `hooks/use-realtime-subscription.ts` - Generic subscription hook with proper cleanup
- `hooks/use-stories-subscription.ts` - Stories list subscription (INSERT/UPDATE/DELETE)
- `hooks/use-comments-subscription.ts` - Comments subscription filtered by story_id

**Components Created:**
- `components/stories/stories-list-realtime.tsx` - Wrapper with "Live" indicator
- `components/stories/comments-section.tsx` - Real-time comments for story detail

**Pages Updated:**
- `app/(dashboard)/stories/page.tsx` - Uses `StoriesListRealtime` wrapper
- `app/(dashboard)/stories/[id]/page.tsx` - Uses `CommentsSection` component

**Features:**
- Stories list updates instantly when stories are added/edited/deleted
- Comments appear in real-time without page refresh
- "Live" indicator shows when real-time connection is active
- Error banner displays if subscription fails
- Proper cleanup on component unmount (no memory leaks)

**Supabase Configuration Required:**
Enable Realtime on tables in Dashboard > Database > Replication:
- `user_stories`
- `story_comments`

### 9. Phase 3 CRUD Testing & Bug Fixes ✅ (Jan 26, 2026)

**Bugs Fixed During Testing:**
1. **Program dropdown empty** - Fixed column name from `program_name` to `name` in queries
2. **Story creation failed with FK error** - Fixed trigger timing from BEFORE to AFTER INSERT
3. **Story creation blocked by RLS** - Added INSERT policy with program-based access
4. **Story updates not saving** - Added UPDATE policy with program-based access
5. **Story deletion not working** - Added DELETE policies for user_stories and related tables
6. **User Story section unclear** - Added visual indicator that either format is required

**New Features Added:**
- "In Development" and "In UAT" statuses added to workflow
- Delete protection for client-approved stories in protected statuses
- Clear (X) button on search bar in stories list

**Files Modified:**
- `types/database.ts` - Added new statuses, fixed programs schema
- `lib/validations/story.ts` - Added new statuses to Zod schema
- `components/stories/story-form.tsx` - Fixed program name reference, improved UX
- `components/stories/stories-list.tsx` - Added search clear button
- `app/(dashboard)/stories/actions.ts` - Added delete protection logic
- `app/(dashboard)/stories/new/page.tsx` - Fixed program query
- `app/(dashboard)/stories/[id]/edit/page.tsx` - Fixed program query

### 8. Authentication Testing ✅ (Previous Session)

**Issues Fixed:**
- Added missing `autoprefixer` dev dependency (`npm install -D autoprefixer`)
- Added `http://localhost:3000/auth/callback` to Supabase Auth Redirect URLs

**Successfully Tested:**
- Magic link authentication end-to-end ✅
- Login flow: email → magic link → redirect to dashboard ✅
- Dashboard displays with stats from existing data ✅
- User Stories page with filters (Program, Status, Priority) ✅
- Protected routes redirect unauthenticated users to login ✅

---

## Current State

### What's Working
- **Authentication:** Magic link login fully functional
- **Role-Based Access:** Admin role recognized and displayed correctly
- **Dashboard:** Shows Total Stories, Approved Stories, Pending Stories, Needs Discussion stats
- **User Stories:** Table view with filters for Program, Status, Priority
- **Story CRUD:** Create, Read, Update, Delete all working with proper RLS
- **Story Statuses:** Draft, Internal Review, Pending Client Review, Approved, In Development, In UAT, Needs Discussion, Out of Scope
- **Delete Protection:** Client-approved stories in Approved/In Development/In UAT cannot be deleted
- **Version History:** Automatic versioning via AFTER trigger
- **Navigation:** Sidebar with Dashboard, User Stories, role-based menu items
- **Session Management:** Middleware refreshes sessions and protects routes
- **RLS Policies:** Full CRUD policies for user_stories with program-based access control

### Logged In User
- **Email:** glenlewis05@gmail.com
- **Name:** Glen Lewis
- **Auth Status:** Authenticated via Supabase Auth
- **Role:** Admin ✅
- **Auth ID:** `63e6da88-1537-4e4b-8071-32be64e47592`

### Database Connection
- **URL:** `https://royctwjkewpnrcqdyhzd.supabase.co`
- **Connection String:** `postgresql://postgres.royctwjkewpnrcqdyhzd:[DB_PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres`
- **Existing Tables:** 44 tables with data (user_stories, programs, requirements, etc.)
- **New Tables:** 3 tables (story_comments, story_approvals, story_versions) - empty

### Known Configuration
- `.env.local` is configured with correct keys
- `.mcp.json` has Supabase MCP server config for Claude Code
- `.eslintrc.json` configured with `next/core-web-vitals` (added Jan 25)
- Supabase Auth Redirect URL: `http://localhost:3000/auth/callback` ✅

---

## Immediate Next Steps: Complete Phase 1 Deployment

### 1. Link Auth ID ✅ COMPLETED (Jan 25, 2026)

- Created user record for Glen Lewis with Admin role
- Linked Supabase Auth UUID: `63e6da88-1537-4e4b-8071-32be64e47592`
- Added RLS policies for users table (read/update own profile)

### 2. Vercel Deployment ✅ COMPLETED (Jan 25, 2026)

- Deployed to: `https://propel-requirements-dashboard.vercel.app`
- Environment variables configured in Vercel
- Auth callback URL added to Supabase: `https://propel-requirements-dashboard.vercel.app/auth/callback`

### 3. GitHub Actions CI/CD ✅ COMPLETED (Jan 25, 2026)

- Workflow file: `.github/workflows/ci.yml`
- Runs on push to main and pull requests
- Steps: install dependencies → lint → build
- GitHub secrets configured: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## What's Left to Do

### Phase 1: Foundation & Authentication ✅ COMPLETE
- [x] Test magic link authentication end-to-end ✅
- [x] Link Glen Lewis's `auth_id` and set role to Admin ✅
- [x] Add RLS policies for users table (read/update own profile) ✅
- [x] Deploy initial version to Vercel ✅
- [x] Configure GitHub Actions for CI/CD ✅

### Phase 2: Core Dashboard & Data Display ✅ COMPLETE
- [x] Add client-side filtering/search functionality ✅
- [x] Create story detail view with expand/collapse sections ✅
- [x] Add loading states and error boundaries ✅
- [x] Implement real-time subscriptions for live updates ✅
- [x] Mobile navigation drawer ✅ (Jan 26, 2026)
- [x] Mobile responsive card view for stories list ✅ (Jan 26, 2026)
- [x] Mobile responsive story detail page ✅ (Jan 26, 2026)
- [x] Mobile responsive dashboard + approvals pages ✅ (Jan 26, 2026)
- [x] Virtual scrolling for large story lists (50+ items) ✅ (Jan 26, 2026)

### Phase 3: CRUD Operations & Versioning ✅ COMPLETE (Jan 26, 2026)
- [x] Story creation form with validation ✅
- [x] Story edit page with optimistic locking ✅
- [x] Story deletion with confirmation (Admin only) ✅
- [x] Version history diff viewer with compare mode ✅
- [x] Comment submission with real-time updates ✅
- [x] Added "In Development" and "In UAT" statuses ✅
- [x] Delete protection for client-approved stories in protected statuses ✅
- [x] Program-based RLS policies for INSERT/UPDATE/DELETE ✅
- [ ] Rich text editor for acceptance criteria (deferred)
- [ ] Baselining capability for releases (deferred)
- [ ] Story templates (deferred)

### Phase 3.5: Story Relationships (NEW - Jan 26, 2026)
**Stakeholder Request:** Enable linking and hierarchy for related requirements

**Linked Stories (Similar/Related)**
- [ ] UI to link stories on story detail page
- [ ] Bidirectional link display (A→B shows B→A)
- [ ] Visual indicator on story cards showing link count
- [ ] Linked stories section on detail page

**Parent-Child Hierarchy**
- [ ] UI to set parent story on detail/edit page
- [ ] One level deep only (parent → children)
- [ ] Parent story display when viewing child
- [ ] Children list when viewing parent

**Visual Relationship Display**
- [ ] "Related Stories" collapsible section
- [ ] "Parent Story" link display
- [ ] "Child Stories" list display
- [ ] Navigation between related stories

**AI Relationship Suggestions**
- [ ] AI analyzes new stories for similarities
- [ ] Suggests: "Similar to [X] - link them?"
- [ ] Suggests: "Child of [Y] - nest it?"
- [ ] Accept/reject/dismiss UI
- [ ] Confidence scores displayed
- [ ] API endpoint: POST /api/ai/suggest-relationships

### Phase 4: Approval Workflow
- [ ] Status transition component with validation
- [ ] Approval action modal with notes
- [ ] Email notifications for status changes
- [ ] Bulk approval functionality
- [ ] Approval history timeline

### Phase 5: Collaboration Features
- [x] Comment submission with real-time updates ✅ (moved to Phase 3)
- [ ] Comment threading (reply to comments)
- [ ] @mentions with autocomplete
- [ ] Activity feed
- [ ] Developer Q&A workflow
- [ ] In-app notification center

### Phase 6: Reporting & Traceability
- [ ] Traceability matrix generation
- [ ] Coverage gap analysis
- [ ] PDF/Excel export
- [ ] Scheduled reports

### Phase 7: Polish & Launch
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Production deployment

---

## Future Features (Backlog)

### Risk Assessment Tool with AI Advisor
**Added:** January 25, 2026
**Design Completed:** January 26, 2026

**Full Design Document:** `docs/AI_Risk_Advisor_Design.md`

**Problem Statement:**
Many stakeholders involved in prioritizing and scheduling requirements lack experience in software development risk management. They need guidance when evaluating requirements to make informed decisions about priority and timeline.

**Solution: AI Risk Advisor**
An embedded intelligent agent that analyzes user stories against program goals, dependencies, and historical patterns to provide actionable risk assessments and recommendations.

**Core Features:**
1. **Goals Management** - Define quarterly/yearly program goals for alignment tracking
2. **AI-Powered Analysis** - Claude API analyzes stories and generates risk assessments
3. **Risk Scoring Matrix** - Likelihood × Impact (1-25 scale) with configurable factors
4. **Conversational Interface** - Ask follow-up questions about risk mitigation
5. **Goal Alignment** - Automatic detection of how stories support/conflict with goals
6. **Risk Dashboard** - Portfolio-level risk visualization and trends

**Risk Categories (Configurable):**
- Technical Complexity
- External Dependencies
- Resource Availability
- Knowledge/Skill Gap
- Integration Risk
- Compliance Impact
- Timeline Pressure
- Scope Clarity

**New Database Tables:**
- `program_goals` - Strategic goals by program/quarter/year
- `story_risk_assessments` - Immutable assessment records with AI analysis
- `risk_conversations` - Chat history with AI advisor
- `goal_story_alignments` - Explicit goal-to-story relationships
- `risk_factors_catalog` - Configurable risk factor definitions

**API Endpoints:**
- `POST /api/risk-advisor/analyze` - Generate AI risk assessment
- `POST /api/risk-advisor/chat` - Conversational follow-up
- `GET /api/risk-advisor/history/[storyId]` - Assessment history
- `CRUD /api/goals` - Goals management

**Implementation Phases:**
1. Foundation (2 weeks) - Database, types, goals CRUD
2. Core Risk Assessment (2 weeks) - AI integration, basic UI
3. Conversational Interface (2 weeks) - Chat system
4. Goal Alignment (2 weeks) - Alignment detection and visualization
5. Dashboard & Reporting (2 weeks) - Portfolio risk views
6. Polish & Optimization (2 weeks) - Testing, performance, docs

**Estimated Timeline:** 12 weeks after Phase 4 (Approval Workflow)

**Cost Estimate:** $1-40/month depending on usage (Claude API)

**Target Users:**
- Program Managers (primary)
- Portfolio Managers
- Stakeholders without technical risk management background

**Dependencies:**
- Core CRUD operations (Phase 3)
- Approval workflow (Phase 4)

**Compliance:**
- FDA 21 CFR Part 11 compliant audit trail
- Immutable assessment records
- Human review required for AI assessments
- Full prompt/response logging capability

---

## Important Notes

### Version Trigger Active
The `user_stories_version_trigger` is active. Any INSERT or UPDATE to `user_stories` will automatically create a version record in `story_versions`. This requires `auth.uid()` to be set (i.e., authenticated requests).

**CRITICAL:** The trigger must be set to **AFTER INSERT OR UPDATE**, not BEFORE. If set to BEFORE, it will fail with foreign key constraint errors because the story row doesn't exist yet when the trigger fires. Fixed Jan 26, 2026:
```sql
DROP TRIGGER IF EXISTS user_stories_version_trigger ON user_stories;
CREATE TRIGGER user_stories_version_trigger
AFTER INSERT OR UPDATE ON user_stories
FOR EACH ROW EXECUTE FUNCTION create_story_version();
```

### RLS Policies on `users` Table
Row Level Security is enabled on the `users` table. The following policies were added (Jan 25, 2026):
- `"Users can read own profile"` - SELECT where `auth_id = auth.uid()`
- `"Users can update own profile"` - UPDATE where `auth_id = auth.uid()`

**Important:** Without these policies, the app cannot fetch the user's role after login, causing it to default to "Developer".

### RLS Policies on `programs` Table
Row Level Security is enabled. Added (Jan 25, 2026):
- `"Anyone can read programs"` - SELECT with `USING (true)` (public read access)

### RLS Policies on `user_stories` Table
Row Level Security is enabled. Added (Jan 25, 2026):
- `"Authenticated users can read stories"` - SELECT where `auth.uid() IS NOT NULL`

### RLS Policies on Other Tables
Row Level Security is enabled on new tables (story_comments, story_approvals, story_versions). For development/testing with service role, RLS is bypassed. For client-side queries with anon key, policies will enforce access based on user role.

### npm Vulnerabilities
`npm audit` reports 4 vulnerabilities (3 high, 1 critical). Can be addressed with `npm audit fix` when ready, but doesn't block development.

---

## Lessons Learned

### Session: January 25, 2026

**1. Users Table Was Empty**
The `users` table had no records. New users authenticated via Supabase Auth need a corresponding record in the `users` table with their `auth_id` linked.

**2. RLS Blocks Client Reads by Default**
Even with a user record, RLS was blocking the app from reading it. Had to add explicit SELECT/UPDATE policies for users to read their own profile.

**3. Check Constraints Matter**
The `users.status` column has a check constraint requiring exact values: `'Active'`, `'Inactive'`, or `'Terminated'` (case-sensitive). Using `'active'` fails silently in some cases.

**4. Use RETURNING for Debugging Inserts**
When INSERT seems to succeed but SELECT returns nothing, use `INSERT ... RETURNING *` to see if the row was actually created and catch constraint violations.

**5. Supabase SQL Editor Quirks**
- The editor may append metadata to queries causing syntax errors
- Setting "No limit" or using single-line queries can help
- Run as postgres/superuser to bypass RLS when debugging

**6. TypeScript Build Errors with Supabase**
The Supabase client returns `never` types when TypeScript can't infer table types from queries. Temporarily disabled type checking in `next.config.js` to allow builds. TODO: Fix type inference properly by either:
- Regenerating database types with `supabase gen types typescript`
- Adding explicit type casts to queries
- Updating Supabase client typing

**7. Programs Table Schema**
The `programs` table uses `name` (not `program_name`) for the program display name. Key columns:
- `program_id` (TEXT, PK) - Unique identifier
- `name` (TEXT) - Display name
- `prefix` (TEXT) - Short code
- `description` (TEXT)
- `status` (TEXT) - 'Active', etc.
- `client_id` (TEXT, FK) - Reference to clients table

**8. Version Trigger Requires Auth**
When inserting test data directly via SQL Editor, disable the `user_stories_version_trigger` first:
```sql
ALTER TABLE user_stories DISABLE TRIGGER user_stories_version_trigger;
-- Insert data here
ALTER TABLE user_stories ENABLE TRIGGER user_stories_version_trigger;
```

**9. RLS Policies Required for Data Access**
Both `programs` and `user_stories` tables have RLS enabled. Without SELECT policies, the app shows empty tables even when data exists.

### Session: January 26, 2026 (Phase 3 CRUD Testing)

**11. Database Trigger Timing is Critical**
The `user_stories_version_trigger` was originally set to BEFORE INSERT, which caused foreign key violations when creating stories. The trigger tries to insert into `story_versions` with the new `story_id`, but BEFORE INSERT means the story doesn't exist yet. **Fix:** Change trigger to AFTER INSERT OR UPDATE:
```sql
DROP TRIGGER IF EXISTS user_stories_version_trigger ON user_stories;
CREATE TRIGGER user_stories_version_trigger
AFTER INSERT OR UPDATE ON user_stories
FOR EACH ROW EXECUTE FUNCTION create_story_version();
```

**12. RLS Policies Needed for All CRUD Operations**
RLS blocks operations silently if no policy exists. For full CRUD functionality, `user_stories` needs:
- SELECT policy (read)
- INSERT policy (create) - restrict by `assigned_programs` or role
- UPDATE policy (edit) - restrict by `assigned_programs` or role
- DELETE policy (delete) - Admin only, with business rule protection

**13. Cascading Deletes Require Related Table Policies**
When deleting a story, related records (comments, approvals, versions) must also be deleted. Each related table needs its own DELETE policy for Admins.

**14. Business Rules in RLS Policies**
RLS can enforce business rules like "cannot delete client-approved stories in protected statuses" directly in the policy:
```sql
AND NOT (
  stakeholder_approved_at IS NOT NULL
  AND status IN ('Approved', 'In Development', 'In UAT')
)
```

**15. Form Validation User Feedback**
When a form field is conditionally required (e.g., "user_story OR role+capability"), the UI should clearly indicate this with visual markers and explanatory text.

**10. User Setup SQL Reference**
```sql
-- Create new user linked to Supabase Auth
INSERT INTO users (user_id, name, email, role, auth_id, status, created_at, updated_at)
VALUES (
  'user-[unique-id]',
  '[Full Name]',
  '[email@domain.com]',
  '[Admin|Portfolio Manager|Program Manager|Developer]',
  '[supabase-auth-uuid]',
  'Active',
  NOW(),
  NOW()
)
RETURNING *;

-- RLS policies needed for users table
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth_id = auth.uid());

-- RLS policies needed for programs table
CREATE POLICY "Anyone can read programs" ON programs FOR SELECT USING (true);

-- RLS policies needed for user_stories table
CREATE POLICY "Authenticated users can read stories" ON user_stories
FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Program-based access
CREATE POLICY "Users can insert stories for assigned programs" ON user_stories
FOR INSERT TO authenticated
WITH CHECK (
  program_id IN (SELECT unnest(assigned_programs) FROM users WHERE auth_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('Admin', 'Portfolio Manager'))
);

-- UPDATE: Program-based access
CREATE POLICY "Users can update stories for assigned programs" ON user_stories
FOR UPDATE TO authenticated
USING (
  program_id IN (SELECT unnest(assigned_programs) FROM users WHERE auth_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('Admin', 'Portfolio Manager'))
)
WITH CHECK (
  program_id IN (SELECT unnest(assigned_programs) FROM users WHERE auth_id = auth.uid())
  OR EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role IN ('Admin', 'Portfolio Manager'))
);

-- DELETE: Admin only, with protection for client-approved stories
CREATE POLICY "Admins can delete non-protected stories" ON user_stories
FOR DELETE TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE auth_id = auth.uid() AND role = 'Admin')
  AND NOT (stakeholder_approved_at IS NOT NULL AND status IN ('Approved', 'In Development', 'In UAT'))
);

-- DELETE policies for related tables (cascading delete support)
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

---

## Next Steps When Resuming

### Phase 3.5: Story Relationships (Next)
1. **Linked Stories UI** - Add ability to link related/similar stories
2. **Parent-Child Hierarchy** - One level deep nesting
3. **Visual Relationship Display** - Show links on detail page
4. **AI Suggestions** - Auto-detect similar stories (future)

### Phase 4: Approval Workflow
- Status transition component with validation
- Approval action modal with notes
- Email notifications for status changes
- Bulk approval functionality

### Deferred Items (Phase 3)
- Rich text editor for acceptance criteria
- Baselining capability for releases
- Story templates

---

## Files to Review Before Resuming

1. `CLAUDE.md` - Quick reference for Claude Code sessions
2. `Requirements_Dashboard_Upgrade_Project_Plan.md` - Full project specification
3. `supabase/migrations/001_interactive_dashboard_schema.sql` - Database changes
4. `types/database.ts` - TypeScript types for all tables
5. `tailwind.config.ts` - Branding configuration
6. `middleware.ts` - Route protection logic
7. `.eslintrc.json` - ESLint configuration

---

## Quick Resume Commands

```bash
# Navigate to project
cd /Volumes/personal_folder/CoyoteJutes_Work/02_Development/propel-requirements-dashboard

# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Connect to Supabase via psql (password in Supabase Dashboard > Settings > Database)
PGPASSWORD='[YOUR_DB_PASSWORD]' psql -h aws-0-us-west-2.pooler.supabase.com -p 5432 -U postgres.royctwjkewpnrcqdyhzd -d postgres
```

---

*This document should be updated at the end of each development session.*
