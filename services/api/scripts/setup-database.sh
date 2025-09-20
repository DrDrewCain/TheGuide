#!/bin/bash

# Script to set up Supabase database with migrations
# Usage: ./setup-database.sh

set -e

echo "🚀 Setting up Supabase database..."

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
API_DIR="$(dirname "$SCRIPT_DIR")"

# Check if .env exists
if [ ! -f "$API_DIR/.env" ]; then
    echo "❌ .env file not found. Please create one from .env.example"
    exit 1
fi

# Load environment variables
source "$API_DIR/.env"

# Extract connection details from DATABASE_URL or use SUPABASE_DB_URL
if [ -z "$SUPABASE_DB_URL" ]; then
    echo "❌ SUPABASE_DB_URL not found in .env"
    echo "Add: SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
    exit 1
fi

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ psql not found. Please install PostgreSQL client tools."
    echo "   On Mac: brew install postgresql"
    echo "   On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Check if SSL certificate exists
SSL_CERT="$API_DIR/prod-ca-2021.crt"
if [ ! -f "$SSL_CERT" ]; then
    echo "❌ SSL certificate not found at $SSL_CERT"
    exit 1
fi

# Export PGSSLROOTCERT for psql to use
export PGSSLROOTCERT="$SSL_CERT"

echo "🔐 Using SSL certificate: $SSL_CERT"

# Run migrations
echo "📝 Running migrations..."

for migration in "$API_DIR"/supabase/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "  → Running $(basename $migration)..."
        psql "$SUPABASE_DB_URL?sslmode=require" -f "$migration"

        if [ $? -eq 0 ]; then
            echo "  ✅ $(basename $migration) completed"
        else
            echo "  ❌ $(basename $migration) failed"
            exit 1
        fi
    fi
done

echo ""
echo "✨ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to your Supabase dashboard"
echo "2. Check that all tables are created"
echo "3. Verify RLS policies are enabled"
echo "4. Test with: bun run dev"