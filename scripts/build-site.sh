#!/usr/bin/env bash
# Assembles the deployable arcade in _deploy/:
#   site/            -> the menu (plain HTML/CSS/JS)
#   games/<name>/    -> each game is built (npm ci + test + build) and published at /<name>/
set -euo pipefail
cd "$(dirname "$0")/.."

node --check site/app.js
node --check site/games.js

rm -rf _deploy
cp -r site _deploy

for pkg in games/*/package.json; do
  [ -e "$pkg" ] || continue
  dir=$(dirname "$pkg")
  name=$(basename "$dir")
  echo "::group::Build $name"
  (cd "$dir" && npm ci --no-audit --no-fund && { npm test --if-present; } && npm run build)
  cp -r "$dir/dist" "_deploy/$name"
  echo "::endgroup::"
done

echo "Deploy folder:"; ls _deploy
