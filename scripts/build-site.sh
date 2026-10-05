#!/usr/bin/env bash
# Assembles the deployable arcade in _deploy/:
#   site/            -> the menu (plain HTML/CSS/JS)
#   games/<name>/    -> each game is built (npm ci + test + build) and published at /<name>/
set -euo pipefail
cd "$(dirname "$0")/.."

for js in site/*.js; do node --check "$js"; done

rm -rf _deploy
cp -r site _deploy

# Which site this build is for: "dev" (default; the azurestaticapps.net test site, from main)
# or "production" (nzdogames.com, from the production branch). The dev site shows a DEV ribbon
# and asks search engines not to index it.
ARCADE_ENV="${ARCADE_ENV:-dev}"
case "$ARCADE_ENV" in dev|production) ;; *) echo "ARCADE_ENV must be dev or production" >&2; exit 1 ;; esac
printf 'window.ARCADE_ENV = "%s";\n' "$ARCADE_ENV" > _deploy/env.js
if [ "$ARCADE_ENV" = production ]; then
  printf 'User-agent: *\nAllow: /\n' > _deploy/robots.txt
else
  printf 'User-agent: *\nDisallow: /\n' > _deploy/robots.txt
fi
echo "Building for: $ARCADE_ENV"

for pkg in games/*/package.json; do
  [ -e "$pkg" ] || continue
  dir=$(dirname "$pkg")
  name=$(basename "$dir")
  echo "::group::Build $name"
  (cd "$dir" && npm ci --no-audit --no-fund && { npm test --if-present; } && npm run build)
  cp -r "$dir/dist" "_deploy/$name"
  # Only the arcade's own staticwebapp.config.json (at the root) should apply.
  rm -f "_deploy/$name/staticwebapp.config.json"
  echo "::endgroup::"
done

echo "Deploy folder:"; ls _deploy
