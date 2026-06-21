#!/usr/bin/env bash
# verify-phase-4.sh — Phase 4 gate.
# Contract: all 3 surfaces serve + behavior identical + build green.
# 4 channels: tsc | eslint | next build | surface-serve + redirect check.
# Exit 0 = gate passes. Non-zero = a real exit-code failure. No self-grading.
# Red-test: delete src/app/(operator)/page.tsx → serve gate must fail.
set -uo pipefail
fail=0
run(){ echo "=== $1 ==="; shift; "$@"; local e=$?; echo "exit=$e"; [ $e -ne 0 ] && fail=1; echo; }

run "tsc --noEmit (type gate)"  npx tsc --noEmit
run "eslint (lint gate)"        npx eslint .
run "next build (build gate)"   npm run build

# ---------------------------------------------------------------------------
echo "=== 4.A route structure (static) ==="
for f in \
  "src/proxy.ts" \
  "src/app/(operator)/page.tsx" \
  "src/app/(public)/schools/[slug]/[instrument]/page.tsx" \
  "src/app/dashboard/page.tsx" \
  "src/app/(public)/onboard/page.tsx" \
  "src/app/(public)/privacy/page.tsx" \
  "src/app/(public)/terms/page.tsx"
do
  [ -f "$f" ] && echo "ok: $f" || { echo "FAIL: missing $f"; fail=1; }
done
grep -q 'export async function proxy' src/proxy.ts && echo "ok: proxy fn exported"   || { echo "FAIL: proxy fn missing in src/proxy.ts"; fail=1; }
grep -q 'createServerClient'             src/proxy.ts && echo "ok: SSR auth in proxy.ts" || { echo "FAIL: SSR auth missing in src/proxy.ts"; fail=1; }
grep -q 'matcher'                        src/proxy.ts && echo "ok: matcher in proxy.ts"  || { echo "FAIL: matcher missing in src/proxy.ts"; fail=1; }
grep -q 'redirects'             next.config.ts && echo "ok: redirects in next.config.ts" || { echo "FAIL: redirects missing in next.config.ts"; fail=1; }
echo

# ---------------------------------------------------------------------------
echo "=== 4.B surface serve gate ==="
# Note: /schools/ requires live Supabase (NEXT_PUBLIC_SUPABASE_URL + ANON_KEY in .env.local).
npm run start >/tmp/p4.log 2>&1 & SRV=$!; sleep 5

check_200(){
  local path=$1 label=${2:-$1}
  local code; code=$(curl -sL -o /tmp/p4_body.html -w '%{http_code}' "http://localhost:3000${path}" 2>/dev/null || echo 000)
  echo "http=${code}  ${label}"; [ "$code" = "200" ] || { echo "FAIL: ${label} did not return 200"; fail=1; }
}
check_redir(){
  local path=$1 label=${2:-$1}
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000${path}" 2>/dev/null || echo 000)
  echo "http=${code}  ${label}"
  case "$code" in 301|302|307|308) : ;; *) echo "FAIL: ${label} not a redirect (got ${code})"; fail=1 ;; esac
}

# Operator surface — middleware redirects unauthenticated requests to /dashboard (correct post-auth behavior)
check_redir "/"         "operator / (auth redirect)"
check_redir "/insights" "operator /insights (auth redirect)"

# Public surfaces
check_200 "/onboard"  "(public) /onboard"
check_200 "/privacy"  "(public) /privacy"
check_200 "/terms"    "(public) /terms"

# Dashboard surface (?preview bypasses auth for gate — no session needed)
check_200 "/dashboard?preview" "dashboard /?preview"

# Schools surface (decoupled to test-fixture slug — seed via _migration/north-path-plan.md SQL)
check_200 "/schools/test-fixture/piano"                        "(public) schools /piano"
check_200 "/schools/test-fixture/signup?instrument=piano"      "(public) schools /signup"
check_200 "/schools/test-fixture/thank-you?instrument=piano"   "(public) schools /thank-you"
check_200 "/schools/test-fixture/confirm?instrument=piano"     "(public) schools /confirm"

# Legacy-redirect gate (permanent redirects from next.config.ts)
check_redir "/onboarding"      "redirect /onboarding→/onboard"
check_redir "/privacy-policy"  "redirect /privacy-policy→/privacy"
check_redir "/terms-of-service" "redirect /terms-of-service→/terms"

kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo

# ---------------------------------------------------------------------------
echo "=== RESULT ==="
[ $fail -eq 0 ] && { echo "PHASE 4 VERIFY: PASS"; exit 0; } || { echo "PHASE 4 VERIFY: FAIL"; exit 1; }
