"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionAnalysisService = void 0;
const openai_1 = __importDefault(require("openai"));
class DecisionAnalysisService {
    openai;
    maxDepth = 5;
    explorationConstant = 1.414;
    simulationCount = 100;
    constructor(apiKey) {
        this.openai = new openai_1.default({ apiKey });
    }
    async analyzeUserInput(prompt) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are an expert life decision analyst. Extract structured information from user descriptions."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 1000,
                response_format: { type: "json_object" }
            });
            const content = response.choices[0].message.content || "{}";
            return JSON.parse(content);
        }
        catch (error) {
            console.error('User input analysis error:', error);
            throw error;
        }
    }
    async analyzeDecision(decision, option, profile) {
        // Initialize root node
        const rootState = {
            decision,
            option,
            profile: profile,
            scenario: {},
            depth: 0
        };
        const root = this.createNode(rootState, null);
        // Run MCTS iterations
        for (let i = 0; i < this.simulationCount; i++) {
            const leaf = await this.treePolicy(root);
            const reward = await this.simulate(leaf.state);
            this.backpropagate(leaf, reward);
        }
        // Extract best scenarios
        const scenarios = this.extractScenarios(root);
        const analysis = await this.generateAnalysis(decision, scenarios);
        return {
            scenarios,
            recommendations: analysis.recommendations,
            risks: analysis.risks,
            opportunities: analysis.opportunities
        };
    }
    createNode(state, parent) {
        return {
            state,
            parent,
            children: [],
            visits: 0,
            value: 0,
            untried_actions: this.getPossibleActions(state)
        };
    }
    async treePolicy(node) {
        let current = node;
        while (current.state.depth < this.maxDepth) {
            if (current.untried_actions.length > 0) {
                return await this.expand(current);
            }
            else if (current.children.length > 0) {
                current = this.selectBestChild(current);
            }
            else {
                break;
            }
        }
        return current;
    }
    async expand(node) {
        const action = node.untried_actions.pop();
        const newState = await this.applyAction(node.state, action);
        const child = this.createNode(newState, node);
        node.children.push(child);
        return child;
    }
    selectBestChild(node) {
        return node.children.reduce((best, child) => {
            const ucb1 = this.calculateUCB1(child, node.visits);
            const bestUCB1 = this.calculateUCB1(best, node.visits);
            return ucb1 > bestUCB1 ? child : best;
        });
    }
    calculateUCB1(node, parentVisits) {
        if (node.visits === 0)
            return Infinity;
        const exploitation = node.value / node.visits;
        const exploration = this.explorationConstant * Math.sqrt(Math.log(parentVisits) / node.visits);
        return exploitation + exploration;
    }
    async simulate(state) {
        // Use LLM to evaluate the scenario
        const prompt = this.buildEvaluationPrompt(state);
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a financial and life decision analyst. Evaluate scenarios and provide numerical scores."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 200
            });
            const content = response.choices[0].message.content || "";
            return this.parseScore(content);
        }
        catch (error) {
            console.error('OpenAI API error:', error);
            return Math.random(); // Fallback to random
        }
    }
    backpropagate(node, reward) {
        let current = node;
        while (current !== null) {
            current.visits++;
            current.value += reward;
            current = current.parent;
        }
    }
    getPossibleActions(state) {
        // Define possible future events/actions based on decision type
        const baseActions = [
            "market_upturn",
            "market_downturn",
            "job_opportunity",
            "unexpected_expense",
            "health_event",
            "family_change"
        ];
        // Add decision-specific actions
        switch (state.decision.type) {
            case 'career':
                return [...baseActions, "promotion", "layoff", "skill_obsolescence", "industry_growth"];
            case 'housing':
                return [...baseActions, "interest_rate_change", "property_value_change", "maintenance_issue"];
            case 'education':
                return [...baseActions, "program_success", "program_failure", "networking_benefit"];
            default:
                return baseActions;
        }
    }
    async applyAction(state, action) {
        // Create new state with action applied
        const newScenario = {
            ...state.scenario,
            [`event_${state.depth}`]: action
        };
        return {
            ...state,
            scenario: newScenario,
            depth: state.depth + 1
        };
    }
    buildEvaluationPrompt(state) {
        return `
      Evaluate this life decision scenario:

      Decision: ${state.decision.title}
      Option: ${state.option.title}

      User Profile:
      - Age: ${state.profile.demographics?.age}
      - Income: $${state.profile.career?.salary}
      - Location: ${state.profile.demographics?.location?.city}

      Scenario Events:
      ${Object.entries(state.scenario).map(([key, value]) => `- ${value}`).join('\n')}

      Score this scenario from 0-1 based on:
      1. Financial impact
      2. Career growth
      3. Life satisfaction
      4. Risk level
      5. Long-term prospects

      Return only a decimal number between 0 and 1.
    `;
    }
    parseScore(content) {
        const match = content.match(/\d*\.?\d+/);
        if (match) {
            const score = parseFloat(match[0]);
            return Math.max(0, Math.min(1, score));
        }
        return 0.5;
    }
    extractScenarios(root) {
        const scenarios = [];
        const queue = [root];
        while (queue.length > 0 && scenarios.length < 10) {
            const node = queue.shift();
            if (node.visits > 5 && node.state.depth > 0) {
                scenarios.push({
                    events: node.state.scenario,
                    score: node.value / node.visits,
                    confidence: node.visits / this.simulationCount
                });
            }
            queue.push(...node.children.sort((a, b) => b.visits - a.visits));
        }
        return scenarios.sort((a, b) => b.score - a.score);
    }
    async generateAnalysis(decision, scenarios) {
        const prompt = `
      Based on these Monte Carlo Tree Search scenarios for the decision "${decision.title}":

      ${scenarios.map((s, i) => `
        Scenario ${i + 1} (Score: ${s.score.toFixed(2)}):
        Events: ${Object.values(s.events).join(' → ')}
      `).join('\n')}

      Provide:
      1. Three specific recommendations
      2. Three key risks to monitor
      3. Three potential opportunities

      Format as JSON with arrays: recommendations, risks, opportunities
    `;
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are a decision analysis expert. Provide actionable insights based on scenario analysis."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500,
                response_format: { type: "json_object" }
            });
            const content = response.choices[0].message.content || "{}";
            return JSON.parse(content);
        }
        catch (error) {
            console.error('Analysis generation error:', error);
            return {
                recommendations: ["Gather more information", "Consider alternatives", "Plan for contingencies"],
                risks: ["Market volatility", "Unexpected expenses", "Career changes"],
                opportunities: ["Skill development", "Network growth", "Financial gains"]
            };
        }
    }
}
exports.DecisionAnalysisService = DecisionAnalysisService;
exports.default = DecisionAnalysisService;
