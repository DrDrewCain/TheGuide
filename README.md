# TheGuide - AI Life Decision Simulator

Make informed life decisions with AI-powered simulations based on real data. TheGuide helps you navigate major life choices like career changes, relocations, education decisions, and major purchases by running advanced Monte Carlo simulations with state-of-the-art algorithms.

## Project Structure

This is a monorepo managed with Turborepo and Bun:

```
TheGuide_Repository/
├── apps/
│   ├── web/              # Next.js web app
│   └── ios/              # iOS app (SwiftUI)
│       └── TheGuide/
├── services/
│   ├── api/              # Backend API (Node.js)
│   ├── sim-engine/       # Advanced simulation engine
│   └── market-proxy/     # Market data proxy service
├── packages/
│   ├── models/           # Shared TypeScript models
│   ├── ui/               # Shared UI components
│   └── sdk/              # Client SDK
├── turbo.json            # Turborepo configuration
├── package.json          # Root package.json
└── bun.lockb             # Bun lock file
```

## Features

- **Advanced Simulation Engine**: State-of-the-art Monte Carlo with Quasi-Monte Carlo (QMC), Multi-Level Monte Carlo (MLMC), and Vine Copulas
- **AI-Powered Analysis**: GPT-4 integration for decision analysis and personalized recommendations
- **Real-Time Progress**: Live simulation progress tracking with detailed stage information
- **Hyper-Personalized Analysis**: Connect financial accounts and analyze your specific situation
- **Real-Time Intelligence**: Job market trends, cost of living data, economic indicators
- **Scenario Planning**: Test decisions against recession, job loss, and other scenarios
- **Multi-Platform**: Native iOS app and responsive web application

## Getting Started

### Prerequisites

- Bun 1.1+ (package manager and runtime)
- Node.js 18+ (for compatibility)
- Xcode 15+ (for iOS app)

### Quick Start

```bash
# Install dependencies for all packages
bun install

# Run all services in development
bun run dev

# Run only the web app
bun run dev:web

# Build only the web app
bun run build:web

# Run the API and supporting services
bun run dev:services
```

### Web App

The web app will be available at `http://localhost:3000`

### iOS App Setup

1. Open `apps/ios/TheGuide/TheGuide.xcodeproj` in Xcode
2. Select your development team in project settings
3. Build and run on simulator or device

Or use the convenience script:
```bash
bun run ios
```

## Key Components

### Advanced Simulation Engine

The simulation engine (`services/sim-engine/`) implements cutting-edge algorithms:

- **Quasi-Monte Carlo (QMC)**: Scrambled Sobol sequences for faster convergence
- **Multi-Level Monte Carlo (MLMC)**: Variance reduction for path-dependent decisions
- **Vine Copulas**: Realistic dependency modeling between risk factors
- **Sensitivity Analysis**: Sobol indices to identify key decision drivers
- **Scenario Reduction**: Wasserstein distance-based scenario selection
- **Parallel RNG**: Philox4x32 for reproducible parallel simulations
- **Real-time Progress**: Stage-by-stage progress reporting

### Data Models

Shared data models for both platforms:
- **UserProfile**: Demographics, career, financial info, goals
- **Decision**: Type, options, constraints, timeline
- **SimulationResult**: Scenarios, metrics, recommendations
- **Outcome Tracking**: Compare actual vs. simulated results

### Decision Types Supported

- Career Change
- Job Offers
- Relocation
- Education (MBA, bootcamps, etc.)
- Home Purchase
- Investment Decisions
- Family Planning
- Retirement Planning
- Business Startup

## Tech Stack

### Monorepo
- **Build System**: Turborepo
- **Package Manager**: Bun
- **Shared Code**: TypeScript packages

### Web App (apps/web)
- **Framework**: Next.js 14 App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React hooks + custom simulation hook
- **AI Integration**: OpenAI GPT-4

### iOS App (apps/ios)
- **Framework**: SwiftUI
- **Data**: Core Data
- **Architecture**: MVVM
- **Min iOS Version**: iOS 16+

### Backend Services
- **API (services/api)**: Node.js + Express + Prisma
- **Simulation Engine (services/sim-engine)**: TypeScript with advanced algorithms
- **Market Proxy (services/market-proxy)**: Data aggregation service
- **Database**: PostgreSQL (planned)
- **Caching**: Redis (planned)

## Development Roadmap

### Phase 1: MVP (Current)
- ✅ Monorepo structure with Turborepo
- ✅ Advanced simulation engine with QMC, MLMC, Copulas
- ✅ Core data models (shared package)
- ✅ Web app with real-time progress tracking
- ✅ AI-powered decision analysis (GPT-4)
- ✅ iOS app structure
- ⏳ API integration layer
- ⏳ Authentication

### Phase 2: Data Integration
- Plaid financial data connection
- Job market API integration
- Cost of living databases
- Real-time economic indicators

### Phase 3: Advanced Features
- ML-powered predictions
- Social features
- Premium subscriptions
- B2B API marketplace

## Revenue Model

- **Critical Decision Pass**: $99-199 one-time
- **Life Optimizer Subscription**: $29/month
- **Premium Data Feeds**: $99/month

## Contributing

This is currently a private project. Please contact the maintainers for contribution guidelines.

## License

Proprietary - All rights reserved