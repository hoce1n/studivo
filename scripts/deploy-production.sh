#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/hocein/projects/minimal-saas}"
PM2_APP_NAME="${PM2_APP_NAME:-studivo}"

cd "$APP_DIR"

git pull --ff-only
pnpm install --frozen-lockfile
pm2 stop "$PM2_APP_NAME" || true
rm -rf .next
pnpm exec prisma generate
pnpm build
pm2 start "$PM2_APP_NAME"
pm2 save