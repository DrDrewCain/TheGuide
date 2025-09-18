import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

// Create an admin client for server-side operations
export const supabaseAdmin = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY || config.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);