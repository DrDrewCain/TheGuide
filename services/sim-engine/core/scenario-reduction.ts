/**
 * Scenario reduction using Wasserstein distance
 * Reduces large scenario sets while preserving distributional properties
 */

import { Scenario } from '@theguide/models';

export class ScenarioReducer {
  /**
   * Reduce scenarios using Wasserstein distance-based clustering
   */
  reduceScenarios(
    scenarios: Scenario[],
    targetCount: number,
    weights?: number[]
  ): ReducedScenarioSet {
    const n = scenarios.length;

    // Initialize weights if not provided
    if (!weights) {
      weights = new Array(n).fill(1 / n);
    }

    // Compute pairwise Wasserstein distances
    const distances = this.computeWassersteinDistances(scenarios);

    // Use fast scenario reduction algorithm (Heitsch & Römisch)
    const { selectedIndices, newWeights } = this.fastReduction(
      distances,
      weights,
      targetCount
    );

    // Extract reduced scenarios
    const reducedScenarios = selectedIndices.map(i => scenarios[i]);

    return {
      scenarios: reducedScenarios,
      weights: newWeights,
      originalCount: n,
      reducedCount: targetCount,
      preservedMass: newWeights.reduce((sum, w) => sum + w, 0),
      maxTransportCost: this.computeMaxTransportCost(
        distances,
        selectedIndices,
        weights
      )
    };
  }

  /**
   * Compute pairwise 2-Wasserstein distances between scenarios
   */
  private computeWassersteinDistances(scenarios: Scenario[]): number[][] {
    const n = scenarios.length;
    const distances: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dist = this.wassersteinDistance(scenarios[i], scenarios[j]);
        distances[i][j] = dist;
        distances[j][i] = dist;
      }
    }

    return distances;
  }

  /**
   * Fast forward selection algorithm for scenario reduction
   */
  private fastReduction(
    distances: number[][],
    weights: number[],
    targetCount: number
  ): { selectedIndices: number[]; newWeights: number[] } {
    const n = distances.length;
    const selected = new Set<number>();
    const newWeights = new Array(targetCount).fill(0);

    // Initialize with scenario having highest weight
    let firstScenario = 0;
    let maxWeight = weights[0];
    for (let i = 1; i < n; i++) {
      if (weights[i] > maxWeight) {
        maxWeight = weights[i];
        firstScenario = i;
      }
    }
    selected.add(firstScenario);
    newWeights[0] = weights[firstScenario];

    // Iteratively add scenarios that minimize Kantorovich distance
    while (selected.size < targetCount) {
      let bestCandidate = -1;
      let minCost = Infinity;

      // Evaluate each non-selected scenario
      for (let i = 0; i < n; i++) {
        if (selected.has(i)) continue;

        // Compute cost of adding scenario i
        let cost = 0;
        for (let j = 0; j < n; j++) {
          if (selected.has(j)) continue;

          // Find closest selected scenario
          let minDist = Infinity;
          selected.forEach(s => {
            minDist = Math.min(minDist, distances[j][s]);
          });
          minDist = Math.min(minDist, distances[j][i]);

          cost += weights[j] * minDist;
        }

        if (cost < minCost) {
          minCost = cost;
          bestCandidate = i;
        }
      }

      selected.add(bestCandidate);
    }

    // Redistribute weights using optimal transport
    const selectedArray = Array.from(selected);
    this.redistributeWeights(
      distances,
      weights,
      selectedArray,
      newWeights
    );

    return {
      selectedIndices: selectedArray,
      newWeights
    };
  }

  /**
   * Redistribute weights from deleted to preserved scenarios
   */
  private redistributeWeights(
    distances: number[][],
    originalWeights: number[],
    selectedIndices: number[],
    newWeights: number[]
  ): void {
    const n = distances.length;
    const selected = new Set(selectedIndices);

    // Initialize new weights with original weights of selected scenarios
    selectedIndices.forEach((idx, i) => {
      newWeights[i] = originalWeights[idx];
    });

    // Redistribute weight from deleted scenarios
    for (let i = 0; i < n; i++) {
      if (selected.has(i)) continue;

      // Find closest selected scenario
      let closestIdx = -1;
      let minDist = Infinity;

      selectedIndices.forEach((idx, j) => {
        if (distances[i][idx] < minDist) {
          minDist = distances[i][idx];
          closestIdx = j;
        }
      });

      // Transfer weight
      newWeights[closestIdx] += originalWeights[i];
    }
  }

  /**
   * Compute Wasserstein distance between two scenarios
   */
  private wassersteinDistance(s1: Scenario, s2: Scenario): number {
    // For multivariate scenarios, use sum of squared differences
    // This is equivalent to 2-Wasserstein for Gaussian measures

    let distance = 0;

    // Financial outcomes
    const horizons: ('year1' | 'year3' | 'year5' | 'year10')[] = ['year1', 'year3', 'year5', 'year10'];
    for (const horizon of horizons) {
      const outcome1 = s1.outcomes[horizon];
      const outcome2 = s2.outcomes[horizon];

      // Financial metrics
      distance += Math.pow(
        outcome1.financialPosition.netWorth - outcome2.financialPosition.netWorth,
        2
      ) / 1e10; // Normalize by typical scale

      distance += Math.pow(
        outcome1.financialPosition.income - outcome2.financialPosition.income,
        2
      ) / 1e8;

      // Career metrics
      distance += Math.pow(
        outcome1.careerProgress.jobSatisfaction - outcome2.careerProgress.jobSatisfaction,
        2
      );

      // Life metrics
      distance += Math.pow(
        outcome1.lifeMetrics.overallHappiness - outcome2.lifeMetrics.overallHappiness,
        2
      );
    }

    // Economic conditions
    distance += Math.pow(
      s1.economicConditions.gdpGrowth - s2.economicConditions.gdpGrowth,
      2
    ) * 0.1;

    distance += Math.pow(
      s1.economicConditions.inflationRate - s2.economicConditions.inflationRate,
      2
    ) * 0.1;

    return Math.sqrt(distance);
  }

  /**
   * Compute maximum transport cost for quality assessment
   */
  private computeMaxTransportCost(
    distances: number[][],
    selectedIndices: number[],
    originalWeights: number[]
  ): number {
    const n = distances.length;
    const selected = new Set(selectedIndices);
    let maxCost = 0;

    for (let i = 0; i < n; i++) {
      if (selected.has(i)) continue;

      // Find closest selected scenario
      let minDist = Infinity;
      selectedIndices.forEach(idx => {
        minDist = Math.min(minDist, distances[i][idx]);
      });

      maxCost = Math.max(maxCost, originalWeights[i] * minDist);
    }

    return maxCost;
  }

  /**
   * Nested distance reduction for multi-stage scenarios
   */
  reduceMultistageScenarios(
    scenarios: MultistageScenario[],
    targetCount: number,
    stages: number,
    reconstructor?: (path: number[][], probability: number) => Scenario
  ): ReducedScenarioSet {
    // Build scenario tree
    const tree = this.buildScenarioTree(scenarios, stages);

    // Apply nested distance algorithm
    const reducedTree = this.nestedDistanceReduction(tree, targetCount);

    // Extract scenarios from reduced tree
    const reducedScenarios = this.extractScenariosFromTree(
      reducedTree,
      reconstructor || this.createDefaultReconstructor(scenarios[0])
    );

    return {
      scenarios: reducedScenarios,
      weights: reducedScenarios.map(s => s.probability),
      originalCount: scenarios.length,
      reducedCount: reducedScenarios.length,
      preservedMass: reducedScenarios.reduce((sum, s) => sum + s.probability, 0),
      maxTransportCost: 0 // TODO: Compute for trees
    };
  }

  /**
   * Build scenario tree from path scenarios
   */
  private buildScenarioTree(
    scenarios: MultistageScenario[],
    stages: number
  ): ScenarioTree {
    const root: TreeNode = {
      stage: 0,
      value: null,
      probability: 1,
      children: []
    };

    // Group scenarios by common history
    for (const scenario of scenarios) {
      let currentNode = root;

      for (let stage = 1; stage <= stages; stage++) {
        const stageValue = scenario.values[stage - 1];

        // Find or create child node
        let childNode = currentNode.children.find(
          child => this.valuesEqual(child.value, stageValue)
        );

        if (!childNode) {
          childNode = {
            stage,
            value: stageValue,
            probability: 0,
            children: []
          };
          currentNode.children.push(childNode);
        }

        childNode.probability += scenario.probability / scenarios.length;
        currentNode = childNode;
      }
    }

    return { root, stages };
  }

  /**
   * Apply nested distance reduction to scenario tree
   */
  private nestedDistanceReduction(
    tree: ScenarioTree,
    targetCount: number
  ): ScenarioTree {
    // Backward recursion through tree stages
    for (let stage = tree.stages; stage >= 1; stage--) {
      const nodes = this.getNodesAtStage(tree.root, stage);

      // Reduce nodes at this stage
      if (nodes.length > targetCount / Math.pow(2, tree.stages - stage)) {
        this.reduceStageNodes(nodes, targetCount / Math.pow(2, tree.stages - stage));
      }
    }

    return tree;
  }

  /**
   * Get all nodes at a specific stage
   */
  private getNodesAtStage(root: TreeNode, targetStage: number): TreeNode[] {
    const nodes: TreeNode[] = [];

    const traverse = (node: TreeNode) => {
      if (node.stage === targetStage) {
        nodes.push(node);
      } else if (node.stage < targetStage) {
        node.children.forEach(child => traverse(child));
      }
    };

    traverse(root);
    return nodes;
  }

  /**
   * Reduce nodes at a stage by merging similar ones
   */
  private reduceStageNodes(nodes: TreeNode[], targetCount: number): void {
    // Compute distances between nodes
    const distances: number[][] = Array(nodes.length)
      .fill(null)
      .map(() => Array(nodes.length).fill(0));

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = this.nodeDistance(nodes[i], nodes[j]);
        distances[i][j] = dist;
        distances[j][i] = dist;
      }
    }

    // Merge closest nodes until target count reached
    while (nodes.length > targetCount) {
      // Find closest pair
      let minDist = Infinity;
      let mergeI = -1;
      let mergeJ = -1;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (distances[i][j] < minDist) {
            minDist = distances[i][j];
            mergeI = i;
            mergeJ = j;
          }
        }
      }

      // Merge nodes
      this.mergeNodes(nodes[mergeI], nodes[mergeJ]);
      nodes.splice(mergeJ, 1);

      // Update distance matrix
      distances.splice(mergeJ, 1);
      for (let i = 0; i < distances.length; i++) {
        distances[i].splice(mergeJ, 1);
      }
    }
  }

  /**
   * Compute distance between tree nodes
   */
  private nodeDistance(node1: TreeNode, node2: TreeNode): number {
    if (!node1.value || !node2.value) return 0;

    // Euclidean distance weighted by probability
    let dist = 0;
    for (let i = 0; i < node1.value.length; i++) {
      dist += Math.pow(node1.value[i] - node2.value[i], 2);
    }

    return Math.sqrt(dist) * Math.sqrt(node1.probability * node2.probability);
  }

  /**
   * Merge two tree nodes
   */
  private mergeNodes(node1: TreeNode, node2: TreeNode): void {
    // Weight average of values
    const totalProb = node1.probability + node2.probability;

    if (node1.value && node2.value) {
      for (let i = 0; i < node1.value.length; i++) {
        node1.value[i] =
          (node1.value[i] * node1.probability + node2.value[i] * node2.probability) /
          totalProb;
      }
    }

    // Merge children
    node1.children.push(...node2.children);
    node1.probability = totalProb;
  }

  /**
   * Create a default reconstructor function based on a template scenario
   */
  private createDefaultReconstructor(template: MultistageScenario): (path: number[][], probability: number) => Scenario {
    return (path: number[][], probability: number): Scenario => {
      // Map path values to scenario outcomes
      // path[i] contains values for stage i+1
      // Typical structure: [netWorth, income, satisfaction, happiness]

      const mapPathToOutcome = (stageIndex: number, year: number) => {
        const values = path[stageIndex] || [0, 0, 0, 0];
        return {
          year,
          financialPosition: {
            netWorth: values[0] || 0,
            income: values[1] || 0,
            expenses: values[1] ? values[1] * 0.7 : 0, // Estimate expenses as 70% of income
            savings: values[1] ? values[1] * 0.3 : 0  // Estimate savings as 30% of income
          },
          careerProgress: {
            role: template.outcomes?.year1?.careerProgress?.role || '',
            seniorityLevel: Math.min(10, Math.max(1, Math.floor((values[2] || 5) / 10))),
            marketValue: values[1] || 0,
            jobSatisfaction: Math.min(10, Math.max(1, values[2] || 5))
          },
          lifeMetrics: {
            overallHappiness: Math.min(10, Math.max(1, values[3] || 5)),
            stress: Math.min(10, Math.max(1, 10 - (values[3] || 5))), // Inverse of happiness
            workLifeBalance: Math.min(10, Math.max(1, values[3] || 5)),
            healthScore: Math.min(10, Math.max(1, 7)) // Default to 7
          }
        };
      };

      return {
        id: `scenario-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        probability,
        outcomes: {
          year1: mapPathToOutcome(0, 1),
          year3: mapPathToOutcome(1, 3),
          year5: mapPathToOutcome(2, 5),
          year10: mapPathToOutcome(3, 10)
        },
        economicConditions: template.economicConditions || {
          gdpGrowth: 0.02,
          inflationRate: 0.02,
          unemploymentRate: 0.04,
          marketCondition: 'stable',
          industryOutlook: 'stable'
        },
        keyEvents: [],
        assumptions: template.assumptions || {}
      };
    };
  }

  /**
   * Extract scenarios from tree
   */
  private extractScenariosFromTree(
    tree: ScenarioTree,
    reconstructor: (path: number[][], probability: number) => Scenario
  ): Scenario[] {
    const scenarios: Scenario[] = [];

    const traverse = (node: TreeNode, path: number[][], probability: number) => {
      if (node.children.length === 0) {
        // Leaf node - create scenario using reconstructor
        scenarios.push(reconstructor(path, probability));
      } else {
        for (const child of node.children) {
          traverse(
            child,
            [...path, child.value || []],
            probability * child.probability
          );
        }
      }
    };

    traverse(tree.root, [], 1);
    return scenarios;
  }

  /**
   * Check if two values are equal
   */
  private valuesEqual(v1: number[] | null, v2: number[] | null): boolean {
    if (!v1 || !v2) return v1 === v2;
    if (v1.length !== v2.length) return false;

    for (let i = 0; i < v1.length; i++) {
      if (Math.abs(v1[i] - v2[i]) > 1e-10) return false;
    }

    return true;
  }
}

// Type definitions
interface MultistageScenario extends Scenario {
  values: number[][];
}

interface ReducedScenarioSet {
  scenarios: Scenario[];
  weights: number[];
  originalCount: number;
  reducedCount: number;
  preservedMass: number;
  maxTransportCost: number;
}

interface TreeNode {
  stage: number;
  value: number[] | null;
  probability: number;
  children: TreeNode[];
}

interface ScenarioTree {
  root: TreeNode;
  stages: number;
}