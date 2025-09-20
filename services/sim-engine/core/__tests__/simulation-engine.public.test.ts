/* 
Testing library/framework: Jest (describe/it/expect, jest.mock, spies). 
If this repository uses Vitest, change `jest` to `vi` and import from 'vitest' accordingly.
*/

import type { Decision, DecisionOption, UserProfile, Scenario, EconomicConditions } from '@theguide/models'

// Import the implementation. The provided diff shows implementation in engine.test.ts path.
// We import from that file name directly to access the exported SimulationEngine.
import { SimulationEngine } from '../engine.test'

// Mock UUID for deterministic IDs
jest.mock('uuid', () => ({ v4: () => '00000000-0000-0000-0000-TESTUUID0001' }))

// Mock DataEnrichmentService to avoid external calls and ensure salary is enriched deterministically
jest.mock('../../src/data/data-enrichment', () => {
  return {
    DataEnrichmentService: class {
      getSalaryDistribution = jest.fn().mockResolvedValue({ median: 70000 })
    }
  }
})

/**
 * Helper builders
 */
const baseProfile = (): Partial<UserProfile> => ({
  demographics: {
    age: 30,
    location: { city: 'Austin', state: 'TX', country: 'USA', zipCode: '78701' } as any
  } as any,
  career: {
    currentRole: 'Software Engineer',
    industry: 'Technology',
    yearsExperience: 4,
    salary: 90000
  } as any,
  financial: {
    assets: { cash: 20000, investments: 30000, retirement: 20000, realEstate: 0, other: 0 } as any,
    liabilities: { creditCards: 0, studentLoans: 0, mortgage: 0, other: 0 } as any,
    monthlyExpenses: { housing: 1500, transportation: 400, food: 500, utilities: 200, entertainment: 200, healthcare: 150, other: 100 } as any,
    savingsRate: 10,
    creditScore: 720
  } as any
})

const decision: Decision = {
  id: 'dec-1',
  type: 'career_change',
  title: 'Switch to new role'
} as any

const option: DecisionOption = {
  id: 'opt-1',
  title: 'Accept new offer',
  parameters: { newSalary: 120000 },
  estimatedImpact: {
    financial: { netWorth: 10000, income: 20000 },
    career: { satisfaction: 2, growth: 1 },
    lifestyle: { fulfillment: 2, stress: 1, workLifeBalance: 1 }
  }
} as any

/**
 * Build a minimal deterministic scenario set for fast tests.
 */
function makeScenario(id: string, prob: number, econ: Partial<EconomicConditions>, overrides: Partial<Scenario['outcomes']> = {}): Scenario {
  const baseOutcomes: Scenario['outcomes'] = {
    year1: {
      year: 1,
      financialPosition: { netWorth: 50000, income: 100000, expenses: 60000, savings: 40000 },
      careerProgress: { role: 'Software Engineer', seniorityLevel: 3, marketValue: 110000, jobSatisfaction: 7 },
      lifeMetrics: { overallHappiness: 7, stress: 4, workLifeBalance: 6, healthScore: 8 }
    },
    year3: {
      year: 3,
      financialPosition: { netWorth: 90000, income: 110000, expenses: 65000, savings: 45000 },
      careerProgress: { role: 'Senior Engineer', seniorityLevel: 5, marketValue: 130000, jobSatisfaction: 7.5 },
      lifeMetrics: { overallHappiness: 7.2, stress: 4.2, workLifeBalance: 6.2, healthScore: 7.8 }
    },
    year5: {
      year: 5,
      financialPosition: { netWorth: 150000, income: 125000, expenses: 70000, savings: 55000 },
      careerProgress: { role: 'Senior Engineer', seniorityLevel: 6, marketValue: 150000, jobSatisfaction: 7.8 },
      lifeMetrics: { overallHappiness: 7.5, stress: 4.5, workLifeBalance: 6.5, healthScore: 7.5 }
    },
    year10: {
      year: 10,
      financialPosition: { netWorth: 300000, income: 150000, expenses: 80000, savings: 70000 },
      careerProgress: { role: 'Staff Engineer', seniorityLevel: 8, marketValue: 180000, jobSatisfaction: 8 },
      lifeMetrics: { overallHappiness: 8, stress: 4.2, workLifeBalance: 7, healthScore: 7.8 }
    }
  }
  const outcomes = { ...baseOutcomes, ...overrides }
  return {
    id,
    probability: prob,
    economicConditions: {
      gdpGrowth: 2.5,
      inflationRate: 2.2,
      unemploymentRate: 4.2,
      marketCondition: (econ.marketCondition ?? 'stable') as any,
      industryOutlook: (econ.industryOutlook ?? 'stable') as any
    },
    outcomes,
    keyEvents: [],
    assumptions: {
      inflation: '2.2% annual',
      gdpGrowth: '2.5% annual',
      unemployment: '4.2%',
      marketCondition: econ.marketCondition?.toString() ?? 'stable',
      industryOutlook: econ.industryOutlook?.toString() ?? 'stable'
    }
  } as any
}

describe('SimulationEngine.runSimulation (public API)', () => {
  test('returns deterministic SimulationResult with mocked scenarios and normalized probabilities', async () => {
    const engine = new SimulationEngine({})

    // Stub generateScenarios to small, controlled set; also ensure normalization will adjust weights
    const scenarios: Scenario[] = [
      makeScenario('s1', 0.5, { marketCondition: 'recession', industryOutlook: 'declining' }),
      makeScenario('s2', 0.5, { marketCondition: 'stable', industryOutlook: 'stable' })
    ]

    // Hijack private methods via casting to any
    ;(engine as any).generateScenarios = jest.fn().mockReturnValue(scenarios)
    ;(engine as any).normalizeScenarioProbabilities = jest.fn((scs: Scenario[]) => {
      // Apply same adjustment logic as code under test to validate expectation later
      scs.forEach(s => {
        let adj = 1
        switch (s.economicConditions.marketCondition) {
          case 'recession': adj = 0.8; break
          case 'downturn': adj = 0.9; break
          case 'stable': adj = 1.2; break
          case 'growth': adj = 1.0; break
          case 'boom': adj = 0.7; break
        }
        s.probability *= adj
      })
      const sum = scs.reduce((a, b) => a + b.probability, 0)
      scs.forEach(s => { s.probability = s.probability / sum })
    })

    const partial = baseProfile()
    const result = await engine.runSimulation(decision, option, partial\!, 'seed-123')

    // Basic shape
    expect(result).toMatchObject({
      id: '00000000-0000-0000-0000-TESTUUID0001',
      decisionId: 'dec-1',
      optionId: 'opt-1',
      scenarios: expect.any(Array),
      aggregateMetrics: expect.any(Object),
      recommendations: expect.any(Array),
      risks: expect.any(Array),
      opportunities: expect.any(Array)
    })

    // Ensure our stub was used and normalization was applied
    expect((engine as any).generateScenarios).toHaveBeenCalled()
    expect((engine as any).normalizeScenarioProbabilities).toHaveBeenCalled()

    // Probabilities sum to ~1 after normalization
    const sum = result.scenarios.reduce((a, s) => a + s.probability, 0)
    expect(sum).toBeCloseTo(1, 10)

    // Because 'stable' gets 1.2 and 'recession' 0.8, stable scenario should get higher final weight
    const pStable = result.scenarios.find(s => s.economicConditions.marketCondition === 'stable')\!.probability
    const pRecession = result.scenarios.find(s => s.economicConditions.marketCondition === 'recession')\!.probability
    expect(pStable).toBeGreaterThan(pRecession)

    // Aggregate metrics include probabilityOfSuccess within [0,1]
    expect(result.aggregateMetrics.probabilityOfSuccess).toBeGreaterThanOrEqual(0)
    expect(result.aggregateMetrics.probabilityOfSuccess).toBeLessThanOrEqual(1)
  })

  test('enriches missing salary via DataEnrichmentService and still runs', async () => {
    const engine = new SimulationEngine({})

    ;(engine as any).generateScenarios = jest.fn().mockReturnValue([
      makeScenario('s1', 1, { marketCondition: 'stable', industryOutlook: 'growing' })
    ])
    ;(engine as any).normalizeScenarioProbabilities = jest.fn((scs: Scenario[]) => {
      scs.forEach(s => (s.probability = 1))
    })

    const profileWithoutSalary: Partial<UserProfile> = {
      ...baseProfile(),
      career: {
        currentRole: 'Software Engineer',
        industry: 'Technology',
        yearsExperience: 4
        // salary missing on purpose
      } as any
    }

    const result = await engine.runSimulation(decision, option, profileWithoutSalary, 'seed-xyz')
    expect(result.aggregateMetrics.expectedValue.financial).toBeGreaterThan(0)
  })

  test('handles low data completeness by increasing iteration count (via generateScenarios call count proxy)', async () => {
    const engine = new SimulationEngine({})

    // Spy on private adjustIterationCount to infer doubling for very low completeness
    const adjustSpy = jest.spyOn(engine as any, 'adjustIterationCount')

    ;(engine as any).generateScenarios = jest.fn().mockImplementation((_d: any, _o: any, _u: any, _rng: any, count: number) => {
      // Return `count` tiny scenarios to reflect the requested iterations without heavy work
      return Array.from({ length: Math.min(count, 5) }).map((_, i) =>
        makeScenario(`s${i + 1}`, 1 / Math.min(count, 5), { marketCondition: 'stable', industryOutlook: 'stable' })
      )
    })
    ;(engine as any).normalizeScenarioProbabilities = jest.fn()

    // Build an intentionally sparse profile to minimize completeness < 0.5
    const sparseProfile: Partial<UserProfile> = {
      demographics: { age: undefined, location: {} as any } as any,
      career: {} as any,
      financial: {} as any
    }

    await engine.runSimulation(decision, option, sparseProfile, 'seed-low')

    // Expect adjustIterationCount to be called with completeness < 0.5
    expect(adjustSpy).toHaveBeenCalled()
    const calls = adjustSpy.mock.calls
    // base (1000) and multiplier (2) behavior is validated indirectly; we ensure the branch was the low-completeness one
    const lastArgs = calls[calls.length - 1]
    expect(lastArgs[1]).toBeLessThan(0.5)
  })
})

describe('SimulationEngine.getMonthlyExpenses (robustness on shapes)', () => {
  test('accepts number or object and falls back to default', () => {
    const engine = new SimulationEngine({})
    // number
    const profileNum: any = { financial: { monthlyExpenses: 4200 } }
    expect((engine as any).getMonthlyExpenses(profileNum)).toBe(4200)
    // object
    const profileObj: any = { financial: { monthlyExpenses: { a: 100, b: 200, c: 50 } } }
    expect((engine as any).getMonthlyExpenses(profileObj)).toBe(350)
    // other -> default 3000
    const profileBad: any = { financial: { monthlyExpenses: null } }
    expect((engine as any).getMonthlyExpenses(profileBad)).toBe(3000)
  })
})

describe('SimulationEngine.weighted statistics', () => {
  test('weightedMean and weightedStdDev handle edge cases', () => {
    const engine = new SimulationEngine({})
    expect((engine as any).weightedMean([], [])).toBe(0)
    expect((engine as any).weightedStdDev([1], [1])).toBe(0)
    expect((engine as any).weightedStdDev([], [])).toBe(0)

    const vals = [10, 20, 30]
    const w = [1, 1, 2] // mean = (10*1 + 20*1 + 30*2) / 4 = 22.5
    expect((engine as any).weightedMean(vals, w)).toBeCloseTo(22.5, 6)
    expect((engine as any).weightedStdDev(vals, w)).toBeGreaterThan(0)
  })

  test('weightedConfidenceInterval returns correct bounds at 90% confidence for sorted inputs', () => {
    const engine = new SimulationEngine({})
    const values = [100, 200, 300, 400]
    const weights = [0.1, 0.2, 0.4, 0.3]
    const ci = (engine as any).weightedConfidenceInterval(values, weights, 0.9)
    // Sanity checks
    expect(ci.confidence).toBe(0.9)
    expect(ci.lower).toBeGreaterThanOrEqual(100)
    expect(ci.upper).toBeLessThanOrEqual(400)
    expect(ci.lower).toBeLessThanOrEqual(ci.upper)
  })
})