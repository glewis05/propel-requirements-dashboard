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
- **Styling:** Tailwind CSS with Providence branding (teal primary #0F766E, navy secondary #1E3A5F)
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
- `programs` - Program/project containers
- `story_comments` - Threaded discussions (RLS enforced)
- `story_approvals` - Immutable approval audit trail (RLS enforced)
- `story_versions` - Automatic version history via trigger (RLS enforced)

### Database Functions (call via `supabase.rpc()`)
- `acquire_story_lock(p_story_id)` - Get 5-minute edit lock
- `release_story_lock(p_story_id)` - Release edit lock
- `is_story_locked(p_story_id)` - Check if another user holds lock
- `get_user_role()` / `get_user_programs()` - Used by RLS policies

### Story Status Workflow
`Draft` → `Internal Review` → `Pending Client Review` → `Approved` (or `Needs Discussion` / `Out of Scope`)

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

## Multi-Client Considerations
Future requirement to support multiple clients (e.g., Providence, Kaiser):
- Approach TBD - options include:
  - Separate deployments per client with different branding/config
  - Single multi-tenant app with client isolation
  - White-label solution with configurable theming
- Keep branding tokens/colors in centralized config for easy swapping
- Design database schema with client isolation in mind

## Current Phase
Phase 1: Foundation & Authentication (nearly complete)
- Auth working, dashboard functional
- Admin user (Glen Lewis) linked and verified
- **Next:** Deploy to Vercel, set up CI/CD

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

## RLS Policies on `users` Table

These policies are required for the app to read user profiles:
```sql
CREATE POLICY "Users can read own profile" ON users FOR SELECT USING (auth_id = auth.uid());
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth_id = auth.uid());
```

Without these, the dashboard defaults all users to "Developer" role.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| User shows as "Developer" instead of actual role | Missing RLS policy or no user record | Add RLS policies, verify user record exists with correct auth_id |
| INSERT succeeds but SELECT returns nothing | RLS blocking read | Run as superuser or add SELECT policy |
| Status constraint error | Wrong case | Use 'Active' not 'active' |
| Queries fail with syntax errors in Supabase SQL Editor | Editor appending metadata | Use "No limit" setting or single-line queries |
| Build fails with "type 'never'" errors | Supabase type inference issue | Temporarily: `ignoreBuildErrors: true` in next.config.js. Properly: regenerate types with `supabase gen types typescript` |

## Known Technical Debt

1. **TypeScript checking disabled in builds** - `next.config.js` has `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. Need to fix Supabase type inference and re-enable.

## Future Features (Backlog)

### Risk Assessment Tool
Help users without software risk management experience evaluate requirements for prioritization and scheduling. Features may include:
- Risk scoring matrix (likelihood × impact)
- Guided assessment questionnaire
- Risk categories: technical complexity, dependencies, resources, skills, integration, security, timeline
- Visual risk indicators on story cards
- Risk-adjusted priority recommendations
- AI-assisted risk identification from story content

See `Project_Progress.md` for full details.
