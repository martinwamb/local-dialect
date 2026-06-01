#!/bin/bash
# Deploy script — run from server: bash ~/apps/local-dialect/deploy.sh
set -e

cd ~/apps/local-dialect

echo "Pulling latest code..."
git pull

echo "Installing dependencies..."
npm install --production=false

echo "Generating Prisma client..."
npx prisma generate

echo "Running migrations..."
npx prisma migrate deploy

echo "Building..."
npm run build

echo "Restarting PM2..."
pm2 startOrReload ecosystem.config.js --update-env

echo "Deploy complete! ✓"
pm2 logs local-dialect --nostream --lines 5
