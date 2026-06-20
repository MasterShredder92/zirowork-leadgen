#!/usr/bin/env bash
# Phase 3 views gate BUNDLE — orthogonal channels; fix WORK not gate to pass.
# READ-ONLY. Editing this file to pass → gate-integrity fails → STOP, surface to Zach.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 2   # repo root
fail=0
run(){ echo "=== $1 ==="; shift; "$@"; local e=$?; echo "exit=$e"; [ $e -ne 0 ] && fail=1; echo; }

# ── VIEWS REGISTRY ────────────────────────────────────────────────────────────
# Source of truth: which views have been ported and have committed baselines.
# Add a view ONLY when its baseline PNG exists at GATES/snapshots/<view>.png.
# Gate goes RED if this list is empty or a view fails render-diff.
VIEWS=(
  "insights"
)

# ── Channel 1-3: toolchain ────────────────────────────────────────────────────
run "tsc --noEmit"  npx tsc --noEmit
run "eslint"        npx eslint .
run "next build"    npm run build

# ── Channel 4: render-diff ────────────────────────────────────────────────────
echo "=== render-diff ==="
if [ ${#VIEWS[@]} -eq 0 ]; then
  echo "FAIL: VIEWS array is empty — no views registered yet"; fail=1
else
  # Start Next.js production server (built in channel 3)
  npm run start >/tmp/ph3-next.log 2>&1 & NEXT_PID=$!

  # Start legacy static server for comparison reference (only needed during baseline generation,
  # but kept here so the gate can be re-run if baselines need regeneration)
  npx serve . -p 3001 --no-clipboard >/tmp/ph3-legacy.log 2>&1 & LEGACY_PID=$!

  # Wait for Next.js to be ready
  for i in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ 2>/dev/null || echo 000)
    [ "$code" = "200" ] && break
    sleep 1
  done

  for v in "${VIEWS[@]}"; do
    echo "--- render-diff: $v ---"
    node _migration/epic/GATES/render-diff.mjs compare "$v"
    e=$?; echo "exit=$e"; [ $e -ne 0 ] && fail=1
  done

  kill $NEXT_PID   2>/dev/null; wait $NEXT_PID   2>/dev/null
  kill $LEGACY_PID 2>/dev/null; wait $LEGACY_PID 2>/dev/null
fi
echo

# ── Channel 5: structural — no window.* in ported components ─────────────────
echo "=== structural: no window.* in src/components/ ==="
if [ -d src/components ] && [ "$(ls -A src/components 2>/dev/null)" ]; then
  w=$(grep -rnE "\bwindow\." src/components/ 2>/dev/null \
      | grep -vE "window\.location|window\.history|window\.open" | wc -l)
  echo "window.* refs in src/components: $w"
  [ "$w" -eq 0 ] || { echo "FAIL: window.* globals in ported components"; fail=1; }

  for v in "${VIEWS[@]}"; do
    # Verify each registered view has a component in src/components/
    count=$(find src/components -name "*.tsx" 2>/dev/null | xargs grep -l "${v}\|${v//-/}" 2>/dev/null | wc -l)
    echo "component files for $v: $count"
    [ "$count" -ge 1 ] || { echo "FAIL: no component found for registered view '$v' in src/components/"; fail=1; }
  done
else
  echo "FAIL: src/components/ is missing or empty — no views have been ported yet"; fail=1
fi
echo

# ── Channel 6: route check — each ported view returns 200 ────────────────────
echo "=== route check ==="
npm run start >/tmp/ph3-route.log 2>&1 & ROUTE_PID=$!
for i in $(seq 1 20); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ 2>/dev/null || echo 000)
  [ "$code" = "200" ] && break
  sleep 1
done

for v in "${VIEWS[@]}"; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000/${v}" 2>/dev/null || echo 000)
  echo "/$v → $code"
  [ "$code" = "200" ] || { echo "FAIL: /$v not 200"; fail=1; }
done

kill $ROUTE_PID 2>/dev/null; wait $ROUTE_PID 2>/dev/null
echo

echo "=== RESULT ==="
[ $fail -eq 0 ] && { echo "PHASE 3 VIEWS: PASS"; exit 0; } || { echo "PHASE 3 VIEWS: FAIL"; exit 1; }
