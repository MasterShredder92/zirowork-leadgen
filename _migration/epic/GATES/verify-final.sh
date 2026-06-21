#!/usr/bin/env bash
# DEFINITION OF DONE. The build is finished only when this exits 0 FROM A CLEAN CLONE,
# so anything gamed in a working tree can't certify it. Run it like:
#   git clone <repo> /tmp/dod && cd /tmp/dod && npm ci && bash _migration/epic/GATES/verify-final.sh
# It exits non-zero TODAY on purpose: later phases are PENDING (not built yet = not done).
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 2
fail=0
run(){ echo "=== $1 ==="; shift; "$@"; local e=$?; echo "exit=$e"; [ $e -ne 0 ] && fail=1; echo; }
pending(){ echo "=== $1 ==="; echo "PENDING — phase not complete; build is NOT done."; fail=1; echo; }

# Gate integrity first — if a gate was tampered with, nothing below can be trusted.
run "gate integrity" bash _migration/epic/GATES/gate-integrity.sh

# Phase gates (re-run from clean state).
run "phase 0" bash _migration/verify-phase-0.sh
run "phase 1" bash _migration/verify-phase-1.sh
run "phase 2 (spine)" bash _migration/verify-phase-2.sh
run "phase 2 wave C" bash _migration/epic/GATES/verify-phase-2-waveC.sh

# Repo-wide sweep (Phase 2 checks live now).
echo "=== repo sweep: no window.* in src/ ==="
w=$(grep -rnE "\bwindow\." src --include='*.ts' --include='*.tsx' 2>/dev/null \
    | grep -vE "addEventListener|removeEventListener|innerWidth|window\.matchMedia|window\.location" | wc -l)
echo "non-allowlisted window.* in src: $w"; [ "$w" -eq 0 ] || { echo "FAIL: window.* in src (only browser-API uses in client hooks allowed)"; fail=1; }
echo
echo "=== repo sweep: no hex literals outside globals.css ==="
h=$(grep -rniE "#[0-9a-f]{3,8}\b" src --include='*.tsx' --include='*.ts' 2>/dev/null | wc -l)
echo "hex in src components: $h"; [ "$h" -eq 0 ] || { echo "FAIL: hex literal in component — use var(--token)"; fail=1; }
echo
echo "=== repo sweep: legacy folders still excluded from tooling ==="
grep -q "00-\|99-agents\|schools\|dashboard" tsconfig.json && echo "ok: tsconfig still scopes to src" || { echo "WARN: confirm tsconfig excludes legacy"; }
echo

run "phase 3 views" bash _migration/epic/GATES/verify-phase-3-views.sh
run "phase 4 (surfaces)" bash _migration/verify-phase-4.sh
run "phase 5 (agent layer)" bash _migration/verify-phase-5.sh

echo "=== RESULT ==="
[ $fail -eq 0 ] && { echo "BUILD COMPLETE: PASS"; exit 0; } || { echo "BUILD NOT DONE (expected until all phases land)"; exit 1; }
