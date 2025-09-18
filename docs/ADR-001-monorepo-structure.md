# ADR-001: Monorepo Structure

## Status
Accepted

## Context
TheGuide requires coordination between multiple frontend applications (web, iOS) and backend services (API, simulation engine, market data proxy). We need a structure that supports:
- Independent deployment of services
- Code sharing between platforms
- Clear ownership boundaries
- CI/CD automation per service

## Decision
We will use a monorepo with clear separation between:
- **apps/**: Deployable frontend applications
- **services/**: Backend services (each independently deployable)
- **packages/**: Shared JavaScript/TypeScript libraries
- **ios-packages/**: Shared Swift packages
- **infra/**: Infrastructure as code
- **ops/**: CI/CD and operational tooling

## Consequences
### Positive
- Single source of truth for all code
- Easy code sharing via workspace packages
- Atomic commits across services
- Simplified dependency management

### Negative
- Larger repository size
- Requires careful CI/CD configuration
- Need path-based filtering for builds
- More complex initial setup

## Implementation
- Use pnpm workspaces for JavaScript/TypeScript
- Use Swift Package Manager for iOS packages
- Use Turborepo for build orchestration
- Configure GitHub Actions with path filters