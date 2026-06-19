#!/usr/bin/env bash
# verify-phase-1.sh — Phase 1 gate. Toolchain must build, type-check, lint clean,
# and serve a BLANK page (no create-next-app example content left behind).
# Exit 0 = gate passes. Non-zero = a real exit-code failure. No self-grading.
set -uo pipefail
fail=0
run(){ echo "=== $1 ==="; shift; "$@"; local e=$?; echo "exit=$e"; [ $e -ne 0 ] && fail=1; echo; }

run "tsc --noEmit (type gate)"  npx tsc --noEmit
run "eslint (lint gate — separate; next build no longer lints in v16)"  npx eslint .
run "next build (build gate, also type-checks)"  npm run build

echo "=== serve gate: blank page returns 200, no example markers ==="
npm run start >/tmp/p1_start.log 2>&1 &
SRV=$!; sleep 4
code=$(curl -s -o /tmp/p1_body.html -w '%{http_code}' http://localhost:3000/ || echo 000)
kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo "http=$code"
[ "$code" = "200" ] || { echo "FAIL: / did not return 200"; fail=1; }
if grep -qiE 'Get started by editing|create next app|next\.svg|vercel\.svg' /tmp/p1_body.html; then
  echo "FAIL: create-next-app example content still present — page not blanked"; fail=1
else echo "ok: no example markers in served HTML"; fi
echo
echo "=== RESULT ==="
[ $fail -eq 0 ] && { echo "PHASE 1 VERIFY: PASS"; exit 0; } || { echo "PHASE 1 VERIFY: FAIL"; exit 1; }
