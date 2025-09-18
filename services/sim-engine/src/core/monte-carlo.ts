// Core Monte Carlo simulation engine

export class MonteCarloEngine {
  private random: RandomGenerator;

  constructor(seed?: number) {
    this.random = new RandomGenerator(seed);
  }

  // Run Monte Carlo simulation
  async runSimulation<T>(
    model: SimulationModel<T>,
    params: any,
    iterations: number = 1000
  ): Promise<SimulationResults<T>> {
    const results: T[] = [];
    const startTime = Date.now();

    // Run iterations
    for (let i = 0; i < iterations; i++) {
      const iterationResult = await model.simulate(params, this.random);
      results.push(iterationResult);
    }

    // Calculate statistics
    const stats = this.calculateStatistics(results, model.metrics);
    const duration = Date.now() - startTime;

    return {
      results,
      statistics: stats,
      metadata: {
        iterations,
        duration,
        timestamp: new Date(),
        modelVersion: model.version,
        dataQuality: this.assessDataQuality(params),
      },
    };
  }

  // Calculate key statistics from simulation results
  private calculateStatistics<T>(
    results: T[],
    metrics: MetricDefinition[]
  ): SimulationStatistics {
    const stats: SimulationStatistics = {
      outcomes: {},
      percentiles: {},
      probabilities: {},
      sensitivities: {},
    };

    // Calculate for each metric
    metrics.forEach(metric => {
      const values = results.map(r => metric.extract(r)).sort((a, b) => a - b);

      stats.outcomes[metric.name] = {
        mean: this.mean(values),
        median: this.percentile(values, 50),
        stdDev: this.standardDeviation(values),
        min: values[0],
        max: values[values.length - 1],
        confidence95: {
          lower: this.percentile(values, 2.5),
          upper: this.percentile(values, 97.5),
        },
      };

      stats.percentiles[metric.name] = {
        p5: this.percentile(values, 5),
        p10: this.percentile(values, 10),
        p25: this.percentile(values, 25),
        p50: this.percentile(values, 50),
        p75: this.percentile(values, 75),
        p90: this.percentile(values, 90),
        p95: this.percentile(values, 95),
      };

      // Calculate probabilities for key thresholds
      if (metric.thresholds) {
        stats.probabilities[metric.name] = {};
        metric.thresholds.forEach(threshold => {
          const probability = values.filter(v => v >= threshold.value).length / values.length;
          stats.probabilities[metric.name][threshold.name] = probability;
        });
      }
    });

    return stats;
  }

  // Assess data quality to inform confidence levels
  private assessDataQuality(params: any): DataQuality {
    let score = 0;
    let missingFields = 0;
    let totalFields = 0;

    // Count provided vs missing fields
    const checkFields = (obj: any, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          missingFields++;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
          checkFields(value, `${prefix}${key}.`);
          return;
        } else {
          score += this.getFieldImportance(prefix + key);
        }
        totalFields++;
      });
    };

    checkFields(params);

    const completeness = (totalFields - missingFields) / totalFields;
    const quality = score / totalFields;

    return {
      completeness,
      quality,
      confidence: this.getConfidenceLevel(completeness, quality),
      missingCriticalData: missingFields > 0,
    };
  }

  // Helper methods
  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private standardDeviation(values: number[]): number {
    const avg = this.mean(values);
    const squareDiffs = values.map(v => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  private percentile(values: number[], p: number): number {
    const index = (p / 100) * (values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
      return values[lower];
    }

    return values[lower] * (1 - weight) + values[upper] * weight;
  }

  private getFieldImportance(field: string): number {
    // Critical fields get higher importance scores
    const importanceMap: Record<string, number> = {
      'salary': 3,
      'age': 2,
      'location': 2,
      'dependents': 2,
      'savings': 3,
      'expenses': 3,
      'industry': 1,
      'education': 1,
    };

    for (const [key, importance] of Object.entries(importanceMap)) {
      if (field.includes(key)) {
        return importance;
      }
    }

    return 1; // default importance
  }

  private getConfidenceLevel(completeness: number, quality: number): ConfidenceLevel {
    const score = (completeness + quality) / 2;

    if (score >= 0.8) return 'high';
    if (score >= 0.6) return 'medium';
    return 'low';
  }
}

// Random number generator with seed support
export class RandomGenerator {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed || Date.now();
  }

  // Generate uniform random number [0, 1)
  uniform(): number {
    // Simple linear congruential generator
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  // Generate normal distribution using Box-Muller transform
  normal(mean: number = 0, stdDev: number = 1): number {
    const u1 = this.uniform();
    const u2 = this.uniform();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  // Generate triangular distribution (min, likely, max)
  triangular(min: number, likely: number, max: number): number {
    const u = this.uniform();
    const f = (likely - min) / (max - min);

    if (u < f) {
      return min + Math.sqrt(u * (max - min) * (likely - min));
    } else {
      return max - Math.sqrt((1 - u) * (max - min) * (max - likely));
    }
  }

  // Generate from beta distribution (useful for probabilities)
  beta(alpha: number, beta: number): number {
    const x = this.gamma(alpha, 1);
    const y = this.gamma(beta, 1);
    return x / (x + y);
  }

  // Gamma distribution (used by beta)
  private gamma(shape: number, scale: number): number {
    // Marsaglia and Tsang method
    if (shape < 1) {
      return this.gamma(shape + 1, scale) * Math.pow(this.uniform(), 1 / shape);
    }

    const d = shape - 1/3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x, v;
      do {
        x = this.normal();
        v = 1 + c * x;
      } while (v <= 0);

      v = v * v * v;
      const u = this.uniform();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }
}

// Type definitions
export interface SimulationModel<T> {
  version: string;
  simulate(params: any, random: RandomGenerator): Promise<T>;
  metrics: MetricDefinition[];
}

export interface MetricDefinition {
  name: string;
  extract: (result: any) => number;
  thresholds?: { name: string; value: number }[];
}

export interface SimulationResults<T> {
  results: T[];
  statistics: SimulationStatistics;
  metadata: SimulationMetadata;
}

export interface SimulationStatistics {
  outcomes: Record<string, OutcomeStats>;
  percentiles: Record<string, PercentileStats>;
  probabilities: Record<string, Record<string, number>>;
  sensitivities: Record<string, number>;
}

export interface OutcomeStats {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  confidence95: { lower: number; upper: number };
}

export interface PercentileStats {
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

export interface SimulationMetadata {
  iterations: number;
  duration: number;
  timestamp: Date;
  modelVersion: string;
  dataQuality: DataQuality;
}

export interface DataQuality {
  completeness: number;
  quality: number;
  confidence: ConfidenceLevel;
  missingCriticalData: boolean;
}

export type ConfidenceLevel = 'high' | 'medium' | 'low';