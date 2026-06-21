#!/usr/bin/env bash
set -uo pipefail
fail=0; G="src/app/globals.css"
run(){ echo "=== $1 ==="; shift; "$@"; local e=$?; echo "exit=$e"; [ $e -ne 0 ] && fail=1; echo; }
run "tsc --noEmit"  npx tsc --noEmit
run "eslint"        npx eslint .
run "next build"    npm run build

echo "=== 2.1 token parity ==="
dark=$(awk '/^@theme \{/{f=1;next} f&&/^\}/{f=0} f' "$G" | grep -oE -- '--color-[a-z0-9-]+:' | sort -u | wc -l)
light=$(sed -n '/\[data-theme="light"\]/,/^}/p' "$G" | grep -oE -- '--color-[a-z0-9-]+:' | sort -u | wc -l)
echo "dark=$dark light=$light"; { [ "$light" -gt 70 ]; } || { echo FAIL; fail=1; }
echo "=== 2.1 row-hover sentinel ==="
awk '/^@theme \{/{f=1} f' "$G" | grep -oE -- '--color-row-hover: [^;]+' | grep -q '0.03' || { echo "FAIL: row-hover"; fail=1; }

echo "=== 2.3 no hardcoded supabase secrets in source (must be empty) ==="
hits=$(grep -rnE 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9|NEXT_PUBLIC_SUPABASE_(URL|ANON_KEY)\s*=' src/ 2>/dev/null | grep -v 'process.env' | grep -v '\[^"' | wc -l)
echo "hits=$hits"; [ "$hits" = "0" ] || { echo "FAIL: hardcoded secrets in strings"; fail=1; }

echo "=== 2.3 serve gate: blank page 200, no hydration crash / example markers ==="
npm run start >/tmp/p2.log 2>&1 & SRV=$!; sleep 4
code=$(curl -s -o /tmp/p2.html -w '%{http_code}' http://localhost:3000/ || echo 000)
kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo "http=$code"; [ "$code" = "200" ] || { echo "FAIL: not 200"; fail=1; }
grep -qiE 'Get started by editing|create next app' /tmp/p2.html && { echo "FAIL: example markers"; fail=1; } || echo "ok: clean HTML"

echo "=== RESULT ==="
[ $fail -eq 0 ] && { echo "PHASE 2 VERIFY: PASS"; exit 0; } || { echo "PHASE 2 VERIFY: FAIL"; exit 1; }
