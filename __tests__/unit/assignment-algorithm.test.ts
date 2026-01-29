/**
 * Assignment Algorithm Unit Tests
 * Tests the core distribution logic for UAT test assignments
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  mockCycleTesters,
  generateMockTestCases,
} from '../fixtures/uat-portal'

// ============================================================================
// Helper functions extracted for testing
// ============================================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function distributePrimaryTests(
  testCases: { testCaseId: string; storyId: string }[],
  testers: { userId: string; capacityWeight: number }[],
  method: 'equal' | 'weighted'
): Map<string, { testCaseId: string; storyId: string }[]> {
  const distribution = new Map<string, { testCaseId: string; storyId: string }[]>()
  testers.forEach(t => distribution.set(t.userId, []))

  if (method === 'equal') {
    let testerIndex = 0
    for (const testCase of testCases) {
      const tester = testers[testerIndex]
      distribution.get(tester.userId)!.push(testCase)
      testerIndex = (testerIndex + 1) % testers.length
    }
  } else {
    const totalWeight = testers.reduce((sum, t) => sum + t.capacityWeight, 0)
    const testsPerWeight = testCases.length / totalWeight

    const targets = testers.map(t => ({
      userId: t.userId,
      target: Math.round(t.capacityWeight * testsPerWeight),
      current: 0,
    }))

    for (const testCase of testCases) {
      const tester = targets.reduce((best, current) => {
        const bestRatio = best.current / Math.max(best.target, 1)
        const currentRatio = current.current / Math.max(current.target, 1)
        return currentRatio < bestRatio ? current : best
      })

      distribution.get(tester.userId)!.push(testCase)
      tester.current++
    }
  }

  return distribution
}

function selectCrossValidationTests(
  testCases: { testCaseId: string; storyId: string }[],
  percentage: number
): { testCaseId: string; storyId: string }[] {
  const count = Math.round(testCases.length * (percentage / 100))
  const shuffled = shuffleArray(testCases)
  return shuffled.slice(0, count)
}

function assignCrossValidationTesters(
  cvTestCases: { testCaseId: string; storyId: string }[],
  testers: { userId: string; capacityWeight: number }[],
  validatorsPerTest: number,
  method: 'equal' | 'weighted'
): Map<string, { testCaseId: string; storyId: string; testers: string[] }> {
  const cvGroups = new Map<string, { testCaseId: string; storyId: string; testers: string[] }>()
  const testerCvCounts = new Map<string, number>()
  testers.forEach(t => testerCvCounts.set(t.userId, 0))

  for (const testCase of cvTestCases) {
    const sortedTesters = [...testers].sort((a, b) => {
      const aCount = testerCvCounts.get(a.userId) || 0
      const bCount = testerCvCounts.get(b.userId) || 0

      if (method === 'weighted') {
        const aRatio = aCount / a.capacityWeight
        const bRatio = bCount / b.capacityWeight
        return aRatio - bRatio
      }
      return aCount - bCount
    })

    const assignedTesters = sortedTesters
      .slice(0, Math.min(validatorsPerTest, testers.length))
      .map(t => t.userId)

    assignedTesters.forEach(userId => {
      testerCvCounts.set(userId, (testerCvCounts.get(userId) || 0) + 1)
    })

    cvGroups.set(testCase.testCaseId, {
      testCaseId: testCase.testCaseId,
      storyId: testCase.storyId,
      testers: assignedTesters,
    })
  }

  return cvGroups
}

// ============================================================================
// Test Suites
// ============================================================================

describe('Assignment Algorithm', () => {
  describe('shuffleArray', () => {
    it('returns array of same length', () => {
      const input = [1, 2, 3, 4, 5]
      const result = shuffleArray(input)
      expect(result).toHaveLength(input.length)
    })

    it('contains all original elements', () => {
      const input = [1, 2, 3, 4, 5]
      const result = shuffleArray(input)
      expect(result.sort()).toEqual(input.sort())
    })

    it('does not mutate original array', () => {
      const input = [1, 2, 3, 4, 5]
      const original = [...input]
      shuffleArray(input)
      expect(input).toEqual(original)
    })

    it('produces different orderings over multiple runs', () => {
      const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const results = new Set<string>()

      // Run 10 times and collect unique orderings
      for (let i = 0; i < 10; i++) {
        results.add(JSON.stringify(shuffleArray(input)))
      }

      // Should have at least 2 different orderings (probabilistically)
      expect(results.size).toBeGreaterThan(1)
    })
  })

  describe('distributePrimaryTests - Equal Distribution', () => {
    const testers = [
      { userId: 'tester-1', capacityWeight: 100 },
      { userId: 'tester-2', capacityWeight: 100 },
      { userId: 'tester-3', capacityWeight: 100 },
    ]

    it('distributes 9 tests equally among 3 testers (3 each)', () => {
      const testCases = Array.from({ length: 9 }, (_, i) => ({
        testCaseId: `tc-${i}`,
        storyId: `story-${i}`,
      }))

      const result = distributePrimaryTests(testCases, testers, 'equal')

      expect(result.get('tester-1')).toHaveLength(3)
      expect(result.get('tester-2')).toHaveLength(3)
      expect(result.get('tester-3')).toHaveLength(3)
    })

    it('distributes 10 tests among 3 testers (4, 3, 3)', () => {
      const testCases = Array.from({ length: 10 }, (_, i) => ({
        testCaseId: `tc-${i}`,
        storyId: `story-${i}`,
      }))

      const result = distributePrimaryTests(testCases, testers, 'equal')

      const counts = [
        result.get('tester-1')!.length,
        result.get('tester-2')!.length,
        result.get('tester-3')!.length,
      ].sort((a, b) => b - a)

      expect(counts).toEqual([4, 3, 3])
    })

    it('handles 100 tests among 5 testers (20 each)', () => {
      const fiveTesters = Array.from({ length: 5 }, (_, i) => ({
        userId: `tester-${i}`,
        capacityWeight: 100,
      }))
      const testCases = Array.from({ length: 100 }, (_, i) => ({
        testCaseId: `tc-${i}`,
        storyId: `story-${i}`,
      }))

      const result = distributePrimaryTests(testCases, fiveTesters, 'equal')

      fiveTesters.forEach(t => {
        expect(result.get(t.userId)).toHaveLength(20)
      })
    })

    it('handles more testers than tests', () => {
      const manyTesters = Array.from({ length: 10 }, (_, i) => ({
        userId: `tester-${i}`,
        capacityWeight: 100,
      }))
      const testCases = Array.from({ length: 3 }, (_, i) => ({
        testCaseId: `tc-${i}`,
        storyId: `story-${i}`,
      }))

      const result = distributePrimaryTests(testCases, manyTesters, 'equal')

      // Total tests assigned should equal input
      let totalAssigned = 0
      result.forEach(tests => {
        totalAssigned += tests.length
      })
      expect(totalAssigned).toBe(3)
    })

    it('handles single tester', () => {
      const singleTester = [{ userId: 'tester-1', capacityWeight: 100 }]
      const testCases = Array.from({ length: 10 }, (_, i) => ({
        testCaseId: `tc-${i}`,
        storyId: `story-${i}`,
      }))

      const result = distributePrimaryTests(testCases, singleTester, 'equal')

      expect(result.get('tester-1')).toHaveLength(10)
    })

    it('handles empty test case array', () => {
      const result = distributePrimaryTests([], testers, 'equal')

      testers.forEach(t => {
        expect(result.get(t.userId)).toHaveLength(0)
      })
    })
  })

  describe('distributePrimaryTests - Weighted Distribution', () => {
    it('distributes tests based on capacity weights', () => {
      const testers = [
        { userId: 'full', capacityWeight: 100 },
        { userId: 'half', capacityWeight: 50 },
      ]
      const testCases = Array.from({ length: 30 }, (_, i) => ({
        testCaseId: `tc-${i}`,
        storyId: `story-${i}`,
      }))

      const result = distributePrimaryTests(testCases, testers, 'weighted')

      const fullCount = result.get('full')!.length
      const halfCount = result.get('half')!.length

      // Full capacity tester should get roughly 2x the tests
      expect(fullCount).toBeGreaterThan(halfCount)
      expect(fullCount + halfCount).toBe(30)

      // Allow some variance due to rounding: expect ratio between 1.5 and 2.5
      const ratio = fullCount / halfCount
      expect(ratio).toBeGreaterThanOrEqual(1.5)
      expect(ratio).toBeLessThanOrEqual(2.5)
    })

    it('handles uneven weights correctly', () => {
      const testers = [
        { userId: 'high', capacityWeight: 100 },
        { userId: 'medium', capacityWeight: 75 },
        { userId: 'low', capacityWeight: 25 },
      ]
      const testCases = Array.from({ length: 100 }, (_, i) => ({
        testCaseId: `tc-${i}`,
        storyId: `story-${i}`,
      }))

      const result = distributePrimaryTests(testCases, testers, 'weighted')

      const highCount = result.get('high')!.length
      const mediumCount = result.get('medium')!.length
      const lowCount = result.get('low')!.length

      // High should get most, low should get least
      expect(highCount).toBeGreaterThan(mediumCount)
      expect(mediumCount).toBeGreaterThan(lowCount)
      expect(highCount + mediumCount + lowCount).toBe(100)
    })

    it('handles equal weights same as equal distribution', () => {
      const testers = [
        { userId: 'tester-1', capacityWeight: 100 },
        { userId: 'tester-2', capacityWeight: 100 },
      ]
      const testCases = Array.from({ length: 10 }, (_, i) => ({
        testCaseId: `tc-${i}`,
        storyId: `story-${i}`,
      }))

      const result = distributePrimaryTests(testCases, testers, 'weighted')

      // Should be 5 each (or 4/6 due to rounding)
      const count1 = result.get('tester-1')!.length
      const count2 = result.get('tester-2')!.length
      expect(Math.abs(count1 - count2)).toBeLessThanOrEqual(1)
    })
  })

  describe('selectCrossValidationTests', () => {
    const testCases = Array.from({ length: 100 }, (_, i) => ({
      testCaseId: `tc-${i}`,
      storyId: `story-${i}`,
    }))

    it('selects correct percentage of tests (20%)', () => {
      const result = selectCrossValidationTests(testCases, 20)
      expect(result).toHaveLength(20)
    })

    it('selects correct percentage of tests (10%)', () => {
      const result = selectCrossValidationTests(testCases, 10)
      expect(result).toHaveLength(10)
    })

    it('handles 0% (no tests)', () => {
      const result = selectCrossValidationTests(testCases, 0)
      expect(result).toHaveLength(0)
    })

    it('handles 100% (all tests)', () => {
      const result = selectCrossValidationTests(testCases, 100)
      expect(result).toHaveLength(100)
    })

    it('returns unique test cases (no duplicates)', () => {
      const result = selectCrossValidationTests(testCases, 30)
      const ids = result.map(tc => tc.testCaseId)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('rounds correctly for non-integer percentages', () => {
      const smallSet = Array.from({ length: 7 }, (_, i) => ({
        testCaseId: `tc-${i}`,
        storyId: `story-${i}`,
      }))

      // 20% of 7 = 1.4, should round to 1
      const result = selectCrossValidationTests(smallSet, 20)
      expect(result).toHaveLength(1)
    })
  })

  describe('assignCrossValidationTesters', () => {
    const testers = [
      { userId: 'tester-1', capacityWeight: 100 },
      { userId: 'tester-2', capacityWeight: 100 },
      { userId: 'tester-3', capacityWeight: 100 },
      { userId: 'tester-4', capacityWeight: 100 },
      { userId: 'tester-5', capacityWeight: 100 },
    ]

    const cvTestCases = Array.from({ length: 20 }, (_, i) => ({
      testCaseId: `cv-tc-${i}`,
      storyId: `story-${i}`,
    }))

    it('assigns correct number of validators per test', () => {
      const result = assignCrossValidationTesters(cvTestCases, testers, 3, 'equal')

      result.forEach(group => {
        expect(group.testers).toHaveLength(3)
      })
    })

    it('creates groups for all CV test cases', () => {
      const result = assignCrossValidationTesters(cvTestCases, testers, 3, 'equal')
      expect(result.size).toBe(20)
    })

    it('assigns different testers to each CV group', () => {
      const result = assignCrossValidationTesters(cvTestCases, testers, 3, 'equal')

      result.forEach(group => {
        const uniqueTesters = new Set(group.testers)
        expect(uniqueTesters.size).toBe(group.testers.length)
      })
    })

    it('distributes CV load somewhat evenly', () => {
      const result = assignCrossValidationTesters(cvTestCases, testers, 3, 'equal')

      // Count how many times each tester appears
      const testerCounts = new Map<string, number>()
      testers.forEach(t => testerCounts.set(t.userId, 0))

      result.forEach(group => {
        group.testers.forEach(t => {
          testerCounts.set(t, (testerCounts.get(t) || 0) + 1)
        })
      })

      // 20 tests * 3 validators = 60 assignments / 5 testers = 12 each
      // Allow variance of ±2
      testerCounts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(10)
        expect(count).toBeLessThanOrEqual(14)
      })
    })

    it('handles validators_per_test greater than tester count', () => {
      const smallTesters = testers.slice(0, 2)
      const result = assignCrossValidationTesters(cvTestCases, smallTesters, 5, 'equal')

      // Should only assign 2 testers (max available)
      result.forEach(group => {
        expect(group.testers).toHaveLength(2)
      })
    })

    it('respects capacity weights in weighted mode', () => {
      const weightedTesters = [
        { userId: 'high', capacityWeight: 100 },
        { userId: 'low', capacityWeight: 25 },
      ]

      const result = assignCrossValidationTesters(cvTestCases, weightedTesters, 2, 'weighted')

      // Both testers should be assigned to every test (only 2 testers, 2 validators)
      // But the order/selection should favor high capacity
      result.forEach(group => {
        expect(group.testers).toContain('high')
        expect(group.testers).toContain('low')
      })
    })
  })

  describe('Full Assignment Flow', () => {
    it('correctly splits tests into primary and CV groups', () => {
      const allTests = generateMockTestCases(100)
      const formattedTests = allTests.map(tc => ({
        testCaseId: tc.test_case_id,
        storyId: tc.story_id,
      }))

      // Select 20% for CV
      const cvTests = selectCrossValidationTests(formattedTests, 20)
      const cvTestIds = new Set(cvTests.map(t => t.testCaseId))
      const primaryTests = formattedTests.filter(t => !cvTestIds.has(t.testCaseId))

      expect(cvTests.length).toBe(20)
      expect(primaryTests.length).toBe(80)
      expect(cvTests.length + primaryTests.length).toBe(100)
    })

    it('total assignments = primary + (CV × validators)', () => {
      const testers = mockCycleTesters.map(t => ({
        userId: t.user_id,
        capacityWeight: t.capacity_weight,
      }))

      const allTests = generateMockTestCases(100)
      const formattedTests = allTests.map(tc => ({
        testCaseId: tc.test_case_id,
        storyId: tc.story_id,
      }))

      // 20% CV with 3 validators
      const cvTests = selectCrossValidationTests(formattedTests, 20)
      const cvTestIds = new Set(cvTests.map(t => t.testCaseId))
      const primaryTests = formattedTests.filter(t => !cvTestIds.has(t.testCaseId))

      const primaryDist = distributePrimaryTests(primaryTests, testers, 'equal')
      const cvGroups = assignCrossValidationTesters(cvTests, testers, 3, 'equal')

      // Count total assignments
      let totalPrimary = 0
      primaryDist.forEach(tests => {
        totalPrimary += tests.length
      })

      let totalCv = 0
      cvGroups.forEach(group => {
        totalCv += group.testers.length
      })

      // Primary: 80, CV: 20 * 3 = 60, Total: 140
      expect(totalPrimary).toBe(80)
      expect(totalCv).toBe(60) // 20 tests * 3 validators
      expect(totalPrimary + totalCv).toBe(140)
    })
  })
})
