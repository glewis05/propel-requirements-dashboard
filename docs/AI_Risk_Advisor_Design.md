# AI Risk Advisor - Design & Implementation Plan

**Document Version:** 1.0
**Created:** January 26, 2026
**Author:** Glen Lewis
**Status:** Draft - Pending Review

---

## Executive Summary

The AI Risk Advisor is an embedded intelligent agent designed to help stakeholders—particularly those without software development risk management experience—evaluate and prioritize requirements effectively. The agent analyzes user stories against program goals, dependencies, and historical patterns to provide actionable risk assessments and recommendations.

### Key Value Propositions

1. **Democratize Risk Assessment** - Enable non-technical stakeholders to make informed prioritization decisions
2. **Goal Alignment** - Ensure requirements align with quarterly/yearly program objectives
3. **Consistency** - Apply uniform risk evaluation criteria across all stories
4. **Speed** - Reduce time spent in prioritization meetings with pre-analyzed recommendations
5. **Audit Trail** - Maintain FDA 21 CFR Part 11 compliant records of risk decisions

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Requirements Dashboard (Next.js)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │   Story Detail   │  │   Goals Manager  │  │   Risk Dashboard         │   │
│  │   Page           │  │   (New)          │  │   (New)                  │   │
│  │                  │  │                  │  │                          │   │
│  │  ┌────────────┐  │  │  • View goals    │  │  • Portfolio risk view   │   │
│  │  │ Risk Panel │  │  │  • Add/edit      │  │  • Risk trends           │   │
│  │  │ (AI Agent) │  │  │  • Track status  │  │  • Mitigation tracking   │   │
│  │  └────────────┘  │  │                  │  │                          │   │
│  └────────┬─────────┘  └──────────────────┘  └──────────────────────────┘   │
│           │                                                                  │
└───────────┼──────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            API Layer (Next.js API Routes)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  /api/risk-advisor                    /api/goals                            │
│  ├── POST /analyze          ────►     ├── GET /[programId]                  │
│  ├── POST /chat                       ├── POST /                            │
│  ├── GET  /history/[storyId]          ├── PUT /[goalId]                     │
│  └── POST /batch-analyze              └── DELETE /[goalId]                  │
│           │                                                                  │
│           │  Context                                                         │
│           │  Assembly                                                        │
│           ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Context Builder Service                           │    │
│  │  • Fetches story + related stories + dependencies                   │    │
│  │  • Fetches program goals (current year, current/next quarter)       │    │
│  │  • Fetches historical risk assessments for similar stories          │    │
│  │  • Fetches team capacity/resource data (future)                     │    │
│  │  • Assembles structured prompt for AI                               │    │
│  └──────────────────────────────────┬──────────────────────────────────┘    │
│                                     │                                        │
└─────────────────────────────────────┼────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         External AI Service                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐                         │
│  │   Claude API        │    │   Fallback:         │                         │
│  │   (Primary)         │    │   OpenAI GPT-4      │                         │
│  │                     │    │   (Secondary)       │                         │
│  │   claude-3-5-sonnet │    │                     │                         │
│  └─────────────────────┘    └─────────────────────┘                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Supabase (PostgreSQL)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Existing Tables              New Tables                                     │
│  ───────────────              ──────────                                     │
│  • user_stories               • program_goals                                │
│  • programs                   • story_risk_assessments                       │
│  • users                      • risk_conversations                           │
│  • story_comments             • risk_factors_catalog                         │
│  • story_versions             • goal_story_alignments                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### New Tables

#### 1. `program_goals` - Strategic Goals Management

```sql
-- Program goals for strategic alignment
CREATE TABLE program_goals (
    goal_id TEXT PRIMARY KEY DEFAULT 'goal-' || gen_random_uuid()::text,
    program_id TEXT NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,

    -- Goal definition
    title TEXT NOT NULL,
    description TEXT,
    goal_type TEXT NOT NULL CHECK (goal_type IN (
        'delivery',      -- Ship feature X by date Y
        'compliance',    -- Meet regulatory requirement
        'quality',       -- Reduce defects, improve reliability
        'strategic',     -- Business objective alignment
        'operational'    -- Process improvement
    )),

    -- Timing
    target_year INTEGER NOT NULL,
    target_quarter TEXT CHECK (target_quarter IN ('Q1', 'Q2', 'Q3', 'Q4', 'Annual')),
    target_date DATE,

    -- Priority and status
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
        'active',
        'achieved',
        'at_risk',
        'deferred',
        'cancelled'
    )),

    -- Success criteria
    success_metrics TEXT,  -- How we measure achievement
    key_results TEXT[],    -- OKR-style key results

    -- Ownership
    owner_user_id TEXT REFERENCES users(user_id),

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by TEXT REFERENCES users(user_id),

    -- Soft delete for compliance
    is_archived BOOLEAN NOT NULL DEFAULT FALSE
);

-- Indexes for common queries
CREATE INDEX idx_program_goals_program ON program_goals(program_id);
CREATE INDEX idx_program_goals_year_quarter ON program_goals(target_year, target_quarter);
CREATE INDEX idx_program_goals_status ON program_goals(status) WHERE status = 'active';
```

#### 2. `story_risk_assessments` - Risk Evaluation Records

```sql
-- Risk assessments for user stories
CREATE TABLE story_risk_assessments (
    assessment_id TEXT PRIMARY KEY DEFAULT 'risk-' || gen_random_uuid()::text,
    story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,

    -- Assessment metadata
    assessment_type TEXT NOT NULL CHECK (assessment_type IN (
        'manual',        -- Human-entered assessment
        'ai_assisted',   -- AI-generated, human-reviewed
        'ai_automated'   -- Fully automated (batch processing)
    )),
    assessed_by TEXT REFERENCES users(user_id),  -- NULL for automated
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Risk scores (1-5 scale)
    likelihood INTEGER NOT NULL CHECK (likelihood BETWEEN 1 AND 5),
    impact INTEGER NOT NULL CHECK (impact BETWEEN 1 AND 5),
    risk_score INTEGER GENERATED ALWAYS AS (likelihood * impact) STORED,

    -- Risk category (derived from score)
    -- 1-4: Low, 5-9: Medium, 10-15: High, 16-25: Critical
    risk_level TEXT GENERATED ALWAYS AS (
        CASE
            WHEN likelihood * impact <= 4 THEN 'low'
            WHEN likelihood * impact <= 9 THEN 'medium'
            WHEN likelihood * impact <= 15 THEN 'high'
            ELSE 'critical'
        END
    ) STORED,

    -- Detailed risk factors (1-5 scale each)
    risk_factors JSONB NOT NULL DEFAULT '{}'::jsonb,
    /*
    Expected structure:
    {
        "technical_complexity": 3,
        "dependency_count": 4,
        "resource_availability": 2,
        "skill_gap": 3,
        "integration_risk": 4,
        "compliance_impact": 5,
        "timeline_pressure": 3,
        "scope_clarity": 2
    }
    */

    -- AI analysis content
    ai_summary TEXT,                    -- Executive summary from AI
    ai_detailed_analysis TEXT,          -- Full analysis
    ai_risk_factors_identified TEXT[],  -- List of identified risks
    ai_mitigation_suggestions TEXT[],   -- Recommended mitigations
    ai_goal_alignment_notes TEXT,       -- How story aligns with goals
    ai_confidence_score DECIMAL(3,2),   -- AI's confidence (0.00-1.00)

    -- Model metadata (for audit)
    ai_model_used TEXT,                 -- e.g., 'claude-3-5-sonnet-20241022'
    ai_prompt_tokens INTEGER,
    ai_completion_tokens INTEGER,

    -- Human review
    is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by TEXT REFERENCES users(user_id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Versioning (assessments are immutable, create new for updates)
    supersedes_assessment_id TEXT REFERENCES story_risk_assessments(assessment_id),
    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_risk_assessments_story ON story_risk_assessments(story_id);
CREATE INDEX idx_risk_assessments_current ON story_risk_assessments(story_id, is_current)
    WHERE is_current = TRUE;
CREATE INDEX idx_risk_assessments_level ON story_risk_assessments(risk_level);
CREATE INDEX idx_risk_assessments_score ON story_risk_assessments(risk_score DESC);

-- Ensure only one current assessment per story
CREATE UNIQUE INDEX idx_risk_assessments_unique_current
    ON story_risk_assessments(story_id) WHERE is_current = TRUE;
```

#### 3. `risk_conversations` - AI Chat History

```sql
-- Conversational history with AI Risk Advisor
CREATE TABLE risk_conversations (
    conversation_id TEXT PRIMARY KEY DEFAULT 'conv-' || gen_random_uuid()::text,
    story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(user_id),

    -- Conversation state
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Messages stored as JSONB array
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    /*
    Expected structure:
    [
        {
            "id": "msg-uuid",
            "role": "user",
            "content": "What if we delay this to Q3?",
            "timestamp": "2026-01-26T10:30:00Z"
        },
        {
            "id": "msg-uuid",
            "role": "assistant",
            "content": "Delaying to Q3 would reduce timeline pressure...",
            "timestamp": "2026-01-26T10:30:05Z",
            "model": "claude-3-5-sonnet",
            "tokens": {"prompt": 1500, "completion": 350}
        }
    ]
    */

    -- Context snapshot (what the AI knew at conversation start)
    context_snapshot JSONB,

    -- Linked assessment (if conversation resulted in assessment)
    resulting_assessment_id TEXT REFERENCES story_risk_assessments(assessment_id),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_risk_conversations_story ON risk_conversations(story_id);
CREATE INDEX idx_risk_conversations_user ON risk_conversations(user_id);
CREATE INDEX idx_risk_conversations_active ON risk_conversations(story_id, is_active)
    WHERE is_active = TRUE;
```

#### 4. `goal_story_alignments` - Goal-to-Story Mapping

```sql
-- Explicit mapping between goals and stories
CREATE TABLE goal_story_alignments (
    alignment_id TEXT PRIMARY KEY DEFAULT 'align-' || gen_random_uuid()::text,
    goal_id TEXT NOT NULL REFERENCES program_goals(goal_id) ON DELETE CASCADE,
    story_id TEXT NOT NULL REFERENCES user_stories(story_id) ON DELETE CASCADE,

    -- Alignment strength
    alignment_type TEXT NOT NULL CHECK (alignment_type IN (
        'directly_supports',   -- Story is required to achieve goal
        'partially_supports',  -- Story contributes to goal
        'enables',            -- Story enables other work toward goal
        'blocks',             -- Story completion blocks goal achievement
        'conflicts'           -- Story works against goal (flag for review)
    )),

    -- AI or human determined
    determined_by TEXT CHECK (determined_by IN ('ai', 'human')),
    determined_by_user TEXT REFERENCES users(user_id),

    -- Notes
    alignment_notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(goal_id, story_id)
);

-- Indexes
CREATE INDEX idx_goal_alignments_goal ON goal_story_alignments(goal_id);
CREATE INDEX idx_goal_alignments_story ON goal_story_alignments(story_id);
```

#### 5. `risk_factors_catalog` - Configurable Risk Categories

```sql
-- Catalog of risk factors for customization
CREATE TABLE risk_factors_catalog (
    factor_id TEXT PRIMARY KEY,
    factor_name TEXT NOT NULL,
    factor_description TEXT NOT NULL,

    -- Scoring guidance
    score_1_description TEXT NOT NULL,  -- What does a 1 mean?
    score_3_description TEXT NOT NULL,  -- What does a 3 mean?
    score_5_description TEXT NOT NULL,  -- What does a 5 mean?

    -- Weighting
    default_weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,

    -- Applicability
    applies_to_technical BOOLEAN NOT NULL DEFAULT TRUE,
    applies_to_non_technical BOOLEAN NOT NULL DEFAULT TRUE,

    -- Display
    display_order INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default risk factors
INSERT INTO risk_factors_catalog (factor_id, factor_name, factor_description,
    score_1_description, score_3_description, score_5_description, display_order)
VALUES
    ('technical_complexity', 'Technical Complexity',
     'How technically challenging is the implementation?',
     'Simple, well-understood patterns',
     'Moderate complexity, some new patterns',
     'Highly complex, cutting-edge or unfamiliar technology', 10),

    ('dependency_count', 'External Dependencies',
     'How many external systems, teams, or stories does this depend on?',
     'No external dependencies',
     '2-3 dependencies, manageable',
     '5+ dependencies or critical-path blockers', 20),

    ('resource_availability', 'Resource Availability',
     'Are the required people and resources available?',
     'Team fully available, no conflicts',
     'Some scheduling conflicts, manageable',
     'Key resources unavailable or overcommitted', 30),

    ('skill_gap', 'Knowledge/Skill Gap',
     'Does the team have the required skills?',
     'Team is expert in this area',
     'Some learning required, achievable',
     'Significant training or hiring needed', 40),

    ('integration_risk', 'Integration Risk',
     'How risky is integrating with existing systems?',
     'Clean interfaces, well-documented APIs',
     'Some integration complexity',
     'Complex integration, legacy systems, poor documentation', 50),

    ('compliance_impact', 'Compliance/Regulatory Impact',
     'Does this affect FDA, HIPAA, or other regulatory requirements?',
     'No compliance implications',
     'Minor compliance considerations',
     'Major compliance requirements, audit implications', 60),

    ('timeline_pressure', 'Timeline Pressure',
     'How tight is the deadline relative to scope?',
     'Comfortable timeline with buffer',
     'Achievable but tight',
     'Aggressive timeline, high risk of delay', 70),

    ('scope_clarity', 'Scope Clarity',
     'How well-defined are the requirements?',
     'Crystal clear, detailed acceptance criteria',
     'Generally clear, some ambiguity',
     'Vague, likely to change significantly', 80);
```

### Row Level Security Policies

```sql
-- program_goals RLS
ALTER TABLE program_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read goals for their programs" ON program_goals
    FOR SELECT USING (
        -- Admins and Portfolio Managers see all
        get_user_role() IN ('Admin', 'Portfolio Manager')
        OR
        -- Program Managers see their assigned programs
        (get_user_role() = 'Program Manager' AND program_id = ANY(get_user_programs()))
        OR
        -- Developers can see goals (read-only context)
        get_user_role() = 'Developer'
    );

CREATE POLICY "Managers can create goals" ON program_goals
    FOR INSERT WITH CHECK (
        get_user_role() IN ('Admin', 'Portfolio Manager')
        OR
        (get_user_role() = 'Program Manager' AND program_id = ANY(get_user_programs()))
    );

CREATE POLICY "Managers can update goals" ON program_goals
    FOR UPDATE USING (
        get_user_role() IN ('Admin', 'Portfolio Manager')
        OR
        (get_user_role() = 'Program Manager' AND program_id = ANY(get_user_programs()))
    );

-- story_risk_assessments RLS
ALTER TABLE story_risk_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read assessments" ON story_risk_assessments
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create assessments" ON story_risk_assessments
    FOR INSERT WITH CHECK (
        get_user_role() IN ('Admin', 'Portfolio Manager', 'Program Manager')
    );

-- risk_conversations RLS
ALTER TABLE risk_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations" ON risk_conversations
    FOR SELECT USING (
        user_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
        OR get_user_role() IN ('Admin', 'Portfolio Manager')
    );

CREATE POLICY "Users can create conversations" ON risk_conversations
    FOR INSERT WITH CHECK (
        user_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );

CREATE POLICY "Users can update own conversations" ON risk_conversations
    FOR UPDATE USING (
        user_id = (SELECT user_id FROM users WHERE auth_id = auth.uid())
    );
```

---

## API Design

### API Routes Structure

```
/api/
├── goals/
│   ├── route.ts              GET (list), POST (create)
│   └── [goalId]/
│       └── route.ts          GET, PUT, DELETE
│
├── risk-advisor/
│   ├── analyze/
│   │   └── route.ts          POST - Generate risk assessment
│   ├── chat/
│   │   └── route.ts          POST - Conversational interaction
│   ├── batch/
│   │   └── route.ts          POST - Batch analyze multiple stories
│   └── history/
│       └── [storyId]/
│           └── route.ts      GET - Assessment history
│
└── risk-assessments/
    ├── route.ts              GET (list with filters)
    └── [assessmentId]/
        ├── route.ts          GET, PUT (review)
        └── review/
            └── route.ts      POST - Mark as reviewed
```

### Key API Endpoints

#### POST `/api/risk-advisor/analyze`

Generate a risk assessment for a story.

**Request:**
```typescript
interface AnalyzeRequest {
  storyId: string
  includeGoalAlignment?: boolean  // Default: true
  includeHistoricalComparison?: boolean  // Default: true
  assessmentType?: 'ai_assisted' | 'ai_automated'  // Default: 'ai_assisted'
}
```

**Response:**
```typescript
interface AnalyzeResponse {
  assessment: {
    assessmentId: string
    likelihood: number
    impact: number
    riskScore: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    riskFactors: Record<string, number>
    aiSummary: string
    aiDetailedAnalysis: string
    aiRiskFactorsIdentified: string[]
    aiMitigationSuggestions: string[]
    aiGoalAlignmentNotes: string
    aiConfidenceScore: number
  }
  goalAlignments: Array<{
    goalId: string
    goalTitle: string
    alignmentType: string
    notes: string
  }>
  relatedAssessments: Array<{
    storyId: string
    storyTitle: string
    riskScore: number
    similarity: string
  }>
}
```

#### POST `/api/risk-advisor/chat`

Continue a conversation about a story's risk.

**Request:**
```typescript
interface ChatRequest {
  storyId: string
  conversationId?: string  // Omit to start new conversation
  message: string
}
```

**Response:**
```typescript
interface ChatResponse {
  conversationId: string
  response: string
  suggestedFollowUps: string[]
  updatedAssessment?: Partial<Assessment>  // If AI suggests score changes
}
```

---

## AI Prompt Engineering

### System Prompt Template

```typescript
const RISK_ADVISOR_SYSTEM_PROMPT = `You are an AI Risk Advisor embedded in a software requirements management system. Your role is to help stakeholders—many of whom lack formal software development risk management training—evaluate and prioritize user stories effectively.

## Your Expertise
- Software development lifecycle and common risks
- Agile methodology and prioritization frameworks
- Healthcare software compliance (FDA 21 CFR Part 11, HIPAA)
- Dependency management and integration risks
- Resource and timeline estimation

## Your Communication Style
- Clear, jargon-free language accessible to non-technical stakeholders
- Concrete examples and analogies (aviation analogies work well for this team)
- Actionable recommendations, not just observations
- Balanced perspective—acknowledge both risks and opportunities

## Risk Scoring Guidelines
Use a 1-5 scale for likelihood and impact:

**Likelihood (How likely is this risk to occur?)**
1 = Rare (< 10% chance)
2 = Unlikely (10-30% chance)
3 = Possible (30-50% chance)
4 = Likely (50-70% chance)
5 = Almost Certain (> 70% chance)

**Impact (If it occurs, how severe?)**
1 = Minimal (minor inconvenience, easily recovered)
2 = Low (some rework, < 1 week delay)
3 = Moderate (significant rework, 1-4 week delay)
4 = High (major rework, 1-3 month delay, stakeholder escalation)
5 = Critical (project failure, compliance violation, client relationship damage)

## Risk Categories to Evaluate
1. Technical Complexity - Implementation difficulty
2. Dependencies - External systems, teams, other stories
3. Resource Availability - People and skills needed
4. Skill Gap - Team knowledge vs. requirements
5. Integration Risk - Connecting with existing systems
6. Compliance Impact - Regulatory implications
7. Timeline Pressure - Deadline vs. realistic effort
8. Scope Clarity - Requirement definition quality

## Response Format
When analyzing a story, structure your response as:

1. **Executive Summary** (2-3 sentences)
2. **Risk Score Recommendation** (Likelihood × Impact with rationale)
3. **Key Risk Factors** (top 3-5 concerns)
4. **Goal Alignment Analysis** (how this supports/conflicts with stated goals)
5. **Mitigation Recommendations** (actionable steps to reduce risk)
6. **Questions to Discuss** (things the team should clarify)

Remember: Your goal is to enable better decisions, not to alarm or create unnecessary caution. Be balanced and practical.`;
```

### Context Assembly Function

```typescript
// lib/risk-advisor/context-builder.ts

interface RiskAdvisorContext {
  story: UserStory
  relatedStories: UserStory[]
  programGoals: ProgramGoal[]
  historicalAssessments: StoryRiskAssessment[]
  program: Program
}

export async function buildRiskAdvisorContext(
  storyId: string,
  supabase: SupabaseClient
): Promise<RiskAdvisorContext> {
  // Fetch story with all details
  const { data: story } = await supabase
    .from('user_stories')
    .select('*')
    .eq('story_id', storyId)
    .single()

  // Fetch related stories (same category or explicit relationships)
  const { data: relatedStories } = await supabase
    .from('user_stories')
    .select('*')
    .eq('program_id', story.program_id)
    .or(`category.eq.${story.category},story_id.in.(${story.related_stories || []})`)
    .neq('story_id', storyId)
    .limit(10)

  // Fetch program goals for current and next quarter
  const currentYear = new Date().getFullYear()
  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`

  const { data: programGoals } = await supabase
    .from('program_goals')
    .select('*')
    .eq('program_id', story.program_id)
    .eq('target_year', currentYear)
    .eq('status', 'active')
    .order('priority', { ascending: true })

  // Fetch historical assessments for similar stories
  const { data: historicalAssessments } = await supabase
    .from('story_risk_assessments')
    .select(`
      *,
      user_stories!inner(title, category, priority, is_technical)
    `)
    .eq('user_stories.category', story.category)
    .eq('is_current', true)
    .order('assessed_at', { ascending: false })
    .limit(5)

  // Fetch program details
  const { data: program } = await supabase
    .from('programs')
    .select('*')
    .eq('program_id', story.program_id)
    .single()

  return {
    story,
    relatedStories: relatedStories || [],
    programGoals: programGoals || [],
    historicalAssessments: historicalAssessments || [],
    program
  }
}
```

### User Prompt Template

```typescript
export function buildAnalysisPrompt(context: RiskAdvisorContext): string {
  const { story, relatedStories, programGoals, historicalAssessments, program } = context

  return `
## Story to Analyze

**ID:** ${story.story_id}
**Title:** ${story.title}
**Program:** ${program.name}
**Priority:** ${story.priority || 'Not set'}
**Category:** ${story.category_full || story.category || 'Uncategorized'}
**Status:** ${story.status}
**Technical:** ${story.is_technical ? 'Yes' : 'No'}
**Roadmap Target:** ${story.roadmap_target || 'Not scheduled'}

**User Story:**
${story.user_story || 'Not provided'}

**Acceptance Criteria:**
${story.acceptance_criteria || 'Not provided'}

**Success Metrics:**
${story.success_metrics || 'Not provided'}

**Internal Notes:**
${story.internal_notes || 'None'}

---

## Program Goals (${new Date().getFullYear()})

${programGoals.length > 0
  ? programGoals.map(g => `- **${g.target_quarter}:** ${g.title} (${g.goal_type}, Priority ${g.priority})
  ${g.description || ''}`).join('\n\n')
  : 'No goals defined for this program yet.'}

---

## Related Stories in Same Category

${relatedStories.length > 0
  ? relatedStories.map(s => `- **${s.story_id}:** ${s.title} [${s.status}] ${s.priority || ''}`).join('\n')
  : 'No related stories found.'}

---

## Historical Risk Assessments (Similar Stories)

${historicalAssessments.length > 0
  ? historicalAssessments.map(a => `- **${a.user_stories.title}:** Risk Score ${a.risk_score} (${a.risk_level})
  Key factors: ${a.ai_risk_factors_identified?.slice(0, 3).join(', ') || 'N/A'}`).join('\n\n')
  : 'No historical assessments available for comparison.'}

---

Please provide a comprehensive risk assessment for this story.`
}
```

---

## Component Architecture

### React Components

```
components/
├── risk-advisor/
│   ├── RiskAdvisorPanel.tsx      # Main panel on story detail page
│   ├── RiskScoreDisplay.tsx      # Visual risk score (gauge/matrix)
│   ├── RiskFactorsChart.tsx      # Spider/radar chart of factors
│   ├── RiskChat.tsx              # Conversational interface
│   ├── RiskHistory.tsx           # Assessment history timeline
│   ├── RiskBadge.tsx             # Compact badge for story cards
│   └── BatchAssessment.tsx       # Bulk assessment UI
│
├── goals/
│   ├── GoalsList.tsx             # Goals dashboard
│   ├── GoalCard.tsx              # Individual goal display
│   ├── GoalForm.tsx              # Create/edit goal
│   ├── GoalProgress.tsx          # Progress indicator
│   └── GoalStoryAlignment.tsx    # Show aligned stories
│
└── risk-dashboard/
    ├── RiskOverview.tsx          # Portfolio risk summary
    ├── RiskTrends.tsx            # Risk trends over time
    ├── RiskHeatmap.tsx           # Program × Category heatmap
    └── MitigationTracker.tsx     # Track mitigation actions
```

### RiskAdvisorPanel Component

```tsx
// components/risk-advisor/RiskAdvisorPanel.tsx

'use client'

import { useState } from 'react'
import { AlertTriangle, MessageSquare, RefreshCw, CheckCircle } from 'lucide-react'

interface RiskAdvisorPanelProps {
  storyId: string
  currentAssessment?: StoryRiskAssessment | null
  onAssessmentCreated?: (assessment: StoryRiskAssessment) => void
}

export function RiskAdvisorPanel({
  storyId,
  currentAssessment,
  onAssessmentCreated
}: RiskAdvisorPanelProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [assessment, setAssessment] = useState(currentAssessment)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/risk-advisor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId })
      })

      if (!response.ok) throw new Error('Analysis failed')

      const data = await response.json()
      setAssessment(data.assessment)
      onAssessmentCreated?.(data.assessment)
    } catch (err) {
      setError('Failed to analyze story. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900">Risk Advisor</h3>
          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
            AI-Powered
          </span>
        </div>

        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
          {isAnalyzing ? 'Analyzing...' : assessment ? 'Re-analyze' : 'Analyze'}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {!assessment && !isAnalyzing && (
          <div className="text-center py-6">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">
              No risk assessment yet. Click "Analyze" to get AI-powered insights.
            </p>
            <button
              onClick={runAnalysis}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700
                         transition-colors"
            >
              Generate Risk Assessment
            </button>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600
                            mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing story and gathering context...</p>
            <p className="text-sm text-gray-400 mt-1">This may take 10-15 seconds</p>
          </div>
        )}

        {assessment && !isAnalyzing && (
          <div className="space-y-4">
            {/* Risk Score Display */}
            <div className={`p-4 rounded-lg border ${getRiskColor(assessment.risk_level)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">Risk Score</p>
                  <p className="text-3xl font-bold">{assessment.risk_score}/25</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold capitalize">
                    {assessment.risk_level}
                  </span>
                  <p className="text-sm opacity-75">
                    L:{assessment.likelihood} × I:{assessment.impact}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Summary</h4>
              <p className="text-gray-600 text-sm">{assessment.ai_summary}</p>
            </div>

            {/* Key Risks */}
            {assessment.ai_risk_factors_identified?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Risks</h4>
                <ul className="space-y-1">
                  {assessment.ai_risk_factors_identified.slice(0, 4).map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-orange-500 mt-0.5">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mitigations */}
            {assessment.ai_mitigation_suggestions?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Recommended Mitigations
                </h4>
                <ul className="space-y-1">
                  {assessment.ai_mitigation_suggestions.slice(0, 3).map((mitigation, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {mitigation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Goal Alignment */}
            {assessment.ai_goal_alignment_notes && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Goal Alignment</h4>
                <p className="text-gray-600 text-sm">{assessment.ai_goal_alignment_notes}</p>
              </div>
            )}

            {/* Chat Button */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="w-full flex items-center justify-center gap-2 py-2 border
                         border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50
                         transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              {showChat ? 'Hide Chat' : 'Ask Follow-up Questions'}
            </button>

            {/* Chat Interface */}
            {showChat && (
              <RiskChat
                storyId={storyId}
                assessment={assessment}
              />
            )}

            {/* Metadata */}
            <div className="pt-3 border-t border-gray-100 text-xs text-gray-400">
              <p>Assessed: {new Date(assessment.assessed_at).toLocaleString()}</p>
              <p>Confidence: {Math.round(assessment.ai_confidence_score * 100)}%</p>
              {!assessment.is_reviewed && (
                <p className="text-yellow-600 mt-1">⚠ Pending human review</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Database & Types**
- [ ] Create migration file with all new tables
- [ ] Add RLS policies
- [ ] Seed risk_factors_catalog
- [ ] Generate TypeScript types
- [ ] Test with sample data

**Goals Management**
- [ ] `/api/goals` CRUD endpoints
- [ ] GoalsList component
- [ ] GoalForm component
- [ ] GoalCard component
- [ ] Add Goals to sidebar navigation

**Deliverable:** Working goals management with full CRUD

### Phase 2: Core Risk Assessment (Week 3-4)

**API Layer**
- [ ] Set up Claude API client with error handling
- [ ] Implement context builder service
- [ ] Create `/api/risk-advisor/analyze` endpoint
- [ ] Create assessment storage logic
- [ ] Add rate limiting and cost tracking

**Components**
- [ ] RiskAdvisorPanel (basic version)
- [ ] RiskScoreDisplay
- [ ] RiskBadge for story cards
- [ ] Integration with story detail page

**Deliverable:** Working AI risk analysis on story detail page

### Phase 3: Conversational Interface (Week 5-6)

**Chat System**
- [ ] `/api/risk-advisor/chat` endpoint
- [ ] Conversation storage and retrieval
- [ ] Context persistence across messages
- [ ] RiskChat component
- [ ] Suggested follow-up questions

**Deliverable:** Interactive Q&A with Risk Advisor

### Phase 4: Goal Alignment (Week 7-8)

**Alignment Features**
- [ ] Automatic goal-story alignment detection
- [ ] goal_story_alignments table population
- [ ] GoalStoryAlignment component
- [ ] Goal progress tracking based on story status
- [ ] Alignment visualization in GoalCard

**Deliverable:** Full goal-story relationship tracking

### Phase 5: Dashboard & Reporting (Week 9-10)

**Risk Dashboard**
- [ ] RiskOverview component (portfolio view)
- [ ] RiskHeatmap (program × category)
- [ ] RiskTrends charts
- [ ] Batch assessment capability
- [ ] Export risk reports

**Deliverable:** Executive risk dashboard

### Phase 6: Polish & Optimization (Week 11-12)

**Quality**
- [ ] Comprehensive testing
- [ ] Performance optimization (caching, batching)
- [ ] Cost optimization (prompt tuning)
- [ ] User documentation
- [ ] Admin configuration UI for risk factors

**Deliverable:** Production-ready Risk Advisor

---

## Environment Configuration

### Required Environment Variables

```env
# .env.local additions

# AI Provider - Primary
ANTHROPIC_API_KEY=sk-ant-xxxxx

# AI Provider - Fallback (optional)
OPENAI_API_KEY=sk-xxxxx

# Rate Limiting
RISK_ADVISOR_RATE_LIMIT=10  # Requests per user per hour
RISK_ADVISOR_DAILY_LIMIT=50  # Total requests per day

# Cost Controls
RISK_ADVISOR_MAX_TOKENS=4000  # Max tokens per request
RISK_ADVISOR_ENABLED=true  # Feature flag
```

### Vercel Environment Setup

Add to Vercel project settings:
- `ANTHROPIC_API_KEY` (encrypted)
- `RISK_ADVISOR_ENABLED=true`
- `RISK_ADVISOR_RATE_LIMIT=10`

---

## Cost Estimation

### Claude API Costs (claude-3-5-sonnet)

| Operation | Input Tokens | Output Tokens | Cost/Request |
|-----------|--------------|---------------|--------------|
| Full Analysis | ~2,500 | ~800 | ~$0.025 |
| Chat Message | ~1,500 | ~400 | ~$0.015 |
| Batch (per story) | ~2,000 | ~600 | ~$0.020 |

### Monthly Projections

| Usage Scenario | Requests/Month | Estimated Cost |
|----------------|----------------|----------------|
| Light (1 user, casual) | 50 | $1.25 |
| Moderate (3 users, regular) | 300 | $7.50 |
| Heavy (10 users, active) | 1,500 | $37.50 |

### Cost Controls
1. Rate limiting per user
2. Caching assessments (re-analyze only if story changed)
3. Shorter prompts for chat follow-ups
4. Batch processing during off-hours

---

## Security & Compliance

### FDA 21 CFR Part 11 Considerations

1. **Audit Trail:** All assessments are immutable records with timestamps
2. **Electronic Signatures:** Assessment reviews link to authenticated user
3. **Version Control:** supersedes_assessment_id maintains history
4. **Access Control:** RLS policies enforce role-based access

### Data Privacy

1. **No PHI in Prompts:** Story content should not contain patient data
2. **API Key Security:** Server-side only, never exposed to client
3. **Conversation Privacy:** Users can only see their own conversations
4. **Data Retention:** Define retention policy for old assessments

### AI Safety

1. **Human Review:** All AI assessments flagged for review
2. **Confidence Scores:** Low-confidence assessments highlighted
3. **Override Capability:** Humans can always override AI recommendations
4. **Audit of AI Decisions:** Full prompt/response logging (optional)

---

## Success Metrics

### Adoption Metrics
- % of stories with risk assessments
- Average assessments per user per week
- Chat engagement rate (follow-up questions asked)

### Quality Metrics
- Human override rate (lower = better AI accuracy)
- Correlation between AI risk scores and actual delivery issues
- User satisfaction surveys

### Business Metrics
- Time saved in prioritization meetings
- Reduction in unplanned scope changes
- Improvement in on-time delivery for high-risk stories

---

## Open Questions

1. **Model Selection:** Should we use Claude 3.5 Sonnet (smarter, more expensive) or Claude 3 Haiku (faster, cheaper) for chat follow-ups?

2. **Batch Processing:** Should we automatically assess all new stories, or only on-demand?

3. **Notification Integration:** Should high-risk assessments trigger notifications to Program Managers?

4. **Historical Learning:** Should we fine-tune prompts based on accuracy of past assessments?

5. **Multi-tenant Considerations:** If this becomes multi-client, should each client have separate AI context/tuning?

---

## Appendix: Sample AI Interactions

### Example 1: High-Risk Story

**Story:** "Implement FHIR Integration with Epic EHR"

**AI Response:**
> **Summary:** This story carries significant risk due to external dependencies on Epic's FHIR API availability and the complexity of healthcare data mapping. Aligns strongly with Q2 goal of "Enable seamless EHR data exchange."
>
> **Risk Score: 16/25 (High)**
> - Likelihood: 4/5 (External dependency on Epic, known integration challenges)
> - Impact: 4/5 (Core functionality, affects patient data flow)
>
> **Key Risks:**
> 1. Epic FHIR API sandbox access can take 4-6 weeks to provision
> 2. Patient demographic mapping requires careful validation against existing data model
> 3. Compliance review needed for PHI handling in transit
>
> **Mitigations:**
> 1. Start Epic sandbox request immediately (parallel track)
> 2. Create mock FHIR responses for development while awaiting access
> 3. Schedule compliance review in sprint planning
>
> **Goal Alignment:** Directly supports Q2 goal "Enable seamless EHR data exchange." However, timeline risk may push delivery to Q3 if Epic access is delayed.

### Example 2: Chat Follow-up

**User:** "What if we scope this down to just patient demographics first?"

**AI Response:**
> Scoping to demographics-only would reduce risk from 16 to approximately 10/25 (Medium):
>
> **What changes:**
> - Technical complexity drops (simpler data model)
> - Integration risk reduced (fewer API endpoints)
> - Compliance review still needed but smaller scope
>
> **What stays the same:**
> - Epic sandbox access timeline unchanged
> - Dependency on external team unchanged
>
> **Recommendation:** This is a good de-risking strategy. Consider:
> 1. Phase 1: Demographics only (Q2)
> 2. Phase 2: Clinical data (Q3)
>
> This approach delivers incremental value while managing risk. Would you like me to suggest how to split the acceptance criteria?

---

*Document maintained by Glen Lewis. Last updated January 26, 2026.*
