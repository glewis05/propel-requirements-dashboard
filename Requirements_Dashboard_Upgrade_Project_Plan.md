**REQUIREMENTS DASHBOARD**

Interactive Platform Upgrade

Project Plan & Technical Specification

**Propel Health**

January 23, 2026

Version 1.0

**1. Executive Summary**

This document outlines the project plan for upgrading the Propel Health
Requirements Dashboard from a static GitHub Pages site to an
interactive, database-backed application. The upgrade will enable
real-time collaboration, stakeholder approval workflows, and role-based
access control.

**1.1 Project Objectives**

-   Replace static HTML dashboard with interactive React-based
    application

-   Enable CRUD operations for user stories, acceptance criteria,
    priorities, risk assessments, and related artifacts

-   Implement stakeholder approval workflow with immutable audit trail

-   Establish role-based access control (Portfolio Manager, Program
    Manager, Developer, Admin)

-   Provide real-time collaboration features including comments and
    notifications

-   Maintain compliance audit trail for FDA 21 CFR Part 11 requirements

-   Enable end-to-end traceability from requirements to test cases and
    releases

-   Support requirements versioning and baselining for change tracking

-   Provide impact analysis when requirements change

-   Generate traceability matrices and coverage reports on demand

**1.2 Success Criteria**

-   All existing dashboard functionality preserved and enhanced

-   Stakeholders can create, modify, collaborate on, approve/reject, and
    prioritize stories directly in the application

-   Complete audit trail of all changes with user attribution

-   Authentication via magic link (passwordless)

-   Response time under 2 seconds for all operations

-   Zero data loss during migration from SQLite to Supabase

-   Traceability coverage of 100% for approved stories to test cases

-   Version history accessible for all requirements with diff comparison

-   Export capability to Excel, PDF, and Word formats

**2. Current State vs Target State**

  ----------------------- ----------------------- -----------------------
  **Aspect**              **Current State**       **Target State**

  Data Storage            SQLite (local)          Supabase (PostgreSQL
                                                  cloud)

  Frontend                Static HTML (10,000+    Next.js 14 React
                          lines)                  application

  Updates                 Manual regeneration via Real-time sync with
                          Python script           database

  User Actions            View only               Create, Edit, Approve,
                                                  Comment

  Authentication          None (public GitHub     Magic link (Supabase
                          Pages)                  Auth)

  Access Control          None                    Role-based (4 roles)

  Collaboration           Export/email PDF        In-app comments,
                                                  \@mentions

  Audit Trail             Separate audit_history  Immutable, integrated
                          table                   logging

  Traceability            Manual linking          Automated
                                                  requirement-to-test
                                                  linking

  Versioning              None                    Full version history
                                                  with diff

  Hosting                 GitHub Pages (static)   Vercel (serverless)
  ----------------------- ----------------------- -----------------------

**3. User Roles & Permissions**

**3.1 Role Definitions**

  ----------------- ----------------------------------- -----------------
  **Role**          **Description**                     **Example Users**

  Portfolio Manager Oversees all programs, approves     Kate
                    roadmap placement, final sign-off   

  Program Manager   Manages specific program(s),        Kim (P4M), TBD
                    creates/edits stories, approves     (GenoRx)
                    content                             

  Developer         Views approved stories and tests,   Development team
                    asks clarifying questions           

  Admin             Full system access, user            Glen Lewis
                    management, configuration           
  ----------------- ----------------------------------- -----------------

**3.2 Permission Matrix**

  --------------------- ------------- ------------ --------------- ------------
  **Action**            **Portfolio   **Program    **Developer**   **Admin**
                        Mgr**         Mgr**                        

  View all stories      ✓             Own          Approved only   ✓
                                      program(s)                   

  Create stories        ---           ✓            ---             ✓

  Edit stories          ---           Own          ---             ✓
                                      program(s)                   

  Delete stories        ---           ---          ---             ✓

  Approve stories       Final         Content      ---             ✓
                        approval      approval                     

  Add comments          ✓             ✓            Questions only  ✓

  Nominate priority     ---           ✓            ---             ✓

  Approve priority      ✓             ---          ---             ✓

  Set roadmap target    ✓             Suggest only ---             ✓

  Manage users          ---           ---          ---             ✓

  View audit trail      ✓             Own          ---             ✓
                                      program(s)                   

  Export reports        ✓             Own          ---             ✓
                                      program(s)                   
  --------------------- ------------- ------------ --------------- ------------

**4. Approval Workflow**

**4.1 Status Progression**

User stories progress through the following statuses, with each
transition logged for audit compliance:

  --------------- ------------------------ -------------- ---------------
  **Status**      **Description**          **Who Can      **Next Status
                                           Transition**   Options**

  Draft           Initial creation, work   Program        Internal Review
                  in progress              Manager, Admin 

  Internal Review Ready for internal team  Admin          Pending Client
                  review                                  Review, Needs
                                                          Discussion

  Pending Client  Sent to Program Manager  Admin          Approved, Needs
  Review          (stakeholder) for review                Discussion

  Approved        Final approval, ready    Portfolio      Needs
                  for development          Manager        Discussion

  Needs           Requires clarification   Anyone         Draft (returns
  Discussion      or changes                              to Admin)

  Out of Scope    Explicitly excluded from Portfolio      ---
                  project                  Manager, Admin 
  --------------- ------------------------ -------------- ---------------

**4.2 Workflow Diagram**

The approval workflow follows this progression:

Draft → Internal Review → Pending Client Review → Approved

At any point, a story can be moved to \'Needs Discussion\' which returns
it to the Admin for revision. The Program Manager acts as the
client/stakeholder who reviews stories during the \'Pending Client
Review\' stage. Final approval authority rests with the Portfolio
Manager.

**4.3 Audit Requirements**

Each status transition will capture:

-   User ID and name of person making the change

-   Timestamp (UTC) of the transition

-   Previous status and new status

-   Optional notes/reason for the change

-   IP address (for compliance)

-   Session ID for traceability

**5. Technology Stack**

**5.1 Stack Overview**

  ----------------- --------------------- -------------------------------
  **Layer**         **Technology**        **Purpose**

  Frontend          Next.js 14 (App       React-based framework with
  Framework         Router)               server components, routing, and
                                          API routes

  UI Components     Tailwind CSS +        Utility-first CSS with
                    shadcn/ui             accessible component library

  Database          Supabase (PostgreSQL) Managed PostgreSQL with
                                          real-time subscriptions and Row
                                          Level Security

  Authentication    Supabase Auth         Magic link (passwordless)
                                          authentication

  Dev Tooling       Supabase MCP          Direct database access for
                                          Claude Code during development

  Hosting           Vercel                Serverless hosting with
                                          automatic deployments from
                                          GitHub

  Version Control   GitHub                Source code management and
                                          CI/CD trigger

  TypeScript        TypeScript 5.x        Type safety and better
                                          developer experience
  ----------------- --------------------- -------------------------------

**5.2 Why This Stack**

Next.js + Supabase + Vercel was selected for the following reasons:

-   Novice-friendly: Excellent documentation, large community, extensive
    tutorials

-   Claude Code compatible: React/TypeScript is well-supported for
    AI-assisted development

-   Real-time ready: Supabase subscriptions enable instant updates
    across all connected clients

-   Auth included: Supabase Auth handles login flows, password reset,
    and session management

-   Row Level Security: Database-level permission enforcement ensures
    data isolation

-   Free tier: Both Vercel and Supabase offer generous free tiers for
    initial development

-   One-click deploy: Push to GitHub automatically triggers Vercel
    deployment

**5.3 Architecture Diagram**

The system uses a three-tier architecture with clear separation of
concerns:

  ----------------- --------------------- -------------------------------
  **Component**     **Technology**        **Responsibility**

  Browser (Client)  Next.js React App     User interface, form handling,
                                          local state management

  Hosting (Server)  Vercel Serverless     Static file serving, API
                                          routes, server-side rendering

  Database          Supabase PostgreSQL   Data storage, authentication,
  (Backend)                               real-time subscriptions, Row
                                          Level Security
  ----------------- --------------------- -------------------------------

**Data Flow:**

-   User opens browser and navigates to the application (hosted on
    Vercel)

-   Vercel serves the Next.js application and handles server-side
    rendering

-   Application connects to Supabase for authentication (magic link sent
    via email)

-   User clicks magic link in email, Supabase validates and creates
    session

-   Authenticated requests go from Browser → Vercel → Supabase

-   Supabase enforces Row Level Security based on user role

-   Real-time updates pushed from Supabase → Browser via WebSocket

**6. Database Schema Updates**

The existing Supabase schema (44 tables) requires the following
additions to support the interactive features:

**6.1 New Tables**

**story_comments**

Enables threaded discussions on user stories:

  --------------------- ----------------- -------------------------------
  **Column**            **Type**          **Description**

  id                    UUID (PK)         Auto-generated unique
                                          identifier

  story_id              TEXT (FK)         Reference to
                                          user_stories.story_id

  user_id               UUID (FK)         Reference to auth.users

  parent_comment_id     UUID (FK)         For threaded replies (nullable)

  content               TEXT              Comment content (markdown
                                          supported)

  is_question           BOOLEAN           Flag for developer questions

  resolved              BOOLEAN           Whether question has been
                                          answered

  created_at            TIMESTAMPTZ       When comment was created

  updated_at            TIMESTAMPTZ       When comment was last edited
  --------------------- ----------------- -------------------------------

**story_approvals**

Tracks approval history for compliance audit trail:

  --------------------- ----------------- -------------------------------
  **Column**            **Type**          **Description**

  id                    UUID (PK)         Auto-generated unique
                                          identifier

  story_id              TEXT (FK)         Reference to
                                          user_stories.story_id

  approved_by           UUID (FK)         Reference to auth.users

  approval_type         TEXT              internal_review, stakeholder,
                                          portfolio

  status                TEXT              approved, rejected,
                                          needs_discussion

  previous_status       TEXT              Status before this approval
                                          action

  notes                 TEXT              Approval comments or rejection
                                          reason

  approved_at           TIMESTAMPTZ       When approval action occurred

  ip_address            INET              Client IP for audit compliance

  session_id            TEXT              Session identifier for
                                          traceability
  --------------------- ----------------- -------------------------------

**story_versions**

Tracks version history for all story changes (immutable):

  --------------------- ----------------- -------------------------------
  **Column**            **Type**          **Description**

  id                    UUID (PK)         Auto-generated unique
                                          identifier

  story_id              TEXT (FK)         Reference to
                                          user_stories.story_id

  version_number        INTEGER           Sequential version number

  snapshot              JSONB             Complete story data at this
                                          version

  changed_fields        TEXT\[\]          Array of field names that
                                          changed

  change_summary        TEXT              Human-readable change
                                          description

  changed_by            UUID (FK)         Reference to auth.users

  changed_at            TIMESTAMPTZ       When this version was created

  is_baseline           BOOLEAN           Whether this is a release
                                          baseline

  baseline_name         TEXT              Name of baseline (e.g., \'Q1
                                          2026 Release\')
  --------------------- ----------------- -------------------------------

**6.2 Schema Modifications**

Existing tables require the following modifications:

  --------------------- ------------------------- ------------------------
  **Table**             **Modification**          **Purpose**

  users                 Add role column (TEXT)    Store user role
                                                  assignment

  users                 Add assigned_programs     Array of program IDs
                        (TEXT\[\])                user can access

  users                 Add avatar_url (TEXT)     Profile picture URL

  users                 Add last_login_at         Track user activity
                        (TIMESTAMPTZ)             

  user_stories          Add                       Who gave stakeholder
                        stakeholder_approved_by   approval
                        (UUID)                    

  user_stories          Add                       When stakeholder
                        stakeholder_approved_at   approved
                        (TIMESTAMPTZ)             

  user_stories          Add locked_by (UUID)      Prevent concurrent edits

  user_stories          Add locked_at             When lock was acquired
                        (TIMESTAMPTZ)             
  --------------------- ------------------------- ------------------------

**6.3 Row Level Security Policies**

Row Level Security (RLS) will enforce permissions at the database level:

-   Portfolio Managers: SELECT all, UPDATE roadmap fields only

-   Program Managers: Full CRUD on assigned programs only

-   Developers: SELECT approved stories only, INSERT comments
    (questions)

-   Admins: Full access to all tables (service role)

**7. Project Phases**

The project is divided into 7 phases, each building on the previous.
Estimated total duration: 8-10 weeks.

**Phase 1: Foundation & Authentication**

**Duration:** 1 week

**Tasks:**

-   Configure Supabase MCP for Claude Code direct database access

-   Run schema migrations for new tables (comments, approvals)

-   Initialize Next.js 14 project with TypeScript

-   Configure Supabase client and environment variables

-   Implement magic link authentication flow

-   Create login/logout pages with email verification

-   Set up role-based middleware for route protection

-   Build basic layout (sidebar, header, navigation)

-   Deploy initial version to Vercel

-   Configure GitHub Actions for CI/CD

**Deliverables:**

-   Supabase MCP connected and tested

-   Database schema updated with new tables and RLS policies

-   Working authentication with magic link

-   Protected routes based on user role

-   Deployed application on Vercel

-   Development environment documentation

**Phase 2: Core Dashboard & Data Display**

**Duration:** 1.5 weeks

**Tasks:**

-   Implement Providence branding scheme (colors, fonts, logo)

-   Create design tokens/CSS variables for brand consistency

-   Migrate existing HTML design to React components

-   Implement story list view with virtual scrolling

-   Build filter system (program, priority, roadmap, search)

-   Create story detail view with expand/collapse

-   Implement real-time data fetching from Supabase

-   Add loading states and error handling

-   Build summary statistics cards

-   Implement responsive design for mobile

**Deliverables:**

-   Providence-branded UI with consistent design tokens

-   Functional dashboard matching current design

-   Real-time data sync with Supabase

-   Filter and search functionality

-   Mobile-responsive layout

**Phase 3: CRUD Operations & Versioning**

**Duration:** 1.5 weeks

**Tasks:**

-   Build story creation form with validation

-   Implement inline editing for story fields

-   Create story deletion with confirmation modal

-   Add acceptance criteria editor (rich text)

-   Implement version history tracking for all changes

-   Build diff comparison view for version history

-   Add baselining capability for release snapshots

-   Implement optimistic updates for better UX

-   Build immutable audit logging for all changes

-   Add duplicate story functionality

-   Implement story templates

-   Create requirement-to-test case linking interface

**Deliverables:**

-   Full CRUD operations for stories

-   Immutable audit trail for all modifications

-   Version history with diff comparison

-   Baselining for release snapshots

-   Form validation with error messages

-   Story templates for common patterns

-   Traceability linking interface

**Phase 4: Approval Workflow**

**Duration:** 1.5 weeks

**Tasks:**

-   Build status transition component

-   Implement approval queue view for stakeholders

-   Create approval action modal with notes

-   Add email notifications for status changes

-   Build approval history timeline

-   Implement stakeholder approval capture

-   Add \'Needs Discussion\' workflow

-   Create bulk approval functionality

**Deliverables:**

-   Complete approval workflow implementation

-   Email notifications for approvals

-   Approval audit trail with timestamps

-   Stakeholder approval signature capture

**Phase 5: Collaboration Features**

**Duration:** 1 week

**Tasks:**

-   Build comment system with threading

-   Implement \@mentions with autocomplete

-   Create activity feed component

-   Add question/answer workflow for developers

-   Build notification center (in-app)

-   Implement read/unread tracking

-   Add comment editing and deletion

-   Create comment moderation tools

**Deliverables:**

-   Threaded comment system

-   \@mention functionality with notifications

-   Activity feed showing recent changes

-   Developer Q&A workflow

**Phase 6: Reporting & Traceability**

**Duration:** 1 week

**Tasks:**

-   Build traceability matrix report (requirements to test cases)

-   Implement coverage gap analysis report

-   Create impact analysis view (what\'s affected by changes)

-   Build PDF export for stories and test cases

-   Implement Excel export with formatting

-   Create program summary report

-   Add compliance coverage report

-   Build roadmap export for presentations

-   Implement scheduled report generation

-   Add report templates

-   Create print-friendly views

**Deliverables:**

-   Traceability matrix generation

-   Coverage gap analysis

-   Impact analysis for change management

-   PDF and Excel export functionality

-   Compliance and coverage reports

-   Scheduled report delivery

-   Print-optimized views

**Phase 7: Polish & Launch**

**Duration:** 1 week

**Tasks:**

-   Comprehensive testing (unit, integration, E2E)

-   Performance optimization and caching

-   Security audit and penetration testing

-   User acceptance testing with stakeholders

-   Documentation (user guide, admin guide)

-   Data migration from SQLite to production Supabase

-   Production deployment and monitoring setup

-   Team training and handoff

**Deliverables:**

-   Production-ready application

-   Complete documentation

-   Trained users

-   Monitoring and alerting configured

**8. Project Timeline**

  ----------------- -------------- ----------- ---------- ---------------------
  **Phase**         **Duration**   **Start**   **End**    **Dependencies**

  Phase 1:          1 week         Week 1      Week 1     None
  Foundation                                              

  Phase 2:          1.5 weeks      Week 2      Week 3     Phase 1
  Dashboard                                               

  Phase 3: CRUD &   1.5 weeks      Week 3      Week 4     Phase 2
  Versioning                                              

  Phase 4: Approval 1.5 weeks      Week 5      Week 6     Phase 3

  Phase 5:          1 week         Week 6      Week 7     Phase 4
  Collaboration                                           

  Phase 6:          1 week         Week 7      Week 8     Phase 5
  Reporting &                                             
  Traceability                                            

  Phase 7: Launch   1 week         Week 8      Week 9     Phase 6
  ----------------- -------------- ----------- ---------- ---------------------

**Total Estimated Duration: 8-10 weeks**

Note: Timeline assumes approximately 10-15 hours per week of development
effort. Phases may overlap where dependencies allow.

**9. Risk Assessment**

  --------------------- ---------------- ------------ ----------------------------
  **Risk**              **Likelihood**   **Impact**   **Mitigation**

  Data migration errors Medium           High         Comprehensive testing,
                                                      rollback plan, parallel
                                                      running

  Supabase service      Low              High         Implement offline mode,
  outage                                              local caching

  Scope creep           High             Medium       Strict phase gates, change
                                                      request process

  User adoption         Medium           Medium       Early stakeholder
  resistance                                          involvement, training

  Performance issues    Medium           Medium       Load testing, pagination,
                                                      virtual scrolling

  Security              Low              Critical     Security audit, RLS
  vulnerabilities                                     policies, penetration
                                                      testing

  Integration with      Medium           Low          API-first design, webhook
  existing tools                                      support
  --------------------- ---------------- ------------ ----------------------------

**10. Success Metrics**

  ------------------------ ----------------- ----------------------------
  **Metric**               **Target**        **Measurement Method**

  Page load time           \< 2 seconds      Lighthouse performance score

  User satisfaction        \> 4.0/5.0        Post-launch survey

  Adoption rate            \> 80% active     Login analytics
                           users             

  Data accuracy            100%              Audit comparison

  Approval cycle time      \< 48 hours avg   Workflow analytics

  System uptime            \> 99.5%          Monitoring alerts

  Bug count (critical)     0                 Issue tracker

  Traceability coverage    100% approved     Coverage report
                           stories           

  Version history          All changes       Audit trail review
  retention                logged            

  Export success rate      \> 99%            Export logs
  ------------------------ ----------------- ----------------------------

**11. Appendices**

**A. Project Directory Structure**

The Next.js application follows a standard App Router structure:

  ----------------------------------------- -----------------------------------
  **Folder/File**                           **Purpose**

  app/                                      Next.js App Router - all pages and
                                            routes

  app/(auth)/                               Authentication pages (login,
                                            register)

  app/(auth)/login/page.tsx                 Magic link login page

  app/(dashboard)/                          Protected dashboard pages (requires
                                            auth)

  app/(dashboard)/layout.tsx                Shared layout with sidebar and
                                            header

  app/(dashboard)/page.tsx                  Dashboard home / overview

  app/(dashboard)/stories/                  Story management pages

  app/(dashboard)/stories/page.tsx          Story list view with filters

  app/(dashboard)/stories/\[id\]/page.tsx   Individual story detail/edit

  app/(dashboard)/stories/new/page.tsx      Create new story form

  app/(dashboard)/approvals/page.tsx        Approval queue for reviewers

  app/(dashboard)/admin/users/page.tsx      User management (Admin only)

  app/api/                                  API routes for server-side
                                            operations

  components/ui/                            Reusable UI components (shadcn/ui)

  components/stories/                       Story-specific components

  components/layout/                        Layout components (sidebar, header,
                                            nav)

  lib/supabase/                             Supabase client configuration

  lib/hooks/                                Custom React hooks

  lib/utils/                                Utility functions

  types/                                    TypeScript type definitions

  public/                                   Static assets (images, fonts)
  ----------------------------------------- -----------------------------------

**B. Environment Variables**

  ------------------------------- ---------------------------- --------------
  **Variable**                    **Description**              **Source**

  NEXT_PUBLIC_SUPABASE_URL        Supabase project URL         Supabase
                                                               Dashboard

  NEXT_PUBLIC_SUPABASE_ANON_KEY   Supabase anonymous key       Supabase
                                  (public)                     Dashboard

  SUPABASE_SERVICE_ROLE_KEY       Supabase service role key    Supabase
                                  (secret)                     Dashboard

  NEXT_PUBLIC_APP_URL             Application URL              Vercel

  SMTP_HOST                       Email server for             Email provider
                                  notifications                

  SMTP_PORT                       Email server port            Email provider

  SMTP_USER                       Email authentication         Email provider

  SMTP_PASS                       Email password               Email provider
  ------------------------------- ---------------------------- --------------

**Supabase MCP Configuration**

Add the following to your Claude Code or Claude Desktop MCP
configuration file:

  ---------------------------- ------------------------------------------
  **Setting**                  **Value**

  Server Name                  supabase

  Command                      npx

  Args                         -y \@supabase/mcp-server

  SUPABASE_URL                 https://royctwjkewpnrcqdyhzd.supabase.co

  SUPABASE_SERVICE_ROLE_KEY    (from Supabase Dashboard → Settings → API)
  ---------------------------- ------------------------------------------

Note: The service role key has full database access. Keep it secure and
never commit it to version control.

**C. Providence Branding Requirements**

The application will use Providence Health & Services brand guidelines
for visual consistency:

  --------------------- --------------------- ----------------------------
  **Element**           **Specification**     **Notes**

  Primary Color         Teal (#0F766E)        Headers, buttons, links

  Secondary Color       Navy (#1E3A5F)        Gradients, accents

  Background            Light Gray (#F8FAFB)  Page background

  Surface               White (#FFFFFF)       Cards, modals

  Text Primary          Dark Slate (#1E293B)  Body text

  Text Secondary        Slate (#64748B)       Muted text, labels

  Success               Green (#059669)       Approved status, positive
                                              actions

  Warning               Orange (#D97706)      Pending status, caution

  Error                 Red (#DC2626)         Errors, Must Have priority

  Font - Headings       DM Sans (Bold)        All headings

  Font - Body           DM Sans (Regular)     Body text, labels

  Font - Code           JetBrains Mono        Story IDs, technical content

  Logo                  Providence            Header, login page
                        GenomicsNow           

  Border Radius         6px / 10px / 16px     Small / Medium / Large
                                              elements
  --------------------- --------------------- ----------------------------

Note: If Providence provides an updated brand guide, these values should
be updated to match official specifications.

**D. Contact Information**

  ----------------------- ----------------------- -----------------------
  **Role**                **Name**                **Responsibility**

  Project Lead / Admin    Glen Lewis              Overall project
                                                  management, technical
                                                  decisions

  Portfolio Manager       Kate                    Roadmap approval, final
                                                  sign-off

  Program Manager (P4M)   Kim                     P4M requirements,
                                                  stakeholder approval

  Program Manager         TBD                     GenoRx requirements,
  (GenoRx)                                        stakeholder approval
  ----------------------- ----------------------- -----------------------

*--- End of Document ---*
