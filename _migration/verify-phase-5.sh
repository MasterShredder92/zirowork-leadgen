#!/usr/bin/env bash
# verify-phase-5.sh — Phase 5 gate.
# Contract: agent workflows + auth middleware + server client + fixture decoupling + loop-demo.
# Exit 0 = gate passes. Non-zero = real failure. No self-grading.
set -uo pipefail
fail=0
run(){ echo "=== $1 ==="; shift; "$@"; local e=$?; echo "exit=$e"; [ $e -ne 0 ] && fail=1; echo; }

# Gate integrity first
run "gate integrity" bash _migration/epic/GATES/gate-integrity.sh

# ---------------------------------------------------------------------------
echo "=== 5.A required files ==="
for f in \
  "_config/agent.md" \
  ".claude/workflows/gate-guard.md" \
  ".claude/workflows/generate-guard-retry.md" \
  "src/middleware.ts" \
  "src/lib/supabase/server.ts" \
  "src/proxy.ts"
do
  [ -f "$f" ] && echo "ok: $f" || { echo "FAIL: missing $f"; fail=1; }
done
echo

# ---------------------------------------------------------------------------
echo "=== 5.B middleware contents ==="
grep -q 'createServerClient' src/middleware.ts \
  && echo "ok: createServerClient in middleware.ts" \
  || { echo "FAIL: createServerClient missing in src/middleware.ts"; fail=1; }
grep -q 'app_metadata' src/middleware.ts \
  && echo "ok: role check in middleware.ts" \
  || { echo "FAIL: operator role check missing in src/middleware.ts"; fail=1; }
echo

# ---------------------------------------------------------------------------
run "loop-demo pct.guard.mjs" node _config/loop-demo/pct.guard.mjs

# ---------------------------------------------------------------------------
run "tsc --noEmit (type gate)"  npx tsc --noEmit
run "eslint (lint gate)"        npx eslint .

# ---------------------------------------------------------------------------
echo "=== 5.C serve gate ==="
npm run start >/tmp/p5.log 2>&1 & SRV=$!; sleep 5

check_200(){
  local path=$1 label=${2:-$1}
  local code; code=$(curl -sL -o /tmp/p5_body.html -w '%{http_code}' "http://localhost:3000${path}" 2>/dev/null || echo 000)
  echo "http=${code}  ${label}"; [ "$code" = "200" ] || { echo "FAIL: ${label} did not return 200"; fail=1; }
}
check_redir(){
  local path=$1 label=${2:-$1}
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000${path}" 2>/dev/null || echo 000)
  echo "http=${code}  ${label}"
  case "$code" in 301|302|307|308) : ;; *) echo "FAIL: ${label} not a redirect (got ${code})"; fail=1 ;; esac
}

# Operator routes must redirect (middleware auth gate active)
check_redir "/"         "operator / (auth redirect)"
check_redir "/insights" "operator /insights (auth redirect)"

# Public routes must serve
check_200 "/schools/test-fixture/piano"                      "schools test-fixture /piano"
check_200 "/schools/test-fixture/signup?instrument=piano"    "schools test-fixture /signup"
check_200 "/schools/test-fixture/thank-you?instrument=piano" "schools test-fixture /thank-you"
check_200 "/schools/test-fixture/confirm?instrument=piano"   "schools test-fixture /confirm"
check_200 "/dashboard?preview"                               "dashboard /?preview"

kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo

# ---------------------------------------------------------------------------
echo "=== RESULT ==="
[ $fail -eq 0 ] && { echo "PHASE 5 VERIFY: PASS"; exit 0; } || { echo "PHASE 5 VERIFY: FAIL"; exit 1; }
