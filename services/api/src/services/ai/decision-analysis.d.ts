import { Decision, DecisionOption, UserProfile } from '@theguide/models';
export declare class DecisionAnalysisService {
    private openai;
    private maxDepth;
    private explorationConstant;
    private simulationCount;
    constructor(apiKey: string);
    analyzeUserInput(prompt: string): Promise<any>;
    analyzeDecision(decision: Decision, option: DecisionOption, profile: Partial<UserProfile>): Promise<{
        scenarios: any[];
        recommendations: string[];
        risks: string[];
        opportunities: string[];
    }>;
    private createNode;
    private treePolicy;
    private expand;
    private selectBestChild;
    private calculateUCB1;
    private simulate;
    private backpropagate;
    private getPossibleActions;
    private applyAction;
    private buildEvaluationPrompt;
    private parseScore;
    private extractScenarios;
    private generateAnalysis;
}
export default DecisionAnalysisService;
//# sourceMappingURL=decision-analysis.d.ts.map