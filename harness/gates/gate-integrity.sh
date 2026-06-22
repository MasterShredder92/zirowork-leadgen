#!/usr/bin/env bash
# Proves no gate script was altered to force a pass. Compares sha256 of every gate against
# the committed manifest HASHES.txt. If a gate changed, this fails — and ONLY Zach regenerates
# HASHES.txt (by running this with --update) when a gate legitimately changes, then commits it.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
cd "$HERE/../.." || exit 2             # repo root
MANIFEST="$HERE/HASHES.txt"

list_gates(){
  echo harness/gates/verify-build.sh
  echo harness/gates/verify-no-hex.sh
  echo harness/gates/verify-phase-north-1.sh
}
mapfile -t GATES < <(list_gates | sort -u)

if [ "${1:-}" = "--update" ]; then
  : > "$MANIFEST"
  for g in "${GATES[@]}"; do [ -f "$g" ] && sha256sum "$g" >> "$MANIFEST"; done
  echo "HASHES.txt regenerated ($(wc -l < "$MANIFEST") gates). Commit it."; exit 0
fi

[ -f "$MANIFEST" ] || { echo "FAIL: no HASHES.txt — run with --update once, commit it."; exit 1; }
fail=0
while read -r want g; do
  g="${g#\*}"   # sha256sum on Windows prefixes path with * (binary mode) — strip it
  [ -f "$g" ] || { echo "FAIL: gate in manifest but missing: $g"; fail=1; continue; }
  got=$(sha256sum "$g" | awk '{print $1}')
  [ "$got" = "$want" ] || { echo "FAIL: gate altered since commit: $g"; fail=1; }
done < "$MANIFEST"
echo "=== RESULT ==="
[ $fail -eq 0 ] && { echo "GATE INTEGRITY: PASS"; exit 0; } || { echo "GATE INTEGRITY: FAIL (a gate changed — STOP, surface to Zach)"; exit 1; }
