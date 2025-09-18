import {
  Decision,
  DecisionOption,
  UserProfile,
  SimulationResult,
  Scenario,
  EconomicConditions,
  YearlyOutcome,
  AggregateMetrics,
  KeyEvent,
  Recommendation,
  Risk,
  Opportunity
} from '@theguide/models';

export class SimulationEngine {
  private static readonly SIMULATION_COUNT = 1000;
  private static readonly TIME_HORIZONS = [1, 3, 5, 10];

  /**
   * Run Monte Carlo simulation for a decision option
   */
  static async runSimulation(
    decision: Decision,
    option: DecisionOption,
    userProfile: UserProfile
  ): Promise<SimulationResult> {
    const scenarios = this.generateScenarios(decision, option, userProfile);
    const aggregateMetrics = this.calculateAggregateMetrics(scenarios);
    const recommendations = this.generateRecommendations(scenarios, option, userProfile);
    const risks = this.identifyRisks(scenarios, option);
    const opportunities = this.identifyOpportunities(scenarios, option);

    return {
      id: crypto.randomUUID(),
      decisionId: decision.id,
      optionId: option.id,
      runDate: new Date(),
      scenarios,
      aggregateMetrics,
      recommendations,
      risks,
      opportunities
    };
  }

  /**
   * Generate multiple scenarios with different economic conditions
   */
  private static generateScenarios(
    decision: Decision,
    option: DecisionOption,
    userProfile: UserProfile
  ): Scenario[] {
    const scenarios: Scenario[] = [];

    for (let i = 0; i < this.SIMULATION_COUNT; i++) {
      const economicConditions = this.generateEconomicConditions();
      const outcomes = this.projectOutcomes(
        decision,
        option,
        userProfile,
        economicConditions
      );
      const keyEvents = this.generateKeyEvents(economicConditions);

      scenarios.push({
        id: crypto.randomUUID(),
        probability: 1 / this.SIMULATION_COUNT,
        economicConditions,
        outcomes,
        keyEvents,
        assumptions: this.getAssumptions(economicConditions)
      });
    }

    return this.adjustScenarioProbabilities(scenarios);
  }

  /**
   * Generate random but realistic economic conditions
   */
  private static generateEconomicConditions(): EconomicConditions {
    // Use historical distributions and correlations
    const marketRand = Math.random();
    let marketCondition: EconomicConditions['marketCondition'];
    let gdpGrowth: number;
    let inflationRate: number;
    let unemploymentRate: number;

    if (marketRand < 0.1) {
      // Recession (10% probability)
      marketCondition = 'recession';
      gdpGrowth = this.normalRandom(-2, 1);
      inflationRate = this.normalRandom(1, 0.5);
      unemploymentRate = this.normalRandom(8, 2);
    } else if (marketRand < 0.25) {
      // Downturn (15% probability)
      marketCondition = 'downturn';
      gdpGrowth = this.normalRandom(0.5, 0.5);
      inflationRate = this.normalRandom(2, 0.5);
      unemploymentRate = this.normalRandom(5.5, 1);
    } else if (marketRand < 0.75) {
      // Stable (50% probability)
      marketCondition = 'stable';
      gdpGrowth = this.normalRandom(2.5, 0.5);
      inflationRate = this.normalRandom(2.5, 0.5);
      unemploymentRate = this.normalRandom(4, 0.5);
    } else if (marketRand < 0.9) {
      // Growth (15% probability)
      marketCondition = 'growth';
      gdpGrowth = this.normalRandom(3.5, 0.5);
      inflationRate = this.normalRandom(3, 0.5);
      unemploymentRate = this.normalRandom(3.5, 0.5);
    } else {
      // Boom (10% probability)
      marketCondition = 'boom';
      gdpGrowth = this.normalRandom(4.5, 0.5);
      inflationRate = this.normalRandom(3.5, 0.5);
      unemploymentRate = this.normalRandom(3, 0.5);
    }

    const industryOutlook = this.determineIndustryOutlook(marketCondition);

    return {
      gdpGrowth,
      inflationRate,
      unemploymentRate,
      marketCondition,
      industryOutlook
    };
  }

  /**
   * Project outcomes for different time horizons
   */
  private static projectOutcomes(
    decision: Decision,
    option: DecisionOption,
    userProfile: UserProfile,
    economicConditions: EconomicConditions
  ): Scenario['outcomes'] {
    const baselineFinancials = this.calculateBaselineFinancials(userProfile);

    const year1 = this.projectYear(1, decision, option, userProfile, economicConditions, baselineFinancials);
    const year3 = this.projectYear(3, decision, option, userProfile, economicConditions, year1.financialPosition);
    const year5 = this.projectYear(5, decision, option, userProfile, economicConditions, year3.financialPosition);
    const year10 = this.projectYear(10, decision, option, userProfile, economicConditions, year5.financialPosition);

    return { year1, year3, year5, year10 };
  }

  /**
   * Project outcomes for a specific year
   */
  private static projectYear(
    year: number,
    decision: Decision,
    option: DecisionOption,
    userProfile: UserProfile,
    economicConditions: EconomicConditions,
    previousFinancials: any
  ): YearlyOutcome {
    // Income projection based on decision type and economic conditions
    let income = userProfile.career.salary;

    if (decision.type === 'career_change' && option.parameters.newSalary) {
      income = option.parameters.newSalary;
    }

    // Apply economic multipliers
    const economicMultiplier = 1 + (economicConditions.gdpGrowth / 100);
    const inflationMultiplier = Math.pow(1 + economicConditions.inflationRate / 100, year);

    income = income * Math.pow(economicMultiplier, year) * inflationMultiplier;

    // Add career growth
    const careerGrowthRate = this.calculateCareerGrowthRate(userProfile, economicConditions);
    income *= Math.pow(1 + careerGrowthRate, year);

    // Calculate expenses with inflation
    const baseExpenses = Object.values(userProfile.financial.monthlyExpenses).reduce((a, b) => a + b, 0) * 12;
    const expenses = baseExpenses * inflationMultiplier;

    // Savings and net worth calculation
    const savings = income - expenses;
    const investmentReturn = this.calculateInvestmentReturn(economicConditions);
    const netWorth = previousFinancials.netWorth + savings + (previousFinancials.netWorth * investmentReturn);

    // Career progression
    const seniorityLevel = Math.min(10, userProfile.career.yearsExperience + year) / 3;
    const marketValue = income * 1.1; // Assume 10% premium in market
    const jobSatisfaction = this.calculateJobSatisfaction(decision, option, year);

    // Life metrics
    const stress = this.calculateStress(decision, option, economicConditions, year);
    const workLifeBalance = this.calculateWorkLifeBalance(decision, option, year);
    const overallHappiness = (jobSatisfaction + workLifeBalance + (10 - stress)) / 3;
    const healthScore = 10 - (stress * 0.2); // Stress impacts health

    return {
      year,
      financialPosition: { netWorth, income, expenses, savings },
      careerProgress: {
        role: option.parameters.newRole || userProfile.career.currentRole,
        seniorityLevel,
        marketValue,
        jobSatisfaction
      },
      lifeMetrics: { overallHappiness, stress, workLifeBalance, healthScore }
    };
  }

  /**
   * Calculate aggregate metrics across all scenarios
   */
  private static calculateAggregateMetrics(scenarios: Scenario[]): AggregateMetrics {
    // Calculate expected values
    const financialValues = scenarios.map(s => s.outcomes.year10.financialPosition.netWorth);
    const careerValues = scenarios.map(s => s.outcomes.year10.careerProgress.jobSatisfaction);
    const lifestyleValues = scenarios.map(s => s.outcomes.year10.lifeMetrics.overallHappiness);

    const expectedFinancial = this.average(financialValues);
    const expectedCareer = this.average(careerValues);
    const expectedLifestyle = this.average(lifestyleValues);
    const expectedOverall = (expectedFinancial / 100000 + expectedCareer + expectedLifestyle) / 3;

    // Calculate volatility
    const financialVolatility = this.standardDeviation(financialValues) / expectedFinancial;
    const careerVolatility = this.standardDeviation(careerValues) / expectedCareer;
    const lifestyleVolatility = this.standardDeviation(lifestyleValues) / expectedLifestyle;

    // Success probability (define success as positive outcome)
    const successCount = scenarios.filter(s =>
      s.outcomes.year10.financialPosition.netWorth > 0 &&
      s.outcomes.year10.careerProgress.jobSatisfaction > 5 &&
      s.outcomes.year10.lifeMetrics.overallHappiness > 5
    ).length;
    const probabilityOfSuccess = successCount / scenarios.length;

    // Confidence interval
    const sortedFinancials = financialValues.sort((a, b) => a - b);
    const lower = sortedFinancials[Math.floor(scenarios.length * 0.05)];
    const upper = sortedFinancials[Math.floor(scenarios.length * 0.95)];

    // Risk and opportunity scores
    const riskScore = Math.min(10, financialVolatility * 10);
    const opportunityScore = Math.min(10, expectedOverall * 2);

    return {
      expectedValue: {
        financial: expectedFinancial,
        career: expectedCareer,
        lifestyle: expectedLifestyle,
        overall: expectedOverall
      },
      volatility: {
        financial: financialVolatility,
        career: careerVolatility,
        lifestyle: lifestyleVolatility
      },
      probabilityOfSuccess,
      confidenceInterval: {
        lower,
        upper,
        confidence: 0.9
      },
      riskScore,
      opportunityScore
    };
  }

  /**
   * Generate personalized recommendations
   */
  private static generateRecommendations(
    scenarios: Scenario[],
    option: DecisionOption,
    userProfile: UserProfile
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Analyze scenarios to identify patterns
    const negativeScenarios = scenarios.filter(s =>
      s.outcomes.year5.financialPosition.netWorth < userProfile.financial.assets.cash
    );

    if (negativeScenarios.length > scenarios.length * 0.3) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: 'high',
        category: 'risk_mitigation',
        title: 'Build Emergency Fund',
        description: 'High probability of financial stress in downturn scenarios',
        actions: [
          'Increase emergency fund to 12 months expenses',
          'Diversify income sources',
          'Reduce fixed expenses'
        ],
        potentialImpact: 25
      });
    }

    // Timing recommendations
    const bestTimingScenarios = scenarios.filter(s =>
      s.economicConditions.marketCondition === 'stable' ||
      s.economicConditions.marketCondition === 'growth'
    );

    if (bestTimingScenarios.length > scenarios.length * 0.6) {
      recommendations.push({
        id: crypto.randomUUID(),
        priority: 'medium',
        category: 'timing',
        title: 'Favorable Market Timing',
        description: 'Current conditions favor making this decision',
        actions: [
          'Act within the next 3-6 months',
          'Lock in current favorable rates/conditions',
          'Negotiate from position of strength'
        ],
        potentialImpact: 15
      });
    }

    return recommendations;
  }

  /**
   * Identify key risks
   */
  private static identifyRisks(scenarios: Scenario[], option: DecisionOption): Risk[] {
    const risks: Risk[] = [];

    // Analyze worst-case scenarios
    const worstScenarios = scenarios
      .sort((a, b) => a.outcomes.year5.financialPosition.netWorth - b.outcomes.year5.financialPosition.netWorth)
      .slice(0, Math.floor(scenarios.length * 0.1));

    // Job loss risk
    const jobLossScenarios = scenarios.filter(s =>
      s.keyEvents.some(e => e.type === 'layoff')
    );

    if (jobLossScenarios.length > scenarios.length * 0.2) {
      risks.push({
        id: crypto.randomUUID(),
        severity: 'high',
        probability: jobLossScenarios.length / scenarios.length,
        category: 'career',
        description: 'Elevated job loss risk in your industry',
        mitigation: [
          'Maintain strong professional network',
          'Keep skills current and marketable',
          'Build multiple income streams'
        ],
        monitoringIndicators: [
          'Industry layoff announcements',
          'Company financial reports',
          'Economic indicators'
        ]
      });
    }

    return risks;
  }

  /**
   * Identify opportunities
   */
  private static identifyOpportunities(scenarios: Scenario[], option: DecisionOption): Opportunity[] {
    const opportunities: Opportunity[] = [];

    // Analyze best-case scenarios
    const bestScenarios = scenarios
      .sort((a, b) => b.outcomes.year5.financialPosition.netWorth - a.outcomes.year5.financialPosition.netWorth)
      .slice(0, Math.floor(scenarios.length * 0.1));

    const avgBestCase = this.average(bestScenarios.map(s => s.outcomes.year5.financialPosition.netWorth));
    const avgCase = this.average(scenarios.map(s => s.outcomes.year5.financialPosition.netWorth));

    if (avgBestCase > avgCase * 2) {
      opportunities.push({
        id: crypto.randomUUID(),
        probability: 0.1,
        timeframe: 'medium_term',
        description: 'Significant upside potential in favorable conditions',
        requirements: [
          'Strong execution on core plan',
          'Market conditions remain favorable',
          'Continuous skill development'
        ],
        potentialValue: avgBestCase - avgCase
      });
    }

    return opportunities;
  }

  // Utility functions

  private static normalRandom(mean: number, stdDev: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  private static average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private static standardDeviation(numbers: number[]): number {
    const avg = this.average(numbers);
    const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2));
    return Math.sqrt(this.average(squaredDiffs));
  }

  private static determineIndustryOutlook(marketCondition: EconomicConditions['marketCondition']): EconomicConditions['industryOutlook'] {
    const rand = Math.random();
    switch (marketCondition) {
      case 'recession':
        return rand < 0.7 ? 'declining' : 'stable';
      case 'downturn':
        return rand < 0.5 ? 'declining' : rand < 0.9 ? 'stable' : 'growing';
      case 'stable':
        return rand < 0.1 ? 'declining' : rand < 0.7 ? 'stable' : rand < 0.95 ? 'growing' : 'booming';
      case 'growth':
        return rand < 0.3 ? 'stable' : rand < 0.8 ? 'growing' : 'booming';
      case 'boom':
        return rand < 0.4 ? 'growing' : 'booming';
    }
  }

  private static calculateBaselineFinancials(userProfile: UserProfile) {
    const totalAssets = Object.values(userProfile.financial.assets).reduce((a, b) => a + b, 0);
    const totalLiabilities = Object.values(userProfile.financial.liabilities).reduce((a, b) => a + b, 0);
    return {
      netWorth: totalAssets - totalLiabilities,
      income: userProfile.career.salary,
      expenses: Object.values(userProfile.financial.monthlyExpenses).reduce((a, b) => a + b, 0) * 12,
      savings: userProfile.career.salary * (userProfile.financial.savingsRate / 100)
    };
  }

  private static calculateCareerGrowthRate(userProfile: UserProfile, economicConditions: EconomicConditions): number {
    let baseGrowth = 0.03; // 3% base growth

    // Industry outlook modifier
    switch (economicConditions.industryOutlook) {
      case 'declining': baseGrowth *= 0.5; break;
      case 'stable': baseGrowth *= 1; break;
      case 'growing': baseGrowth *= 1.5; break;
      case 'booming': baseGrowth *= 2; break;
    }

    // Experience modifier
    if (userProfile.career.yearsExperience < 5) baseGrowth *= 1.5;
    else if (userProfile.career.yearsExperience < 10) baseGrowth *= 1.2;

    return baseGrowth;
  }

  private static calculateInvestmentReturn(economicConditions: EconomicConditions): number {
    const baseReturn = 0.07; // 7% historical average

    switch (economicConditions.marketCondition) {
      case 'recession': return baseReturn - 0.15;
      case 'downturn': return baseReturn - 0.05;
      case 'stable': return baseReturn;
      case 'growth': return baseReturn + 0.05;
      case 'boom': return baseReturn + 0.10;
    }
  }

  private static generateKeyEvents(economicConditions: EconomicConditions): KeyEvent[] {
    const events: KeyEvent[] = [];

    // Probability of events based on economic conditions
    if (economicConditions.marketCondition === 'recession' && Math.random() < 0.3) {
      events.push({
        year: Math.floor(Math.random() * 5) + 1,
        type: 'layoff',
        description: 'Company downsizing due to economic conditions',
        impact: 'negative',
        financialImpact: -50000
      });
    }

    if (economicConditions.marketCondition === 'boom' && Math.random() < 0.4) {
      events.push({
        year: Math.floor(Math.random() * 5) + 1,
        type: 'promotion',
        description: 'Promoted due to strong performance and market growth',
        impact: 'positive',
        financialImpact: 20000
      });
    }

    return events;
  }

  private static adjustScenarioProbabilities(scenarios: Scenario[]): Scenario[] {
    // Adjust probabilities based on historical likelihoods
    return scenarios.map(scenario => ({
      ...scenario,
      probability: this.calculateScenarioProbability(scenario)
    }));
  }

  private static calculateScenarioProbability(scenario: Scenario): number {
    // Base probability
    let probability = 1 / this.SIMULATION_COUNT;

    // Adjust based on economic condition likelihood
    switch (scenario.economicConditions.marketCondition) {
      case 'recession': probability *= 0.8; break;
      case 'downturn': probability *= 0.9; break;
      case 'stable': probability *= 1.2; break;
      case 'growth': probability *= 1.0; break;
      case 'boom': probability *= 0.7; break;
    }

    return probability;
  }

  private static getAssumptions(economicConditions: EconomicConditions): Record<string, string> {
    return {
      inflation: `${economicConditions.inflationRate.toFixed(1)}% annual`,
      gdpGrowth: `${economicConditions.gdpGrowth.toFixed(1)}% annual`,
      unemployment: `${economicConditions.unemploymentRate.toFixed(1)}%`,
      marketCondition: economicConditions.marketCondition,
      industryOutlook: economicConditions.industryOutlook
    };
  }

  private static calculateJobSatisfaction(decision: Decision, option: DecisionOption, year: number): number {
    let satisfaction = 7; // Base satisfaction

    // Career change usually has honeymoon period
    if (decision.type === 'career_change' && year < 2) {
      satisfaction += 1.5;
    }

    // Add impact from option
    satisfaction += option.estimatedImpact.lifestyle.fulfillment / 2;

    return Math.max(1, Math.min(10, satisfaction));
  }

  private static calculateStress(decision: Decision, option: DecisionOption, economicConditions: EconomicConditions, year: number): number {
    let stress = 5; // Base stress

    // Economic conditions impact
    if (economicConditions.marketCondition === 'recession') stress += 2;
    if (economicConditions.marketCondition === 'boom') stress += 0.5; // Fast pace

    // Decision type impact
    if (decision.type === 'career_change' && year < 1) stress += 1.5; // Adjustment period
    if (decision.type === 'relocation' && year < 1) stress += 2;

    // Add impact from option
    stress += option.estimatedImpact.lifestyle.stress;

    return Math.max(1, Math.min(10, stress));
  }

  private static calculateWorkLifeBalance(decision: Decision, option: DecisionOption, year: number): number {
    let balance = 6; // Base balance

    // Add impact from option
    balance += option.estimatedImpact.lifestyle.workLifeBalance;

    // Adjustment over time
    if (year > 2) balance += 0.5; // Settled into routine

    return Math.max(1, Math.min(10, balance));
  }
}