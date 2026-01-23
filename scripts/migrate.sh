#!/bin/bash
set -e

echo "Running Prisma migrations..."

# Generate Prisma client
prisma generate

# Try to run migrations
if ! prisma migrate deploy 2>&1 | tee /tmp/migrate-output.txt; then
  # Check if it's the baseline error
  if grep -q "P3005" /tmp/migrate-output.txt || grep -q "database schema is not empty" /tmp/migrate-output.txt; then
    echo "Database is not empty. Creating baseline..."

    # Mark all existing migrations as applied (baseline)
    for migration in prisma/migrations/*/; do
      migration_name=$(basename "$migration")
      echo "Marking $migration_name as applied..."
      prisma migrate resolve --applied "$migration_name" || true
    done

    echo "Baseline created. Migrations are now in sync."
  else
    # If it's a different error, fail the build
    echo "Migration failed with unexpected error"
    exit 1
  fi
fi

echo "Migrations complete!"
