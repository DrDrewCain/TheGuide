/**
 * Simulation service that integrates advanced Monte Carlo engine
 * Runs simulations client-side for now (no backend storage)
 */

import {
  Decision,
  DecisionOption,
  UserProfile,
  SimulationResult,
  DecisionType
} from '@theguide/models';

// Import simulation engines
import { AdvancedSimulationEngine } from '@theguide/sim-engine';

export interface SimulationConfig {
  mode: 'fast' | 'balanced' | 'accurate';
  enableSensitivity: boolean;
  targetScenarios: number;
  showProgress: boolean;
}

export interface SimulationProgress {
  stage: 'initializing' | 'sensitivity' | 'generating' | 'reducing' | 'analyzing' | 'complete';
  percentage: number;
  message: string;
}

export class SimulationService {
  private engine: AdvancedSimulationEngine;
  private currentSimulation: Promise<SimulationResult> | null = null;

  constructor() {
    // Initialize with timestamp-based seed for uniqueness
    const seed = `user-${Date.now()}-${Math.random()}`;
    this.engine = new AdvancedSimulationEngine(seed);
  }

  /**
   * Run simulation for a decision option
   */
  async runSimulation(
    decision: Decision,
    option: DecisionOption,
    userProfile: Partial<UserProfile>,
    config: SimulationConfig = this.getDefaultConfig(),
    onProgress?: (progress: SimulationProgress) => void
  ): Promise<SimulationResult> {
    console.log('🚀 Starting simulation with:', { decision, option, userProfile });

    try {
      // Report progress
      onProgress?.({
        stage: 'initializing',
        percentage: 0,
        message: 'Preparing simulation engine...'
      });

      console.log('📊 Progress callback triggered - initializing');

      // Map config to engine settings
      const engineConfig = this.mapToEngineConfig(config);

      // Add a small delay to ensure loading state is visible
      await new Promise(resolve => setTimeout(resolve, 500));

      onProgress?.({
        stage: 'generating',
        percentage: 20,
        message: 'Generating Monte Carlo scenarios...'
      });

      // Run simulation with progress callback
      this.currentSimulation = this.engine.runAdvancedSimulation(
        decision,
        option,
        userProfile,
        engineConfig,
        (progress) => {
          console.log('📊 Progress from engine:', progress);
          // Use setTimeout to escape the current execution context
          setTimeout(() => {
            onProgress?.({
              stage: 'generating',
              percentage: progress.percentage,
              message: progress.step
            });
          }, 0);
        }
      );

      const result = await this.currentSimulation;

      onProgress?.({
        stage: 'complete',
        percentage: 100,
        message: 'Simulation complete!'
      });

      return result;
    } catch (error) {
      console.error('Simulation failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      throw new Error(`Failed to run simulation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.currentSimulation = null;
    }
  }

  /**
   * Run quick estimation for real-time feedback
   */
  async runQuickEstimate(
    decision: Decision,
    option: DecisionOption,
    userProfile: Partial<UserProfile>
  ): Promise<QuickEstimate> {
    // Use minimal settings for speed
    const config = {
      targetScenarios: 50,
      useQMC: true,
      useMLMC: false,
      useCopulas: false,
      reduceScenarios: false,
      runSensitivity: false
    };

    const result = await this.engine.runAdvancedSimulation(
      decision,
      option,
      userProfile,
      config
    );

    return {
      expectedValue: result.aggregateMetrics.expectedValue.financial,
      confidence95: result.aggregateMetrics.confidenceInterval,
      riskScore: result.aggregateMetrics.riskScore,
      successProbability: result.aggregateMetrics.probabilityOfSuccess
    };
  }

  /**
   * Run sensitivity analysis only
   */
  async analyzeSensitivity(
    decision: Decision,
    option: DecisionOption,
    userProfile: Partial<UserProfile>
  ): Promise<SensitivityResult> {
    const config = {
      targetScenarios: 0,
      runSensitivity: true,
      sensitivitySamples: 512,
      useQMC: false,
      useMLMC: false,
      useCopulas: false,
      reduceScenarios: false
    };

    const result = await this.engine.runAdvancedSimulation(
      decision,
      option,
      userProfile,
      config
    );

    if (!result.metadata?.sensitivityAnalysis) {
      throw new Error('Sensitivity analysis failed');
    }

    return result.metadata.sensitivityAnalysis;
  }

  /**
   * Get data quality assessment
   */
  assessDataQuality(userProfile: Partial<UserProfile>, decisionType: DecisionType): DataQualityReport {
    const requiredFields = this.getRequiredFields(decisionType);
    const providedFields = this.getProvidedFields(userProfile, requiredFields);

    const completeness = providedFields.length / requiredFields.length;
    const missingFields = requiredFields.filter(f => !providedFields.includes(f));

    return {
      completeness,
      confidence: completeness > 0.8 ? 'high' : completeness > 0.6 ? 'medium' : 'low',
      missingFields,
      recommendations: this.getDataRecommendations(missingFields, decisionType),
      simulationImpact: this.getSimulationImpact(completeness)
    };
  }

  /**
   * Cancel current simulation
   */
  cancelSimulation(): void {
    // In a real implementation, would cancel ongoing calculations
    this.currentSimulation = null;
  }

  /**
   * Private helper methods
   */

  private getDefaultConfig(): SimulationConfig {
    return {
      mode: 'balanced',
      enableSensitivity: true,
      targetScenarios: 200,
      showProgress: true
    };
  }

  private mapToEngineConfig(config: SimulationConfig): any {
    const baseConfig = {
      runSensitivity: config.enableSensitivity,
      targetScenarios: config.targetScenarios
    };

    switch (config.mode) {
      case 'fast':
        return {
          ...baseConfig,
          useQMC: true,
          useMLMC: false,
          useCopulas: false,
          reduceScenarios: true,
          sensitivitySamples: 16,  // Reduced for fast mode
          runSensitivity: false  // Disable by default in fast mode
        };

      case 'balanced':
        return {
          ...baseConfig,
          useQMC: true,
          useMLMC: true,
          useCopulas: true,
          reduceScenarios: true,
          sensitivitySamples: 512
        };

      case 'accurate':
        return {
          ...baseConfig,
          targetScenarios: config.targetScenarios * 2,
          useQMC: true,
          useMLMC: true,
          useCopulas: true,
          reduceScenarios: false,
          sensitivitySamples: 1024
        };

      default:
        return baseConfig;
    }
  }


  private getRequiredFields(decisionType: DecisionType): string[] {
    const common = [
      'demographics.age',
      'location.city',
      'career.salary',
      'financial.monthlyExpenses'
    ];

    const specific: Record<string, string[]> = {
      career_change: ['career.role', 'career.experience', 'career.industry'],
      job_offer: ['career.role', 'career.experience', 'career.salary'],
      home_purchase: ['financial.assets', 'financial.creditScore', 'financial.savingsRate'],
      education: ['education.level', 'education.field', 'career.experience'],
      relocation: ['demographics.dependents', 'demographics.maritalStatus'],
      family_planning: ['demographics.maritalStatus', 'financial.savingsRate'],
      retirement: ['financial.retirement', 'demographics.age', 'financial.assets'],
      investment: ['financial.assets', 'financial.riskTolerance'],
      business_startup: ['financial.assets', 'career.experience', 'financial.creditScore']
    };

    return [...common, ...(specific[decisionType] || [])];
  }

  private getProvidedFields(profile: Partial<UserProfile>, fields: string[]): string[] {
    return fields.filter(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], profile as any);
      return value !== undefined && value !== null;
    });
  }

  private getDataRecommendations(
    missingFields: string[],
    decisionType: DecisionType
  ): string[] {
    const recommendations: string[] = [];

    if (missingFields.includes('career.salary')) {
      recommendations.push('Add your current salary for accurate financial projections');
    }

    if (missingFields.includes('financial.monthlyExpenses')) {
      recommendations.push('Provide monthly expenses to improve lifestyle impact estimates');
    }

    if ((decisionType === 'career_change' || decisionType === 'job_offer') && missingFields.includes('career.industry')) {
      recommendations.push('Specify your industry for market-specific growth projections');
    }

    if (decisionType === 'home_purchase' && missingFields.includes('financial.creditScore')) {
      recommendations.push('Add credit score for accurate mortgage rate estimates');
    }

    return recommendations;
  }

  private getSimulationImpact(completeness: number): string {
    if (completeness >= 0.8) {
      return 'Simulations will be highly personalized and accurate';
    } else if (completeness >= 0.6) {
      return 'Good accuracy with some assumptions based on market averages';
    } else if (completeness >= 0.4) {
      return 'Results will include wider uncertainty ranges';
    } else {
      return 'Limited personalization - results based mostly on population averages';
    }
  }
}

// Type definitions
export interface QuickEstimate {
  expectedValue: number;
  confidence95: { lower: number; upper: number; confidence: number };
  riskScore: number;
  successProbability: number;
}

export interface SensitivityResult {
  keyDrivers: Array<{
    parameter: string;
    importance: number;
    firstOrder: number;
    interactions: number;
  }>;
  recommendation: string;
}

export interface DataQualityReport {
  completeness: number;
  confidence: 'high' | 'medium' | 'low';
  missingFields: string[];
  recommendations: string[];
  simulationImpact: string;
}

// Export singleton instance
export const simulationService = new SimulationService();