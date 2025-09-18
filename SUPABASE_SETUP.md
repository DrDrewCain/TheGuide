# Supabase Setup Guide for TheGuide

This guide will help you set up Supabase as the backend database for TheGuide.

## 1. Create Supabase Account & Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Sign up or login
3. Click "New Project"
4. Fill in:
   - Project name: `theguide` (or your preference)
   - Database password: Generate a strong password
   - Region: Choose closest to your users
   - Plan: Free tier is fine for development

## 2. Get Your Project Credentials

After project creation, go to Settings > API:

- **Project URL**: `https://[YOUR-PROJECT-REF].supabase.co`
- **Anon/Public Key**: Used for client-side access
- **Service Role Key**: Used for admin/server-side access (keep secret!)

## 3. Run Database Migrations

1. Go to SQL Editor in your Supabase dashboard
2. Create a new query
3. Copy the entire contents of `/services/api/supabase/migrations/001_initial_schema.sql`
4. Paste and click "Run"

This will create:
- Custom types for decisions and simulations
- Tables with proper relationships
- Row Level Security (RLS) policies
- Automatic user profile creation trigger

## 4. Configure Authentication

1. Go to Authentication > Settings
2. Configure:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/auth/reset-password`

3. Enable Email Auth:
   - Go to Authentication > Providers
   - Ensure Email is enabled
   - Configure email templates if desired

## 5. Set Up Environment Variables

Create `.env` file in `/services/api/`:

```env
# Supabase Configuration
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJ... (your anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (your service role key)

# Other required variables
NODE_ENV=development
PORT=3001
REDIS_URL=redis://localhost:6379
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

## 6. Test Your Setup

1. Install dependencies:
   ```bash
   cd services/api
   bun install
   ```

2. Start Redis:
   ```bash
   redis-server
   ```

3. Start the API server:
   ```bash
   bun run dev
   ```

4. Test the health endpoint:
   ```bash
   curl http://localhost:3001/health/detailed
   ```

   You should see:
   ```json
   {
     "status": "healthy",
     "timestamp": "...",
     "checks": {
       "api": "ok",
       "supabase": "ok",
       "redis": "ok"
     }
   }
   ```

## 7. Security Best Practices

1. **Never commit `.env` files** - already in `.gitignore`
2. **Service Role Key** - Only use server-side, never expose to client
3. **RLS Policies** - All tables have RLS enabled by default
4. **Environment Variables** - Use different keys for production

## 8. Production Setup

For production deployment:

1. Create a separate Supabase project for production
2. Update Site URL and Redirect URLs to your production domain
3. Run the same migrations
4. Use production environment variables
5. Consider upgrading to a paid plan for better performance

## Troubleshooting

### "PGRST301" Error
- RLS policies are blocking access
- Check user authentication and permissions

### "already registered" Error
- User email already exists
- This is expected behavior

### Connection Issues
- Verify SUPABASE_URL is correct
- Check if project is paused (free tier pauses after inactivity)

## Next Steps

1. Test user registration: `POST /api/auth/register`
2. Create a test decision: `POST /api/decisions`
3. Run a simulation: `POST /api/simulations/run`

## Additional Resources

- [Supabase Docs](https://supabase.com/docs)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)