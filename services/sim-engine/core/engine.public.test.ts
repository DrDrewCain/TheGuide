/* 
Testing library/framework: Jest (describe/it/expect). 
Lightweight smoke test to ensure export availability and basic run with stubs.
*/
import { SimulationEngine } from './engine.test'
import type { Decision, DecisionOption, UserProfile } from '@theguide/models'

jest.mock('uuid', () => ({ v4: () => '00000000-0000-0000-0000-TESTUUID0002' }))
jest.mock('../src/data/data-enrichment', () => ({
  DataEnrichmentService: class { getSalaryDistribution = jest.fn().mockResolvedValue({ median: 65000 }) }
}))

const decision: Decision = { id: 'd1', type: 'job_offer' } as any
const option: DecisionOption = { id: 'o1', parameters: { newSalary: 130000 }, estimatedImpact: {} } as any
const profile: Partial<UserProfile> = {
  demographics: { age: 29, location: { city: 'NYC', state: 'NY', country: 'USA', zipCode: '10001' } as any } as any,
  career: { currentRole: 'Engineer', yearsExperience: 3, salary: 90000 } as any,
  financial: { assets: { cash: 20000, investments: 10000, retirement: 10000, realEstate: 0, other: 0 } as any, 
               liabilities: { creditCards: 0, studentLoans: 0, mortgage: 0, other: 0 } as any,
               monthlyExpenses: 3500, savingsRate: 10, creditScore: 710 } as any
}

it('smoke: runSimulation returns coherent result', async () => {
  const engine = new SimulationEngine({})
  // Keep runtime small by stubbing internal heavy generator
  ;(engine as any).generateScenarios = jest.fn().mockReturnValue([])
  ;(engine as any).normalizeScenarioProbabilities = jest.fn()
  ;(engine as any).calculateAggregateMetrics = jest.fn().mockReturnValue({
    expectedValue: { financial: 1, career: 1, lifestyle: 1, overall: 1 },
    volatility: { financial: 0.1, career: 0.1, lifestyle: 0.1 },
    probabilityOfSuccess: 0.5,
    confidenceInterval: { lower: 0, upper: 1, confidence: 0.9 },
    riskScore: 1,
    opportunityScore: 1
  })
  ;(SimulationEngine as any).generateRecommendations = jest.fn().mockReturnValue([])
  ;(SimulationEngine as any).identifyRisks = jest.fn().mockReturnValue([])
  ;(SimulationEngine as any).identifyOpportunities = jest.fn().mockReturnValue([])

  const res = await engine.runSimulation(decision, option, profile, 'seed-smoke')
  expect(res.id).toBe('00000000-0000-0000-0000-TESTUUID0002')
  expect(res.scenarios).toEqual([])
  expect(res.aggregateMetrics.expectedValue.overall).toBe(1)
})