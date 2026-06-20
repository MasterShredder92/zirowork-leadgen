#!/usr/bin/env bash
# Wave C gate BUNDLE — multiple orthogonal channels so green can't come from gaming one check.
# READ-ONLY. Do not edit to pass; fix the work. If green needs editing this file → STOP, surface.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 2   # repo root
fail=0
run(){ echo "=== $1 ==="; shift; "$@"; local e=$?; echo "exit=$e"; [ $e -ne 0 ] && fail=1; echo; }

# ── Channel 1-3: toolchain ────────────────────────────────────────────────────
run "tsc --noEmit" npx tsc --noEmit
run "eslint"       npx eslint .
run "next build"   npm run build

# ── Channel 4: behavior/parity — pure derive fns, exact counts ────────────────
run "derive fns (fixtures)" node --experimental-strip-types _migration/epic/GATES/waveC.derive.test.ts

# ── Channel 5: structural audit (greps; violation => non-zero) ────────────────
echo "=== structural audit ==="
audit(){ # $1 = label, $2 = 1 means "must have hits", else "must be empty"; reads count on stdin
  local label="$1" want="$2" n; read -r n
  if [ "$want" = "haveeach" ]; then :; fi
  echo "$label: $n"
}

# 5a. 8 live hooks present in src/hooks
for h in useClients useCampaigns useLeads useEscalations useBookings useEnrollments useAutomationRules useAgentTenants; do
  c=$(grep -rl "\b$h\b" src/hooks 2>/dev/null | wc -l)
  [ "$c" -ge 1 ] || { echo "FAIL: live hook missing in src/hooks: $h"; fail=1; }
done
# 5b. 4 dead hooks must NOT be reintroduced into src
for d in useConversations useOperatorTasks useClientReports useIntegrations; do
  c=$(grep -rl "\b$d\b" src 2>/dev/null | wc -l)
  [ "$c" -eq 0 ] || { echo "FAIL: dead hook resurrected in src: $d"; fail=1; }
done
# 5c. BOTH escalation tables present (trap #1: don't collapse them)
grep -rqE "['\"]ziro_messaging_escalations['\"]" src/hooks src/lib 2>/dev/null || { echo "FAIL: ziro_messaging_escalations missing (rollups open-count)"; fail=1; }
grep -rqE "['\"]escalations['\"]" src/hooks 2>/dev/null || { echo "FAIL: escalations table missing (useEscalations)"; fail=1; }
# 5d. no non-browser-API window.* in the new spine (allowlist real browser APIs used by useIsMobile)
w=$(grep -rnE "\bwindow\." src/hooks src/lib/derive 2>/dev/null \
    | grep -vE "addEventListener|removeEventListener|innerWidth|matchMedia|window\.location" | wc -l)
echo "non-allowlisted window.* in new spine: $w"; [ "$w" -eq 0 ] || { echo "FAIL: window global leaked into src (e.g. window.sb / currentStudio / SEED_DATA)"; fail=1; }
# 5e. dead seed branch not ported
s=$(grep -rnE "SEED_DATA" src/hooks src/lib 2>/dev/null | wc -l)
echo "SEED_DATA refs in new spine: $s"; [ "$s" -eq 0 ] || { echo "FAIL: SEED_DATA ported (dead branch)"; fail=1; }
echo

# ── Channel 6: serve — page still 200, no hydration crash ─────────────────────
echo "=== serve gate ==="
npm run start >/tmp/wc.log 2>&1 & SRV=$!; sleep 4
code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ || echo 000)
kill $SRV 2>/dev/null; wait $SRV 2>/dev/null
echo "http=$code"; [ "$code" = "200" ] || { echo "FAIL: not 200"; fail=1; }
echo

echo "=== RESULT ==="
[ $fail -eq 0 ] && { echo "PHASE 2 WAVE C: PASS"; exit 0; } || { echo "PHASE 2 WAVE C: FAIL"; exit 1; }
