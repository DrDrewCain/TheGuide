import { Decision, DecisionOption, UserProfile, SimulationResult } from '@theguide/models';
import { Engine } from './engine';
import { AdvancedSimulationEngine } from './advanced-engine';
import DecisionAnalysisService from '../../api/src/services/ai/decision-analysis';

interface AIEnhancedSimulationConfig {
  useAI: boolean;
  aiApiKey?: string;
  baseSimulations: number;
  aiGuidedSimulations: number;
  hybridWeight: number; // 0-1, how much to weight AI vs algorithmic
}

export class AIEnhancedSimulationEngine {
  private baseEngine: Engine;
  private advancedEngine: AdvancedSimulationEngine;
  private aiService?: DecisionAnalysisService;
  private config: AIEnhancedSimulationConfig;

  constructor(config: AIEnhancedSimulationConfig) {
    this.baseEngine = new Engine();
    this.advancedEngine = new AdvancedSimulationEngine({
      simulationCount: config.baseSimulations,
      enableQMC: true,
      enableMLMC: true,
      enableSensitivity: true,
      enableScenarioReduction: true,
      enableVineCopula: true
    });
    this.config = config;

    if (config.useAI && config.aiApiKey) {
      this.aiService = new DecisionAnalysisService(config.aiApiKey);
    }
  }

  async runSimulation(
    decision: Decision,
    option: DecisionOption,
    profile: Partial<UserProfile>,
    progressCallback?: (progress: { step: string; percentage: number }) => void
  ): Promise<SimulationResult> {
    // Step 1: Run base algorithmic simulations
    progressCallback?.({ step: 'Running base simulations', percentage: 10 });
    const baseResult = await this.advancedEngine.runAdvancedSimulation(
      decision,
      option,
      profile,
      (msg, pct) => progressCallback?.({ step: msg, percentage: Math.min(40, pct * 0.4) })
    );

    if (!this.config.useAI || !this.aiService) {
      return baseResult;
    }

    // Step 2: Run AI-guided analysis
    progressCallback?.({ step: 'Running AI analysis', percentage: 45 });
    const aiAnalysis = await this.aiService.analyzeDecision(decision, option, profile);

    // Step 3: Generate AI-guided scenarios
    progressCallback?.({ step: 'Generating AI-guided scenarios', percentage: 60 });
    const aiGuidedScenarios = await this.generateAIGuidedScenarios(
      decision,
      option,
      profile,
      aiAnalysis.scenarios
    );

    // Step 4: Merge and weight results
    progressCallback?.({ step: 'Combining results', percentage: 80 });
    const mergedResult = this.mergeResults(
      baseResult,
      aiGuidedScenarios,
      aiAnalysis
    );

    // Step 5: Generate enhanced insights
    progressCallback?.({ step: 'Generating insights', percentage: 90 });
    const enhancedResult = await this.enhanceWithAIInsights(mergedResult, aiAnalysis);

    progressCallback?.({ step: 'Complete', percentage: 100 });
    return enhancedResult;
  }

  private async generateAIGuidedScenarios(
    decision: Decision,
    option: DecisionOption,
    profile: Partial<UserProfile>,
    aiScenarios: any[]
  ): Promise<any[]> {
    const scenarios = [];

    for (const aiScenario of aiScenarios) {
      // Use AI scenario events to guide parameter generation
      const guidedParams = this.extractParametersFromAIScenario(aiScenario);

      // Run targeted simulations with these parameters
      const targetedScenarios = await this.runTargetedSimulations(
        decision,
        option,
        profile,
        guidedParams,
        Math.floor(this.config.aiGuidedSimulations / aiScenarios.length)
      );

      scenarios.push(...targetedScenarios);
    }

    return scenarios;
  }

  private extractParametersFromAIScenario(aiScenario: any): any {
    const params: any = {
      marketVolatility: 0.2,
      careerGrowthRate: 0.05,
      inflationRate: 0.03
    };

    // Adjust parameters based on AI scenario events
    const events = Object.values(aiScenario.events);

    if (events.includes('market_downturn')) {
      params.marketVolatility = 0.4;
      params.careerGrowthRate = -0.02;
    }

    if (events.includes('promotion')) {
      params.careerGrowthRate = 0.15;
    }

    if (events.includes('unexpected_expense')) {
      params.emergencyFundDrain = 0.3;
    }

    return params;
  }

  private async runTargetedSimulations(
    decision: Decision,
    option: DecisionOption,
    profile: Partial<UserProfile>,
    parameters: any,
    count: number
  ): Promise<any[]> {
    // Create scenarios with specific parameters
    return Array(count).fill(null).map(() =>
      this.baseEngine.generateScenario(decision, option, profile, parameters)
    );
  }

  private mergeResults(
    baseResult: SimulationResult,
    aiGuidedScenarios: any[],
    aiAnalysis: any
  ): SimulationResult {
    const weight = this.config.hybridWeight;

    // Combine scenarios
    const allScenarios = [
      ...baseResult.scenarios.map(s => ({ ...s, source: 'algorithmic' })),
      ...aiGuidedScenarios.map(s => ({ ...s, source: 'ai-guided' }))
    ];

    // Recalculate metrics with weighting
    const weightedMetrics = this.calculateWeightedMetrics(
      baseResult.aggregateMetrics,
      aiGuidedScenarios,
      weight
    );

    return {
      ...baseResult,
      scenarios: allScenarios,
      aggregateMetrics: weightedMetrics,
      metadata: {
        ...baseResult.metadata,
        aiEnhanced: true,
        hybridWeight: weight,
        aiScenarioCount: aiGuidedScenarios.length
      }
    };
  }

  private calculateWeightedMetrics(
    baseMetrics: any,
    aiScenarios: any[],
    weight: number
  ): any {
    // Calculate AI scenario metrics
    const aiMetrics = this.calculateMetricsFromScenarios(aiScenarios);

    // Weight and combine
    return {
      expectedValue: {
        financial: baseMetrics.expectedValue.financial * (1 - weight) + aiMetrics.expectedValue.financial * weight,
        career: baseMetrics.expectedValue.career * (1 - weight) + aiMetrics.expectedValue.career * weight,
        lifestyle: baseMetrics.expectedValue.lifestyle * (1 - weight) + aiMetrics.expectedValue.lifestyle * weight,
        overall: baseMetrics.expectedValue.overall * (1 - weight) + aiMetrics.expectedValue.overall * weight
      },
      volatility: {
        financial: baseMetrics.volatility.financial * (1 - weight) + aiMetrics.volatility.financial * weight,
        career: baseMetrics.volatility.career * (1 - weight) + aiMetrics.volatility.career * weight,
        lifestyle: baseMetrics.volatility.lifestyle * (1 - weight) + aiMetrics.volatility.lifestyle * weight
      },
      riskScore: baseMetrics.riskScore * (1 - weight) + aiMetrics.riskScore * weight,
      opportunityScore: baseMetrics.opportunityScore * (1 - weight) + aiMetrics.opportunityScore * weight
    };
  }

  private calculateMetricsFromScenarios(scenarios: any[]): any {
    // Implementation similar to advancedEngine's aggregateScenarios
    // but adapted for AI-guided scenarios
    return {
      expectedValue: {
        financial: 0,
        career: 0,
        lifestyle: 0,
        overall: 0
      },
      volatility: {
        financial: 0,
        career: 0,
        lifestyle: 0
      },
      riskScore: 0,
      opportunityScore: 0
    };
  }

  private async enhanceWithAIInsights(
    result: SimulationResult,
    aiAnalysis: any
  ): Promise<SimulationResult> {
    // Add AI-generated insights to the result
    return {
      ...result,
      recommendations: [
        ...result.recommendations,
        ...aiAnalysis.recommendations.map((r: string) => ({
          title: r,
          description: r,
          impact: 'high',
          timeframe: 'medium',
          actions: []
        }))
      ],
      risks: [
        ...result.risks,
        ...aiAnalysis.risks.map((r: string) => ({
          title: r,
          probability: 0.5,
          impact: 'medium',
          description: r,
          category: 'ai-identified',
          mitigation: '',
          monitoringIndicators: []
        }))
      ],
      opportunities: [
        ...result.opportunities,
        ...aiAnalysis.opportunities.map((o: string) => ({
          title: o,
          probability: 0.5,
          impact: 'medium',
          description: o,
          requirements: [],
          timeframe: 'medium'
        }))
      ]
    };
  }
}

export default AIEnhancedSimulationEngine;