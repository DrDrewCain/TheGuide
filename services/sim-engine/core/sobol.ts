/**
 * Scrambled Sobol sequence generator for Quasi-Monte Carlo
 * Implements Owen scrambling for better randomization
 */

import { PhiloxRNG } from './philox-rng';

export class SobolSequence {
  private dimension: number;
  private count: number;
  private directionNumbers: number[][];
  private x: number[];

  constructor(dimension: number) {
    this.dimension = dimension;
    this.count = 0;
    this.x = new Array(dimension).fill(0);

    // Initialize direction numbers (Joe-Kuo 2010)
    this.directionNumbers = this.initializeDirectionNumbers(dimension);
  }

  /**
   * Generate next point in Sobol sequence
   */
  next(): number[] {
    if (this.count === 0) {
      this.count++;
      return new Array(this.dimension).fill(0.5);
    }

    // Find rightmost zero bit in count
    const c = this.findRightmostZeroBit(this.count);

    // Update each dimension
    for (let j = 0; j < this.dimension; j++) {
      this.x[j] ^= this.directionNumbers[j][c];
    }

    this.count++;

    // Convert to [0,1)
    return this.x.map(val => val / 0x100000000);
  }

  /**
   * Skip ahead in sequence (for parallel generation)
   */
  skip(n: number): void {
    for (let i = 0; i < n; i++) {
      this.next();
    }
  }

  /**
   * Reset sequence to beginning
   */
  reset(): void {
    this.count = 0;
    this.x.fill(0);
  }

  private findRightmostZeroBit(n: number): number {
    // Gray code: find position of rightmost zero bit
    let c = 0;
    let value = n;

    while ((value & 1) === 1) {
      value >>>= 1;
      c++;
    }

    return c;
  }

  /**
   * Initialize direction numbers using Joe-Kuo 2010 values
   */
  private initializeDirectionNumbers(dim: number): number[][] {
    const v: number[][] = [];

    // First dimension is special (van der Corput)
    v[0] = [];
    for (let i = 0; i < 32; i++) {
      v[0][i] = 1 << (31 - i);
    }

    // Initialize primitive polynomials and initial values
    const primitivePolynomials = [
      1, 3, 7, 11, 13, 19, 25, 37, 59, 47,
      61, 55, 41, 67, 97, 91, 109, 103, 115, 131
    ];

    const initialValues = [
      [1],
      [1, 1],
      [1, 3, 7],
      [1, 1, 5],
      [1, 1, 7],
      [1, 3, 3],
      [1, 1, 3],
      [1, 3, 7],
      [1, 3, 3],
      [1, 1, 5]
    ];

    // Generate direction numbers for each dimension
    for (let d = 1; d < Math.min(dim, primitivePolynomials.length); d++) {
      const s = this.degree(primitivePolynomials[d]);
      const a = primitivePolynomials[d];

      v[d] = new Array(32).fill(0);

      // Copy initial values
      const m = initialValues[Math.min(d - 1, initialValues.length - 1)];
      for (let i = 0; i < m.length; i++) {
        v[d][i] = m[i] << (31 - i);
      }

      // Generate remaining direction numbers
      for (let i = s; i < 32; i++) {
        v[d][i] = v[d][i - s] ^ (v[d][i - s] >>> s);

        for (let k = 1; k < s; k++) {
          v[d][i] ^= ((a >>> (s - k - 1)) & 1) * v[d][i - k];
        }
      }
    }

    // For higher dimensions, use random initialization
    const rng = new PhiloxRNG(12345); // Fixed seed for reproducibility
    for (let d = primitivePolynomials.length; d < dim; d++) {
      v[d] = [];
      for (let i = 0; i < 32; i++) {
        v[d][i] = Math.floor(rng.next() * 0x100000000);
      }
    }

    return v;
  }

  private degree(polynomial: number): number {
    let d = 0;
    let p = polynomial;
    while (p > 1) {
      p >>>= 1;
      d++;
    }
    return d;
  }
}

/**
 * Owen-scrambled Sobol sequence for improved QMC properties
 */
export class ScrambledSobol {
  private sobol: SobolSequence;
  private scrambleRng: PhiloxRNG;
  private permutations: Map<string, number[]>;

  constructor(dimension: number, scramblingKey: string) {
    this.sobol = new SobolSequence(dimension);
    this.scrambleRng = new PhiloxRNG(scramblingKey);
    this.permutations = new Map();
  }

  /**
   * Generate next Owen-scrambled point
   */
  next(): number[] {
    const point = this.sobol.next();
    return this.owenScramble(point);
  }

  /**
   * Apply Owen scrambling to a point
   */
  private owenScramble(point: number[]): number[] {
    const scrambled: number[] = [];

    for (let d = 0; d < point.length; d++) {
      // Convert to binary representation
      const binary = this.toBinary(point[d]);

      // Apply nested uniform scrambling
      let scrambledBinary = '';
      let prefix = '';

      for (let bit of binary) {
        const permKey = `${d}-${prefix}`;
        const perm = this.getPermutation(permKey, 2);
        const scrambledBit = perm[parseInt(bit)];
        scrambledBinary += scrambledBit;
        prefix += bit;
      }

      // Convert back to [0,1)
      scrambled[d] = this.fromBinary(scrambledBinary);
    }

    return scrambled;
  }

  /**
   * Get or generate permutation for scrambling
   */
  private getPermutation(key: string, size: number): number[] {
    if (!this.permutations.has(key)) {
      // Generate random permutation
      const perm = Array.from({ length: size }, (_, i) => i);

      // Fisher-Yates shuffle
      for (let i = size - 1; i > 0; i--) {
        const j = this.scrambleRng.nextInt(i + 1);
        [perm[i], perm[j]] = [perm[j], perm[i]];
      }

      this.permutations.set(key, perm);
    }

    return this.permutations.get(key)!;
  }

  /**
   * Convert [0,1) to binary string (32 bits)
   */
  private toBinary(x: number): string {
    const intVal = Math.floor(x * 0x100000000);
    return intVal.toString(2).padStart(32, '0');
  }

  /**
   * Convert binary string to [0,1)
   */
  private fromBinary(binary: string): number {
    const intVal = parseInt(binary, 2);
    return intVal / 0x100000000;
  }

  /**
   * Reset scrambled sequence
   */
  reset(): void {
    this.sobol.reset();
    this.permutations.clear();
  }
}

/**
 * Utility to generate optimal sample sizes for QMC
 */
export class QMCSampleSizer {
  /**
   * Get next power of 2 (optimal for Sobol)
   */
  static getOptimalSize(minSamples: number): number {
    return Math.pow(2, Math.ceil(Math.log2(minSamples)));
  }

  /**
   * Get sample sizes for median-of-means estimation
   */
  static getMedianOfMeansSizes(
    totalBudget: number,
    numGroups: number = 30
  ): { groupSize: number; totalSize: number } {
    // Ensure divisibility and power of 2
    const groupSize = Math.pow(2, Math.ceil(Math.log2(totalBudget / numGroups)));
    const totalSize = groupSize * numGroups;

    return { groupSize, totalSize };
  }

  /**
   * Estimate required samples for target error
   */
  static estimateRequiredSamples(
    targetError: number,
    dimension: number,
    smoothness: number = 1
  ): number {
    // QMC convergence rate: O((log N)^d / N^s)
    // where s is smoothness parameter
    const base = Math.pow(targetError, -1 / smoothness);
    const logFactor = Math.pow(Math.log(base), dimension);

    return Math.ceil(base * logFactor);
  }
}