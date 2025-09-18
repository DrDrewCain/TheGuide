# TheGuide Architecture Overview

## Directory Structure

```
theguide/
├─ apps/                    # Deployable frontend applications
│  ├─ web/                  # Next.js 14 web app
│  └─ ios/                  # SwiftUI iOS app
├─ services/                # Backend microservices
│  ├─ api/                  # Public REST API
│  ├─ sim-engine/          # Monte Carlo simulation engine
│  └─ market-proxy/        # External data API aggregator
├─ packages/               # Shared JS/TS libraries
│  ├─ models/              # TypeScript domain models
│  ├─ sdk/                 # Generated API client
│  ├─ ui/                  # React component library
│  ├─ utils/               # Shared utilities
│  └─ charts/              # Data visualization components
├─ ios-packages/           # Shared Swift packages
│  ├─ CoreModels/          # Swift domain models
│  ├─ SDK/                 # iOS API client
│  └─ DesignKit/           # SwiftUI components
├─ infra/                  # Infrastructure as code
├─ ops/                    # CI/CD and operations
└─ docs/                   # Architecture decisions & guides
```

## System Architecture

### Backend Services

#### API Service (`services/api`)
- Express.js REST API with OpenAPI specification
- JWT authentication with refresh tokens
- Request validation using Zod schemas
- Prisma ORM for PostgreSQL
- Bull queue for async job dispatch

#### Simulation Engine (`services/sim-engine`)
- Isolated CPU-intensive Monte Carlo simulations
- Worker processes consume jobs from Redis queue
- 1000+ scenario generation per decision
- Statistical analysis using simple-statistics
- Results cached in Redis with TTL

#### Market Proxy (`services/market-proxy`)
- Aggregates and caches external API data
- Rate limiting and retry logic
- Normalizes data formats
- 15-minute cache for expensive API calls

### Frontend Applications

#### Web App (`apps/web`)
- Next.js 14 with App Router
- Server Components for initial load
- TypeScript with strict mode
- Tailwind CSS for styling
- API client using generated SDK

#### iOS App (`apps/ios`)
- SwiftUI with MVVM architecture
- Async/await for networking
- Core Data for offline storage
- Shared Swift packages for models

### Data Flow

1. **User Request** → Web/iOS App
2. **API Call** → API Service validates and authorizes
3. **Decision Created** → Stored in PostgreSQL
4. **Simulation Request** → Job queued in Redis
5. **Worker Processing** → Sim-engine consumes job
6. **Market Data** → Fetched via market-proxy
7. **Results** → Cached and returned to client
8. **Visualization** → Rendered in app

### Technology Stack

#### Backend
- Node.js 20+ with TypeScript
- Express.js for API
- PostgreSQL + Prisma
- Redis for caching/queues
- Bull for job management
- Docker for containerization

#### Frontend
- Next.js 14 (React 18)
- Swift 5.9 / SwiftUI
- TypeScript 5+
- Tailwind CSS
- D3.js/Recharts for charts

#### Infrastructure
- AWS/GCP for hosting
- Terraform for IaC
- GitHub Actions for CI/CD
- Vercel for web frontend
- TestFlight for iOS distribution

## Security Considerations

1. **Authentication**: JWT with secure httpOnly cookies
2. **Data Encryption**: TLS 1.3 for transport, AES-256 at rest
3. **API Security**: Rate limiting, CORS, input validation
4. **PII Protection**: Data minimization, GDPR compliance
5. **Financial Data**: Never stored, only session-based via Plaid

## Deployment Strategy

### Production
- API: AWS ECS or Google Cloud Run
- Database: AWS RDS or Cloud SQL
- Redis: ElastiCache or Cloud Memorystore
- Web: Vercel with preview deployments
- iOS: App Store with phased rollout

### Development
- Local Docker Compose setup
- Seed data for testing
- Feature branch deployments
- Automated E2E tests