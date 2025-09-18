/**
 * Vine Copula implementation for modeling complex dependencies
 * Captures non-Gaussian and tail dependencies between economic variables
 */

import { PhiloxRNG } from './philox-rng';

export class VineCopula {
  private tree: VineTree;
  private copulas: Map<string, BivariateCopula>;
  private rng: PhiloxRNG;

  constructor() {
    this.tree = { dimension: 0, variables: [], levels: [] };
    this.copulas = new Map();
    this.rng = new PhiloxRNG('vine-copula');
  }

  /**
   * Fit vine copula to historical data
   */
  fit(data: { [key: string]: number[] }): void {
    console.log('[VineCopula] fit called with data keys:', Object.keys(data));
    console.log('[VineCopula] data sample:', {
      wageGrowth: data.wageGrowth?.slice(0, 3),
      inflation: data.inflation?.slice(0, 3),
      assetReturns: data.assetReturns?.slice(0, 3),
      unemployment: data.unemployment?.slice(0, 3)
    });

    const variables = Object.keys(data);
    const n = variables.length;

    // Convert to uniform margins using empirical CDF
    const uniformData = this.toUniformMargins(data);

    // Build vine structure using maximum spanning tree
    this.tree = this.buildVineStructure(uniformData, variables);

    // Fit bivariate copulas for each edge
    this.fitBivariateCopulas(uniformData);
  }

  /**
   * Transform uniform random variables through vine copula
   */
  transform(uniform: number[]): number[] {
    return this.vineTransform(uniform);
  }

  /**
   * Simulate from fitted vine copula
   */
  simulate(n: number): number[][] {
    const samples: number[][] = [];

    for (let i = 0; i < n; i++) {
      // Generate independent uniforms
      const independent = Array(this.tree.dimension)
        .fill(0)
        .map(() => this.rng.next());

      // Transform through vine
      const dependent = this.vineTransform(independent);
      samples.push(dependent);
    }

    return samples;
  }

  /**
   * Convert data to uniform margins using empirical CDF
   */
  private toUniformMargins(data: { [key: string]: number[] }): UniformData {
    const uniform: UniformData = {};

    for (const [variable, values] of Object.entries(data)) {
      const sorted = [...values].sort((a, b) => a - b);
      const n = values.length;

      uniform[variable] = values.map(v => {
        const rank = sorted.findIndex(x => x >= v) + 1;
        return rank / (n + 1); // Avoid 0 and 1
      });
    }

    return uniform;
  }

  /**
   * Build vine structure using Dissmann et al. algorithm
   */
  private buildVineStructure(
    data: UniformData,
    variables: string[]
  ): VineTree {
    console.log('[VineCopula] Building vine structure with variables:', variables);
    console.log('[VineCopula] Data structure:', Object.keys(data));
    console.log('[VineCopula] Data lengths:', Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, Array.isArray(v) ? v.length : 'not array'])
    ));

    const n = variables.length;
    const tree: VineTree = {
      dimension: n,
      variables: variables,
      levels: []
    };

    // Level 1: Build maximum spanning tree based on Kendall's tau
    const edges: Edge[] = [];
    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const var1 = variables[i];
        const var2 = variables[j];

        if (!data[var1] || !data[var2]) {
          console.error(`[VineCopula] Missing data for ${var1} or ${var2}`);
          continue;
        }

        const tau = this.kendallsTau(
          data[var1],
          data[var2]
        );
        edges.push({
          node1: var1,
          node2: var2,
          weight: Math.abs(tau),
          tau
        });
      }
    }

    // Sort by absolute tau (strongest dependencies first)
    edges.sort((a, b) => b.weight - a.weight);

    // Build maximum spanning tree using Kruskal's algorithm
    const level1 = this.kruskal(edges, n);
    console.log(`[VineCopula] Level 1 edges built: ${level1.length} edges`);
    tree.levels.push(level1);

    // Higher levels: Sequential tree construction
    for (let level = 2; level < n; level++) {
      console.log(`[VineCopula] Building tree level ${level}, prevLevel: ${level - 1}`);
      console.log(`[VineCopula] Current tree levels length: ${tree.levels.length}`);
      const nextLevel = this.buildNextTreeLevel(tree, level - 1, data);
      if (nextLevel.length === 0) break;
      tree.levels.push(nextLevel);
    }

    return tree;
  }

  /**
   * Kruskal's algorithm for maximum spanning tree
   */
  private kruskal(edges: Edge[], n: number): Edge[] {
    const parent = new Map<string, string>();
    const mst: Edge[] = [];

    // Initialize union-find
    const find = (x: string): string => {
      if (!parent.has(x)) parent.set(x, x);
      if (parent.get(x) !== x) {
        parent.set(x, find(parent.get(x)!));
      }
      return parent.get(x)!;
    };

    const union = (x: string, y: string): boolean => {
      const px = find(x);
      const py = find(y);
      if (px === py) return false;
      parent.set(px, py);
      return true;
    };

    // Add edges in decreasing order of weight
    for (const edge of edges) {
      if (union(edge.node1, edge.node2)) {
        mst.push(edge);
        if (mst.length === n - 1) break;
      }
    }

    return mst;
  }

  /**
   * Build next level of vine tree
   */
  private buildNextTreeLevel(
    tree: VineTree,
    prevLevel: number,
    data: UniformData
  ): Edge[] {
    // Safety check: ensure previous level exists
    if (!tree.levels[prevLevel] || tree.levels[prevLevel].length === 0) {
      console.log(`[VineCopula] No edges at level ${prevLevel}, cannot build next level`);
      return [];
    }

    const prevEdges = tree.levels[prevLevel];
    const edges: Edge[] = [];

    // Find edges that share a node in previous level
    for (let i = 0; i < prevEdges.length - 1; i++) {
      for (let j = i + 1; j < prevEdges.length; j++) {
        const shared = this.getSharedNode(prevEdges[i], prevEdges[j]);
        if (shared) {
          // Compute conditional data
          const cond1 = this.computeConditional(prevEdges[i], data, tree);
          const cond2 = this.computeConditional(prevEdges[j], data, tree);

          const tau = this.kendallsTau(cond1, cond2);
          edges.push({
            node1: `${prevEdges[i].node1}|${prevEdges[i].node2}`,
            node2: `${prevEdges[j].node1}|${prevEdges[j].node2}`,
            weight: Math.abs(tau),
            tau,
            conditioning: shared
          });
        }
      }
    }

    return this.kruskal(edges, edges.length);
  }

  /**
   * Get shared node between two edges
   */
  private getSharedNode(edge1: Edge, edge2: Edge): string | null {
    if (edge1.node1 === edge2.node1 || edge1.node1 === edge2.node2) return edge1.node1;
    if (edge1.node2 === edge2.node1 || edge1.node2 === edge2.node2) return edge1.node2;
    return null;
  }

  /**
   * Compute conditional data for vine construction
   */
  private computeConditional(
    edge: Edge,
    data: UniformData,
    tree: VineTree
  ): number[] {
    // Simplified: return pseudo-observations
    // In practice, use h-functions for conditioning
    return data[edge.node1.split('|')[0]];
  }

  /**
   * Fit bivariate copulas for each edge
   */
  private fitBivariateCopulas(data: UniformData): void {
    for (const level of this.tree.levels) {
      for (const edge of level) {
        // Select copula family based on dependence pattern
        const copulaFamily = this.selectCopulaFamily(edge.tau!);

        // Fit parameters
        const copula = this.fitBivariateCopula(
          copulaFamily,
          data[edge.node1.split('|')[0]],
          data[edge.node2.split('|')[0]]
        );

        this.copulas.set(`${edge.node1}-${edge.node2}`, copula);
      }
    }
  }

  /**
   * Select appropriate copula family based on tau
   */
  private selectCopulaFamily(tau: number): CopulaFamily {
    const absTau = Math.abs(tau);

    if (absTau < 0.1) return 'gaussian';
    if (tau > 0.5) return 'clayton'; // Lower tail dependence
    if (tau < -0.3) return 'gumbel'; // Upper tail dependence
    return 't'; // Symmetric tail dependence
  }

  /**
   * Fit bivariate copula parameters
   */
  private fitBivariateCopula(
    family: CopulaFamily,
    u: number[],
    v: number[]
  ): BivariateCopula {
    const tau = this.kendallsTau(u, v);

    switch (family) {
      case 'gaussian':
        return new GaussianCopula(this.tauToRho(tau));

      case 'clayton':
        return new ClaytonCopula(this.tauToClaytonTheta(tau));

      case 'gumbel':
        return new GumbelCopula(this.tauToGumbelTheta(tau));

      case 't':
        const rho = this.tauToRho(tau);
        const nu = this.estimateTDegrees(u, v, rho);
        return new TCopula(rho, nu);

      default:
        return new GaussianCopula(this.tauToRho(tau));
    }
  }

  /**
   * Transform independent uniforms through vine
   */
  private vineTransform(independent: number[]): number[] {
    const n = independent.length;
    const v = [...independent]; // Working array
    const result = new Array(n);

    // R-vine transformation algorithm
    result[0] = v[0];

    for (let i = 1; i < n; i++) {
      result[i] = v[i];

      // Apply conditional transformations
      for (let k = i - 1; k >= 0; k--) {
        const edge = this.findEdge(k, i);
        const copula = this.copulas.get(edge);

        if (copula) {
          v[i] = copula.conditional(v[i], v[k]);
        }
      }
    }

    return result;
  }

  /**
   * Find edge identifier in vine structure
   */
  private findEdge(i: number, j: number): string {
    // Simplified for demonstration
    const var1 = this.tree.variables[i];
    const var2 = this.tree.variables[j];
    return `${var1}-${var2}`;
  }

  /**
   * Kendall's tau rank correlation
   */
  private kendallsTau(x: number[], y: number[]): number {
    const n = x.length;
    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = x[i] - x[j];
        const dy = y[i] - y[j];

        if (dx * dy > 0) concordant++;
        else if (dx * dy < 0) discordant++;
      }
    }

    return (concordant - discordant) / (n * (n - 1) / 2);
  }

  // Parameter conversion methods
  private tauToRho(tau: number): number {
    return Math.sin(Math.PI * tau / 2);
  }

  private tauToClaytonTheta(tau: number): number {
    return 2 * tau / (1 - tau);
  }

  private tauToGumbelTheta(tau: number): number {
    return 1 / (1 - tau);
  }

  private estimateTDegrees(u: number[], v: number[], rho: number): number {
    // Simplified: use fixed degrees of freedom
    // In practice, use maximum likelihood
    return 5;
  }
}

/**
 * Base class for bivariate copulas
 */
abstract class BivariateCopula {
  abstract cdf(u: number, v: number): number;
  abstract pdf(u: number, v: number): number;
  abstract conditional(u: number, v: number): number;
  abstract simulate(n: number, rng: PhiloxRNG): [number[], number[]];
}

/**
 * Gaussian copula
 */
class GaussianCopula extends BivariateCopula {
  constructor(private rho: number) {
    super();
  }

  cdf(u: number, v: number): number {
    const x = this.quantileNormal(u);
    const y = this.quantileNormal(v);
    return this.bivariateNormalCDF(x, y, this.rho);
  }

  pdf(u: number, v: number): number {
    const x = this.quantileNormal(u);
    const y = this.quantileNormal(v);
    const factor = Math.sqrt(1 - this.rho * this.rho);

    return Math.exp(
      -(x * x - 2 * this.rho * x * y + y * y) / (2 * factor * factor)
    ) / (2 * Math.PI * factor);
  }

  conditional(u: number, v: number): number {
    const x = this.quantileNormal(u);
    const y = this.quantileNormal(v);
    const z = (x - this.rho * y) / Math.sqrt(1 - this.rho * this.rho);
    return this.cdfNormal(z);
  }

  simulate(n: number, rng: PhiloxRNG): [number[], number[]] {
    const u: number[] = [];
    const v: number[] = [];

    for (let i = 0; i < n; i++) {
      const z1 = rng.normal();
      const z2 = this.rho * z1 + Math.sqrt(1 - this.rho * this.rho) * rng.normal();

      u.push(this.cdfNormal(z1));
      v.push(this.cdfNormal(z2));
    }

    return [u, v];
  }

  private quantileNormal(p: number): number {
    // Use inverse normal CDF
    return this.inverseNormalCDF(p);
  }

  private cdfNormal(x: number): number {
    // Standard normal CDF using error function
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private bivariateNormalCDF(x: number, y: number, rho: number): number {
    // Drezner-Wesolowsky approximation
    const a1 = 0.3253030;
    const a2 = 0.4211071;
    const a3 = 0.1334425;
    const a4 = 0.006374323;

    const h = x;
    const k = y;
    const hk = h * k;

    if (Math.abs(rho) < 0.3) {
      const sum = a1 * Math.exp(-0.5 * (h * h + k * k) / (1 + rho)) +
        a2 * Math.exp(-0.5 * (h * h + k * k) / (1 + 2 * rho)) +
        a3 * Math.exp(-0.5 * (h * h + k * k) / (1 + 3 * rho)) +
        a4 * Math.exp(-0.5 * (h * h + k * k) / (1 + 4 * rho));

      return this.cdfNormal(h) * this.cdfNormal(k) + rho * sum;
    }

    // For larger rho, use different approximation
    const r = rho;
    const rr = 1 - r * r;
    const sqrr = Math.sqrt(rr);

    return this.cdfNormal(h) * this.cdfNormal(k) +
      (1 / (2 * Math.PI)) * sqrr *
      Math.exp(-(h * h - 2 * r * h * k + k * k) / (2 * rr));
  }

  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private inverseNormalCDF(p: number): number {
    // Acklam's algorithm (same as in QMC engine)
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

/**
 * Clayton copula (lower tail dependence)
 */
class ClaytonCopula extends BivariateCopula {
  constructor(private theta: number) {
    super();
  }

  cdf(u: number, v: number): number {
    return Math.pow(
      Math.pow(u, -this.theta) + Math.pow(v, -this.theta) - 1,
      -1 / this.theta
    );
  }

  pdf(u: number, v: number): number {
    const factor = (1 + this.theta) *
      Math.pow(u * v, -this.theta - 1) *
      Math.pow(
        Math.pow(u, -this.theta) + Math.pow(v, -this.theta) - 1,
        -2 - 1 / this.theta
      );
    return factor;
  }

  conditional(u: number, v: number): number {
    return Math.pow(
      1 + Math.pow(u, -this.theta) * (Math.pow(v, -this.theta) - 1),
      -1 - 1 / this.theta
    );
  }

  simulate(n: number, rng: PhiloxRNG): [number[], number[]] {
    const u: number[] = [];
    const v: number[] = [];

    for (let i = 0; i < n; i++) {
      const u1 = rng.next();
      const u2 = rng.next();

      u.push(u1);
      v.push(Math.pow(
        Math.pow(u2, -this.theta / (1 + this.theta)) *
        (Math.pow(u1, this.theta) - 1) + 1,
        -1 / this.theta
      ));
    }

    return [u, v];
  }
}

/**
 * Gumbel copula (upper tail dependence)
 */
class GumbelCopula extends BivariateCopula {
  constructor(private theta: number) {
    super();
  }

  cdf(u: number, v: number): number {
    return Math.exp(-Math.pow(
      Math.pow(-Math.log(u), this.theta) +
      Math.pow(-Math.log(v), this.theta),
      1 / this.theta
    ));
  }

  pdf(u: number, v: number): number {
    const logu = -Math.log(u);
    const logv = -Math.log(v);
    const sum = Math.pow(logu, this.theta) + Math.pow(logv, this.theta);
    const A = Math.pow(sum, 1 / this.theta);

    const factor1 = this.cdf(u, v) * Math.pow(logu * logv, this.theta - 1) / (u * v);
    const factor2 = Math.pow(A, -this.theta) / sum;
    const factor3 = (this.theta - 1 + A);

    return factor1 * factor2 * factor3;
  }

  conditional(u: number, v: number): number {
    const logu = -Math.log(u);
    const logv = -Math.log(v);
    const sum = Math.pow(logu, this.theta) + Math.pow(logv, this.theta);

    return this.cdf(u, v) * Math.pow(logv / v, this.theta - 1) *
      Math.pow(sum, 1 / this.theta - 1);
  }

  simulate(n: number, rng: PhiloxRNG): [number[], number[]] {
    const u: number[] = [];
    const v: number[] = [];

    for (let i = 0; i < n; i++) {
      // Use Archimedean copula simulation
      const w = rng.next();
      const t = this.inverseGenerator(w);

      const u1 = rng.next();
      const u2 = rng.next();

      u.push(this.generator(u1 * t));
      v.push(this.generator(u2 * t));
    }

    return [u, v];
  }

  private generator(t: number): number {
    return Math.exp(-Math.pow(t, 1 / this.theta));
  }

  private inverseGenerator(u: number): number {
    return Math.pow(-Math.log(u), this.theta);
  }
}

/**
 * Student's t copula (symmetric tail dependence)
 */
class TCopula extends BivariateCopula {
  constructor(private rho: number, private nu: number) {
    super();
  }

  cdf(u: number, v: number): number {
    // Numerical integration required
    // Simplified implementation
    const x = this.quantileT(u, this.nu);
    const y = this.quantileT(v, this.nu);
    return this.bivariateT(x, y, this.rho, this.nu);
  }

  pdf(u: number, v: number): number {
    const x = this.quantileT(u, this.nu);
    const y = this.quantileT(v, this.nu);

    const factor1 = 1 / Math.sqrt(1 - this.rho * this.rho);
    const factor2 = this.gamma((this.nu + 2) / 2) / this.gamma(this.nu / 2);
    const factor3 = Math.pow(this.nu * Math.PI, -1);

    const Q = (x * x - 2 * this.rho * x * y + y * y) / (1 - this.rho * this.rho);
    const factor4 = Math.pow(1 + Q / this.nu, -(this.nu + 2) / 2);

    return factor1 * factor2 * factor3 * factor4 /
      (this.pdfT(x, this.nu) * this.pdfT(y, this.nu));
  }

  conditional(u: number, v: number): number {
    const x = this.quantileT(u, this.nu);
    const y = this.quantileT(v, this.nu);

    const z = Math.sqrt((this.nu + y * y) / (this.nu + 1)) *
      (x - this.rho * y) / Math.sqrt(1 - this.rho * this.rho);

    return this.cdfT(z, this.nu + 1);
  }

  simulate(n: number, rng: PhiloxRNG): [number[], number[]] {
    const u: number[] = [];
    const v: number[] = [];

    for (let i = 0; i < n; i++) {
      // Generate chi-squared
      const w = this.chiSquared(this.nu, rng) / this.nu;

      // Generate bivariate normal
      const z1 = rng.normal();
      const z2 = this.rho * z1 + Math.sqrt(1 - this.rho * this.rho) * rng.normal();

      // Transform to t
      const x = z1 / Math.sqrt(w);
      const y = z2 / Math.sqrt(w);

      u.push(this.cdfT(x, this.nu));
      v.push(this.cdfT(y, this.nu));
    }

    return [u, v];
  }

  private quantileT(p: number, df: number): number {
    // Simplified: use normal approximation for large df
    if (df > 30) {
      return this.inverseNormalCDF(p);
    }

    // Newton-Raphson for small df
    let x = this.inverseNormalCDF(p);
    const tol = 1e-8;

    for (let i = 0; i < 20; i++) {
      const f = this.cdfT(x, df) - p;
      const fprime = this.pdfT(x, df);
      const delta = f / fprime;

      x -= delta;
      if (Math.abs(delta) < tol) break;
    }

    return x;
  }

  private cdfT(x: number, df: number): number {
    // Simplified implementation
    const z = x / Math.sqrt(df);
    const p = 0.5 + 0.5 * this.sign(x) * this.incompleteBeta(
      z * z / (z * z + 1),
      0.5,
      df / 2
    );
    return p;
  }

  private pdfT(x: number, df: number): number {
    const factor1 = this.gamma((df + 1) / 2) /
      (Math.sqrt(df * Math.PI) * this.gamma(df / 2));
    const factor2 = Math.pow(1 + x * x / df, -(df + 1) / 2);
    return factor1 * factor2;
  }

  private bivariateT(x: number, y: number, rho: number, nu: number): number {
    // Numerical integration - simplified
    // In practice, use adaptive quadrature
    return 0.5; // Placeholder
  }

  private chiSquared(df: number, rng: PhiloxRNG): number {
    // Sum of squared normals
    let sum = 0;
    for (let i = 0; i < df; i++) {
      const z = rng.normal();
      sum += z * z;
    }
    return sum;
  }

  private gamma(x: number): number {
    // Lanczos approximation
    return Math.exp(this.logGamma(x));
  }

  private logGamma(x: number): number {
    const g = 7;
    const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];

    if (x < 0.5) {
      return Math.log(Math.PI) - Math.log(Math.sin(Math.PI * x)) - this.logGamma(1 - x);
    }

    x -= 1;
    let ag = c[0];
    for (let i = 1; i < g + 2; i++) {
      ag += c[i] / (x + i);
    }

    const t = x + g + 0.5;
    return Math.sqrt(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(ag);
  }

  private incompleteBeta(x: number, a: number, b: number): number {
    // Continued fraction expansion
    if (x <= 0) return 0;
    if (x >= 1) return 1;

    const bt = Math.exp(
      this.logGamma(a + b) - this.logGamma(a) - this.logGamma(b) +
      a * Math.log(x) + b * Math.log(1 - x)
    );

    if (x < (a + 1) / (a + b + 2)) {
      return bt * this.betaContinuedFraction(x, a, b) / a;
    } else {
      return 1 - bt * this.betaContinuedFraction(1 - x, b, a) / b;
    }
  }

  private betaContinuedFraction(x: number, a: number, b: number): number {
    const maxIter = 100;
    const epsilon = 3e-10;

    const qab = a + b;
    const qap = a + 1;
    const qam = a - 1;

    let c = 1;
    let d = 1 - qab * x / qap;

    if (Math.abs(d) < epsilon) d = epsilon;
    d = 1 / d;
    let h = d;

    for (let m = 1; m <= maxIter; m++) {
      const m2 = 2 * m;

      let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < epsilon) d = epsilon;
      c = 1 + aa / c;
      if (Math.abs(c) < epsilon) c = epsilon;
      d = 1 / d;
      h *= d * c;

      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < epsilon) d = epsilon;
      c = 1 + aa / c;
      if (Math.abs(c) < epsilon) c = epsilon;
      d = 1 / d;
      const del = d * c;
      h *= del;

      if (Math.abs(del - 1) < epsilon) break;
    }

    return h;
  }

  private sign(x: number): number {
    return x >= 0 ? 1 : -1;
  }

  private inverseNormalCDF(p: number): number {
    // Same as in GaussianCopula
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
interface VineTree {
  dimension: number;
  variables: string[];
  levels: Edge[][];
}

interface Edge {
  node1: string;
  node2: string;
  weight: number;
  tau?: number;
  conditioning?: string;
}

type UniformData = { [key: string]: number[] };

type CopulaFamily = 'gaussian' | 'clayton' | 'gumbel' | 't';