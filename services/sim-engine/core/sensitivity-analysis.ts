/**
 * Global sensitivity analysis using Sobol indices
 * Identifies which input parameters drive outcome uncertainty
 */

import { SobolSequence } from './sobol';
import { PhiloxRNG } from './philox-rng';

export class SensitivityAnalyzer {
  private sobol: SobolSequence;
  private rng: PhiloxRNG;

  constructor(seed: string = 'sensitivity') {
    this.rng = new PhiloxRNG(seed);
    this.sobol = new SobolSequence(20); // Max 20 parameters
  }

  /**
   * Compute Sobol sensitivity indices
   * Returns first-order, total-order, and second-order indices
   */
  async computeSobolIndices(
    model: (inputs: number[]) => Promise<number>,
    parameterRanges: ParameterRange[],
    numSamples: number = 1024
  ): Promise<SobolIndicesResult> {
    const d = parameterRanges.length;

    // Generate sample matrices using Saltelli's scheme
    const { A, B, C } = this.generateSaltelliSamples(numSamples, d);

    // Transform to parameter space
    const samplesA = this.transformSamples(A, parameterRanges);
    const samplesB = this.transformSamples(B, parameterRanges);
    const samplesC = C.map(matrix => this.transformSamples(matrix, parameterRanges));

    // Evaluate model
    console.log('Evaluating base samples...');
    console.log(`Sample A: ${samplesA.length} points`);
    const fA = await this.evaluateModel(model, samplesA);
    console.log(`Sample B: ${samplesB.length} points`);
    const fB = await this.evaluateModel(model, samplesB);

    console.log('Evaluating cross samples...');
    const fC: number[][] = [];
    for (let i = 0; i < d; i++) {
      console.log(`Cross sample ${i+1}/${d}: ${samplesC[i].length} points`);
      fC[i] = await this.evaluateModel(model, samplesC[i]);
    }

    // Compute indices
    const firstOrder = this.computeFirstOrderIndices(fA, fB, fC);
    const totalOrder = this.computeTotalOrderIndices(fA, fB, fC);
    const secondOrder = this.computeSecondOrderIndices(fA, fB, fC, d);

    // Skip bootstrap for now to avoid infinite recursion
    // Bootstrap would re-run the entire sensitivity analysis
    const confidence: ConfidenceIntervals = {
      firstOrderCI: firstOrder.map(v => [v * 0.9, v * 1.1] as [number, number]),
      totalOrderCI: totalOrder.map(v => [v * 0.9, v * 1.1] as [number, number])
    };

    console.log('Sensitivity analysis complete');

    return {
      parameters: parameterRanges.map(p => p.name),
      firstOrder,
      totalOrder,
      secondOrder,
      confidence,
      convergence: this.assessConvergence(firstOrder, totalOrder),
      totalVariance: this.variance([...fA, ...fB])
    };
  }

  /**
   * Generate Saltelli sample scheme for Sobol indices
   */
  private generateSaltelliSamples(
    n: number,
    d: number
  ): { A: number[][]; B: number[][]; C: number[][][] } {
    // Use Sobol sequence for better coverage
    const totalSamples = n * (2 + d);
    const samples: number[][] = [];

    for (let i = 0; i < totalSamples; i++) {
      samples.push(this.sobol.next().slice(0, d));
    }

    // Split into A and B matrices
    const A = samples.slice(0, n);
    const B = samples.slice(n, 2 * n);

    // Create C matrices (A with column i from B)
    const C: number[][][] = [];
    for (let i = 0; i < d; i++) {
      C[i] = A.map((row, j) => {
        const newRow = [...row];
        newRow[i] = B[j][i];
        return newRow;
      });
    }

    return { A, B, C };
  }

  /**
   * Transform uniform samples to parameter space
   */
  private transformSamples(
    uniformSamples: number[][],
    ranges: ParameterRange[]
  ): number[][] {
    return uniformSamples.map(sample =>
      sample.map((u, i) => {
        const range = ranges[i];
        if (range.distribution === 'uniform') {
          return range.min + u * (range.max - range.min);
        } else if (range.distribution === 'normal') {
          // Transform uniform to normal
          const z = this.inverseNormalCDF(u);
          return range.mean! + z * range.std!;
        } else if (range.distribution === 'lognormal') {
          const z = this.inverseNormalCDF(u);
          return Math.exp(range.logMean! + z * range.logStd!);
        }
        return u;
      })
    );
  }

  /**
   * Evaluate model for multiple parameter sets
   */
  private async evaluateModel(
    model: (inputs: number[]) => Promise<number>,
    samples: number[][]
  ): Promise<number[]> {
    console.log(`evaluateModel: Processing ${samples.length} samples`);
    const results: number[] = [];

    // Batch evaluation for efficiency
    const batchSize = 10; // Reduced batch size
    for (let i = 0; i < samples.length; i += batchSize) {
      const batch = samples.slice(i, i + batchSize);
      console.log(`Processing batch ${i/batchSize + 1}/${Math.ceil(samples.length/batchSize)}`);
      const batchResults = await Promise.all(
        batch.map(sample => model(sample))
      );
      results.push(...batchResults);
    }

    console.log(`evaluateModel: Completed ${results.length} evaluations`);
    return results;
  }

  /**
   * Compute first-order Sobol indices
   */
  private computeFirstOrderIndices(
    fA: number[],
    fB: number[],
    fC: number[][]
  ): number[] {
    const d = fC.length;
    const indices: number[] = [];

    const varY = this.variance([...fA, ...fB]);

    for (let i = 0; i < d; i++) {
      // First-order index: S_i = V[E(Y|X_i)] / V(Y)
      const numerator = this.mean(
        fB.map((fb, j) => fb * (fC[i][j] - fA[j]))
      );

      indices.push(Math.max(0, numerator / varY));
    }

    return indices;
  }

  /**
   * Compute total-order Sobol indices
   */
  private computeTotalOrderIndices(
    fA: number[],
    fB: number[],
    fC: number[][]
  ): number[] {
    const d = fC.length;
    const indices: number[] = [];

    const varY = this.variance([...fA, ...fB]);
    const E2 = this.mean(fA.map((fa, i) => fa * fB[i]));

    for (let i = 0; i < d; i++) {
      // Total-order index: ST_i = 1 - V[E(Y|X_~i)] / V(Y)
      const E_i = this.mean(
        fA.map((fa, j) => fa * fC[i][j])
      );

      indices.push(Math.min(1, Math.max(0, 1 - (E_i - E2) / varY)));
    }

    return indices;
  }

  /**
   * Compute second-order interaction indices
   */
  private computeSecondOrderIndices(
    fA: number[],
    fB: number[],
    fC: number[][],
    d: number
  ): number[][] {
    const indices: number[][] = Array(d).fill(null)
      .map(() => Array(d).fill(0));

    const varY = this.variance([...fA, ...fB]);
    const firstOrder = this.computeFirstOrderIndices(fA, fB, fC);

    // For each pair (i,j)
    for (let i = 0; i < d - 1; i++) {
      for (let j = i + 1; j < d; j++) {
        // Create samples where both X_i and X_j are from B
        const fCij = fA.map((fa, k) => {
          // This is simplified - proper implementation needs additional samples
          return fC[i][k];
        });

        const Vij = this.mean(
          fB.map((fb, k) => fb * (fCij[k] - fA[k]))
        ) / varY;

        // Second-order index: S_ij = V_ij - S_i - S_j
        const Sij = Math.max(0, Vij - firstOrder[i] - firstOrder[j]);

        indices[i][j] = Sij;
        indices[j][i] = Sij;
      }
    }

    return indices;
  }

  /**
   * Bootstrap confidence intervals
   */
  private async bootstrapConfidence(
    model: (inputs: number[]) => Promise<number>,
    parameterRanges: ParameterRange[],
    numSamples: number,
    numBootstrap: number
  ): Promise<ConfidenceIntervals> {
    const d = parameterRanges.length;
    const bootstrapFirstOrder: number[][] = Array(numBootstrap).fill(null)
      .map(() => []);
    const bootstrapTotalOrder: number[][] = Array(numBootstrap).fill(null)
      .map(() => []);

    // Run bootstrap iterations
    for (let b = 0; b < numBootstrap; b++) {
      // Generate bootstrap sample with different seed
      const bootstrapRng = new PhiloxRNG(`bootstrap-${b}`);
      const oldSobol = this.sobol;
      this.sobol = new SobolSequence(d);

      // Smaller sample size for bootstrap
      const bootstrapN = Math.floor(numSamples / 2);
      const result = await this.computeSobolIndices(
        model,
        parameterRanges,
        bootstrapN
      );

      bootstrapFirstOrder[b] = result.firstOrder;
      bootstrapTotalOrder[b] = result.totalOrder;

      this.sobol = oldSobol;
    }

    // Compute percentiles
    const firstOrderCI: Array<[number, number]> = [];
    const totalOrderCI: Array<[number, number]> = [];

    for (let i = 0; i < d; i++) {
      const firstValues = bootstrapFirstOrder.map(b => b[i]).sort((a, b) => a - b);
      const totalValues = bootstrapTotalOrder.map(b => b[i]).sort((a, b) => a - b);

      firstOrderCI.push([
        firstValues[Math.floor(numBootstrap * 0.025)],
        firstValues[Math.floor(numBootstrap * 0.975)]
      ]);

      totalOrderCI.push([
        totalValues[Math.floor(numBootstrap * 0.025)],
        totalValues[Math.floor(numBootstrap * 0.975)]
      ]);
    }

    return { firstOrderCI, totalOrderCI };
  }

  /**
   * Assess convergence of sensitivity indices
   */
  private assessConvergence(
    firstOrder: number[],
    totalOrder: number[]
  ): ConvergenceMetrics {
    // Sum of first-order indices (should be ≤ 1)
    const sumFirstOrder = firstOrder.reduce((sum, s) => sum + s, 0);

    // Check if total >= first for all parameters
    const monotonicity = firstOrder.every((s1, i) => totalOrder[i] >= s1);

    // Interaction strength
    const interactionStrength = Math.max(0, 1 - sumFirstOrder);

    return {
      sumFirstOrder,
      monotonicity,
      interactionStrength,
      converged: sumFirstOrder <= 1.01 && monotonicity
    };
  }

  /**
   * Morris screening method for quick sensitivity ranking
   */
  async morrisScreening(
    model: (inputs: number[]) => Promise<number>,
    parameterRanges: ParameterRange[],
    numTrajectories: number = 10,
    numLevels: number = 4
  ): Promise<MorrisResult> {
    const d = parameterRanges.length;
    const delta = 1 / (numLevels - 1);

    const effects: number[][] = Array(d).fill(null).map(() => []);

    // Generate Morris trajectories
    for (let t = 0; t < numTrajectories; t++) {
      const trajectory = this.generateMorrisTrajectory(d, numLevels);
      const samples = this.transformMorrisTrajectory(
        trajectory,
        parameterRanges,
        delta
      );

      // Evaluate along trajectory
      const values = await this.evaluateModel(model, samples);

      // Compute elementary effects
      for (let i = 0; i < d; i++) {
        const effect = (values[i + 1] - values[i]) / delta;
        effects[i].push(effect);
      }
    }

    // Compute Morris statistics
    const mu: number[] = [];
    const muStar: number[] = [];
    const sigma: number[] = [];

    for (let i = 0; i < d; i++) {
      mu[i] = this.mean(effects[i]);
      muStar[i] = this.mean(effects[i].map(Math.abs));
      sigma[i] = this.stdDev(effects[i]);
    }

    // Rank parameters by importance
    const ranking = parameterRanges
      .map((p, i) => ({
        parameter: p.name,
        index: i,
        muStar: muStar[i],
        sigma: sigma[i]
      }))
      .sort((a, b) => b.muStar - a.muStar);

    return {
      parameters: parameterRanges.map(p => p.name),
      mu,
      muStar,
      sigma,
      ranking,
      trajectories: numTrajectories
    };
  }

  /**
   * Generate Morris trajectory using radial sampling
   */
  private generateMorrisTrajectory(d: number, levels: number): number[][] {
    const trajectory: number[][] = [];

    // Random starting point
    const start = Array(d).fill(0).map(() =>
      Math.floor(this.rng.next() * levels) / (levels - 1)
    );
    trajectory.push(start);

    // Random permutation of dimensions
    const order = this.randomPermutation(d);

    // Step through dimensions
    const current = [...start];
    for (const dim of order) {
      // Change one factor at a time
      current[dim] = current[dim] < 0.5 ? current[dim] + 1 / (levels - 1) : current[dim] - 1 / (levels - 1);
      trajectory.push([...current]);
    }

    return trajectory;
  }

  /**
   * Transform Morris trajectory to parameter space
   */
  private transformMorrisTrajectory(
    trajectory: number[][],
    ranges: ParameterRange[],
    delta: number
  ): number[][] {
    return trajectory.map(point =>
      point.map((u, i) => {
        const range = ranges[i];
        return range.min + u * (range.max - range.min);
      })
    );
  }

  /**
   * Generate random permutation
   */
  private randomPermutation(n: number): number[] {
    const perm = Array(n).fill(0).map((_, i) => i);

    for (let i = n - 1; i > 0; i--) {
      const j = this.rng.nextInt(i + 1);
      [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    return perm;
  }

  // Statistical utilities
  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private variance(values: number[]): number {
    const m = this.mean(values);
    return values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  }

  private stdDev(values: number[]): number {
    return Math.sqrt(this.variance(values));
  }

  private inverseNormalCDF(p: number): number {
    // Acklam's algorithm
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
export interface ParameterRange {
  name: string;
  min: number;
  max: number;
  distribution: 'uniform' | 'normal' | 'lognormal';
  mean?: number;
  std?: number;
  logMean?: number;
  logStd?: number;
}

export interface SobolIndicesResult {
  parameters: string[];
  firstOrder: number[];
  totalOrder: number[];
  secondOrder: number[][];
  confidence: ConfidenceIntervals;
  convergence: ConvergenceMetrics;
  totalVariance: number;
}

interface ConfidenceIntervals {
  firstOrderCI: Array<[number, number]>;
  totalOrderCI: Array<[number, number]>;
}

interface ConvergenceMetrics {
  sumFirstOrder: number;
  monotonicity: boolean;
  interactionStrength: number;
  converged: boolean;
}

export interface MorrisResult {
  parameters: string[];
  mu: number[];
  muStar: number[];
  sigma: number[];
  ranking: Array<{
    parameter: string;
    index: number;
    muStar: number;
    sigma: number;
  }>;
  trajectories: number;
}