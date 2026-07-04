#!/usr/bin/env bash
set -e

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

echo "==> Node: $(node --version), npm: $(npm --version)"

ROOT="/Users/srilekha/sus-score"

# ── 1. Build detector package first (no workspace deps) ─────────────────────
echo "==> [1/3] Installing detector package..."
cd "$ROOT/packages/detector"
npm install --legacy-peer-deps 2>&1 | grep -E "(added|error|warn)" | head -10
echo "==> Building detector..."
npx tsc 2>&1
echo "==> Detector built OK"

# ── 2. Install API deps ──────────────────────────────────────────────────────
echo "==> [2/3] Installing API deps..."
cd "$ROOT/api"
# Replace workspace reference with local path for standalone install
npm install --legacy-peer-deps 2>&1 | grep -E "(added|error|warn)" | head -10
echo "==> API deps OK"

# ── 3. Install frontend deps ─────────────────────────────────────────────────
echo "==> [3/3] Installing frontend deps..."
cd "$ROOT/app"
npm install --legacy-peer-deps 2>&1 | grep -E "(added|error|warn)" | head -10
echo "==> Frontend deps OK"

echo ""
echo "✅ Setup complete!"
