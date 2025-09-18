/**
 * Philox4x32-10 counter-based random number generator
 * Parallel-safe, reproducible, and stateless
 * Based on Random123 library
 */

export class PhiloxRNG {
  private readonly multipliers = [
    0xD2511F53, // Philox4x32-10 multiplier 1
    0xCD9E8D57  // Philox4x32-10 multiplier 2
  ];

  private key: Uint32Array;
  private counter: Uint32Array;
  private output: Uint32Array;
  private outputIndex: number;

  constructor(seed: string | number, streamId: number = 0, substream: number = 0) {
    // Initialize key from seed
    this.key = new Uint32Array(2);
    if (typeof seed === 'string') {
      const hash = this.hashString(seed);
      this.key[0] = hash & 0xFFFFFFFF;
      this.key[1] = (hash >>> 32) & 0xFFFFFFFF;
    } else {
      this.key[0] = seed & 0xFFFFFFFF;
      this.key[1] = (seed >>> 32) & 0xFFFFFFFF;
    }

    // Initialize counter with stream/substream for parallel safety
    this.counter = new Uint32Array([0, 0, streamId, substream]);
    this.output = new Uint32Array(4);
    this.outputIndex = 4;
  }

  /**
   * Get next random number in [0, 1)
   */
  next(): number {
    if (this.outputIndex >= 4) {
      this.generateNext();
      this.outputIndex = 0;
    }
    return this.output[this.outputIndex++] / 0x100000000;
  }

  /**
   * Get random integer in [0, max)
   */
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }

  /**
   * Normal distribution using Box-Muller (with guard)
   */
  normal(mean: number = 0, stdDev: number = 1): number {
    // Use two uniforms to generate one normal
    const u1 = Math.max(Number.EPSILON, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Jump ahead by 2^64 steps for independent streams
   */
  jump(): void {
    // Increment high 64 bits of counter
    this.counter[2]++;
    if (this.counter[2] === 0) {
      this.counter[3]++;
    }
    this.outputIndex = 4; // Force regeneration
  }

  /**
   * Split into independent substreams
   */
  split(): PhiloxRNG {
    const newRng = new PhiloxRNG(0);
    newRng.key[0] = this.key[0];
    newRng.key[1] = this.key[1];
    newRng.counter[0] = this.counter[0];
    newRng.counter[1] = this.counter[1];
    newRng.counter[2] = this.counter[2];
    newRng.counter[3] = this.counter[3] + 1;
    return newRng;
  }

  /**
   * Get state for persistence/debugging
   */
  getState(): RNGState {
    return {
      key: Array.from(this.key),
      counter: Array.from(this.counter),
      outputIndex: this.outputIndex
    };
  }

  /**
   * Restore from saved state
   */
  setState(state: RNGState): void {
    this.key = new Uint32Array(state.key);
    this.counter = new Uint32Array(state.counter);
    this.outputIndex = state.outputIndex;
    if (this.outputIndex >= 4) {
      this.generateNext();
    }
  }

  /**
   * Core Philox4x32-10 round function
   */
  private generateNext(): void {
    // Copy counter to work array
    let ctr0 = this.counter[0];
    let ctr1 = this.counter[1];
    let ctr2 = this.counter[2];
    let ctr3 = this.counter[3];

    // Copy key
    let key0 = this.key[0];
    let key1 = this.key[1];

    // 10 rounds of Philox
    for (let round = 0; round < 10; round++) {
      // Update key for this round
      key0 += 0x9E3779B9; // Golden ratio
      key1 += 0xBB67AE85; // Another constant

      // Philox round function
      const mul0 = this.multiplyHighLow(this.multipliers[0], ctr0);
      const mul1 = this.multiplyHighLow(this.multipliers[1], ctr2);

      ctr0 = mul1.high ^ ctr1 ^ key0;
      ctr1 = mul1.low;
      ctr2 = mul0.high ^ ctr3 ^ key1;
      ctr3 = mul0.low;
    }

    // Store output
    this.output[0] = ctr0;
    this.output[1] = ctr1;
    this.output[2] = ctr2;
    this.output[3] = ctr3;

    // Increment counter for next block
    this.incrementCounter();
  }

  /**
   * 32-bit multiply returning high and low parts
   */
  private multiplyHighLow(a: number, b: number): { high: number; low: number } {
    // Convert to unsigned 32-bit
    a = a >>> 0;
    b = b >>> 0;

    // Split into 16-bit parts
    const aLow = a & 0xFFFF;
    const aHigh = a >>> 16;
    const bLow = b & 0xFFFF;
    const bHigh = b >>> 16;

    // Multiply parts
    const lowLow = aLow * bLow;
    const highLow = aHigh * bLow;
    const lowHigh = aLow * bHigh;
    const highHigh = aHigh * bHigh;

    // Combine results
    const cross = highLow + lowHigh;
    const low = (lowLow + (cross << 16)) >>> 0;
    const high = (highHigh + (cross >>> 16) + (low < lowLow ? 1 : 0)) >>> 0;

    return { high, low };
  }

  /**
   * Increment 128-bit counter
   */
  private incrementCounter(): void {
    this.counter[0]++;
    if (this.counter[0] === 0) {
      this.counter[1]++;
      if (this.counter[1] === 0) {
        this.counter[2]++;
        if (this.counter[2] === 0) {
          this.counter[3]++;
        }
      }
    }
  }

  /**
   * Simple string hash for seed conversion
   */
  private hashString(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return hash >>> 0;
  }
}

/**
 * Factory for creating independent RNG streams
 */
export class PhiloxStreamFactory {
  private baseKey: Uint32Array;
  private nextStreamId: number = 0;

  constructor(masterSeed: string | number) {
    const rng = new PhiloxRNG(masterSeed);
    this.baseKey = new Uint32Array([
      rng.nextInt(0xFFFFFFFF),
      rng.nextInt(0xFFFFFFFF)
    ]);
  }

  /**
   * Create a new independent stream
   */
  createStream(workerId?: string): PhiloxRNG {
    const streamId = this.nextStreamId++;
    const seed = workerId ?
      `${this.baseKey[0]}-${this.baseKey[1]}-${workerId}` :
      (this.baseKey[0] ^ (streamId * 0x9E3779B9));

    return new PhiloxRNG(seed, streamId, 0);
  }

  /**
   * Create a batch of independent streams for parallel workers
   */
  createStreams(count: number): PhiloxRNG[] {
    const streams: PhiloxRNG[] = [];
    for (let i = 0; i < count; i++) {
      streams.push(this.createStream());
    }
    return streams;
  }
}

// Type definitions
interface RNGState {
  key: number[];
  counter: number[];
  outputIndex: number;
}