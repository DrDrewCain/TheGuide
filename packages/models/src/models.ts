// Core Data Models for TheGuide

export interface UserProfile {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  demographics: Demographics;
  career: CareerProfile;
  financial: FinancialProfile;
  goals: Goals;
  preferences: UserPreferences;
}

export interface Demographics {
  age: number;
  location: Location;
  education: Education;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed';
  dependents: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface Location {
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Education {
  level: 'high_school' | 'bachelors' | 'masters' | 'phd' | 'other';
  field: string;
  institution: string;
  graduationYear: number;
  debt: number;
}

export interface CareerProfile {
  currentRole: string;
  industry: string;
  company: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  yearsExperience: number;
  skills: Skill[];
  salary: number;
  compensation: {
    base: number;
    bonus: number;
    equity: number;
    benefits: number;
  };
  workStyle: 'remote' | 'hybrid' | 'office';
  careerTrajectory: 'stable' | 'growing' | 'pivoting' | 'exploring';
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsExperience: number;
  marketDemand: 'low' | 'medium' | 'high' | 'very_high';
}

export interface FinancialProfile {
  assets: {
    cash: number;
    investments: number;
    retirement: number;
    realEstate: number;
    other: number;
  };
  liabilities: {
    creditCards: number;
    studentLoans: number;
    mortgage: number;
    other: number;
  };
  monthlyExpenses: {
    housing: number;
    transportation: number;
    food: number;
    utilities: number;
    entertainment: number;
    healthcare: number;
    other: number;
  };
  savingsRate: number;
  creditScore: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
}

export interface Goals {
  shortTerm: Goal[]; // 1-2 years
  mediumTerm: Goal[]; // 3-5 years
  longTerm: Goal[]; // 5+ years
}

export interface Goal {
  id: string;
  title: string;
  category: 'career' | 'financial' | 'family' | 'lifestyle' | 'education';
  targetDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
  progress: number; // 0-100
}

export interface UserPreferences {
  workLifeBalance: number; // 0-10
  stabilityVsGrowth: number; // 0-10 (0 = stability, 10 = growth)
  urbanVsRural: number; // 0-10 (0 = rural, 10 = urban)
  familyOrientation: number; // 0-10
  adventureIndex: number; // 0-10
}

// Decision Models

export interface Decision {
  id: string;
  userId: string;
  type: DecisionType;
  title: string;
  description: string;
  status: 'draft' | 'analyzing' | 'simulated' | 'decided' | 'implemented' | 'archived';
  options: DecisionOption[];
  constraints: Constraint[];
  timeline: {
    createdAt: Date;
    decisionDeadline: Date;
    implementationDate: Date;
  };
  simulations?: SimulationResult[];
  finalChoice?: string; // option id
  outcome?: DecisionOutcome;
}

export type DecisionType =
  | 'career_change'
  | 'job_offer'
  | 'relocation'
  | 'education'
  | 'home_purchase'
  | 'investment'
  | 'family_planning'
  | 'retirement'
  | 'business_startup';

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  parameters: DecisionParameters;
  pros: string[];
  cons: string[];
  estimatedImpact: Impact;
  requirements: Requirement[];
}

export interface DecisionParameters {
  // Career Change
  newSalary?: number;
  newLocation?: Location;
  newIndustry?: string;
  newRole?: string;

  // Relocation
  destinationCity?: string;
  costOfLivingChange?: number;

  // Education
  programType?: string;
  duration?: number;
  totalCost?: number;

  // Home Purchase
  homePrice?: number;
  downPayment?: number;
  mortgageRate?: number;

  // Custom parameters
  [key: string]: any;
}

export interface Impact {
  financial: {
    immediate: number;
    year1: number;
    year5: number;
    year10: number;
  };
  career: {
    growthPotential: number; // 0-10
    skillDevelopment: number; // 0-10
    networkExpansion: number; // 0-10
  };
  lifestyle: {
    workLifeBalance: number; // -5 to +5 change
    stress: number; // -5 to +5 change
    fulfillment: number; // -5 to +5 change
  };
  family: {
    timeWithFamily: number; // -5 to +5 change
    familyStability: number; // -5 to +5 change
  };
}

export interface Constraint {
  id: string;
  type: 'financial' | 'time' | 'location' | 'family' | 'health' | 'other';
  description: string;
  priority: 'must_have' | 'nice_to_have' | 'avoid';
}

export interface Requirement {
  id: string;
  description: string;
  met: boolean;
  details?: string;
}

// Simulation Models

export interface SimulationResult {
  id: string;
  decisionId: string;
  optionId: string;
  runDate: Date;
  scenarios: Scenario[];
  aggregateMetrics: AggregateMetrics;
  recommendations: Recommendation[];
  risks: Risk[];
  opportunities: Opportunity[];
}

export interface Scenario {
  id: string;
  probability: number;
  economicConditions: EconomicConditions;
  outcomes: {
    year1: YearlyOutcome;
    year3: YearlyOutcome;
    year5: YearlyOutcome;
    year10: YearlyOutcome;
  };
  keyEvents: KeyEvent[];
  assumptions: Record<string, any>;
}

export interface EconomicConditions {
  gdpGrowth: number;
  inflationRate: number;
  unemploymentRate: number;
  marketCondition: 'recession' | 'downturn' | 'stable' | 'growth' | 'boom';
  industryOutlook: 'declining' | 'stable' | 'growing' | 'booming';
}

export interface YearlyOutcome {
  year: number;
  financialPosition: {
    netWorth: number;
    income: number;
    expenses: number;
    savings: number;
  };
  careerProgress: {
    role: string;
    seniorityLevel: number; // 1-10
    marketValue: number;
    jobSatisfaction: number; // 1-10
  };
  lifeMetrics: {
    overallHappiness: number; // 1-10
    stress: number; // 1-10
    workLifeBalance: number; // 1-10
    healthScore: number; // 1-10
  };
}

export interface KeyEvent {
  year: number;
  type: 'promotion' | 'layoff' | 'market_crash' | 'opportunity' | 'life_event' | 'other';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  financialImpact?: number;
}

export interface AggregateMetrics {
  expectedValue: {
    financial: number;
    career: number;
    lifestyle: number;
    overall: number;
  };
  volatility: {
    financial: number;
    career: number;
    lifestyle: number;
  };
  probabilityOfSuccess: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number; // e.g., 0.95 for 95%
  };
  riskScore: number; // 1-10
  opportunityScore: number; // 1-10
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  category: 'preparation' | 'timing' | 'risk_mitigation' | 'optimization';
  title: string;
  description: string;
  actions: string[];
  potentialImpact: number; // percentage improvement
}

export interface Risk {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  category: 'financial' | 'career' | 'personal' | 'market' | 'health';
  description: string;
  mitigation: string[];
  monitoringIndicators: string[];
}

export interface Opportunity {
  id: string;
  probability: number; // 0-1
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  description: string;
  requirements: string[];
  potentialValue: number;
}

export interface DecisionOutcome {
  id: string;
  decisionId: string;
  optionId: string;
  implementedDate: Date;
  actualOutcomes: {
    [period: string]: ActualOutcome;
  };
  lessonsLearned: string[];
  wouldRepeat: boolean;
  satisfactionScore: number; // 1-10
}

export interface ActualOutcome {
  date: Date;
  financialResult: number;
  careerProgress: string;
  unexpectedEvents: string[];
  comparedToSimulation: 'better' | 'as_expected' | 'worse';
}