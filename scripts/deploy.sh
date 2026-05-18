#!/usr/bin/env bash
# Build and publish compose-claude to GitHub Pages (mbousendorfer/skyline-rage).
#
# Usage: ./scripts/deploy.sh
#
# Requires: ../design checkout available, node_modules symlink resolved, gh CLI authed.

set -euo pipefail

REPO_OWNER="mbousendorfer"
REPO_NAME="skyline-rage"
BASE_HREF="/${REPO_NAME}/"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d "../design" ]; then
  echo "error: ../design checkout is required for SCSS includes and assets" >&2
  exit 1
fi

echo "==> Building (base-href=${BASE_HREF})"
node_modules/.bin/ng build --base-href="$BASE_HREF" --configuration=production

BUILD_DIR="$ROOT_DIR/dist/compose-claude/browser"
if [ ! -f "$BUILD_DIR/index.html" ]; then
  echo "error: build output not found at $BUILD_DIR" >&2
  exit 1
fi

MAIN_SHA="$(git rev-parse --short HEAD)"
TMP="$(mktemp -d -t skyline-rage-ghpages)"
trap 'rm -rf "$TMP"' EXIT

echo "==> Staging build in $TMP"
cp -R "$BUILD_DIR"/. "$TMP/"
touch "$TMP/.nojekyll"

cd "$TMP"
git init -b gh-pages -q
git add .
git commit -q -m "deploy: build from main@${MAIN_SHA}"
git remote add origin "https://github.com/${REPO_OWNER}/${REPO_NAME}.git"
echo "==> Force-pushing to origin/gh-pages"
git push -f origin gh-pages

echo
echo "Deployed. Site: https://${REPO_OWNER}.github.io/${REPO_NAME}/"
echo "(GitHub Pages may take 30-60s to refresh the CDN.)"
