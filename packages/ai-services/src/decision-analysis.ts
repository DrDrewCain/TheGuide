import type { Decision, DecisionOption, UserProfile } from '@theguide/models'
import { type AIProvider, createAIProvider } from './ai-provider.js'

interface MCTSNode {
  state: DecisionState
  parent: MCTSNode | null
  children: MCTSNode[]
  visits: number
  value: number
  untried_actions: string[]
}

interface DecisionState {
  decision: Decision
  option: DecisionOption
  profile: UserProfile
  scenario: any
  depth: number
}

export class DecisionAnalysisService {
  private aiProvider: AIProvider
  private maxDepth = 5
  private explorationConstant = Math.SQRT2
  private simulationCount = 100

  constructor(config: { openaiKey?: string; geminiKey?: string } | string) {
    // Support both old string constructor and new config object
    if (typeof config === 'string') {
      this.aiProvider = createAIProvider({ openaiKey: config })
    } else {
      this.aiProvider = createAIProvider(config)
    }
  }

  async analyzeUserInput(prompt: string): Promise<any> {
    try {
      const systemPrompt =
        'You are an expert life decision analyst. Extract structured information from user descriptions.'

      const content = await this.aiProvider.analyzeText(systemPrompt, prompt, {
        temperature: 0.3,
        maxTokens: 1000,
        jsonMode: true,
      })

      return JSON.parse(content)
    } catch (error) {
      console.error('User input analysis error:', error)
      throw error
    }
  }

  async analyzeDecision(
    decision: Decision,
    option: DecisionOption,
    profile: Partial<UserProfile>
  ): Promise<{
    scenarios: any[]
    recommendations: string[]
    risks: string[]
    opportunities: string[]
  }> {
    // Initialize root node
    const rootState: DecisionState = {
      decision,
      option,
      profile: profile as UserProfile,
      scenario: {},
      depth: 0,
    }

    const root = this.createNode(rootState, null)

    // Run MCTS iterations
    for (let i = 0; i < this.simulationCount; i++) {
      const leaf = await this.treePolicy(root)
      const reward = await this.simulate(leaf.state)
      this.backpropagate(leaf, reward)
    }

    // Extract best scenarios
    const scenarios = this.extractScenarios(root)
    const analysis = await this.generateAnalysis(decision, scenarios)

    return {
      scenarios,
      recommendations: analysis.recommendations,
      risks: analysis.risks,
      opportunities: analysis.opportunities,
    }
  }

  private createNode(state: DecisionState, parent: MCTSNode | null): MCTSNode {
    return {
      state,
      parent,
      children: [],
      visits: 0,
      value: 0,
      untried_actions: this.getPossibleActions(state),
    }
  }

  private async treePolicy(node: MCTSNode): Promise<MCTSNode> {
    let current = node

    while (current.state.depth < this.maxDepth) {
      if (current.untried_actions.length > 0) {
        return await this.expand(current)
      } else if (current.children.length > 0) {
        current = this.selectBestChild(current)
      } else {
        break
      }
    }

    return current
  }

  private async expand(node: MCTSNode): Promise<MCTSNode> {
    const action = node.untried_actions.pop()!
    const newState = await this.applyAction(node.state, action)
    const child = this.createNode(newState, node)
    node.children.push(child)
    return child
  }

  private selectBestChild(node: MCTSNode): MCTSNode {
    return node.children.reduce((best, child) => {
      const ucb1 = this.calculateUCB1(child, node.visits)
      const bestUCB1 = this.calculateUCB1(best, node.visits)
      return ucb1 > bestUCB1 ? child : best
    })
  }

  private calculateUCB1(node: MCTSNode, parentVisits: number): number {
    if (node.visits === 0) return Infinity

    const exploitation = node.value / node.visits
    const exploration = this.explorationConstant * Math.sqrt(Math.log(parentVisits) / node.visits)

    return exploitation + exploration
  }

  private async simulate(state: DecisionState): Promise<number> {
    // Use LLM to evaluate the scenario
    const prompt = this.buildEvaluationPrompt(state)

    try {
      const systemPrompt =
        'You are a financial and life decision analyst. Evaluate scenarios and provide numerical scores.'

      const content = await this.aiProvider.analyzeText(systemPrompt, prompt, {
        temperature: 0.7,
        maxTokens: 200,
      })

      return this.parseScore(content)
    } catch (error) {
      console.error(`${this.aiProvider.name} API error:`, error)
      return Math.random() // Fallback to random
    }
  }

  private backpropagate(node: MCTSNode, reward: number) {
    let current: MCTSNode | null = node

    while (current !== null) {
      current.visits++
      current.value += reward
      current = current.parent
    }
  }

  private getPossibleActions(state: DecisionState): string[] {
    // Define possible future events/actions based on decision type
    const baseActions = [
      'market_upturn',
      'market_downturn',
      'job_opportunity',
      'unexpected_expense',
      'health_event',
      'family_change',
    ]

    // Add decision-specific actions
    switch (state.decision.type) {
      case 'career':
        return [...baseActions, 'promotion', 'layoff', 'skill_obsolescence', 'industry_growth']
      case 'housing':
        return [
          ...baseActions,
          'interest_rate_change',
          'property_value_change',
          'maintenance_issue',
        ]
      case 'education':
        return [...baseActions, 'program_success', 'program_failure', 'networking_benefit']
      default:
        return baseActions
    }
  }

  private async applyAction(state: DecisionState, action: string): Promise<DecisionState> {
    // Create new state with action applied
    const newScenario = {
      ...state.scenario,
      [`event_${state.depth}`]: action,
    }

    return {
      ...state,
      scenario: newScenario,
      depth: state.depth + 1,
    }
  }

  private buildEvaluationPrompt(state: DecisionState): string {
    return `
      Evaluate this life decision scenario:

      Decision: ${state.decision.title}
      Option: ${state.option.title}

      User Profile:
      - Age: ${state.profile.demographics?.age}
      - Income: $${state.profile.career?.salary}
      - Location: ${state.profile.demographics?.location?.city}

      Scenario Events:
      ${Object.entries(state.scenario)
        .map(([_key, value]) => `- ${value}`)
        .join('\n')}

      Score this scenario from 0-1 based on:
      1. Financial impact
      2. Career growth
      3. Life satisfaction
      4. Risk level
      5. Long-term prospects

      Return only a decimal number between 0 and 1.
    `
  }

  private parseScore(content: string): number {
    const match = content.match(/\d*\.?\d+/)
    if (match) {
      const score = parseFloat(match[0])
      return Math.max(0, Math.min(1, score))
    }
    return 0.5
  }

  private extractScenarios(root: MCTSNode): any[] {
    const scenarios: any[] = []
    const queue: MCTSNode[] = [root]

    while (queue.length > 0 && scenarios.length < 10) {
      const node = queue.shift()!

      if (node.visits > 5 && node.state.depth > 0) {
        scenarios.push({
          events: node.state.scenario,
          score: node.value / node.visits,
          confidence: node.visits / this.simulationCount,
        })
      }

      queue.push(...node.children.sort((a, b) => b.visits - a.visits))
    }

    return scenarios.sort((a, b) => b.score - a.score)
  }

  private async generateAnalysis(
    decision: Decision,
    scenarios: any[]
  ): Promise<{
    recommendations: string[]
    risks: string[]
    opportunities: string[]
  }> {
    const prompt = `
      Based on these Monte Carlo Tree Search scenarios for the decision "${decision.title}":

      ${scenarios
        .map(
          (s, i) => `
        Scenario ${i + 1} (Score: ${s.score.toFixed(2)}):
        Events: ${Object.values(s.events).join(' → ')}
      `
        )
        .join('\n')}

      Provide:
      1. Three specific recommendations
      2. Three key risks to monitor
      3. Three potential opportunities

      Format as JSON with arrays: recommendations, risks, opportunities
    `

    try {
      const systemPrompt =
        'You are a decision analysis expert. Provide actionable insights based on scenario analysis.'

      const content = await this.aiProvider.analyzeText(systemPrompt, prompt, {
        temperature: 0.3,
        maxTokens: 500,
        jsonMode: true,
      })

      return JSON.parse(content)
    } catch (error) {
      console.error('Analysis generation error:', error)
      return {
        recommendations: [
          'Gather more information',
          'Consider alternatives',
          'Plan for contingencies',
        ],
        risks: ['Market volatility', 'Unexpected expenses', 'Career changes'],
        opportunities: ['Skill development', 'Network growth', 'Financial gains'],
      }
    }
  }
}

export default DecisionAnalysisService
