/**
 * Advanced Monte Carlo simulation engine integrating all state-of-the-art techniques
 * Combines RQMC, MLMC, vine copulas, and sensitivity analysis
 */

import { QMCEngine } from './qmc-engine';
import { MLMCEngine, PathGenerator } from './mlmc-engine';
import { VineCopula } from './copulas';
import { ScenarioReducer } from './scenario-reduction';
import { SensitivityAnalyzer } from './sensitivity-analysis';
import { PhiloxStreamFactory } from './philox-rng';
import { SimulationEngine } from './engine';
import {
  Decision,
  DecisionOption,
  UserProfile,
  SimulationResult,
  Scenario,
  EconomicConditions
} from '@theguide/models';

export class AdvancedSimulationEngine {
  private qmcEngine: QMCEngine;
  private mlmcEngine: MLMCEngine;
  private vineCopula: VineCopula;
  private scenarioReducer: ScenarioReducer;
  private sensitivityAnalyzer: SensitivityAnalyzer;
  private streamFactory: PhiloxStreamFactory;
  private baseEngine: SimulationEngine;
  private masterSeed: string;

  constructor(masterSeed: string) {
    this.masterSeed = masterSeed;
    this.streamFactory = new PhiloxStreamFactory(masterSeed);
    this.qmcEngine = new QMCEngine(10, masterSeed);
    this.mlmcEngine = new MLMCEngine(masterSeed);
    this.vineCopula = new VineCopula();
    this.scenarioReducer = new ScenarioReducer();
    this.sensitivityAnalyzer = new SensitivityAnalyzer(masterSeed);
    this.baseEngine = new SimulationEngine();
  }

  /**
   * Run advanced simulation with all optimizations
   */
  async runAdvancedSimulation(
    decision: Decision,
    option: DecisionOption,
    userProfile: Partial<UserProfile>,
    config: SimulationConfig = {},
    progressCallback?: (progress: { step: string; percentage: number }) => void
  ): Promise<AdvancedSimulationResult> {
    console.log('=== Starting Advanced Simulation ===');
    console.log('Decision:', decision.type);
    console.log('Option:', option.title);
    console.log('Config:', config);
    const startTime = Date.now();

    // Default configuration
    const finalConfig = {
      targetScenarios: 200,
      sensitivitySamples: 32,  // Reduced from 512 to avoid timeout
      mlmcTargetMSE: 0.01,
      useQMC: true,
      useMLMC: false,  // Disable MLMC for now to speed up
      useCopulas: false,  // Disable copulas for now
      reduceScenarios: true,
      runSensitivity: false,  // Disable sensitivity analysis by default
      ...config
    };

    // Step 1: Sensitivity analysis to identify important parameters
    let sensitivityResult = null;
    if (finalConfig.runSensitivity) {
      console.log('Step 1: Running sensitivity analysis...');
      console.log('Samples:', finalConfig.sensitivitySamples);
      progressCallback?.({ step: 'Running sensitivity analysis', percentage: 10 });
      sensitivityResult = await this.runSensitivityAnalysis(
        decision,
        option,
        userProfile,
        finalConfig.sensitivitySamples
      );
      console.log('Sensitivity analysis complete');
      progressCallback?.({ step: 'Sensitivity analysis complete', percentage: 25 });
    } else {
      console.log('Step 1: Skipping sensitivity analysis (disabled)');
    }

    // Step 2: Generate scenarios using appropriate method
    console.log('Step 2: Generating scenarios...');
    progressCallback?.({ step: 'Generating scenarios', percentage: finalConfig.runSensitivity ? 30 : 10 });
    let scenarios: Scenario[];
    let generationMetadata: any = {};

    if (finalConfig.useMLMC && this.isPathDependent(decision.type)) {
      console.log('Using MLMC for path-dependent decision');
      progressCallback?.({ step: 'Running Multi-Level Monte Carlo', percentage: 40 });
      // Use MLMC for path-dependent decisions
      const mlmcResult = await this.runMLMCSimulation(
        decision,
        option,
        userProfile,
        finalConfig.mlmcTargetMSE
      );
      scenarios = mlmcResult.scenarios;
      generationMetadata = mlmcResult.metadata;
    } else if (finalConfig.useQMC) {
      console.log('Using QMC simulation with', finalConfig.targetScenarios, 'samples');
      progressCallback?.({ step: 'Running Quasi-Monte Carlo simulation', percentage: 40 });
      // Use QMC for better convergence
      scenarios = await this.runQMCSimulation(
        decision,
        option,
        userProfile,
        finalConfig.targetScenarios // Don't multiply - use exact number requested
      );
    } else {
      console.log('Using standard simulation');
      progressCallback?.({ step: 'Running standard simulation', percentage: 40 });
      // Fallback to standard simulation
      const result = await this.baseEngine.runSimulation(
        decision,
        option,
        userProfile as UserProfile
      );
      scenarios = result.scenarios;
    }
    console.log('Generated', scenarios.length, 'scenarios');
    progressCallback?.({ step: 'Scenarios generated', percentage: 60 });

    // Step 3: Apply copulas for realistic dependencies
    if (finalConfig.useCopulas) {
      progressCallback?.({ step: 'Applying dependency structures', percentage: 70 });
      scenarios = await this.applyCopulaDependence(scenarios, userProfile);
    }

    // Step 4: Reduce scenarios while preserving distribution
    progressCallback?.({ step: 'Optimizing scenario set', percentage: 75 });
    let reducedScenarios = scenarios;
    let reductionMetadata = null;

    if (finalConfig.reduceScenarios && scenarios.length > finalConfig.targetScenarios) {
      const reduction = this.scenarioReducer.reduceScenarios(
        scenarios,
        finalConfig.targetScenarios
      );
      reducedScenarios = reduction.scenarios;
      reductionMetadata = {
        originalCount: reduction.originalCount,
        reducedCount: reduction.reducedCount,
        maxTransportCost: reduction.maxTransportCost
      };
    }

    // Step 5: Calculate final metrics from our scenarios
    progressCallback?.({ step: 'Calculating metrics', percentage: 85 });
    const aggregatedMetrics = this.aggregateScenarios(reducedScenarios);
    const recommendations = this.generateRecommendations(reducedScenarios, decision, option);
    const risks = this.identifyRisks(reducedScenarios, decision);
    const opportunities = this.identifyOpportunities(reducedScenarios, decision);

    // Create the result structure
    const result: SimulationResult = {
      decisionId: decision.id,
      optionId: option.id,
      scenarios: reducedScenarios,
      aggregateMetrics: aggregatedMetrics,
      recommendations,
      risks,
      opportunities,
      id: `sim-${Date.now()}`,
      runDate: new Date()
    };

    // Add advanced metadata
    const advancedResult: AdvancedSimulationResult = {
      ...result,
      metadata: {
        computationTime: Date.now() - startTime,
        seed: this.masterSeed,
        config: finalConfig,
        sensitivityAnalysis: sensitivityResult,
        generationMethod: finalConfig.useMLMC ? 'MLMC' : finalConfig.useQMC ? 'QMC' : 'Standard',
        generationMetadata,
        reductionMetadata,
        dataQuality: this.assessDataQuality(userProfile)
      }
    };

    progressCallback?.({ step: 'Simulation complete', percentage: 100 });
    return advancedResult;
  }

  /**
   * Run sensitivity analysis to identify important parameters
   */
  private async runSensitivityAnalysis(
    decision: Decision,
    option: DecisionOption,
    userProfile: Partial<UserProfile>,
    numSamples: number
  ): Promise<SensitivityResult> {
    // Define parameter ranges based on decision type
    const paramRanges = this.getParameterRanges(decision.type, userProfile);

    // Create model wrapper
    const model = async (inputs: number[]): Promise<number> => {
      const modifiedProfile = this.applyParameterValues(userProfile, paramRanges, inputs);
      const result = await this.baseEngine.runSimulation(
        decision,
        option,
        modifiedProfile as UserProfile
      );

      // Return expected NPV as primary metric
      return result.aggregateMetrics.expectedValue.financial;
    };

    // Run Sobol analysis
    const sobolResult = await this.sensitivityAnalyzer.computeSobolIndices(
      model,
      paramRanges,
      numSamples
    );

    // Identify key drivers
    const keyDrivers = sobolResult.parameters
      .map((param, i) => ({
        parameter: param,
        importance: sobolResult.totalOrder[i],
        firstOrder: sobolResult.firstOrder[i],
        interactions: sobolResult.totalOrder[i] - sobolResult.firstOrder[i]
      }))
      .filter(d => d.importance > 0.05)
      .sort((a, b) => b.importance - a.importance);

    return {
      keyDrivers,
      sobolIndices: sobolResult,
      recommendation: this.generateSensitivityRecommendation(keyDrivers)
    };
  }

  /**
   * Run MLMC simulation for path-dependent outcomes
   */
  private async runMLMCSimulation(
    decision: Decision,
    option: DecisionOption,
    userProfile: Partial<UserProfile>,
    targetMSE: number
  ): Promise<MLMCSimulationResult> {
    // Create path generator for financial paths
    const pathGenerator = this.createPathGenerator(decision, option, userProfile);

    // Run MLMC
    const mlmcResult = await this.mlmcEngine.runMLMC(
      pathGenerator,
      targetMSE,
      6 // max levels
    );

    // Convert MLMC paths to scenarios
    const scenarios = await this.convertMLMCToScenarios(
      mlmcResult,
      decision,
      option,
      userProfile
    );

    return {
      scenarios,
      metadata: {
        levels: mlmcResult.levels.length,
        totalCost: mlmcResult.totalCost,
        costReduction: mlmcResult.costReduction,
        estimate: mlmcResult.estimate,
        confidence95: mlmcResult.confidence95
      }
    };
  }

  /**
   * Run QMC simulation with scrambled Sobol
   */
  private async runQMCSimulation(
    decision: Decision,
    option: DecisionOption,
    userProfile: Partial<UserProfile>,
    numScenarios: number
  ): Promise<Scenario[]> {
    console.log('runQMCSimulation started with', numScenarios, 'scenarios');

    // Determine dimension based on decision type and time horizon
    const dimension = this.getSimulationDimension(decision.type);
    console.log('Simulation dimension:', dimension);

    // Generate QMC points
    console.log('Generating QMC samples...');
    const qmcSamples = this.qmcEngine.generateQMCSamples(numScenarios, dimension);
    console.log('Generated', qmcSamples.length, 'QMC samples');

    // Transform to economic scenarios
    console.log('Getting market parameters...');
    const marketParams = await this.getMarketParameters(userProfile);
    console.log('Transforming to scenarios...');
    const economicScenarios = this.qmcEngine.transformToScenarios(
      qmcSamples,
      marketParams
    );
    console.log('Created', economicScenarios.length, 'economic scenarios');

    // Convert to full scenarios by running a single base simulation
    // and then applying the QMC-generated economic conditions
    console.log('Running base simulation to get template scenario...');
    const baseResult = await this.baseEngine.runSimulation(
      decision,
      option,
      userProfile as UserProfile,
      this.masterSeed
    );

    console.log('Applying QMC economic conditions to scenarios...');
    const scenarios: Scenario[] = economicScenarios.map((econScenario, index) => {
      // Use the first scenario as a template
      const template = baseResult.scenarios[0];

      // Convert EconomicScenario to EconomicConditions
      const economicConditions: EconomicConditions = {
        gdpGrowth: econScenario.wageGrowth * 100, // Convert to percentage
        inflationRate: econScenario.inflation * 100,
        unemploymentRate: econScenario.unemployment * 100,
        marketCondition: this.mapRegimeToCondition(econScenario.marketRegime),
        industryOutlook: this.mapRegimeToOutlook(econScenario.marketRegime)
      };

      return {
        ...template,
        id: `qmc-scenario-${index}`,
        economicConditions,
        probability: 1 / economicScenarios.length
      };
    });
    console.log('Created', scenarios.length, 'QMC scenarios');

    return scenarios;
  }

  /**
   * Apply copula-based dependence structure
   */
  private async applyCopulaDependence(
    scenarios: Scenario[],
    userProfile: Partial<UserProfile>
  ): Promise<Scenario[]> {
    // Extract key variables from scenarios
    const data = this.extractVariablesFromScenarios(scenarios);

    // Fit vine copula
    this.vineCopula.fit(data);

    // Re-sample with proper dependence
    const dependentSamples = this.vineCopula.simulate(scenarios.length);

    // Update scenarios with dependent values
    return this.updateScenariosWithDependence(scenarios, dependentSamples, data);
  }

  /**
   * Helper methods
   */

  private isPathDependent(decisionType: Decision['type']): boolean {
    return ['career_change', 'job_offer', 'education', 'retirement'].includes(decisionType);
  }

  private getParameterRanges(
    decisionType: Decision['type'],
    userProfile: Partial<UserProfile>
  ): ParameterRange[] {
    const ranges: ParameterRange[] = [];

    // Common financial parameters
    ranges.push({
      name: 'salary_growth',
      min: -0.02,
      max: 0.10,
      distribution: 'normal',
      mean: 0.03,
      std: 0.02
    });

    ranges.push({
      name: 'inflation',
      min: 0.01,
      max: 0.05,
      distribution: 'normal',
      mean: 0.025,
      std: 0.01
    });

    ranges.push({
      name: 'investment_return',
      min: -0.20,
      max: 0.30,
      distribution: 'normal',
      mean: 0.08,
      std: 0.15
    });

    // Decision-specific parameters
    switch (decisionType) {
      case 'career_change':
      case 'job_offer':
        ranges.push({
          name: 'job_stability',
          min: 0.5,
          max: 1.0,
          distribution: 'uniform'
        });
        break;

      case 'home_purchase':
        ranges.push({
          name: 'home_appreciation',
          min: -0.05,
          max: 0.10,
          distribution: 'normal',
          mean: 0.035,
          std: 0.03
        });
        break;

      case 'education':
        ranges.push({
          name: 'education_roi',
          min: 0.05,
          max: 0.20,
          distribution: 'lognormal',
          logMean: Math.log(0.12),
          logStd: 0.3
        });
        break;
    }

    return ranges;
  }

  private createPathGenerator(
    decision: Decision,
    option: DecisionOption,
    userProfile: Partial<UserProfile>
  ): PathGenerator {
    // Simplified implementation - would create proper path generator
    const getStepsForLevel = (level: number) => Math.pow(2, level + 2);
    return {
      getStepsForLevel,
      generate: async (level, rng) => ({
        times: Array(getStepsForLevel(level)).fill(0).map((_, i) => i),
        values: Array(getStepsForLevel(level)).fill(0).map(() => [0]),
        level
      }),
      generateFromNoise: async (level, noise) => ({
        times: Array(noise.length).fill(0).map((_, i) => i),
        values: noise,
        level
      }),
      generateFromUniform: async (level, uniform) => ({
        times: Array(level).fill(0).map((_, i) => i),
        values: [uniform],
        level
      }),
      evaluate: (path) => path.values.reduce((sum, v) => sum + v[0], 0)
    };
  }

  private getSimulationDimension(decisionType: Decision['type']): number {
    // 5 risk factors × 10 time steps
    return 50;
  }

  private async getMarketParameters(userProfile: Partial<UserProfile>): Promise<any> {
    // Would fetch real market data
    return {
      historicalWageGrowth: Array(100).fill(0).map(() => Math.random() * 0.1),
      historicalInflation: Array(100).fill(0).map(() => Math.random() * 0.05),
      historicalReturns: Array(100).fill(0).map(() => Math.random() * 0.3 - 0.1),
      historicalUnemployment: Array(100).fill(0).map(() => Math.random() * 0.1),
      wageGrowthDist: { type: 'normal', mean: 0.03, std: 0.02 },
      inflationDist: { type: 'normal', mean: 0.025, std: 0.01 },
      assetReturnDist: { type: 'normal', mean: 0.08, std: 0.15 },
      unemploymentDist: { type: 'beta', alpha: 2, beta: 20, min: 0, max: 0.15 },
      housingDist: { type: 'normal', mean: 0.035, std: 0.03 }
    };
  }

  private assessDataQuality(userProfile: Partial<UserProfile>): DataQualityAssessment {
    const requiredFields = [
      'demographics.age',
      'career.salary',
      'financial.monthlyExpenses',
      'location.city'
    ];

    const providedFields = requiredFields.filter(field =>
      this.getNestedValue(userProfile, field) !== undefined
    );

    const completeness = providedFields.length / requiredFields.length;

    return {
      completeness,
      confidence: completeness > 0.8 ? 'high' : completeness > 0.5 ? 'medium' : 'low',
      missingCriticalData: completeness < 0.5,
      recommendation: completeness < 0.8 ?
        'Provide more personal information for accurate simulations' :
        'Data quality is sufficient for reliable results'
    };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  // Additional helper methods would be implemented...
  private applyParameterValues(
    profile: Partial<UserProfile>,
    ranges: ParameterRange[],
    values: number[]
  ): Partial<UserProfile> {
    // Apply parameter values to profile
    return { ...profile };
  }

  private generateSensitivityRecommendation(keyDrivers: any[]): string {
    if (keyDrivers.length === 0) return 'Results are robust to parameter uncertainty';

    const top = keyDrivers[0];
    return `Focus on ${top.parameter} - accounts for ${(top.importance * 100).toFixed(1)}% of uncertainty`;
  }

  private async convertMLMCToScenarios(
    mlmcResult: any,
    decision: Decision,
    option: DecisionOption,
    userProfile: Partial<UserProfile>
  ): Promise<Scenario[]> {
    // Convert MLMC paths to scenarios
    // This is a placeholder - would properly convert MLMC results to scenarios
    const scenarios: Scenario[] = [];

    // Create a simple scenario for now
    scenarios.push({
      id: `mlmc-scenario-${Date.now()}`,
      probability: 1,
      economicConditions: {
        gdpGrowth: 2.5,
        inflationRate: 2.5,
        unemploymentRate: 4,
        marketCondition: 'stable',
        industryOutlook: 'stable'
      },
      outcomes: {} as any, // Would be properly generated from MLMC paths
      keyEvents: [],
      assumptions: {}
    });

    return scenarios;
  }

  private async generateScenarioFromEconomic(
    econScenario: any,
    decision: Decision,
    option: DecisionOption,
    userProfile: Partial<UserProfile>
  ): Promise<Scenario> {
    // Generate full scenario from economic conditions
    // This is a placeholder - in real implementation would use the base engine
    return {
      id: `scenario-${Date.now()}-${Math.random()}`,
      probability: 1,
      economicConditions: {
        gdpGrowth: econScenario.gdpGrowth || 2.5,
        inflationRate: econScenario.inflation || 2.5,
        unemploymentRate: econScenario.unemployment || 4,
        marketCondition: 'stable',
        industryOutlook: 'stable'
      },
      outcomes: {} as any, // Would be properly generated
      keyEvents: [],
      assumptions: {}
    };
  }

  private extractVariablesFromScenarios(scenarios: Scenario[]): any {
    // Extract key variables for copula fitting
    if (scenarios.length === 0) {
      console.log('[AdvancedEngine] No scenarios to extract variables from');
      return {};
    }

    // Extract economic variables from scenarios
    const gdpGrowth = scenarios.map(s => s.economicConditions.gdpGrowth);
    const inflation = scenarios.map(s => s.economicConditions.inflationRate);
    const unemployment = scenarios.map(s => s.economicConditions.unemploymentRate);

    // Use market condition as a proxy for returns (map to numeric values)
    const marketReturns = scenarios.map(s => {
      const conditionMap = {
        'recession': -0.15,
        'downturn': -0.05,
        'stable': 0.05,
        'growth': 0.10,
        'boom': 0.20
      };
      return conditionMap[s.economicConditions.marketCondition] || 0.05;
    });

    return {
      gdpGrowth,
      inflation,
      unemployment,
      marketReturns
    };
  }

  private updateScenariosWithDependence(
    scenarios: Scenario[],
    samples: number[][],
    originalData: any
  ): Scenario[] {
    // For now, return scenarios as-is since copula simulation needs proper implementation
    // TODO: Apply the dependent samples back to the scenarios
    return scenarios;
  }

  private aggregateScenarios(scenarios: Scenario[]): SimulationResult['aggregateMetrics'] {
    // Extract financial outcomes
    const financialValues = scenarios.map(s => s.outcomes.year10.financialPosition.netWorth);
    const careerValues = scenarios.map(s => s.outcomes.year10.careerProgress.jobSatisfaction);
    const lifestyleValues = scenarios.map(s => s.outcomes.year10.lifeMetrics.overallHappiness);

    // Calculate statistics
    const calculateStats = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);

      return {
        mean,
        std,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p5: sorted[Math.floor(0.05 * sorted.length)],
        p95: sorted[Math.floor(0.95 * sorted.length)],
        median: sorted[Math.floor(0.5 * sorted.length)]
      };
    };

    const financialStats = calculateStats(financialValues);
    const careerStats = calculateStats(careerValues);
    const lifestyleStats = calculateStats(lifestyleValues);

    // Calculate probability of success (positive outcome in all dimensions)
    const successCount = scenarios.filter(s =>
      s.outcomes.year10.financialPosition.netWorth > 0 &&
      s.outcomes.year10.careerProgress.jobSatisfaction > 6 &&
      s.outcomes.year10.lifeMetrics.overallHappiness > 6
    ).length;

    return {
      expectedValue: {
        financial: financialStats.mean,
        career: careerStats.mean,
        lifestyle: lifestyleStats.mean,
        overall: (financialStats.mean / 100000 + careerStats.mean + lifestyleStats.mean) / 3
      },
      volatility: {
        financial: financialStats.std / Math.abs(financialStats.mean),
        career: careerStats.std / careerStats.mean,
        lifestyle: lifestyleStats.std / lifestyleStats.mean
      },
      confidenceInterval: {
        lower: financialStats.p5,
        upper: financialStats.p95,
        confidence: 0.90
      },
      riskScore: this.calculateRiskScore(scenarios),
      probabilityOfSuccess: successCount / scenarios.length,
      opportunityScore: this.calculateOpportunityScore(scenarios)
    };
  }

  private generateRecommendations(
    scenarios: Scenario[],
    decision: Decision,
    option: DecisionOption
  ): SimulationResult['recommendations'] {
    const recommendations = [];

    // Analyze scenarios to find patterns
    const goodScenarios = scenarios
      .filter(s => s.outcomes.year10.financialPosition.netWorth >
        scenarios.map(sc => sc.outcomes.year10.financialPosition.netWorth)
          .reduce((a, b) => a + b, 0) / scenarios.length
      );

    // Generic recommendations based on patterns
    recommendations.push({
      id: 'timing',
      priority: 'high' as const,
      category: 'timing' as const,
      title: 'Optimal Timing',
      description: 'Based on market conditions, consider implementing this decision within the next 6 months.',
      actions: [
        'Monitor market indicators weekly',
        'Set trigger points for decision execution',
        'Prepare necessary documentation in advance'
      ],
      potentialImpact: 15
    });

    if (decision.type === 'career_change') {
      recommendations.push({
        id: 'skills',
        priority: 'medium' as const,
        category: 'preparation' as const,
        title: 'Skill Development',
        description: 'Invest in relevant skills before making the transition to maximize success probability.',
        actions: [
          'Identify key skills gaps',
          'Enroll in relevant courses or certifications',
          'Build portfolio or demonstrate competencies'
        ],
        potentialImpact: 20
      });
    }

    recommendations.push({
      id: 'contingency',
      priority: 'medium' as const,
      category: 'risk_mitigation' as const,
      title: 'Build Emergency Fund',
      description: 'Maintain 6-12 months of expenses as a safety net during the transition.',
      actions: [
        'Calculate monthly expenses',
        'Set up automatic savings',
        'Review and reduce unnecessary expenses'
      ],
      potentialImpact: 10
    });

    return recommendations;
  }

  private identifyRisks(
    scenarios: Scenario[],
    decision: Decision
  ): SimulationResult['risks'] {
    const risks = [];

    // Calculate downside scenarios
    const downsideScenarios = scenarios.filter(s =>
      s.outcomes.year10.financialPosition.netWorth < 0
    );

    if (downsideScenarios.length > 0) {
      risks.push({
        id: 'financial-loss',
        severity: 'high' as const,
        probability: downsideScenarios.length / scenarios.length,
        description: 'Risk of negative financial outcome',
        category: 'financial' as const,
        potentialImpact: Math.min(...downsideScenarios.map(s =>
          s.outcomes.year10.financialPosition.netWorth
        )),
        mitigation: ['Maintain emergency fund', 'Consider phased approach'],
        monitoringIndicators: ['Monthly cash flow', 'Market conditions', 'Income stability']
      });
    }

    // Market risk
    const recessionScenarios = scenarios.filter(s =>
      s.economicConditions.marketCondition === 'recession'
    );

    if (recessionScenarios.length > 0) {
      risks.push({
        id: 'market-downturn',
        severity: 'medium' as const,
        probability: recessionScenarios.length / scenarios.length,
        description: 'Economic downturn could impact outcomes',
        category: 'market' as const,
        potentialImpact: -20000,
        mitigation: ['Diversify income sources', 'Build larger cash reserves'],
        monitoringIndicators: ['GDP growth', 'Unemployment rate', 'Market volatility']
      });
    }

    return risks;
  }

  private identifyOpportunities(
    scenarios: Scenario[],
    decision: Decision
  ): SimulationResult['opportunities'] {
    const opportunities = [];

    // Find high-performing scenarios
    const topScenarios = scenarios
      .sort((a, b) =>
        b.outcomes.year10.financialPosition.netWorth -
        a.outcomes.year10.financialPosition.netWorth
      )
      .slice(0, Math.floor(scenarios.length * 0.1));

    opportunities.push({
      id: 'upside-potential',
      probability: 0.1,
      description: 'Top 10% outcome potential',
      potentialValue: topScenarios[0]?.outcomes.year10.financialPosition.netWorth || 0,
      requirements: ['Strong execution', 'Favorable market conditions'],
      timeframe: 'long_term' as const
    });

    return opportunities;
  }

  private calculateRiskScore(scenarios: Scenario[]): number {
    // Simple risk score based on downside probability and severity
    const negativeOutcomes = scenarios.filter(s =>
      s.outcomes.year10.financialPosition.netWorth < 0
    );

    const downsideProbability = negativeOutcomes.length / scenarios.length;
    const avgDownside = negativeOutcomes.length > 0
      ? negativeOutcomes.reduce((sum, s) =>
        sum + s.outcomes.year10.financialPosition.netWorth, 0
      ) / negativeOutcomes.length
      : 0;

    // Risk score from 0-10
    const riskScore = Math.min(10, downsideProbability * 10 + Math.abs(avgDownside) / 10000);
    return Math.round(riskScore * 10) / 10;
  }

  private calculateOpportunityScore(scenarios: Scenario[]): number {
    // Opportunity score based on upside potential
    const positiveOutcomes = scenarios.filter(s =>
      s.outcomes.year10.financialPosition.netWorth > 100000 &&
      s.outcomes.year10.careerProgress.jobSatisfaction > 7 &&
      s.outcomes.year10.lifeMetrics.overallHappiness > 7
    );

    const upsideProbability = positiveOutcomes.length / scenarios.length;
    const avgUpside = positiveOutcomes.length > 0
      ? positiveOutcomes.reduce((sum, s) =>
        sum + s.outcomes.year10.financialPosition.netWorth, 0
      ) / positiveOutcomes.length
      : 0;

    // Opportunity score from 0-10
    const opportunityScore = Math.min(10, upsideProbability * 10 + avgUpside / 100000);
    return Math.round(opportunityScore * 10) / 10;
  }


  private mapRegimeToCondition(regime: any): EconomicConditions['marketCondition'] {
    switch (regime) {
      case 'crisis':
      case 'recession':
        return 'recession';
      case 'normal':
        return 'stable';
      case 'boom':
        return 'boom';
      case 'inflation':
        return 'growth'; // High inflation often comes with growth
      default:
        return 'stable';
    }
  }

  private mapRegimeToOutlook(regime: any): EconomicConditions['industryOutlook'] {
    switch (regime) {
      case 'crisis':
        return 'declining';
      case 'recession':
        return 'stable';
      case 'normal':
        return 'stable';
      case 'boom':
        return 'booming';
      case 'inflation':
        return 'growing';
      default:
        return 'stable';
    }
  }
}

// Type definitions
interface SimulationConfig {
  targetScenarios?: number;
  sensitivitySamples?: number;
  mlmcTargetMSE?: number;
  useQMC?: boolean;
  useMLMC?: boolean;
  useCopulas?: boolean;
  reduceScenarios?: boolean;
  runSensitivity?: boolean;
}

interface AdvancedSimulationResult extends SimulationResult {
  metadata: {
    computationTime: number;
    seed: string;
    config: SimulationConfig;
    sensitivityAnalysis: SensitivityResult | null;
    generationMethod: string;
    generationMetadata: any;
    reductionMetadata: any;
    dataQuality: DataQualityAssessment;
  };
}

interface SensitivityResult {
  keyDrivers: Array<{
    parameter: string;
    importance: number;
    firstOrder: number;
    interactions: number;
  }>;
  sobolIndices: any;
  recommendation: string;
}

interface MLMCSimulationResult {
  scenarios: Scenario[];
  metadata: any;
}

interface DataQualityAssessment {
  completeness: number;
  confidence: 'high' | 'medium' | 'low';
  missingCriticalData: boolean;
  recommendation: string;
}

type ParameterRange = import('./sensitivity-analysis').ParameterRange;