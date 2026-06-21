#!/usr/bin/env bash
# Standing build gate. Replaces verify-phase-3-views (render-diff retired, see DECISIONS.md).
# Clean-clone proof: build + tsc + lint + routes serve. No pixel fidelity.
# Exit 0 = pass. Non-zero = fail.
set -uo pipefail
fail=0
run(){ echo "=== $1 ==="; shift; "$@"; local e=$?; echo "exit=$e"; [ $e -ne 0 ] && fail=1; echo; }

run "build" npm run build
run "tsc"   npx tsc --noEmit
run "lint"  npx eslint .

echo "=== serve ==="
npm run start >/tmp/vb.log 2>&1 & SRV=$!; sleep 5

check_200(){
  local path=$1 label=${2:-$1}
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000${path}" 2>/dev/null || echo 000)
  echo "http=${code}  ${label}"
  [ "$code" = "200" ] || { echo "FAIL: ${label} did not return 200 (got ${code})"; fail=1; }
}
check_redir(){
  local path=$1 label=${2:-$1}
  local code; code=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:3000${path}" 2>/dev/null || echo 000)
  echo "http=${code}  ${label}"
  case "$code" in 301|302|307|308) : ;; *) echo "FAIL: ${label} not a redirect (got ${code})"; fail=1 ;; esac
}

check_redir "/"         "operator / (auth redirect)"
check_redir "/insights" "operator /insights (auth redirect)"

check_200 "/schools/test-fixture/piano"                      "schools /piano"
check_200 "/schools/test-fixture/signup?instrument=piano"    "schools /signup"
check_200 "/schools/test-fixture/thank-you?instrument=piano" "schools /thank-you"
check_200 "/schools/test-fixture/confirm?instrument=piano"   "schools /confirm"
check_200 "/dashboard?preview"                               "dashboard /?preview"

grep -q " 500 " /tmp/vb.log && { echo "FAIL: 500 in server log"; fail=1; }

kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo

echo "=== RESULT ==="
[ $fail -eq 0 ] && { echo "BUILD VERIFY: PASS"; exit 0; } || { echo "BUILD VERIFY: FAIL"; exit 1; }
