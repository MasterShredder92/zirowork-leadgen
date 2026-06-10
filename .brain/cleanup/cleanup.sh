#!/bin/bash
# ZiroWork Repo Cleanup & Validation
# Runs at session close to maintain repo health
# Usage: bash .brain/cleanup/cleanup.sh

set -e

# Script lives at .brain/cleanup/ — go up two levels to reach repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

HEALTH_FILE=".brain/cleanup/repo-health.json"
REPORT_FILE=".brain/cleanup/cleanup-report.txt"

# --- Tier 2 Configuration Sync ---
# Default fallbacks if repo-health.json is missing or jq isn't installed
STALE_DAYS=30
MAX_SIZE_KB=30

if [ -f "$HEALTH_FILE" ] && command -v jq &> /dev/null; then
  STALE_DAYS=$(jq -r '.staleDaysThreshold // 30' "$HEALTH_FILE")
  MAX_SIZE_KB=$(jq -r '.maxFileSizeKB["*.md"] // 30' "$HEALTH_FILE")
fi

echo "=== ZiroWork Repo Health Check ===" > "$REPORT_FILE"
echo "Time: $(date)" >> "$REPORT_FILE"
echo "Config: Max Size ${MAX_SIZE_KB}KB | Stale Threshold ${STALE_DAYS} days" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# 1. Archive old session logs
echo "[1/4] Archiving old session logs..."
if [ -f ".brain/session-log.md" ]; then
  LINES=$(wc -l < .brain/session-log.md)
  if [ "$LINES" -gt 50 ]; then
    mkdir -p .brain/archive
    cp .brain/session-log.md ".brain/archive/session-log-backup-$(date +%Y%m%d-%H%M%S).md"
    # Keep only the 20 most recent lines (latest sessions)
    tail -20 .brain/session-log.md > .brain/session-log-tmp.md
    mv .brain/session-log-tmp.md .brain/session-log.md
    echo "✓ Archived old session logs (kept last 20 lines)" >> "$REPORT_FILE"
  fi
fi

# 2. Validate CONTEXT.md references (Multi-Link Proofed)
echo "[2/4] Validating CONTEXT.md references..."
if [ -f "CONTEXT.md" ]; then
  MISSING=0
  
  # Uses portable ERE grep to rip out every single instance of ](path) even if multi-lined
  while IFS= read -r LINK_RAW; do
    # Strip the leading ]( and trailing )
    FILE="${LINK_RAW#\](}"
    FILE="${FILE%)}"
    
    # Skip external links, pure hashes, and internal section anchors
    if [[ "$FILE" != http* ]] && [[ "$FILE" != \#* ]]; then
      if [ ! -f "$FILE" ]; then
        echo "✗ Missing reference in CONTEXT.md: $FILE" >> "$REPORT_FILE"
        ((MISSING++))
      fi
    fi
  done < <(grep -E -o '\]\([^)]+\)' CONTEXT.md || true)

  if [ "$MISSING" -eq 0 ]; then
    echo "✓ All CONTEXT.md references valid" >> "$REPORT_FILE"
  else
    echo "⚠ Found $MISSING broken references in CONTEXT.md" >> "$REPORT_FILE"
  fi
fi

# 3. Check for bloated files
echo "[3/4] Checking file sizes..."
BLOAT=0
shopt -s nullglob
for file in 94-knowledge/*.md .brain/*.md CLAUDE.md; do
  if [ -f "$file" ]; then
    SIZE_KB=$(du -k "$file" | cut -f1)
    if [ "$SIZE_KB" -gt "$MAX_SIZE_KB" ]; then
      echo "⚠ Large file: $file ($SIZE_KB KB)" >> "$REPORT_FILE"
      ((BLOAT++))
    fi
  fi
done
shopt -u nullglob

if [ "$BLOAT" -eq 0 ]; then
  echo "✓ No bloated files detected" >> "$REPORT_FILE"
else
  echo "⚠ Found $BLOAT files exceeding ${MAX_SIZE_KB}KB" >> "$REPORT_FILE"
fi

# 4. Check for orphaned .brain/ session artifacts
echo "[4/4] Checking for orphaned session artifacts..."
ORPHANED=0
shopt -s nullglob
for file in .brain/*.md; do
  if [ -f "$file" ]; then
    BASENAME=$(basename "$file")
    # Skip essential system files
    if [[ "$BASENAME" != "CLAUDE.md" && "$BASENAME" != "current-state.md" && "$BASENAME" != "whats-left.md" && "$BASENAME" != "session-log.md" ]]; then
      
      MTIME=$(stat -f%m "$file" 2>/dev/null || stat -c%Y "$file" 2>/dev/null || echo 0)
      NOW=$(date +%s)
      AGE_DAYS=$(( (NOW - MTIME) / 86400 ))

      if [ "$AGE_DAYS" -gt "$STALE_DAYS" ]; then
        echo "ℹ Candidate for archive: $file ($AGE_DAYS days old)" >> "$REPORT_FILE"
        ((ORPHANED++))
      fi
    fi
  fi
done
shopt -u nullglob

if [ "$ORPHANED" -eq 0 ]; then
  echo "✓ No orphaned session artifacts" >> "$REPORT_FILE"
else
  echo "ℹ Found $ORPHANED files older than $STALE_DAYS days (consider archiving)" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "=== Health Check Complete ===" >> "$REPORT_FILE"

# Show report to user
echo ""
head -20 "$REPORT_FILE"
echo "[Full report: $REPORT_FILE]"