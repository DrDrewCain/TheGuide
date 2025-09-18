//
//  DataModels.swift
//  TheGuide
//
//  Core data models for TheGuide app
//

import Foundation

// MARK: - User Profile Models

struct UserProfile: Codable, Identifiable {
    let id: String
    let email: String
    let createdAt: Date
    let updatedAt: Date
    var demographics: Demographics
    var career: CareerProfile
    var financial: FinancialProfile
    var goals: Goals
    var preferences: UserPreferences
}

struct Demographics: Codable {
    var age: Int
    var location: Location
    var education: Education
    var maritalStatus: MaritalStatus
    var dependents: Int
    var healthStatus: HealthStatus
}

struct Location: Codable {
    let city: String
    let state: String
    let country: String
    let zipCode: String
    let coordinates: Coordinates
}

struct Coordinates: Codable {
    let lat: Double
    let lng: Double
}

struct Education: Codable {
    let level: EducationLevel
    let field: String
    let institution: String
    let graduationYear: Int
    let debt: Double
}

struct CareerProfile: Codable {
    var currentRole: String
    var industry: String
    var company: String
    var companySize: CompanySize
    var yearsExperience: Int
    var skills: [Skill]
    var salary: Double
    var compensation: Compensation
    var workStyle: WorkStyle
    var careerTrajectory: CareerTrajectory
}

struct Skill: Codable, Identifiable {
    let id = UUID()
    let name: String
    let level: SkillLevel
    let yearsExperience: Int
    let marketDemand: MarketDemand
}

struct Compensation: Codable {
    let base: Double
    let bonus: Double
    let equity: Double
    let benefits: Double
}

struct FinancialProfile: Codable {
    var assets: Assets
    var liabilities: Liabilities
    var monthlyExpenses: MonthlyExpenses
    var savingsRate: Double
    var creditScore: Int
    var riskTolerance: RiskTolerance
}

struct Assets: Codable {
    var cash: Double
    var investments: Double
    var retirement: Double
    var realEstate: Double
    var other: Double
}

struct Liabilities: Codable {
    var creditCards: Double
    var studentLoans: Double
    var mortgage: Double
    var other: Double
}

struct MonthlyExpenses: Codable {
    var housing: Double
    var transportation: Double
    var food: Double
    var utilities: Double
    var entertainment: Double
    var healthcare: Double
    var other: Double
}

struct Goals: Codable {
    var shortTerm: [Goal] // 1-2 years
    var mediumTerm: [Goal] // 3-5 years
    var longTerm: [Goal] // 5+ years
}

struct Goal: Codable, Identifiable {
    let id: String
    let title: String
    let category: GoalCategory
    let targetDate: Date
    let priority: Priority
    let estimatedCost: Double
    var progress: Double // 0-100
}

struct UserPreferences: Codable {
    var workLifeBalance: Double // 0-10
    var stabilityVsGrowth: Double // 0-10 (0 = stability, 10 = growth)
    var urbanVsRural: Double // 0-10 (0 = rural, 10 = urban)
    var familyOrientation: Double // 0-10
    var adventureIndex: Double // 0-10
}

// MARK: - Decision Models

struct Decision: Codable, Identifiable {
    let id: String
    let userId: String
    let type: DecisionType
    let title: String
    let description: String
    var status: DecisionStatus
    var options: [DecisionOption]
    var constraints: [Constraint]
    let timeline: Timeline
    var simulations: [SimulationResult]?
    var finalChoice: String? // option id
    var outcome: DecisionOutcome?
}

struct DecisionOption: Codable, Identifiable {
    let id: String
    let title: String
    let description: String
    let parameters: DecisionParameters
    let pros: [String]
    let cons: [String]
    let estimatedImpact: Impact
    let requirements: [Requirement]
}

struct DecisionParameters: Codable {
    // Career Change
    var newSalary: Double?
    var newLocation: Location?
    var newIndustry: String?
    var newRole: String?

    // Relocation
    var destinationCity: String?
    var costOfLivingChange: Double?

    // Education
    var programType: String?
    var duration: Int?
    var totalCost: Double?

    // Home Purchase
    var homePrice: Double?
    var downPayment: Double?
    var mortgageRate: Double?
}

struct Impact: Codable {
    let financial: FinancialImpact
    let career: CareerImpact
    let lifestyle: LifestyleImpact
    let family: FamilyImpact
}

struct FinancialImpact: Codable {
    let immediate: Double
    let year1: Double
    let year5: Double
    let year10: Double
}

struct CareerImpact: Codable {
    let growthPotential: Double // 0-10
    let skillDevelopment: Double // 0-10
    let networkExpansion: Double // 0-10
}

struct LifestyleImpact: Codable {
    let workLifeBalance: Double // -5 to +5 change
    let stress: Double // -5 to +5 change
    let fulfillment: Double // -5 to +5 change
}

struct FamilyImpact: Codable {
    let timeWithFamily: Double // -5 to +5 change
    let familyStability: Double // -5 to +5 change
}

struct Timeline: Codable {
    let createdAt: Date
    let decisionDeadline: Date
    let implementationDate: Date
}

struct Constraint: Codable, Identifiable {
    let id: String
    let type: ConstraintType
    let description: String
    let priority: ConstraintPriority
}

struct Requirement: Codable, Identifiable {
    let id: String
    let description: String
    var met: Bool
    let details: String?
}

// MARK: - Simulation Models

struct SimulationResult: Codable, Identifiable {
    let id: String
    let decisionId: String
    let optionId: String
    let runDate: Date
    let scenarios: [Scenario]
    let aggregateMetrics: AggregateMetrics
    let recommendations: [Recommendation]
    let risks: [Risk]
    let opportunities: [Opportunity]
}

struct Scenario: Codable, Identifiable {
    let id: String
    let probability: Double
    let economicConditions: EconomicConditions
    let outcomes: ScenarioOutcomes
    let keyEvents: [KeyEvent]
    let assumptions: [String: String]
}

struct ScenarioOutcomes: Codable {
    let year1: YearlyOutcome
    let year3: YearlyOutcome
    let year5: YearlyOutcome
    let year10: YearlyOutcome
}

struct EconomicConditions: Codable {
    let gdpGrowth: Double
    let inflationRate: Double
    let unemploymentRate: Double
    let marketCondition: MarketCondition
    let industryOutlook: IndustryOutlook
}

struct YearlyOutcome: Codable {
    let year: Int
    let financialPosition: FinancialPosition
    let careerProgress: CareerProgress
    let lifeMetrics: LifeMetrics
}

struct FinancialPosition: Codable {
    let netWorth: Double
    let income: Double
    let expenses: Double
    let savings: Double
}

struct CareerProgress: Codable {
    let role: String
    let seniorityLevel: Double // 1-10
    let marketValue: Double
    let jobSatisfaction: Double // 1-10
}

struct LifeMetrics: Codable {
    let overallHappiness: Double // 1-10
    let stress: Double // 1-10
    let workLifeBalance: Double // 1-10
    let healthScore: Double // 1-10
}

struct KeyEvent: Codable, Identifiable {
    let id = UUID()
    let year: Int
    let type: KeyEventType
    let description: String
    let impact: ImpactType
    let financialImpact: Double?
}

struct AggregateMetrics: Codable {
    let expectedValue: ExpectedValue
    let volatility: Volatility
    let probabilityOfSuccess: Double
    let confidenceInterval: ConfidenceInterval
    let riskScore: Double // 1-10
    let opportunityScore: Double // 1-10
}

struct ExpectedValue: Codable {
    let financial: Double
    let career: Double
    let lifestyle: Double
    let overall: Double
}

struct Volatility: Codable {
    let financial: Double
    let career: Double
    let lifestyle: Double
}

struct ConfidenceInterval: Codable {
    let lower: Double
    let upper: Double
    let confidence: Double // e.g., 0.95 for 95%
}

struct Recommendation: Codable, Identifiable {
    let id: String
    let priority: Priority
    let category: RecommendationCategory
    let title: String
    let description: String
    let actions: [String]
    let potentialImpact: Double // percentage improvement
}

struct Risk: Codable, Identifiable {
    let id: String
    let severity: Severity
    let probability: Double // 0-1
    let category: RiskCategory
    let description: String
    let mitigation: [String]
    let monitoringIndicators: [String]
}

struct Opportunity: Codable, Identifiable {
    let id: String
    let probability: Double // 0-1
    let timeframe: Timeframe
    let description: String
    let requirements: [String]
    let potentialValue: Double
}

struct DecisionOutcome: Codable {
    let id: String
    let decisionId: String
    let optionId: String
    let implementedDate: Date
    let actualOutcomes: [String: ActualOutcome]
    let lessonsLearned: [String]
    let wouldRepeat: Bool
    let satisfactionScore: Double // 1-10
}

struct ActualOutcome: Codable {
    let date: Date
    let financialResult: Double
    let careerProgress: String
    let unexpectedEvents: [String]
    let comparedToSimulation: SimulationComparison
}

// MARK: - Enums

enum MaritalStatus: String, Codable, CaseIterable {
    case single, married, divorced, widowed
}

enum HealthStatus: String, Codable, CaseIterable {
    case excellent, good, fair, poor
}

enum EducationLevel: String, Codable, CaseIterable {
    case highSchool = "high_school"
    case bachelors, masters, phd, other
}

enum CompanySize: String, Codable, CaseIterable {
    case startup, small, medium, large, enterprise
}

enum SkillLevel: String, Codable, CaseIterable {
    case beginner, intermediate, advanced, expert
}

enum MarketDemand: String, Codable, CaseIterable {
    case low, medium, high, veryHigh = "very_high"
}

enum WorkStyle: String, Codable, CaseIterable {
    case remote, hybrid, office
}

enum CareerTrajectory: String, Codable, CaseIterable {
    case stable, growing, pivoting, exploring
}

enum RiskTolerance: String, Codable, CaseIterable {
    case conservative, moderate, aggressive
}

enum GoalCategory: String, Codable, CaseIterable {
    case career, financial, family, lifestyle, education
}

enum Priority: String, Codable, CaseIterable {
    case low, medium, high, critical
}

enum DecisionType: String, Codable, CaseIterable {
    case careerChange = "career_change"
    case jobOffer = "job_offer"
    case relocation, education
    case homePurchase = "home_purchase"
    case investment
    case familyPlanning = "family_planning"
    case retirement
    case businessStartup = "business_startup"
}

enum DecisionStatus: String, Codable, CaseIterable {
    case draft, analyzing, simulated, decided, implemented, archived
}

enum ConstraintType: String, Codable, CaseIterable {
    case financial, time, location, family, health, other
}

enum ConstraintPriority: String, Codable, CaseIterable {
    case mustHave = "must_have"
    case niceToHave = "nice_to_have"
    case avoid
}

enum MarketCondition: String, Codable, CaseIterable {
    case recession, downturn, stable, growth, boom
}

enum IndustryOutlook: String, Codable, CaseIterable {
    case declining, stable, growing, booming
}

enum KeyEventType: String, Codable, CaseIterable {
    case promotion, layoff
    case marketCrash = "market_crash"
    case opportunity
    case lifeEvent = "life_event"
    case other
}

enum ImpactType: String, Codable, CaseIterable {
    case positive, negative, neutral
}

enum RecommendationCategory: String, Codable, CaseIterable {
    case preparation, timing
    case riskMitigation = "risk_mitigation"
    case optimization
}

enum Severity: String, Codable, CaseIterable {
    case low, medium, high, critical
}

enum RiskCategory: String, Codable, CaseIterable {
    case financial, career, personal, market, health
}

enum Timeframe: String, Codable, CaseIterable {
    case immediate
    case shortTerm = "short_term"
    case mediumTerm = "medium_term"
    case longTerm = "long_term"
}

enum SimulationComparison: String, Codable, CaseIterable {
    case better
    case asExpected = "as_expected"
    case worse
}