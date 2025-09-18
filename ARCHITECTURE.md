# TheGuide Architecture Overview

## System Components

### 1. Backend API (Shared)
- **Framework**: Node.js with Express/Fastify or Python with FastAPI
- **Database**: PostgreSQL for user data + TimescaleDB for time-series simulations
- **Cache**: Redis for simulation results and API responses
- **Queue**: Bull/RabbitMQ for async simulation processing

### 2. Core Services

#### Life Simulation Engine
- Monte Carlo simulation engine running 1000+ scenarios
- Factors: career trajectory, economic conditions, location data, personal circumstances
- Output: probability distributions, confidence intervals, risk assessments

#### Data Integration Layer
- **Financial**: Plaid API for bank/investment data
- **Employment**: LinkedIn API, Indeed API, Glassdoor API
- **Economic**: FRED API, Bureau of Labor Statistics
- **Real Estate**: Zillow API, Rentberry API
- **Cost of Living**: Numbeo API, BestPlaces API

#### ML/AI Models
- **Career Trajectory Prediction**: Based on industry trends, skills, experience
- **Financial Outcome Modeling**: Income projections, expense forecasting
- **Life Event Impact Analysis**: Marriage, children, health events

### 3. iOS App (SwiftUI)
- **Architecture**: MVVM with Combine
- **Networking**: URLSession with async/await
- **Storage**: Core Data + Keychain
- **UI**: Native SwiftUI components with custom visualizations

### 4. Web App (React/Next.js)
- **Framework**: Next.js 14 with App Router
- **State**: Zustand or Redux Toolkit
- **UI**: Tailwind CSS + shadcn/ui components
- **Charts**: D3.js or Recharts for visualizations
- **Auth**: NextAuth.js with JWT

## Data Models

### User Profile
```typescript
interface UserProfile {
  id: string;
  demographics: {
    age: number;
    location: string;
    education: string;
    maritalStatus: string;
    dependents: number;
  };
  career: {
    currentRole: string;
    industry: string;
    experience: number;
    skills: string[];
    salary: number;
  };
  financial: {
    assets: number;
    liabilities: number;
    monthlyExpenses: number;
    savingsRate: number;
  };
  goals: {
    shortTerm: Goal[];
    longTerm: Goal[];
  };
}
```

### Decision Model
```typescript
interface Decision {
  id: string;
  userId: string;
  type: 'career' | 'relocation' | 'education' | 'housing' | 'family';
  title: string;
  options: DecisionOption[];
  constraints: Constraint[];
  timeline: {
    decisionDate: Date;
    implementationDate: Date;
  };
  status: 'analyzing' | 'simulated' | 'decided' | 'implemented';
}

interface DecisionOption {
  id: string;
  description: string;
  parameters: Record<string, any>;
  pros: string[];
  cons: string[];
  estimatedImpact: {
    financial: number;
    career: number;
    lifestyle: number;
    family: number;
  };
}
```

### Simulation Result
```typescript
interface SimulationResult {
  id: string;
  decisionId: string;
  optionId: string;
  scenarios: Scenario[];
  metrics: {
    expectedValue: number;
    standardDeviation: number;
    percentiles: Record<number, number>;
    riskScore: number;
    confidenceInterval: [number, number];
  };
  recommendations: string[];
  warnings: string[];
}

interface Scenario {
  probability: number;
  outcomes: {
    year1: Outcome;
    year5: Outcome;
    year10: Outcome;
  };
  assumptions: Record<string, any>;
}
```

## API Endpoints

### Authentication
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### User Management
- `GET /users/profile`
- `PUT /users/profile`
- `POST /users/financial-connect` (Plaid integration)
- `DELETE /users/account`

### Decisions
- `GET /decisions`
- `POST /decisions`
- `GET /decisions/:id`
- `PUT /decisions/:id`
- `DELETE /decisions/:id`

### Simulations
- `POST /simulations/run`
- `GET /simulations/:id`
- `GET /simulations/history`
- `POST /simulations/:id/export`

### Market Data
- `GET /market/salaries`
- `GET /market/cost-of-living`
- `GET /market/housing`
- `GET /market/economic-indicators`

## Security Considerations

1. **Authentication**: JWT with refresh tokens
2. **Data Encryption**: AES-256 for sensitive data at rest
3. **API Security**: Rate limiting, CORS, input validation
4. **PII Protection**: Data anonymization, GDPR compliance
5. **Financial Data**: PCI DSS compliance for payment processing

## Deployment Architecture

1. **Backend**: AWS ECS/Fargate or Google Cloud Run
2. **Database**: AWS RDS or Google Cloud SQL
3. **Cache**: AWS ElastiCache or Redis Cloud
4. **CDN**: CloudFront or Cloudflare
5. **Mobile**: App Store and TestFlight
6. **Web**: Vercel or AWS Amplify

## Development Phases

### Phase 1: MVP (Month 1-2)
- Basic user profiles
- Career decision simulation
- Simple Monte Carlo engine
- Core iOS/Web UI

### Phase 2: Data Integration (Month 3-4)
- Plaid integration
- External API connections
- Enhanced simulation accuracy
- Real-time data feeds

### Phase 3: Advanced Features (Month 5-6)
- ML-powered predictions
- Scenario planning
- Social features
- Premium subscriptions

### Phase 4: Scale & Optimize (Month 7+)
- Performance optimization
- Advanced analytics
- B2B features
- API marketplace