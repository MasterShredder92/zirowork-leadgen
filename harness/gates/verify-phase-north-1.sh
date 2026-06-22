#!/usr/bin/env bash
set -e

echo "========================================="
echo " ZiroWork Phase 1 Gate: Excise 2nd CRM   "
echo "========================================="

# 1. Grep Check
echo "Running CRM grep check..."
# We expect NO output from grep, so if it finds something, we fail.
# grep exits 0 if lines are found, 1 if no lines are found. We want it to exit 1 (nothing found).
if grep -riE "families|use-students|use-lessons|payroll|financials" src/ 94-knowledge/schema.sql; then
  echo "❌ FAIL: Found remnants of the old CRM in src/ or schema.sql"
  exit 1
fi
echo "✅ Grep check passed (no CRM remnants found)"

# 2. Build Check
echo "Running next build..."
if ! npx cross-env NEXT_TELEMETRY_DISABLED=1 next build; then
  echo "❌ FAIL: next build failed"
  exit 1
fi
echo "✅ Build passed"

echo "========================================="
echo " PHASE 1 GATE: PASS                      "
echo "========================================="
exit 0
