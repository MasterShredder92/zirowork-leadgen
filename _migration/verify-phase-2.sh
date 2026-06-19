#!/usr/bin/env bash
# verify-phase-2.sh — Phase 2 gate: CSS token spine
# Three teeth:
#   1. tsc + eslint + next build compile (invalid CSS exits non-zero)
#   2. dark/light --color-* parity: both must equal exactly 72 (every dark token has a light override)
#   3. --color-row-hover sentinel: dark=0.03, NOT collapsed into --color-hover (0.05)
# Falsification: change any guarded value and this goes red. That is correct behavior.
set -uo pipefail

fail=0
G="src/app/globals.css"

run() { echo "=== $1 ==="; shift; "$@"; local e=$?; echo "exit=$e"; [ $e -ne 0 ] && fail=1; echo; }

# ── Tooth 1: toolchain compile ────────────────────────────────────────────────
run "tsc --noEmit"  npx tsc --noEmit
run "eslint"        npx eslint .
run "next build"    npm run build

# ── Tooth 2: dark/light --color-* parity = 72 exactly ────────────────────────
# Counts only --color-* tokens (excludes --shadow-drawer) so the number is stable.
# Both blocks must match. Floor + ceiling = 72 — not "> 60" which a stripped file could pass.
echo "=== token parity: dark --color-* == light --color-* == 72 ==="
dark=$(awk '/^@theme \{/{f=1;next} f&&/^\}/{f=0} f' "$G" \
      | grep -oE -- '--color-[a-z0-9-]+:' | sort -u | wc -l | tr -d ' ')
light=$(awk '/\[data-theme="light"\] \{/{f=1;next} f&&/^  \}/{f=0} f' "$G" \
       | grep -oE -- '--color-[a-z0-9-]+:' | sort -u | wc -l | tr -d ' ')
echo "dark=$dark  light=$light  expected=72"
if [ "$dark" -eq 72 ] && [ "$light" -eq 72 ] && [ "$dark" -eq "$light" ]; then
  echo "PASS: parity dark=72 light=72"
else
  echo "FAIL: parity mismatch or wrong count (expected 72 each)"
  fail=1
fi
echo ""

# ── Tooth 3: --color-row-hover pixel catch ────────────────────────────────────
# Derived from 8 view call sites in derived.md:
#   T.rowHover || 'rgba(255,255,255,0.03)'   (dark)
#   T.rowHover = rgba(0,0,0,0.04)            (light, native)
# Dark MUST be 0.03. --color-hover (dark) is 0.05. They must not collapse — that
# would make dark row hover 67% brighter than intended.
echo "=== row-hover sentinel: dark=0.03, must differ from hover ==="
rh=$(awk '/^@theme \{/{f=1} f' "$G" | grep -oE -- '--color-row-hover: [^;]+' | head -1)
hv=$(awk '/^@theme \{/{f=1} f' "$G" | grep -oE -- '--color-hover: [^;]+' | head -1)
echo "row-hover: $rh"
echo "hover:     $hv"
ROW_HOVER_OK=1
echo "$rh" | grep -q '0\.03' || { echo "FAIL: dark --color-row-hover does not contain 0.03"; ROW_HOVER_OK=0; }
[ "$rh" != "${hv/hover/row-hover}" ] || { echo "FAIL: dark --color-row-hover collapsed into --color-hover value"; ROW_HOVER_OK=0; }
[ $ROW_HOVER_OK -eq 1 ] && echo "PASS: row-hover=0.03 and distinct from hover" || fail=1
echo ""

# ── Result ────────────────────────────────────────────────────────────────────
echo "=== RESULT ==="
[ $fail -eq 0 ] && { echo "PHASE 2 VERIFY: PASS"; exit 0; } || { echo "PHASE 2 VERIFY: FAIL"; exit 1; }
