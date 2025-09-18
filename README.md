# TheGuide - AI Life Decision Simulator

Make informed life decisions with AI-powered simulations based on real data. TheGuide helps you navigate major life choices like career changes, relocations, education decisions, and major purchases by running thousands of Monte Carlo simulations.

## Project Structure

```
TheGuide_Repository/
├── TheGuideiOS/          # iOS app (SwiftUI)
├── TheGuideWebapp/       # Web app (Next.js)
└── ARCHITECTURE.md       # System architecture documentation
```

## Features

- **Life Path Simulation**: Run 1000+ Monte Carlo simulations for major decisions
- **Hyper-Personalized Analysis**: Connect financial accounts and analyze your specific situation
- **Real-Time Intelligence**: Job market trends, cost of living data, economic indicators
- **Scenario Planning**: Test decisions against recession, job loss, and other scenarios
- **Multi-Platform**: Native iOS app and responsive web application

## Getting Started

### Prerequisites

- Node.js 18+ (for web app)
- Xcode 15+ (for iOS app)
- npm or yarn

### Web App Setup

```bash
cd TheGuideWebapp
npm install
npm run dev
```

The web app will be available at `http://localhost:3000`

### iOS App Setup

1. Open `TheGuideiOS/TheGuide.xcodeproj` in Xcode
2. Select your development team in project settings
3. Build and run on simulator or device

## Key Components

### Simulation Engine

The core simulation engine (`TheGuideWebapp/src/lib/simulation/engine.ts`) uses:
- Monte Carlo methods with 1000+ scenarios
- Economic condition modeling (recession, growth, etc.)
- Career trajectory projections
- Financial outcome calculations
- Risk and opportunity analysis

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

### Web App
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks (Zustand planned)
- **Charts**: D3.js/Recharts (planned)

### iOS App
- **Framework**: SwiftUI
- **Data**: Core Data
- **Architecture**: MVVM
- **Min iOS Version**: iOS 16+

### Planned Backend
- Node.js/Python API
- PostgreSQL + TimescaleDB
- Redis caching
- External API integrations (Plaid, job market data, etc.)

## Development Roadmap

### Phase 1: MVP (Current)
- ✅ Basic UI structure
- ✅ Core data models
- ✅ Simulation engine foundation
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