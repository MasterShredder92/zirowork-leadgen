#!/usr/bin/env bash
set -uo pipefail

echo "========================================="
echo " ZiroWork Phase 1 Gate: Excise 2nd CRM   "
echo "========================================="

FAIL=0

# --- schema.sql check ---
# CRM table definitions must be deleted (docs only — live DDL is a separate step).
# We check for CREATE TABLE statements on the CRM-specific tables.
echo "Checking schema.sql for 2nd CRM table definitions..."
if grep -iE "CREATE TABLE (families|students|lessons|invoices|payroll|financials)" 94-knowledge/schema.sql 2>/dev/null; then
  echo "❌ FAIL: 2nd CRM table definitions still in schema.sql"
  FAIL=1
else
  echo "✅ schema.sql: no 2nd CRM tables"
fi

# --- src/ check (tracked files only) ---
# Check for CODE references to CRM-specific identifiers.
# We do NOT check for the word "families" alone (it appears in landing-page copy;
# removing that is Phase 2 vertical-vocab work). We check for:
#   - families_timeline (join table — uniquely 2nd CRM)
#   - use-students / use-lessons (old hook file names)
#   - payroll / financials (billing tables)
echo "Checking tracked src/ files for 2nd CRM code references..."
tracked=$(git ls-files src/ 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' || true)
crm_hits=""
if [ -n "$tracked" ]; then
  crm_hits=$(echo "$tracked" | xargs grep -lE "families_timeline|use[-_]?[Ss]tudents|use[-_]?[Ll]essons|payroll|financials" 2>/dev/null || true)
fi
if [ -n "$crm_hits" ]; then
  echo "$crm_hits"
  echo "❌ FAIL: tracked src/ files still reference 2nd CRM identifiers"
  FAIL=1
else
  echo "✅ src/: no 2nd CRM code references in tracked files"
fi

# Build integrity is covered by harness/gates/verify-build.sh — not repeated here.
# This gate is cold-clone-safe: schema grep + src grep are the only checks.

echo "========================================="
if [ $FAIL -eq 0 ]; then
  echo " PHASE 1 GATE: PASS                      "
  echo "========================================="
  exit 0
else
  echo " PHASE 1 GATE: FAIL                      "
  echo "========================================="
  exit 1
fi
