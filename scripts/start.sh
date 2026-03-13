#!/usr/bin/env sh
set -eu

echo "Applying Prisma migrations..."
npx prisma migrate deploy

if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  echo "RUN_DB_SEED=true -> seeding demo data..."
  npm run db:seed
fi

echo "Starting Next.js server..."
npm run start
