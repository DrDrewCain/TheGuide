// Simulation parameter types for different decision types

export interface BaseSimulationParams {
  iterations: number // Default: 1000
  confidenceLevel: number // Default: 0.95
  timeHorizon: number // Years to simulate
}

export interface FinancialParams {
  currentSalary?: number
  salaryGrowthRate?: { min: number; max: number; likely: number }
  inflationRate?: { min: number; max: number; likely: number }
  savingsRate?: number
  currentSavings?: number
  monthlyExpenses?: number
  investmentReturnRate?: { min: number; max: number; likely: number }
}

export interface CareerChangeParams extends BaseSimulationParams {
  currentRole: {
    salary: number
    satisfaction: number // 1-10
    growthPotential: number // 1-10
    industry: string
    location: string
  }
  newRole: {
    estimatedSalary: { min: number; max: number; likely: number }
    transitionCost: number
    trainingDuration: number // months
    successProbability: number // 0-1
    industry: string
    location?: string
  }
  financial: FinancialParams
}

export interface RelocationParams extends BaseSimulationParams {
  currentLocation: {
    city: string
    state: string
    costOfLivingIndex: number
    housingCost: number
    qualityOfLifeScore: number
  }
  targetLocation: {
    city: string
    state: string
    costOfLivingIndex: number
    estimatedHousingCost: { min: number; max: number; likely: number }
    movingCost: { min: number; max: number; likely: number }
    jobMarketStrength: number // 1-10
  }
  financial: FinancialParams
  family: {
    dependents: number
    spouseEmployment: boolean
    schoolingCosts?: number
  }
}

export interface HomePurchaseParams extends BaseSimulationParams {
  property: {
    price: number
    downPaymentPercent: number
    mortgageRate: { min: number; max: number; likely: number }
    mortgageTerm: number // years
    propertyTaxRate: number
    insurance: number
    hoa?: number
    maintenanceCostPercent: number // annual % of home value
  }
  market: {
    appreciationRate: { min: number; max: number; likely: number }
    rentGrowthRate: { min: number; max: number; likely: number }
    currentRent: number
  }
  financial: FinancialParams
}

// Default distributions when data is missing
export const DEFAULT_DISTRIBUTIONS = {
  salaryGrowthRate: { min: 0.02, max: 0.08, likely: 0.04 },
  inflationRate: { min: 0.015, max: 0.04, likely: 0.025 },
  investmentReturnRate: { min: 0.04, max: 0.12, likely: 0.08 },
  homeAppreciationRate: { min: 0.02, max: 0.06, likely: 0.035 },
  mortgageRate: { min: 0.05, max: 0.08, likely: 0.065 },
  careerTransitionSuccess: 0.75,
  relocationAdjustmentPeriod: 6, // months
}

// Uncertainty factors - wider ranges when less data is available
export const UNCERTAINTY_MULTIPLIERS = {
  noData: 1.5, // 50% wider confidence intervals
  partialData: 1.2, // 20% wider
  fullData: 1.0, // normal confidence intervals
}
