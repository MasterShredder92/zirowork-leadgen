#!/usr/bin/env bash
# Guards operator views + shell + connectors from raw hex color literals.
# Scope: src/components/views/ + src/components/shell/ + src/components/connectors/ (tracked files only).
# Schools/dashboard/forms use separate design systems and are excluded.
# Untracked WIP files are excluded — they must comply before being committed.
# Rule: all colors in operator components must use var(--token) from globals.css.
set -uo pipefail

echo "========================================="
echo " No-hex guard: views/ + shell/ + connectors/ "
echo "========================================="

DIRS="src/components/views src/components/shell src/components/connectors"

tracked=$(git ls-files $DIRS 2>/dev/null | grep -E '\.(tsx|ts)$')

if [ -z "$tracked" ]; then
  echo "PASS: no tracked tsx/ts files in scope"
  exit 0
fi

# Match hex inside any string: catches both "#fff" and "1px solid #fff"
hits=$(echo "$tracked" | xargs grep -En "[\"'][^\"']*#[0-9a-fA-F]{3,8}" 2>/dev/null || true)

if [ -n "$hits" ]; then
  echo "$hits"
  echo "FAIL: hex literal colors found — use var(--token) instead (see globals.css)"
  exit 1
fi

echo "PASS: no hex literals in operator views/shell"
exit 0
