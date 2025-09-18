# TheGuide API Service

Backend API service for TheGuide - an AI-powered life decision simulator.

## Tech Stack

- **Framework**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **Job Queue**: Bull with Redis
- **Validation**: Zod
- **Logging**: Winston

## Prerequisites

- Node.js v18+
- Redis (for job queue)
- Supabase account and project

## Supabase Setup

1. **Create a Supabase Project**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Create a new project
   - Note down your project URL and keys

2. **Run Database Migrations**
   ```bash
   # Copy the SQL from supabase/migrations/001_initial_schema.sql
   # Go to Supabase Dashboard > SQL Editor
   # Paste and run the migration
   ```

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials:
   # - SUPABASE_URL
   # - SUPABASE_ANON_KEY
   # - SUPABASE_SERVICE_ROLE_KEY (for admin operations)
   ```

## Installation

```bash
# Install dependencies
bun install

# Run database migrations in Supabase dashboard
# Copy contents of supabase/migrations/001_initial_schema.sql
```

## Development

```bash
# Start Redis (if not running)
redis-server

# Start development server
bun run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Send password reset email
- `POST /api/auth/update-password` - Update password
- `GET /api/auth/me` - Get current user

### User Profile
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account

### Decisions
- `GET /api/decisions` - List user's decisions
- `POST /api/decisions` - Create new decision
- `GET /api/decisions/:id` - Get decision details
- `PUT /api/decisions/:id` - Update decision
- `DELETE /api/decisions/:id` - Delete decision

### Simulations
- `POST /api/simulations/run` - Start new simulation
- `GET /api/simulations/:id` - Get simulation details
- `GET /api/simulations` - List simulation history
- `POST /api/simulations/:id/export` - Export simulation results

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check with dependency status

## Security Features

- **Row Level Security (RLS)**: All database tables have RLS enabled
- **Authentication**: JWT tokens via Supabase Auth
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Zod schemas for all inputs
- **CORS**: Configured for allowed origins
- **Helmet**: Security headers

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3001

# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:3000

# Frontend URL (for email redirects)
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info
```

## Testing

```bash
bun test
```

## Building

```bash
bun run build
```

## Production Deployment

1. Set all required environment variables
2. Ensure Redis is available
3. Run migrations in production Supabase project
4. Deploy the built application

```bash
bun run build
bun start
```