# Changelog

All notable changes to the Propel Requirements Dashboard will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

---

## [0.9.0] - 2026-01-30

### Added
- **Rule Update Story Type** - New story type for NCCN/TC healthcare rule engine updates with structured test cases
- Story type selector on new story page (User Story vs Rule Update choice)
- `rule_update_details` table for rule-specific metadata (rule_type, target_rule, change_id, etc.)
- `rule_update_test_cases` table for structured test case management with patient conditions
- `rule_update_history` table for immutable FDA 21 CFR Part 11 compliant audit trail
- Auto-generated Profile IDs for test cases (format: `TP-{RULE}-{TYPE}-{SEQ}-{PLATFORM}`)
- Rule update form with collapsible sections for rule details, description, change summary, and test cases
- Test case editor with patient conditions builder (PHX, FDR, SDR fields)
- Test steps editor for structured navigation paths and actions
- Rule update detail view with formatted rule information and test case list
- Story type filter dropdown on stories list (All Types, User Stories, Rule Updates)
- NCCN/TC rule type badges on story cards and list
- Server actions: `createRuleUpdateStory`, `updateRuleUpdateDetails`, `getRuleUpdateDetails`, `getRuleTestCases`, `addRuleTestCase`, `updateRuleTestCase`, `deleteRuleTestCase`, `generateProfileId`, `getRuleUpdateHistory`
- Constants module (`lib/rule-update/constants.ts`) for platforms (P4M, Px4M), rule types, change types, test types
- Zod validation schemas for rule update forms and test cases (`lib/validations/rule-update.ts`)
- TypeScript interfaces for rule updates (`types/rule-update.ts`)

### Changed
- `user_stories` table now includes `story_type` column with values 'user_story' or 'rule_update'
- Stories list component extended to display rule_type and target_rule for rule update stories
- Story detail page conditionally renders RuleUpdateDetailView or traditional view based on story_type
- New story page uses wrapper component for type selection flow

### Database
- Migration `011_rule_update_schema.sql` adds all rule update tables, RLS policies, triggers, and profile ID generation function

---

## [0.8.1] - 2026-01-29

### Added
- AI relationship suggestions now work in both create and edit modes (previously only edit mode)
- `onSetParent` callback support in AIRelationshipSuggestions component for form integration
- `programId` prop support in AIRelationshipSuggestions for create mode context
- UAT Enhancements Roadmap documentation (`docs/UAT_ENHANCEMENTS_ROADMAP.md`)

### Changed
- Story detail view tile order now matches form view order (Story Relationships before Acceptance Criteria)
- CollapsibleSection component now uses `overflow-visible` to prevent dropdown clipping
- AIRelationshipSuggestions `storyId` prop is now optional to support create mode

### Fixed
- Related Stories dropdown being cut off by container boundaries in story form
- AI suggestion buttons not appearing in create mode for relationships section

---

## [0.8.0] - 2026-01-28

### Added
- Grouped sidebar navigation with section labels (Core / Workflow / Admin)
- Gold left border indicator on active navigation items
- Active filter chips with individual dismiss buttons on stories list
- Accessible badge icons on status/priority badges (WCAG compliance)
- Enhanced empty states with icons and CTA buttons
- Shared navigation config module (`lib/navigation.ts`)
- Shared badge config module (`lib/badge-config.ts`)
- UAT navigation entry (was missing from mobile nav)

### Changed
- Search placeholder updated to "Search by title, ID, or description..."
- New Story button made more prominent with `font-semibold` and shadow

### Fixed
- Duplicate heading bug in header (`<h1>` changed to `<p aria-hidden="true">`)
- Mobile navigation missing UAT entry

---

## [0.7.0] - 2026-01-27

### Added
- AI relationship suggestions using Claude API
- AI acceptance criteria generation
- `AIRelationshipSuggestions` component
- `AIAcceptanceCriteria` component
- AI availability check (`checkAIAvailability()`)

### Changed
- Story relationships section now includes AI suggestion button

---

## [0.6.0] - 2026-01-27

### Added
- Requirements table schema update (added `id`, `status`, `category` columns)
- Requirement-story mapping table for traceability
- Traceability matrix report page (`/reports/traceability`)
- Program summary report page (`/reports/program-summary`)
- Coverage report page (`/reports/coverage`)
- Approval history report page (`/reports/approvals`)
- CSV export for all reports
- Database views: `traceability_matrix`, `requirement_coverage_summary`, `story_coverage`

---

## [0.5.0] - 2026-01-27

### Added
- Comment threading (replies up to 3 levels deep)
- @mentions with autocomplete and notifications
- Activity feed page (`/activity`)
- Questions page with Q&A workflow (`/questions`)
- Accept/unaccept answer functionality for Q&A
- In-app notification center (bell icon dropdown)
- `MentionInput` component for @mentions autocomplete
- `ActivityFeed` component
- `NotificationBell` component
- `activity_log` and `user_notifications` database tables

---

## [0.4.0] - 2026-01-27

### Added
- Status transition component with role-based permissions
- Approval action modal with notes
- Email notifications for status changes via Resend
- Notification settings page (`/settings/notifications`)
- Approval history timeline on story detail page
- `StatusTransition` component
- `ApprovalHistoryTimeline` component
- `notification_preferences` database migration

---

## [0.3.5] - 2026-01-26

### Added
- Story relationships feature (parent-child hierarchy, related/linked stories)
- Related stories selector component
- Story relationships display component
- Bidirectional link display (A→B shows B→A)
- Visual indicator on story cards showing link count
- `parent_story_id` and `related_stories` fields in database

---

## [0.3.0] - 2026-01-26

### Added
- Story creation form with validation (react-hook-form + Zod)
- Story edit page with optimistic locking
- Story deletion with confirmation dialog (Admin only)
- Version history diff viewer with compare mode
- Comment submission with real-time updates
- "In Development" and "In UAT" statuses
- Delete protection for client-approved stories in protected statuses
- Program-based RLS policies for INSERT/UPDATE/DELETE
- Clear (X) button on search bar

### Fixed
- Program dropdown empty (column name fix)
- Story creation FK error (trigger timing fix)
- Story creation/update blocked by RLS (policy additions)
- User Story section unclear (visual indicator added)

---

## [0.2.0] - 2026-01-26

### Added
- Mobile navigation drawer
- Mobile responsive card view for stories list
- Mobile responsive story detail page
- Mobile responsive dashboard and approvals pages
- Virtual scrolling for large story lists (50+ items)
- Real-time subscriptions for stories and comments
- "Live" indicator for real-time connection status

---

## [0.1.0] - 2026-01-25

### Added
- Initial Next.js 14 project setup with App Router
- Supabase integration (PostgreSQL with RLS)
- Magic link (passwordless) authentication
- Dashboard with story statistics
- User Stories list page with filters (Program, Status, Priority)
- Story detail page with collapsible sections
- Loading states and error boundaries
- Propel Health branding (teal, gold, navy, Montserrat font)
- Role-based access control (Admin, Portfolio Manager, Program Manager, Developer)
- Vercel deployment
- GitHub Actions CI/CD

### Database
- `story_comments` table for threaded discussions
- `story_approvals` table for FDA 21 CFR Part 11 compliance
- `story_versions` table for full version history
- Row Level Security policies for all tables
- Database functions for locking and versioning
