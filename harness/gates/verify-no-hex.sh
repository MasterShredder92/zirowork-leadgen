#!/usr/bin/env bash
# verify-no-hex.sh — Gate: no raw hex color literals in src/ component files.
#
# Rule: The only legal home for a raw hex value is the @theme block in the
# global CSS token file. Components must use var(--token).
#
# Scans: src/**/*.{ts,tsx,js,jsx,css}
# Exempts: the single file in src/ that owns the @theme token block (globals.css).
# Fires on: #RGB  #RGBA  #RRGGBB  #RRGGBBAA  (case-insensitive, word-boundary)
#
# Per-line skip rules (all three must miss for a line to be flagged):
#   1. Comment lines — first non-whitespace is // or *
#   2. Token definition lines — line contains --color- followed by any chars then :
#      (covers both the @theme block in globals.css AND the THEME_CSS template-literal
#       block in DashboardShell.tsx — no filename exemption needed)
#   3. hex-allow marker — line contains the literal string "hex-allow"
#
# Exit 0 = PASS (no hits in scope).
# Exit 1 = FAIL (one or more hits).

set -uo pipefail

echo "============================================="
echo " verify-no-hex: hex literals in src/         "
echo "============================================="

# ── 1. Locate the @theme token SSOT file ─────────────────────────────────────
THEME_FILE=$(grep -rl '@theme' src/ 2>/dev/null | grep -E '\.(css)$' | head -n 1)

if [ -z "$THEME_FILE" ]; then
  echo "WARN: no @theme CSS file found under src/ — proceeding without exemption"
  THEME_FILE="__no_theme_file__"
else
  echo "Token SSOT (exempted): $THEME_FILE"
fi

# Check for ambiguity — more than one @theme CSS file would be unexpected
THEME_COUNT=$(grep -rl '@theme' src/ 2>/dev/null | grep -E '\.(css)$' | wc -l | tr -d ' ')
if [ "$THEME_COUNT" -gt 1 ]; then
  echo "AMBIGUITY: more than one CSS file with @theme found:"
  grep -rl '@theme' src/ | grep -E '\.(css)$'
  echo "Exempting only the first: $THEME_FILE"
fi

# ── 2. Gather candidate files ─────────────────────────────────────────────────
FILES=$(find src/ -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.css' \) 2>/dev/null)

if [ -z "$FILES" ]; then
  echo "PASS: no source files found in src/"
  exit 0
fi

# ── 3. Regex ─────────────────────────────────────────────────────────────────
# Matches # followed by exactly 3, 4, 6, or 8 hex digits at a word boundary.
HEX_RE='#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})([^0-9a-fA-F]|$)'

# ── 4. Scan ───────────────────────────────────────────────────────────────────
HITS=""
while IFS= read -r f; do
  # Normalize path separator for comparison
  normalized=$(echo "$f" | sed 's|\\|/|g')
  theme_norm=$(echo "$THEME_FILE" | sed 's|\\|/|g')
  # Skip the @theme SSOT CSS file entirely
  if [ "$normalized" = "$theme_norm" ]; then
    continue
  fi
  # Grep for hex hits; pipe through per-line skip rules:
  #   - skip comment lines (first non-whitespace = // or *)
  #   - skip token definition lines (contain --color-...:)
  #   - skip hex-allow lines
  result=$(grep -En "$HEX_RE" "$f" 2>/dev/null \
    | grep -Ev '^[0-9]+:[[:space:]]*//' \
    | grep -Ev '^[0-9]+:[[:space:]]*\*' \
    | grep -Ev -- '--[A-Za-z][A-Za-z0-9_-]*[[:space:]]*:' \
    | grep -Fv 'hex-allow' \
    || true)
  if [ -n "$result" ]; then
    while IFS= read -r line; do
      HITS="${HITS}${f}:${line}"$'\n'
    done <<< "$result"
  fi
done <<< "$FILES"

# ── 5. Report ─────────────────────────────────────────────────────────────────
if [ -n "$HITS" ]; then
  echo ""
  echo "FAIL: hex color literals found in src/ — use var(--token) or add hex-allow marker:"
  echo "----------------------------------------------------------------------"
  printf '%s' "$HITS"
  echo "----------------------------------------------------------------------"
  echo "Reference: src/app/globals.css @theme block for available tokens."
  exit 1
fi

echo "PASS: no hex color literals in src/ (token SSOT + definition lines + hex-allow exempted)"
exit 0
