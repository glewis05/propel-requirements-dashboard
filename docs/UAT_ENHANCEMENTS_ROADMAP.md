# UAT System Enhancements Roadmap

**Created:** January 29, 2026
**Status:** Planned
**Priority:** High
**Compliance:** FDA 21 CFR Part 11, HIPAA, HITRUST

---

## Overview

This document outlines the enhancements needed to complete the UAT (User Acceptance Testing) system for external testers. The goal is to enable self-service, asynchronous testing by business users and technical validators without requiring GitHub access.

---

## Current State

### What's Built
- Test case CRUD with AI generation component
- Test execution tracking with step-by-step runner
- Defect management with severity/status workflow
- UAT cycles with tester pools and assignments
- Cross-validation schema (UI incomplete)
- 21 CFR Part 11 acknowledgment system
- HIPAA-compliant test patient data management
- Role-based access (UAT Tester, UAT Manager roles)

### What's Missing
1. Auto-generation of test cases on story approval
2. Self-service tester invitation/onboarding
3. Complete tester portal for asynchronous execution
4. Unique shareable links for test assignments

---

## Enhancement 1: Auto-Generate Test Cases on Story Approval

### Trigger
When a user story status transitions to **"Approved"**, automatically generate test cases using AI.

### Implementation

#### 1.1 Status Transition Hook
**File:** `lib/status-transitions.ts` or new `lib/uat/auto-generation.ts`

```typescript
// Pseudo-code
async function onStoryStatusChange(storyId: string, newStatus: string) {
  if (newStatus === "Approved") {
    await generateTestCasesForStory(storyId)
  }
}
```

#### 1.2 AI Test Case Generation
**Existing Component:** `components/uat/test-cases/AITestCaseGenerator.tsx`

Extract the generation logic into a server action that can be called:
- Manually from the UI (current)
- Automatically on approval (new)

#### 1.3 Generation Rules
- Generate test cases based on:
  - Story title and description
  - Acceptance criteria (parse Given/When/Then)
  - Story type (functional vs technical)
  - Program context
- Mark generated cases as `is_ai_generated = true`, `status = 'draft'`
- Require human review before use (`human_reviewed = false`)

#### 1.4 Notification
- Notify UAT Manager when test cases are auto-generated
- Include count and link to review queue

#### 1.5 Database Changes
None required - existing schema supports this.

#### 1.6 Compliance Considerations
- Log AI generation event in `activity_log`
- Record AI model version used
- Require human review before tests enter a cycle

---

## Enhancement 2: Self-Service Tester Invitation

### User Flow
1. UAT Manager enters tester email(s) in cycle management
2. System creates user record (if not exists) with role "UAT Tester"
3. System sends magic link invitation email
4. Tester clicks link, authenticates, sees acknowledgment screen
5. After acknowledgment, tester sees their assigned tests

### Implementation

#### 2.1 Invitation UI
**Location:** `/uat/cycles/[cycleId]/testers`

Add "Invite Tester" button that:
- Accepts email address(es)
- Optionally accepts name
- Shows pending invitations

#### 2.2 Invitation Server Action
**File:** `app/(dashboard)/uat/cycles/invitation-actions.ts` (new)

```typescript
export async function inviteTester(data: {
  cycleId: string
  email: string
  name?: string
  capacityWeight?: number
}) {
  // 1. Check if user exists
  // 2. If not, create user with role "UAT Tester"
  // 3. Add to cycle_testers
  // 4. Generate unique invitation token
  // 5. Send magic link email with cycle context
  // 6. Log invitation in activity_log
}
```

#### 2.3 Database Changes

**New Table: `tester_invitations`**
```sql
CREATE TABLE tester_invitations (
  invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES uat_cycles(cycle_id),
  email TEXT NOT NULL,
  name TEXT,
  invited_by TEXT NOT NULL REFERENCES users(user_id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
);
```

#### 2.4 Email Template
**File:** `lib/notifications/email.ts`

New template: `tester-invitation`
- Subject: "You've been invited to test [Cycle Name]"
- Body: Cycle description, start/end dates, magic link button
- Branding: Propel Health

#### 2.5 Landing Page for Invited Testers
**Route:** `/uat/invitation/[token]`

- Validates token
- Shows cycle info
- Triggers magic link auth if not logged in
- Redirects to acknowledgment screen after auth

#### 2.6 Compliance Considerations
- Log all invitations with inviter identity
- Track invitation acceptance with timestamp
- Support invitation revocation
- Expire unused invitations after configurable period

---

## Enhancement 3: Tester Portal (My Executions)

### Purpose
A focused, distraction-free interface for testers to:
- View their assigned tests
- Execute tests asynchronously
- Report defects
- Track their progress

### Implementation

#### 3.1 Tester Dashboard
**Route:** `/uat/my` or `/uat/executions/my`

**Features:**
- Active cycle(s) the tester is part of
- Assigned tests with status indicators
- Progress bar (completed/total)
- Quick filters: Not Started, In Progress, Completed
- No access to admin features (cycle management, assignments, etc.)

#### 3.2 Simplified Navigation
For users with role "UAT Tester" only:
- Hide: UAT Cycles, Test Cases management, Test Patients
- Show: My Tests, Report Issue, Help

#### 3.3 Test Execution Interface
**Existing:** `components/uat/executions/ExecutionRunner.tsx`

Enhancements:
- Mobile-responsive design for tablet testing
- Offline indicator (tests require connectivity)
- Auto-save step results as tester progresses
- Clear "Submit Results" CTA
- Confirmation before marking complete

#### 3.4 Asynchronous Execution Support
- No time limits on test execution
- Allow pause/resume (save partial progress)
- Show last activity timestamp
- Email reminder for incomplete tests (configurable)

#### 3.5 Defect Reporting from Execution
When a step fails:
- Prompt to create defect immediately
- Pre-fill: test case, step number, story
- Allow screenshot/attachment upload
- Continue testing after defect submission

#### 3.6 Database Changes
None required - existing schema supports this.

#### 3.7 Compliance Considerations
- All executions logged with timestamps
- Step-by-step audit trail maintained
- Tester identity verified via acknowledgment

---

## Enhancement 4: Unique Shareable Links

### Purpose
Allow UAT Managers to share direct links to specific test assignments.

### Implementation

#### 4.1 Link Structure
```
/uat/execute/[executionId]?token=[uniqueToken]
```

Or simpler (if user is authenticated):
```
/uat/executions/[executionId]
```

#### 4.2 Email Notifications
When tests are assigned, send email with:
- List of assigned test titles
- Direct links to each execution
- Cycle deadline reminder
- Magic link for authentication

#### 4.3 Bulk Assignment Notification
**File:** `lib/notifications/email.ts`

New template: `test-assignment`
- Subject: "[X] tests assigned to you in [Cycle Name]"
- Body: Test list with links, due date, instructions

---

## Enhancement 5: AI-Assisted Test Division

### Purpose
Help UAT Managers efficiently distribute tests among testers based on:
- Tester capacity/availability
- Test complexity
- Skill matching (technical vs business tests)

### Implementation

#### 5.1 AI Assignment Suggestions
**Location:** `/uat/cycles/[cycleId]/assign`

"Suggest Assignments" button that:
- Analyzes test cases (complexity, type)
- Considers tester capacity weights
- Proposes balanced distribution
- Shows reasoning for suggestions

#### 5.2 Server Action
**File:** `app/(dashboard)/uat/cycles/ai-assignment-actions.ts` (new)

```typescript
export async function suggestAssignments(cycleId: string) {
  // 1. Get all unassigned test cases in cycle
  // 2. Get all testers with capacity weights
  // 3. Call Claude API with test case summaries and tester info
  // 4. Return suggested assignments with reasoning
}
```

#### 5.3 Prompt Design
Include in AI prompt:
- Test case titles, types, priorities
- Tester names and capacity weights
- Cross-validation requirements
- Goal: Even distribution by effort, not just count

---

## Implementation Priority

| Enhancement | Priority | Effort | Dependencies |
|-------------|----------|--------|--------------|
| 3. Tester Portal | High | Medium | None |
| 2. Self-Service Invitation | High | Medium | None |
| 4. Shareable Links | High | Low | Enhancement 2 |
| 1. Auto-Generate on Approval | Medium | Medium | None |
| 5. AI Assignment Suggestions | Low | Medium | Enhancement 1 |

### Suggested Order
1. **Tester Portal** - Enable testers to work immediately
2. **Self-Service Invitation** - Enable manager to onboard testers
3. **Shareable Links** - Improve tester experience
4. **Auto-Generate on Approval** - Reduce manual test creation
5. **AI Assignment Suggestions** - Optimize distribution

---

## Compliance Checklist

### FDA 21 CFR Part 11
- [ ] Electronic signatures for test completion
- [ ] Audit trail for all test executions
- [ ] User identity verification (acknowledgments)
- [ ] Immutable execution records
- [ ] Version control for test cases

### HIPAA
- [ ] Test patient data access logging
- [ ] HIPAA acknowledgment before accessing PHI
- [ ] No real patient data in test environments
- [ ] Secure transmission of test results

### HITRUST
- [ ] Role-based access control
- [ ] Session management
- [ ] Encryption at rest and in transit
- [ ] Audit logging

---

## Database Migrations Required

### Migration 008: Tester Invitations
```sql
-- tester_invitations table
-- invitation_tokens table (or column)
-- RLS policies for invitations
```

### Migration 009: Execution Enhancements (if needed)
```sql
-- Add partial_results JSONB for pause/resume
-- Add last_activity_at timestamp
-- Add reminder_sent_at for email reminders
```

---

## Files to Create/Modify

### New Files
- `app/(dashboard)/uat/my/page.tsx` - Tester dashboard
- `app/(dashboard)/uat/invitation/[token]/page.tsx` - Invitation landing
- `app/(dashboard)/uat/cycles/invitation-actions.ts` - Invitation server actions
- `app/(dashboard)/uat/cycles/ai-assignment-actions.ts` - AI assignment
- `lib/uat/auto-generation.ts` - Auto-generate on approval
- `supabase/migrations/008_tester_invitations.sql`

### Modified Files
- `lib/navigation.ts` - Add tester-specific nav
- `lib/status-transitions.ts` - Hook for auto-generation
- `lib/notifications/email.ts` - New templates
- `components/uat/executions/ExecutionRunner.tsx` - Enhancements
- `app/(dashboard)/uat/cycles/[cycleId]/testers/page.tsx` - Invitation UI

---

## Success Metrics

1. **Tester Onboarding Time:** < 5 minutes from invitation to first test
2. **Test Completion Rate:** Track % of assigned tests completed
3. **Defect Discovery Rate:** Defects found per test executed
4. **Tester Satisfaction:** Survey after cycle completion
5. **Auto-Generation Accuracy:** % of AI-generated tests accepted without major edits

---

## Open Questions

1. Should test case auto-generation be opt-in per program or globally enabled?
2. What's the invitation expiration period? (Suggested: 7 days)
3. Should testers be able to decline/reassign tests?
4. Maximum tests per tester per cycle?
5. Email reminder frequency for incomplete tests?

---

*This document should be reviewed and updated as implementation progresses.*
