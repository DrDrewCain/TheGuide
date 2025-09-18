/**
 * Multilevel Monte Carlo (MLMC) for efficient path-dependent simulations
 * Reduces computational cost by orders of magnitude for time-series outcomes
 */

import { PhiloxRNG } from './philox-rng';
import { QMCEngine } from './qmc-engine';

export class MLMCEngine {
  private qmcEngine: QMCEngine;
  private baseRng: PhiloxRNG;

  constructor(seed: string) {
    this.qmcEngine = new QMCEngine(10, seed); // 10 dimensions typical
    this.baseRng = new PhiloxRNG(seed);
  }

  /**
   * Run multilevel Monte Carlo simulation
   * Combines coarse and fine path simulations for efficiency
   */
  async runMLMC(
    pathGenerator: PathGenerator,
    targetMSE: number,
    maxLevels: number = 6
  ): Promise<MLMCResult> {
    const levels: LevelResult[] = [];
    let totalCost = 0;

    // Step 1: Pilot run to estimate variances and costs
    const pilotSamples = 100;
    const { variances, costs } = await this.runPilotStudy(
      pathGenerator,
      pilotSamples,
      maxLevels
    );

    // Step 2: Optimal sample allocation using Giles' formula
    const optimalSamples = this.computeOptimalSamples(
      variances,
      costs,
      targetMSE
    );

    // Step 3: Run main simulation at each level
    for (let level = 0; level < optimalSamples.length; level++) {
      const samples = optimalSamples[level];
      if (samples === 0) continue;

      const levelResult = await this.simulateLevel(
        pathGenerator,
        level,
        samples
      );

      levels.push(levelResult);
      totalCost += samples * costs[level];
    }

    // Step 4: Combine estimates from all levels
    const finalEstimate = this.combineEstimates(levels);

    return {
      estimate: finalEstimate.mean,
      variance: finalEstimate.variance,
      confidence95: finalEstimate.confidence95,
      levels,
      totalCost,
      costReduction: this.estimateCostReduction(totalCost, variances[0], targetMSE)
    };
  }

  /**
   * Run pilot study to estimate level variances and costs
   */
  private async runPilotStudy(
    pathGenerator: PathGenerator,
    samplesPerLevel: number,
    maxLevels: number
  ): Promise<{ variances: number[]; costs: number[] }> {
    const variances: number[] = [];
    const costs: number[] = [];

    for (let level = 0; level < maxLevels; level++) {
      const startTime = Date.now();
      const values: number[] = [];

      // Generate pilot samples
      for (let i = 0; i < samplesPerLevel; i++) {
        const rng = this.baseRng.split();

        if (level === 0) {
          // Coarsest level: just evaluate on coarse grid
          const coarsePath = await pathGenerator.generate(level, rng);
          values.push(pathGenerator.evaluate(coarsePath));
        } else {
          // Finer levels: compute difference
          const [finePath, coarsePath] = await this.generateCoupledPaths(
            pathGenerator,
            level,
            rng
          );

          const fineValue = pathGenerator.evaluate(finePath);
          const coarseValue = pathGenerator.evaluate(coarsePath);
          values.push(fineValue - coarseValue);
        }
      }

      // Estimate variance and cost
      variances.push(this.sampleVariance(values));
      costs.push((Date.now() - startTime) / samplesPerLevel);

      // Check for convergence
      if (level > 2 && variances[level] < variances[level - 1] * 0.1) {
        break; // Variance decaying rapidly, can stop
      }
    }

    return { variances, costs };
  }

  /**
   * Generate coupled fine and coarse paths for level l
   * Uses Brownian bridge or similar coupling for correlation
   */
  private async generateCoupledPaths(
    pathGenerator: PathGenerator,
    level: number,
    rng: PhiloxRNG
  ): Promise<[Path, Path]> {
    const fineSteps = pathGenerator.getStepsForLevel(level);
    const coarseSteps = pathGenerator.getStepsForLevel(level - 1);

    // Generate coarse path first
    const coarseNoise = this.generateBrownianIncrements(coarseSteps, rng);
    const coarsePath = await pathGenerator.generateFromNoise(
      level - 1,
      coarseNoise
    );

    // Generate fine path using Brownian bridge
    const fineNoise = this.refineBrownianPath(coarseNoise, fineSteps, rng);
    const finePath = await pathGenerator.generateFromNoise(
      level,
      fineNoise
    );

    return [finePath, coarsePath];
  }

  /**
   * Refine Brownian path using Brownian bridge construction
   */
  private refineBrownianPath(
    coarseIncrements: number[][],
    fineSteps: number,
    rng: PhiloxRNG
  ): number[][] {
    const dimension = coarseIncrements[0].length;
    const coarseSteps = coarseIncrements.length;
    const refinementFactor = Math.floor(fineSteps / coarseSteps);

    const fineIncrements: number[][] = [];

    for (let i = 0; i < coarseSteps; i++) {
      // For each coarse interval, generate fine increments
      const coarseIncrement = coarseIncrements[i];

      // Subdivide using Brownian bridge
      const subIncrements = this.brownianBridge(
        coarseIncrement,
        refinementFactor,
        dimension,
        rng
      );

      fineIncrements.push(...subIncrements);
    }

    return fineIncrements;
  }

  /**
   * Brownian bridge construction for path refinement
   */
  private brownianBridge(
    totalIncrement: number[],
    subdivisions: number,
    dimension: number,
    rng: PhiloxRNG
  ): number[][] {
    const dt = 1 / subdivisions;
    const increments: number[][] = [];

    // Generate intermediate points
    const points: number[][] = [new Array(dimension).fill(0)];

    // Final point
    const finalPoint = totalIncrement.slice();
    points[subdivisions] = finalPoint;

    // Fill in using bridge construction (recursive midpoint)
    this.fillBrownianBridge(points, 0, subdivisions, Math.sqrt(dt), rng);

    // Convert to increments
    for (let i = 1; i <= subdivisions; i++) {
      const increment = points[i].map((val, d) => val - (points[i - 1]?.[d] || 0));
      increments.push(increment);
    }

    return increments;
  }

  /**
   * Recursive Brownian bridge construction
   */
  private fillBrownianBridge(
    points: number[][],
    start: number,
    end: number,
    scale: number,
    rng: PhiloxRNG
  ): void {
    if (end - start <= 1) return;

    const mid = Math.floor((start + end) / 2);
    const dimension = points[start].length;

    // Interpolate midpoint
    points[mid] = new Array(dimension);
    for (let d = 0; d < dimension; d++) {
      const mean = (points[start][d] + points[end][d]) / 2;
      const std = scale * Math.sqrt((end - mid) * (mid - start) / (end - start));
      points[mid][d] = mean + rng.normal(0, std);
    }

    // Recursively fill left and right
    this.fillBrownianBridge(points, start, mid, scale, rng);
    this.fillBrownianBridge(points, mid, end, scale, rng);
  }

  /**
   * Generate Brownian increments
   */
  private generateBrownianIncrements(
    steps: number,
    rng: PhiloxRNG,
    dimension: number = 5
  ): number[][] {
    const increments: number[][] = [];
    const sqrtDt = Math.sqrt(1 / steps);

    for (let i = 0; i < steps; i++) {
      const increment: number[] = [];
      for (let d = 0; d < dimension; d++) {
        increment.push(rng.normal(0, sqrtDt));
      }
      increments.push(increment);
    }

    return increments;
  }

  /**
   * Compute optimal number of samples per level
   * Using Giles' optimal allocation formula
   */
  private computeOptimalSamples(
    variances: number[],
    costs: number[],
    targetMSE: number
  ): number[] {
    const L = variances.length;
    const epsilon = Math.sqrt(targetMSE / 2); // Split MSE between bias and variance

    // Compute sum for normalization
    let sum = 0;
    for (let l = 0; l < L; l++) {
      sum += Math.sqrt(variances[l] * costs[l]);
    }

    // Optimal samples per level
    const samples: number[] = [];
    for (let l = 0; l < L; l++) {
      const nl = Math.ceil(
        (2 / (epsilon * epsilon)) * sum * Math.sqrt(variances[l] / costs[l])
      );
      samples.push(nl);
    }

    return samples;
  }

  /**
   * Simulate at a specific level
   */
  private async simulateLevel(
    pathGenerator: PathGenerator,
    level: number,
    numSamples: number
  ): Promise<LevelResult> {
    const values: number[] = [];
    const startTime = Date.now();

    // Use QMC for better convergence
    const qmcDimension = pathGenerator.getStepsForLevel(level) * 5; // 5 risk factors
    const qmcSamples = this.qmcEngine.generateQMCSamples(numSamples, qmcDimension);

    for (let i = 0; i < numSamples; i++) {
      const rng = new PhiloxRNG(this.baseRng.nextInt(1e9), level, i);

      if (level === 0) {
        const path = await pathGenerator.generateFromUniform(level, qmcSamples[i]);
        values.push(pathGenerator.evaluate(path));
      } else {
        // Generate coupled paths using QMC points
        const [finePath, coarsePath] = await this.generateCoupledPathsQMC(
          pathGenerator,
          level,
          qmcSamples[i]
        );

        const fineValue = pathGenerator.evaluate(finePath);
        const coarseValue = pathGenerator.evaluate(coarsePath);
        values.push(fineValue - coarseValue);
      }
    }

    const mean = this.mean(values);
    const variance = this.sampleVariance(values);
    const cost = Date.now() - startTime;

    return {
      level,
      samples: numSamples,
      mean,
      variance,
      cost,
      values
    };
  }

  /**
   * Generate coupled paths using QMC points
   */
  private async generateCoupledPathsQMC(
    pathGenerator: PathGenerator,
    level: number,
    qmcPoint: number[]
  ): Promise<[Path, Path]> {
    // Transform QMC points to Brownian increments
    const fineSteps = pathGenerator.getStepsForLevel(level);
    const coarseSteps = pathGenerator.getStepsForLevel(level - 1);

    // Use antithetic variates for variance reduction
    const fineNoise = this.qmcToBrownian(qmcPoint, fineSteps);
    const coarseNoise = this.coarsenPath(fineNoise, coarseSteps);

    const finePath = await pathGenerator.generateFromNoise(level, fineNoise);
    const coarsePath = await pathGenerator.generateFromNoise(level - 1, coarseNoise);

    return [finePath, coarsePath];
  }

  /**
   * Transform QMC points to Brownian increments
   */
  private qmcToBrownian(qmcPoint: number[], steps: number): number[][] {
    const dimension = Math.floor(qmcPoint.length / steps);
    const increments: number[][] = [];

    for (let t = 0; t < steps; t++) {
      const increment: number[] = [];
      for (let d = 0; d < dimension; d++) {
        const u = qmcPoint[t * dimension + d];
        // Transform uniform to normal
        increment.push(this.inverseNormalCDF(u));
      }
      increments.push(increment);
    }

    return increments;
  }

  /**
   * Coarsen fine path to coarse path
   */
  private coarsenPath(finePath: number[][], coarseSteps: number): number[][] {
    const refinementFactor = Math.floor(finePath.length / coarseSteps);
    const coarsePath: number[][] = [];

    for (let i = 0; i < coarseSteps; i++) {
      const aggregated = new Array(finePath[0].length).fill(0);

      // Sum fine increments
      for (let j = 0; j < refinementFactor; j++) {
        const fineIdx = i * refinementFactor + j;
        if (fineIdx < finePath.length) {
          finePath[fineIdx].forEach((val, d) => {
            aggregated[d] += val;
          });
        }
      }

      coarsePath.push(aggregated);
    }

    return coarsePath;
  }

  /**
   * Combine estimates from all levels
   */
  private combineEstimates(levels: LevelResult[]): {
    mean: number;
    variance: number;
    confidence95: [number, number];
  } {
    // MLMC estimator: sum of level expectations
    let totalMean = 0;
    let totalVariance = 0;

    for (const level of levels) {
      totalMean += level.mean;
      totalVariance += level.variance / level.samples;
    }

    const stderr = Math.sqrt(totalVariance);
    const confidence95: [number, number] = [
      totalMean - 1.96 * stderr,
      totalMean + 1.96 * stderr
    ];

    return {
      mean: totalMean,
      variance: totalVariance,
      confidence95
    };
  }

  /**
   * Estimate cost reduction vs standard MC
   */
  private estimateCostReduction(
    mlmcCost: number,
    level0Variance: number,
    targetMSE: number
  ): number {
    // Standard MC would need this many samples
    const standardMCSamples = Math.ceil(level0Variance / targetMSE);
    const standardMCCost = standardMCSamples; // Assuming unit cost

    return standardMCCost / mlmcCost;
  }

  // Statistical utilities
  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private sampleVariance(values: number[]): number {
    const m = this.mean(values);
    return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / (values.length - 1);
  }

  private inverseNormalCDF(p: number): number {
    // Use same implementation as in QMCEngine
    const a = [-3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01,
    -1.328068155288572e+01];

    const p_low = 0.02425;
    const p_high = 1 - p_low;

    if (p < p_low) {
      const q = Math.sqrt(-2 * Math.log(p));
      return (((((a[0] * q + a[1]) * q + a[2]) * q + a[3]) * q + a[4]) * q + a[5]) /
        (((((b[0] * q + b[1]) * q + b[2]) * q + b[3]) * q + b[4]) * q + 1);
    } else if (p <= p_high) {
      const q = p - 0.5;
      const r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    } else {
      const q = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((a[0] * q + a[1]) * q + a[2]) * q + a[3]) * q + a[4]) * q + a[5]) /
        (((((b[0] * q + b[1]) * q + b[2]) * q + b[3]) * q + b[4]) * q + 1);
    }
  }
}

// Type definitions
export interface PathGenerator {
  getStepsForLevel(level: number): number;
  generate(level: number, rng: PhiloxRNG): Promise<Path>;
  generateFromNoise(level: number, noise: number[][]): Promise<Path>;
  generateFromUniform(level: number, uniform: number[]): Promise<Path>;
  evaluate(path: Path): number;
}

export interface Path {
  times: number[];
  values: number[][];
  level: number;
}

interface LevelResult {
  level: number;
  samples: number;
  mean: number;
  variance: number;
  cost: number;
  values: number[];
}

interface MLMCResult {
  estimate: number;
  variance: number;
  confidence95: [number, number];
  levels: LevelResult[];
  totalCost: number;
  costReduction: number;
}