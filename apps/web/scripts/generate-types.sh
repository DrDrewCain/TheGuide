#!/bin/bash

# Generate TypeScript types from Supabase database schema
# Usage: ./scripts/generate-types.sh

set -e

echo "🔄 Generating TypeScript types from Supabase..."

# Check if we're in the web app directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo "❌ Please run this script from the apps/web directory"
    exit 1
fi

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -E "^NEXT_PUBLIC_SUPABASE_URL" | xargs)
else
    echo "❌ .env.local not found"
    exit 1
fi

# Extract project ID from Supabase URL
PROJECT_ID=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -n 's/https:\/\/\(.*\)\.supabase\.co/\1/p')

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Could not extract project ID from NEXT_PUBLIC_SUPABASE_URL"
    exit 1
fi

echo "📦 Project ID: $PROJECT_ID"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing it via npm..."
    npm install -g supabase
fi

# Generate types using the Supabase API
echo "🔐 Generating types from Supabase project..."

# Create the directory if it doesn't exist
mkdir -p src/lib/supabase

# Use npx to run supabase CLI
npx supabase gen types typescript \
  --project-id "$PROJECT_ID" \
  --schema public \
  > src/lib/supabase/database.types.ts

echo "✅ Types generated at src/lib/supabase/database.types.ts"
echo ""
echo "💡 To keep types in sync:"
echo "   1. Run this script after database migrations"
echo "   2. Add to package.json scripts: \"generate:types\": \"./scripts/generate-types.sh\""
echo "   3. Consider adding to your CI/CD pipeline"