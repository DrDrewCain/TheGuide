import type {
  AggregateMetrics,
  Decision,
  DecisionOption,
  EconomicConditions,
  KeyEvent,
  Opportunity,
  Recommendation,
  Risk,
  Scenario,
  SimulationResult,
  UserProfile,
  YearlyOutcome,
} from '@theguide/models'
import { v4 as uuidv4 } from 'uuid'
import { DataEnrichmentService } from '../src/data/data-enrichment'
import { type RNG, SeededRNG } from './rng'

export class SimulationEngine {
  private static readonly SIMULATION_COUNT = 1000
  private static readonly TIME_HORIZONS = [1, 3, 5, 10]

  private dataEnrichment: DataEnrichmentService

  constructor(dataSources?: any) {
    this.dataEnrichment = new DataEnrichmentService(dataSources || {})
  }

  /**
   * Run Monte Carlo simulation for a decision option
   */
  async runSimulation(
    decision: Decision,
    option: DecisionOption,
    partialProfile: Partial<UserProfile>,
    seed?: string
  ): Promise<SimulationResult> {
    // Create seeded RNG for reproducibility
    const rng = new SeededRNG(seed || `${decision.id}-${option.id}-${Date.now()}`)

    // Assess data quality and enrich profile
    const dataQuality = this.assessDataQuality(partialProfile, decision.type)
    const userProfile = await this.enrichUserProfile(partialProfile, decision.type)

    // Generate scenarios with adjusted iteration count based on data quality
    const iterationCount = this.adjustIterationCount(
      SimulationEngine.SIMULATION_COUNT,
      dataQuality.completeness
    )
    const scenarios = this.generateScenarios(decision, option, userProfile, rng, iterationCount)

    // Normalize probabilities
    this.normalizeScenarioProbabilities(scenarios)

    // Calculate weighted metrics
    const aggregateMetrics = this.calculateAggregateMetrics(scenarios, dataQuality)
    const recommendations = SimulationEngine.generateRecommendations(scenarios, option, userProfile)
    const risks = SimulationEngine.identifyRisks(scenarios, option)
    const opportunities = SimulationEngine.identifyOpportunities(scenarios, option)

    return {
      id: uuidv4(),
      decisionId: decision.id,
      optionId: option.id,
      runDate: new Date(),
      scenarios,
      aggregateMetrics,
      recommendations,
      risks,
      opportunities,
    }
  }

  /**
   * Generate multiple scenarios with different economic conditions
   */
  private generateScenarios(
    decision: Decision,
    option: DecisionOption,
    userProfile: UserProfile,
    rng: RNG,
    count: number
  ): Scenario[] {
    const scenarios: Scenario[] = []

    for (let i = 0; i < count; i++) {
      const economicConditions = this.generateEconomicConditions(rng)
      const outcomes = this.projectOutcomes(decision, option, userProfile, economicConditions, rng)
      const keyEvents = this.generateKeyEvents(economicConditions, rng)

      scenarios.push({
        id: uuidv4(),
        probability: 1 / count, // Initial uniform probability
        economicConditions,
        outcomes,
        keyEvents,
        assumptions: this.getAssumptions(economicConditions),
      })
    }

    return scenarios
  }

  /**
   * Generate random but realistic economic conditions
   */
  private generateEconomicConditions(rng: RNG): EconomicConditions {
    // Use historical distributions and correlations
    const marketRand = rng.next()
    let marketCondition: EconomicConditions['marketCondition']
    let gdpGrowth: number
    let inflationRate: number
    let unemploymentRate: number

    if (marketRand < 0.1) {
      // Recession (10% probability)
      marketCondition = 'recession'
      gdpGrowth = rng.normal(-2, 1)
      inflationRate = rng.normal(1, 0.5)
      unemploymentRate = rng.normal(8, 2)
    } else if (marketRand < 0.25) {
      // Downturn (15% probability)
      marketCondition = 'downturn'
      gdpGrowth = rng.normal(0.5, 0.5)
      inflationRate = rng.normal(2, 0.5)
      unemploymentRate = rng.normal(5.5, 1)
    } else if (marketRand < 0.75) {
      // Stable (50% probability)
      marketCondition = 'stable'
      gdpGrowth = rng.normal(2.5, 0.5)
      inflationRate = rng.normal(2.5, 0.5)
      unemploymentRate = rng.normal(4, 0.5)
    } else if (marketRand < 0.9) {
      // Growth (15% probability)
      marketCondition = 'growth'
      gdpGrowth = rng.normal(3.5, 0.5)
      inflationRate = rng.normal(3, 0.5)
      unemploymentRate = rng.normal(3.5, 0.5)
    } else {
      // Boom (10% probability)
      marketCondition = 'boom'
      gdpGrowth = rng.normal(4.5, 0.5)
      inflationRate = rng.normal(3.5, 0.5)
      unemploymentRate = rng.normal(3, 0.5)
    }

    const industryOutlook = SimulationEngine.determineIndustryOutlook(marketCondition)

    return {
      gdpGrowth,
      inflationRate,
      unemploymentRate,
      marketCondition,
      industryOutlook,
    }
  }

  /**
   * Project outcomes for different time horizons
   */
  private projectOutcomes(
    decision: Decision,
    option: DecisionOption,
    userProfile: UserProfile,
    economicConditions: EconomicConditions,
    rng: RNG
  ): Scenario['outcomes'] {
    const outcomes: any = {}
    let previousFinancials = SimulationEngine.calculateBaselineFinancials(userProfile)

    // Project for each time horizon
    for (const horizon of SimulationEngine.TIME_HORIZONS) {
      const yearOutcome = this.projectYear(
        horizon,
        decision,
        option,
        userProfile,
        economicConditions,
        previousFinancials,
        rng
      )
      outcomes[`year${horizon}`] = yearOutcome
      previousFinancials = yearOutcome.financialPosition
    }

    return outcomes
  }

  /**
   * Project outcomes for a specific year
   */
  private projectYear(
    year: number,
    decision: Decision,
    option: DecisionOption,
    userProfile: UserProfile,
    economicConditions: EconomicConditions,
    previousFinancials: any,
    rng: RNG
  ): YearlyOutcome {
    // Income projection based on decision type and economic conditions
    let income = userProfile.career.salary

    if (
      (decision.type === 'career_change' || decision.type === 'job_offer') &&
      option.parameters?.newSalary
    ) {
      income = option.parameters.newSalary as number
    }

    // Apply wage growth with randomness
    const wageInflation = economicConditions.inflationRate / 100
    const baseCareerGrowth = this.calculateCareerGrowthRate(userProfile, economicConditions)

    // Add random variation to growth rate (-2% to +2%)
    const growthVariation = (rng.uniform(0, 1) - 0.5) * 0.04
    const careerGrowthRate = baseCareerGrowth + growthVariation
    const totalGrowthRate = wageInflation + careerGrowthRate

    income = income * (1 + totalGrowthRate) ** year

    // Calculate expenses with inflation and random variation
    const monthlyExpenses = this.getMonthlyExpenses(userProfile)
    const expenseVariation = 1 + (rng.uniform(0, 1) - 0.5) * 0.2 // +/- 10% variation
    const expenses =
      monthlyExpenses * 12 * expenseVariation * (1 + economicConditions.inflationRate / 100) ** year

    // Add unexpected expenses occasionally (20% chance per year)
    const unexpectedExpenses = rng.uniform(0, 1) < 0.2 ? income * rng.uniform(0.05, 0.15) : 0
    const totalExpenses = expenses + unexpectedExpenses

    // Savings calculation
    const savings = income - totalExpenses

    // Investment returns on investable assets only
    const investableAssets =
      previousFinancials.netWorth - (userProfile.financial.assets.cash || 20000)
    const baseReturn = this.calculateInvestmentReturn(economicConditions, rng)

    // Add market volatility
    const volatilityMultiplier = 1 + (rng.uniform(0, 1) - 0.5) * 0.3 // +/- 15% volatility
    const investmentReturn = baseReturn * volatilityMultiplier
    const investmentGains = Math.max(0, investableAssets) * investmentReturn

    // Bonus income (10% chance)
    const bonusIncome = rng.uniform(0, 1) < 0.1 ? income * rng.uniform(0.1, 0.3) : 0

    const netWorth = previousFinancials.netWorth + savings + investmentGains + bonusIncome

    // Career progression with random events
    const experience = userProfile.career.yearsExperience + year

    // Random promotion chance (15% per year after year 2)
    const promotionBonus = year > 2 && rng.uniform(0, 1) < 0.15 ? 1 : 0
    const seniorityLevel = Math.min(10, Math.floor(experience / 3) + promotionBonus)

    // Market value varies more widely
    const marketValue = income * rng.uniform(0.9, 1.25)

    // Extract impact values safely
    const impactValues = this.extractImpactValues(option)
    const baseJobSatisfaction = this.calculateJobSatisfaction(decision, impactValues, year, rng)
    const jobSatisfaction = Math.max(
      1,
      Math.min(10, baseJobSatisfaction + (rng.uniform(0, 1) - 0.5) * 2)
    )

    // Life metrics with more variation
    const baseStress = this.calculateStress(decision, impactValues, economicConditions, year, rng)
    const stress = Math.max(1, Math.min(10, baseStress + (rng.uniform(0, 1) - 0.5) * 2))

    const baseBalance = this.calculateWorkLifeBalance(decision, impactValues, year, rng)
    const workLifeBalance = Math.max(1, Math.min(10, baseBalance + (rng.uniform(0, 1) - 0.5) * 1.5))

    // Life events affect happiness (20% chance)
    const lifeEventImpact = rng.uniform(0, 1) < 0.2 ? (rng.uniform(0, 1) - 0.5) * 3 : 0
    const overallHappiness = Math.max(
      1,
      Math.min(10, (jobSatisfaction + workLifeBalance + (10 - stress)) / 3 + lifeEventImpact)
    )
    const healthScore = Math.max(1, Math.min(10, 10 - stress * 0.2 + (rng.uniform(0, 1) - 0.5)))

    return {
      year,
      financialPosition: { netWorth, income, expenses, savings },
      careerProgress: {
        role: (option.parameters?.newRole as string) || userProfile.career.currentRole,
        seniorityLevel,
        marketValue,
        jobSatisfaction,
      },
      lifeMetrics: { overallHappiness, stress, workLifeBalance, healthScore },
    }
  }

  /**
   * Normalize scenario probabilities
   */
  private normalizeScenarioProbabilities(scenarios: Scenario[]): void {
    // Adjust based on market condition likelihood
    scenarios.forEach(scenario => {
      let adjustment = 1.0
      switch (scenario.economicConditions.marketCondition) {
        case 'recession':
          adjustment = 0.8
          break
        case 'downturn':
          adjustment = 0.9
          break
        case 'stable':
          adjustment = 1.2
          break
        case 'growth':
          adjustment = 1.0
          break
        case 'boom':
          adjustment = 0.7
          break
      }
      scenario.probability *= adjustment
    })

    // Normalize to sum to 1
    const sum = scenarios.reduce((a, s) => a + s.probability, 0)
    if (sum > 0) {
      scenarios.forEach(s => (s.probability /= sum))
    }
  }

  /**
   * Calculate aggregate metrics across all scenarios
   */
  private calculateAggregateMetrics(
    scenarios: Scenario[],
    dataQuality: DataQuality
  ): AggregateMetrics {
    // Extract values and weights
    const weights = scenarios.map(s => s.probability)
    const financialValues = scenarios.map(s => s.outcomes.year10.financialPosition.netWorth)
    const careerValues = scenarios.map(s => s.outcomes.year10.careerProgress.jobSatisfaction)
    const lifestyleValues = scenarios.map(s => s.outcomes.year10.lifeMetrics.overallHappiness)

    // Weighted expected values
    const expectedFinancial = this.weightedMean(financialValues, weights)
    const expectedCareer = this.weightedMean(careerValues, weights)
    const expectedLifestyle = this.weightedMean(lifestyleValues, weights)
    const expectedOverall = (expectedFinancial / 100000 + expectedCareer + expectedLifestyle) / 3

    // Weighted volatility
    const financialVolatility =
      this.weightedStdDev(financialValues, weights) / Math.abs(expectedFinancial || 1)
    const careerVolatility =
      this.weightedStdDev(careerValues, weights) / Math.abs(expectedCareer || 1)
    const lifestyleVolatility =
      this.weightedStdDev(lifestyleValues, weights) / Math.abs(expectedLifestyle || 1)

    // Success probability (weighted)
    const successProbability = scenarios
      .filter(
        s =>
          s.outcomes.year10.financialPosition.netWorth > 0 &&
          s.outcomes.year10.careerProgress.jobSatisfaction > 5 &&
          s.outcomes.year10.lifeMetrics.overallHappiness > 5
      )
      .reduce((sum, s) => sum + s.probability, 0)

    // Weighted confidence interval
    const confidenceInterval = this.weightedConfidenceInterval(financialValues, weights, 0.9)

    // Apply data quality adjustments
    const uncertaintyMultiplier =
      dataQuality.confidence === 'high' ? 1.0 : dataQuality.confidence === 'medium' ? 1.2 : 1.5

    // Risk and opportunity scores
    const riskScore = Math.min(10, financialVolatility * 10 * uncertaintyMultiplier)
    const opportunityScore = Math.min(10, expectedOverall * 2)

    return {
      expectedValue: {
        financial: expectedFinancial,
        career: expectedCareer,
        lifestyle: expectedLifestyle,
        overall: expectedOverall,
      },
      volatility: {
        financial: financialVolatility * uncertaintyMultiplier,
        career: careerVolatility * uncertaintyMultiplier,
        lifestyle: lifestyleVolatility * uncertaintyMultiplier,
      },
      probabilityOfSuccess: successProbability,
      confidenceInterval: {
        lower: confidenceInterval.lower,
        upper: confidenceInterval.upper,
        confidence: confidenceInterval.confidence * dataQuality.completeness,
      },
      riskScore,
      opportunityScore,
    }
  }

  /**
   * Generate personalized recommendations
   */
  private static generateRecommendations(
    scenarios: Scenario[],
    _option: DecisionOption,
    userProfile: UserProfile
  ): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Analyze scenarios to identify patterns
    const negativeScenarios = scenarios.filter(
      s => s.outcomes.year5.financialPosition.netWorth < userProfile.financial.assets.cash
    )

    if (negativeScenarios.length > scenarios.length * 0.3) {
      recommendations.push({
        id: uuidv4(),
        priority: 'high',
        category: 'risk_mitigation',
        title: 'Build Emergency Fund',
        description: 'High probability of financial stress in downturn scenarios',
        actions: [
          'Increase emergency fund to 12 months expenses',
          'Diversify income sources',
          'Reduce fixed expenses',
        ],
        potentialImpact: 25,
      })
    }

    // Timing recommendations
    const bestTimingScenarios = scenarios.filter(
      s =>
        s.economicConditions.marketCondition === 'stable' ||
        s.economicConditions.marketCondition === 'growth'
    )

    if (bestTimingScenarios.length > scenarios.length * 0.6) {
      recommendations.push({
        id: uuidv4(),
        priority: 'medium',
        category: 'timing',
        title: 'Favorable Market Timing',
        description: 'Current conditions favor making this decision',
        actions: [
          'Act within the next 3-6 months',
          'Lock in current favorable rates/conditions',
          'Negotiate from position of strength',
        ],
        potentialImpact: 15,
      })
    }

    return recommendations
  }

  /**
   * Identify key risks
   */
  private static identifyRisks(scenarios: Scenario[], _option: DecisionOption): Risk[] {
    const risks: Risk[] = []

    // Analyze worst-case scenarios
    const _worstScenarios = scenarios
      .sort(
        (a, b) =>
          a.outcomes.year5.financialPosition.netWorth - b.outcomes.year5.financialPosition.netWorth
      )
      .slice(0, Math.floor(scenarios.length * 0.1))

    // Job loss risk
    const jobLossScenarios = scenarios.filter(s => s.keyEvents.some(e => e.type === 'layoff'))

    if (jobLossScenarios.length > scenarios.length * 0.2) {
      risks.push({
        id: uuidv4(),
        severity: 'high',
        probability: jobLossScenarios.length / scenarios.length,
        category: 'career',
        description: 'Elevated job loss risk in your industry',
        mitigation: [
          'Maintain strong professional network',
          'Keep skills current and marketable',
          'Build multiple income streams',
        ],
        monitoringIndicators: [
          'Industry layoff announcements',
          'Company financial reports',
          'Economic indicators',
        ],
      })
    }

    return risks
  }

  /**
   * Identify opportunities
   */
  private static identifyOpportunities(
    scenarios: Scenario[],
    _option: DecisionOption
  ): Opportunity[] {
    const opportunities: Opportunity[] = []

    // Analyze best-case scenarios
    const bestScenarios = scenarios
      .sort(
        (a, b) =>
          b.outcomes.year5.financialPosition.netWorth - a.outcomes.year5.financialPosition.netWorth
      )
      .slice(0, Math.floor(scenarios.length * 0.1))

    const avgBestCase = SimulationEngine.average(
      bestScenarios.map(s => s.outcomes.year5.financialPosition.netWorth)
    )
    const avgCase = SimulationEngine.average(
      scenarios.map(s => s.outcomes.year5.financialPosition.netWorth)
    )

    if (avgBestCase > avgCase * 2) {
      opportunities.push({
        id: uuidv4(),
        probability: 0.1,
        timeframe: 'medium_term',
        description: 'Significant upside potential in favorable conditions',
        requirements: [
          'Strong execution on core plan',
          'Market conditions remain favorable',
          'Continuous skill development',
        ],
        potentialValue: avgBestCase - avgCase,
      })
    }

    return opportunities
  }

  private static average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length
  }

  private static determineIndustryOutlook(
    marketCondition: EconomicConditions['marketCondition']
  ): EconomicConditions['industryOutlook'] {
    const rand = Math.random()
    switch (marketCondition) {
      case 'recession':
        return rand < 0.7 ? 'declining' : 'stable'
      case 'downturn':
        return rand < 0.5 ? 'declining' : rand < 0.9 ? 'stable' : 'growing'
      case 'stable':
        return rand < 0.1
          ? 'declining'
          : rand < 0.7
            ? 'stable'
            : rand < 0.95
              ? 'growing'
              : 'booming'
      case 'growth':
        return rand < 0.3 ? 'stable' : rand < 0.8 ? 'growing' : 'booming'
      case 'boom':
        return rand < 0.4 ? 'growing' : 'booming'
    }
  }

  private static calculateBaselineFinancials(userProfile: UserProfile) {
    const totalAssets = Object.values(userProfile.financial.assets).reduce((a, b) => a + b, 0)
    const totalLiabilities = Object.values(userProfile.financial.liabilities).reduce(
      (a, b) => a + b,
      0
    )
    return {
      netWorth: totalAssets - totalLiabilities,
      income: userProfile.career.salary,
      expenses:
        Object.values(userProfile.financial.monthlyExpenses).reduce((a, b) => a + b, 0) * 12,
      savings: userProfile.career.salary * (userProfile.financial.savingsRate / 100),
    }
  }

  private calculateCareerGrowthRate(
    userProfile: UserProfile,
    economicConditions: EconomicConditions
  ): number {
    let baseGrowth = 0.03 // 3% base growth

    // Industry outlook modifier
    switch (economicConditions.industryOutlook) {
      case 'declining':
        baseGrowth *= 0.5
        break
      case 'stable':
        baseGrowth *= 1
        break
      case 'growing':
        baseGrowth *= 1.5
        break
      case 'booming':
        baseGrowth *= 2
        break
    }

    // Experience modifier
    const experience = userProfile.career.yearsExperience || 0
    if (experience < 5) baseGrowth *= 1.5
    else if (experience < 10) baseGrowth *= 1.2

    return baseGrowth
  }

  private calculateInvestmentReturn(economicConditions: EconomicConditions, rng: RNG): number {
    const baseReturn = 0.07
    const volatility = 0.15

    let meanReturn: number
    switch (economicConditions.marketCondition) {
      case 'recession':
        meanReturn = baseReturn - 0.15
        break
      case 'downturn':
        meanReturn = baseReturn - 0.05
        break
      case 'stable':
        meanReturn = baseReturn
        break
      case 'growth':
        meanReturn = baseReturn + 0.05
        break
      case 'boom':
        meanReturn = baseReturn + 0.1
        break
    }

    return rng.normal(meanReturn, volatility)
  }

  // Moved to earlier in the file

  // Methods for data quality assessment and enrichment

  private assessDataQuality(
    profile: Partial<UserProfile>,
    decisionType: Decision['type']
  ): DataQuality {
    const requiredFields = this.getRequiredFields(decisionType)
    let provided = 0
    let critical = 0
    let criticalProvided = 0

    requiredFields.forEach(field => {
      const value = this.getNestedValue(profile, field.path)
      if (value !== undefined && value !== null) {
        provided++
        if (field.critical) criticalProvided++
      }
      if (field.critical) critical++
    })

    const completeness = provided / requiredFields.length
    const criticalCompleteness = critical > 0 ? criticalProvided / critical : 1

    return {
      completeness,
      criticalCompleteness,
      confidence: this.calculateConfidenceLevel(completeness, criticalCompleteness),
    }
  }

  private async enrichUserProfile(
    partial: Partial<UserProfile>,
    _decisionType: Decision['type']
  ): Promise<UserProfile> {
    const enriched = JSON.parse(JSON.stringify(partial)) as any

    // Enrich salary data if missing
    if (partial.career?.currentRole && !partial.career?.salary) {
      const salaryData = await this.dataEnrichment.getSalaryDistribution({
        jobTitle: partial.career.currentRole,
        industry: partial.career.industry,
        location: partial.demographics?.location
          ? `${partial.demographics.location.city}, ${partial.demographics.location.state}`
          : undefined,
        experience: partial.career.yearsExperience,
      })

      enriched.career = enriched.career || {}
      enriched.career.salary = salaryData.likely
    }

    // Apply intelligent defaults
    return this.applyDefaults(enriched)
  }

  private getRequiredFields(decisionType: Decision['type']): RequiredField[] {
    const base: RequiredField[] = [
      { path: 'demographics.age', critical: true },
      { path: 'demographics.location.city', critical: true },
      { path: 'career.salary', critical: true },
      { path: 'financial.monthlyExpenses', critical: true },
    ]

    switch (decisionType) {
      case 'career_change':
      case 'job_offer':
        base.push(
          { path: 'career.currentRole', critical: true },
          { path: 'career.yearsExperience', critical: true }
        )
        break
      case 'home_purchase':
        base.push(
          { path: 'financial.assets', critical: true },
          { path: 'financial.creditScore', critical: false }
        )
        break
    }

    return base
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj)
  }

  private calculateConfidenceLevel(
    completeness: number,
    criticalCompleteness: number
  ): 'high' | 'medium' | 'low' {
    const score = completeness * 0.4 + criticalCompleteness * 0.6
    if (score >= 0.8) return 'high'
    if (score >= 0.6) return 'medium'
    return 'low'
  }

  private adjustIterationCount(base: number, completeness: number): number {
    if (completeness < 0.5) return base * 2
    if (completeness < 0.7) return Math.floor(base * 1.5)
    return base
  }

  private applyDefaults(profile: any): UserProfile {
    const defaults = {
      demographics: {
        age: 35,
        maritalStatus: 'single' as const,
        dependents: 0,
        location: {
          city: 'Unknown',
          state: 'Unknown',
          country: 'USA',
          zipCode: '00000',
        },
        education: {
          level: 'bachelors' as const,
          field: 'General',
          school: 'Unknown',
        },
        healthStatus: 'good' as const,
      },
      career: {
        currentRole: 'Professional',
        industry: 'Technology',
        company: 'Unknown',
        companySize: 'medium' as const,
        yearsExperience: 5,
        skills: [],
        salary: 65000,
        compensation: {
          base: 65000,
          bonus: 0,
          equity: 0,
          benefits: 0,
        },
        workStyle: 'office' as const,
        careerTrajectory: 'stable' as const,
      },
      financial: {
        assets: {
          cash: 20000,
          investments: 30000,
          retirement: 50000,
          realEstate: 0,
          other: 0,
        },
        liabilities: {
          creditCards: 0,
          studentLoans: 0,
          mortgage: 0,
          other: 0,
        },
        monthlyExpenses: {
          housing: 1500,
          transportation: 500,
          food: 600,
          utilities: 200,
          entertainment: 300,
          healthcare: 200,
          other: 200,
        },
        savingsRate: 10,
        creditScore: 700,
        riskTolerance: 'moderate' as const,
      },
      preferences: {},
      goals: {},
    }

    return this.deepMerge(defaults, profile)
  }

  private deepMerge(target: any, source: any): any {
    const output = Object.assign({}, target)
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] })
          else output[key] = this.deepMerge(target[key], source[key])
        } else {
          Object.assign(output, { [key]: source[key] })
        }
      })
    }
    return output
  }

  private isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item)
  }

  private getMonthlyExpenses(userProfile: UserProfile): number {
    const expenses = userProfile.financial.monthlyExpenses

    // Handle both number and object types
    if (typeof expenses === 'number') {
      return expenses
    } else if (typeof expenses === 'object') {
      return Object.values(expenses).reduce((sum, val) => sum + (val || 0), 0)
    }

    return 3000 // Default fallback
  }

  private extractImpactValues(option: DecisionOption): any {
    const impact = option.estimatedImpact

    // Handle both flat and nested impact structures
    if (typeof impact === 'object' && 'lifestyle' in impact) {
      return impact
    }

    // Create default structure
    return {
      financial: { netWorth: 0, income: 0 },
      career: { satisfaction: 0, growth: 0 },
      lifestyle: { fulfillment: 0, stress: 0, workLifeBalance: 0 },
    }
  }

  private getAssumptions(economicConditions: EconomicConditions): Record<string, string> {
    return {
      inflation: `${economicConditions.inflationRate.toFixed(1)}% annual`,
      gdpGrowth: `${economicConditions.gdpGrowth.toFixed(1)}% annual`,
      unemployment: `${economicConditions.unemploymentRate.toFixed(1)}%`,
      marketCondition: economicConditions.marketCondition,
      industryOutlook: economicConditions.industryOutlook,
    }
  }

  private calculateJobSatisfaction(
    decision: Decision,
    impact: any,
    year: number,
    rng: RNG
  ): number {
    let satisfaction = 7 + rng.normal(0, 0.5)

    // Career change honeymoon period
    if ((decision.type === 'career_change' || decision.type === 'job_offer') && year < 2) {
      satisfaction += 1.5
    }

    // Add impact
    const impactValue = impact?.lifestyle?.fulfillment || 0
    satisfaction += impactValue / 2

    return Math.max(1, Math.min(10, satisfaction))
  }

  private calculateStress(
    decision: Decision,
    impact: any,
    economicConditions: EconomicConditions,
    year: number,
    rng: RNG
  ): number {
    let stress = 5 + rng.normal(0, 0.5)

    // Economic conditions
    if (economicConditions.marketCondition === 'recession') stress += 2
    if (economicConditions.marketCondition === 'boom') stress += 0.5

    // Decision adjustments
    if ((decision.type === 'career_change' || decision.type === 'job_offer') && year < 1)
      stress += 1.5
    if (decision.type === 'relocation' && year < 1) stress += 2

    // Add impact
    const impactValue = impact?.lifestyle?.stress || 0
    stress += impactValue

    return Math.max(1, Math.min(10, stress))
  }

  private calculateWorkLifeBalance(
    _decision: Decision,
    impact: any,
    year: number,
    rng: RNG
  ): number {
    let balance = 6 + rng.normal(0, 0.3)

    // Add impact
    const impactValue = impact?.lifestyle?.workLifeBalance || 0
    balance += impactValue

    // Settling bonus
    if (year > 2) balance += 0.5

    return Math.max(1, Math.min(10, balance))
  }

  private generateKeyEvents(economicConditions: EconomicConditions, rng: RNG): KeyEvent[] {
    const events: KeyEvent[] = []

    // Market-based events
    if (economicConditions.marketCondition === 'recession' && rng.uniform(0, 1) < 0.3) {
      events.push({
        year: Math.floor(rng.uniform(1, 10)),
        type: 'market_crash',
        description: 'Major market downturn affecting investments',
        impact: 'negative',
        financialImpact: -50000,
      })
    }

    // Career events
    if (economicConditions.industryOutlook === 'booming' && rng.uniform(0, 1) < 0.4) {
      events.push({
        year: Math.floor(rng.uniform(2, 8)),
        type: 'promotion',
        description: 'Promotion opportunity due to industry growth',
        impact: 'positive',
      })
    }

    return events
  }

  // Statistical utility methods
  private weightedMean(values: number[], weights: number[]): number {
    if (values.length !== weights.length || values.length === 0) return 0

    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    if (totalWeight === 0) return 0

    const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0)
    return weightedSum / totalWeight
  }

  private weightedStdDev(values: number[], weights: number[]): number {
    if (values.length !== weights.length || values.length < 2) return 0

    const mean = this.weightedMean(values, weights)
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    if (totalWeight === 0) return 0

    const weightedSquaredDiff = values.reduce((sum, val, i) => {
      return sum + weights[i] * (val - mean) ** 2
    }, 0)

    return Math.sqrt(weightedSquaredDiff / totalWeight)
  }

  private weightedConfidenceInterval(
    values: number[],
    weights: number[],
    confidence: number
  ): { lower: number; upper: number; confidence: number } {
    if (values.length !== weights.length || values.length === 0) {
      return { lower: 0, upper: 0, confidence: 0 }
    }

    // Sort values with their corresponding weights
    const sortedPairs = values
      .map((val, i) => ({ value: val, weight: weights[i] }))
      .sort((a, b) => a.value - b.value)

    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const alpha = (1 - confidence) / 2
    const lowerTarget = alpha * totalWeight
    const upperTarget = (1 - alpha) * totalWeight

    let cumulativeWeight = 0
    let lower = sortedPairs[0].value
    let upper = sortedPairs[sortedPairs.length - 1].value

    for (const pair of sortedPairs) {
      cumulativeWeight += pair.weight
      if (cumulativeWeight >= lowerTarget && lower === sortedPairs[0].value) {
        lower = pair.value
      }
      if (cumulativeWeight >= upperTarget) {
        upper = pair.value
        break
      }
    }

    return { lower, upper, confidence }
  }
}

// Type definitions
interface RequiredField {
  path: string
  critical: boolean
}

interface DataQuality {
  completeness: number
  criticalCompleteness: number
  confidence: 'high' | 'medium' | 'low'
}
