# AI Features Test Plan

## Overview
This document outlines the test plan for the AI-powered features in the Propel Requirements Dashboard.

## Prerequisites
- [ ] `ANTHROPIC_API_KEY` is configured in `.env.local`
- [ ] Application is running (`npm run dev`)
- [ ] User is logged in with valid credentials
- [ ] At least 5 existing user stories in the database (for relationship suggestions)

---

## Unit Tests (Automated)

Run with: `npm run test:run -- lib/ai/__tests__`

### lib/ai/client.ts
- [x] `parseJSONResponse` - Parse valid JSON
- [x] `parseJSONResponse` - Handle markdown code blocks
- [x] `parseJSONResponse` - Return null for invalid JSON
- [x] `isAIAvailable` - Check API key availability
- [x] `getAnthropicClient` - Return null when no API key

### lib/ai/prompts.ts
- [x] Acceptance criteria prompt includes healthcare context
- [x] Acceptance criteria prompt requests Given/When/Then format
- [x] Relationship suggestions prompt includes confidence scoring
- [x] Prompts include all provided parameters

---

## Integration Tests (Automated)

Run with: `npm run test:run -- app/(dashboard)/stories/__tests__`

### ai-actions.ts
- [ ] `generateAcceptanceCriteria` - Returns suggestions for valid input
- [ ] `generateAcceptanceCriteria` - Returns error for short titles
- [ ] `generateAcceptanceCriteria` - Returns error when not authenticated
- [ ] `getRelationshipSuggestions` - Returns suggestions for valid story
- [ ] `getRelationshipSuggestions` - Returns empty array when no related stories
- [ ] `getRelationshipSuggestions` - Returns error when story not found

---

## Manual Testing Checklist

### 1. AI Acceptance Criteria (Story Form)

#### 1.1 Happy Path
- [ ] Navigate to `/stories/new`
- [ ] Enter a title with at least 5 characters
- [ ] Enter a user story description
- [ ] Click "Generate with AI" button
- [ ] Verify loading spinner appears
- [ ] Verify 5-8 acceptance criteria suggestions appear
- [ ] Verify each suggestion is in Given/When/Then format
- [ ] Select 3 suggestions using checkboxes
- [ ] Click "Accept Selected (3)"
- [ ] Verify selected criteria appear in the textarea
- [ ] Verify the suggestions panel closes

#### 1.2 Regenerate Suggestions
- [ ] Click "Generate with AI" again
- [ ] Click "Regenerate" while suggestions are shown
- [ ] Verify new suggestions replace old ones
- [ ] Verify selection is reset

#### 1.3 Append to Existing Criteria
- [ ] Manually type some acceptance criteria
- [ ] Generate AI suggestions
- [ ] Accept selected suggestions
- [ ] Verify AI criteria are appended (not replaced)

#### 1.4 Edge Cases
- [ ] Try generating with title < 5 characters - should show error
- [ ] Close panel with X button - should hide suggestions
- [ ] Deselect all and click "Accept Selected (0)" - button should be disabled
- [ ] Use "Select all" / "Deselect all" buttons

#### 1.5 Edit Mode
- [ ] Navigate to existing story edit page
- [ ] Verify AI generation works the same way

### 2. AI Relationship Suggestions (Story Detail Page)

#### 2.1 Happy Path
- [ ] Navigate to an existing story detail page (`/stories/[id]`)
- [ ] Scroll to "Story Relationships" section
- [ ] Click "Suggest Related Stories" button
- [ ] Verify loading state with "Analyzing story relationships..."
- [ ] Verify suggestions appear with:
  - [ ] Story title and ID
  - [ ] Relationship type badge (Parent/Related)
  - [ ] Confidence level (High/Medium/Low)
  - [ ] Reason for suggestion
- [ ] Click "Add as Related" on a suggestion
- [ ] Verify loading state on the add button
- [ ] Verify "Added" checkmark appears
- [ ] Refresh page and verify relationship persists

#### 2.2 Edge Cases
- [ ] Story with no similar stories - should show "No related stories found"
- [ ] Close panel with X button
- [ ] Try adding same relationship twice - should already show "Added"

### 3. Feature Visibility (Graceful Degradation)

#### 3.1 Without API Key
- [ ] Remove `ANTHROPIC_API_KEY` from `.env.local`
- [ ] Restart the development server
- [ ] Navigate to story form
- [ ] Verify "Generate with AI" button is NOT visible
- [ ] Navigate to story detail
- [ ] Verify "Suggest Related Stories" button is NOT visible

#### 3.2 With Invalid API Key
- [ ] Set `ANTHROPIC_API_KEY=invalid-key` in `.env.local`
- [ ] Restart the development server
- [ ] Try to generate acceptance criteria
- [ ] Verify appropriate error message appears

### 4. Error Handling

#### 4.1 Network Errors
- [ ] Disconnect from internet
- [ ] Try to generate suggestions
- [ ] Verify error message and "Try again" option

#### 4.2 Rate Limiting
- [ ] Make many rapid requests
- [ ] Verify rate limit error message appears
- [ ] Verify "Please try again later" message

---

## Performance Criteria

- [ ] AI suggestions should return within 10 seconds
- [ ] UI should remain responsive during API calls
- [ ] Loading states should be clearly visible

---

## Security Verification

- [ ] API key is never exposed to client-side code
- [ ] Server actions require authentication
- [ ] Story data is validated before sending to AI

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Test Data Requirements

For comprehensive testing, ensure:
1. At least 10 user stories exist across multiple programs
2. Stories have varied content (different roles, capabilities)
3. Some stories already have relationships defined
4. Mix of story statuses (Draft, In Review, Approved, etc.)

---

## Sign-off

| Test Category | Tester | Date | Status |
|--------------|--------|------|--------|
| Unit Tests | | | |
| Integration Tests | | | |
| Manual Testing | | | |
| Performance | | | |
| Security | | | |
| Browser Compatibility | | | |
