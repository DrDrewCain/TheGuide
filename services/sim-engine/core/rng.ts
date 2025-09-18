/**
 * Seedable random number generator for reproducible simulations
 */

export interface RNG {
  next(): number;
  normal(mean?: number, stdDev?: number): number;
  uniform(min: number, max: number): number;
}

export class SeededRNG implements RNG {
  private seed: number;

  constructor(seed: string | number) {
    this.seed = typeof seed === 'string'
      ? this.hashString(seed)
      : seed;
  }

  // Linear congruential generator (simple, fast, reproducible)
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  // Normal distribution using Box-Muller (with guard)
  normal(mean: number = 0, stdDev: number = 1): number {
    const u1 = Math.max(Number.EPSILON, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  // Uniform distribution
  uniform(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}