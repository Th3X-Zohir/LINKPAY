#!/bin/sh
set -e

echo "[init] Running Prisma schema sync..."
node node_modules/prisma/build/index.js db push --schema=prisma/schema.prisma --skip-generate

echo "[init] Running first-time seed check..."
node prisma/seed-initial.js

echo "[init] Starting LinkPay app..."
exec node server.js
