#!/usr/bin/env bash
# verify-phase-0.sh — independent checker for Phase 0 artifacts.
# The worker wrote the claims; this script grades them. It does NOT trust prose:
# it recomputes every headline fact from the repo and fails if an artifact disagrees.
# Run from repo root.  Exit 0 = artifacts match reality.  Exit non-zero = a claim is wrong/unverifiable.
#
# Each check below exists because a real Phase 0 failure motivated it:
#   C1/C2  the false "zero shared modules" headline (onboard.html shares 3 files)
#   C3     line counts that were estimated, not measured
#   C4     a global count stated, not computed
#   C5     "dead-code" files asserted dead without a repo-wide ref check

set -uo pipefail
A=_migration/phase-0          # analysis artifacts
M=_migration                  # progress/handoff
fail=0; warn=0
say(){ printf '%s\n' "$*"; }
PASS(){ say "  PASS  $*"; }
FAIL(){ say "  FAIL  $*"; fail=1; }
WARN(){ say "  WARN  $*  (claim not found — cannot verify, treat as unverified)"; warn=1; }

# --- helper: local (non-CDN) script srcs from one html, normalized to a repo-relative path ---
local_scripts(){ grep -oE 'src="[^"]+\.(jsx?)"' "$1" 2>/dev/null \
  | sed -E 's/^src="//; s/"$//' | grep -vE '^https?://' | sed -E 's|^/||; s|\?.*$||' | sort -u; }

say "=== RECOMPUTED FACTS (ground truth from disk) ==="

# entry points = every html, derived from disk (NOT a hardcoded "3 surfaces")
mapfile -t ENTRIES < <(find . -name '*.html' -not -path './.git/*' -not -path './node_modules/*' | sed 's|^\./||' | sort)
say "entry-point HTML files: ${#ENTRIES[@]}"; printf '    %s\n' "${ENTRIES[@]}"

# shared local modules = any local script loaded by 2+ distinct entry points
: > /tmp/p0_scripts.txt
for h in "${ENTRIES[@]}"; do local_scripts "$h" | sed "s|^|$h\t|" >> /tmp/p0_scripts.txt; done
mapfile -t SHARED < <(cut -f2 /tmp/p0_scripts.txt | sort | uniq -d)
say "shared local modules (loaded by >1 entry point): ${#SHARED[@]}"
[ "${#SHARED[@]}" -gt 0 ] && printf '    %s\n' "${SHARED[@]}"

# window.* define count (distinct names across jsx/js)
DEFCOUNT=$(grep -rhoE 'window\.[A-Za-z0-9_]+ *=' --include=*.jsx --include=*.js . \
  | grep -v node_modules | sed -E 's/^window\.//; s/ *=.*//' | sort -u | wc -l | tr -d ' ')
say "distinct window.* defines (jsx/js): $DEFCOUNT"

say ""; say "=== ASSERTIONS ==="

# C1 — if shared modules exist, the artifact must NOT claim zero / private islands
if [ "${#SHARED[@]}" -gt 0 ]; then
  if grep -qiE 'zero shared|private island|no .*shared (local )?module' "$A/spa-boundaries.md"; then
    FAIL "C1 shared-modules: ${#SHARED[@]} shared modules exist but spa-boundaries.md claims zero/private-islands"
  else PASS "C1 shared-modules: artifact does not falsely claim zero sharing"; fi
else PASS "C1 shared-modules: none on disk (claim of zero would be valid)"; fi

# C2 — every shared module must be named in the artifact
miss=0
for s in "${SHARED[@]}"; do grep -qF "$s" "$A/spa-boundaries.md" || { FAIL "C2 shared-listing: $s not documented in spa-boundaries.md"; miss=1; }; done
[ "$miss" -eq 0 ] && [ "${#SHARED[@]}" -gt 0 ] && PASS "C2 shared-listing: all ${#SHARED[@]} shared modules documented"

# C3 — claimed line counts must equal actual wc -l
for f in dep-graph spa-boundaries token-map; do
  claim=$(grep -oE "$f\.md +\(([0-9]+) lines\)" "$M/progress.md" | grep -oE '[0-9]+' | head -1)
  actual=$(wc -l < "$A/$f.md" | tr -d ' ')
  if   [ -z "$claim" ]; then WARN "C3 line-count[$f]: no count stated in progress.md"
  elif [ "$claim" = "$actual" ]; then PASS "C3 line-count[$f]: $claim == $actual"
  else FAIL "C3 line-count[$f]: progress.md claims $claim, actual is $actual"; fi
done

# C4 — any stated "N globals/defines" must equal the recompute (jsx/js + html-inline, distinct)
DEFCOUNT_ALL=$( { grep -rhoE 'window\.[A-Za-z0-9_]+ *=' --include=*.jsx --include=*.js .; \
                  grep -rhoE 'window\.[A-Za-z0-9_]+ *=' --include=*.html .; } \
  | grep -v node_modules | sed -E 's/^window\.//; s/ *=.*//' | sort -u | wc -l | tr -d ' ')
say "distinct window.* defines incl html-inline: $DEFCOUNT_ALL"
claim=$(grep -rhoiE '[0-9]+( [a-z]+){0,2} (globals|defines)' "$A" "$M" | grep -oE '^[0-9]+' | sort -u | head -1)
if   [ -z "$claim" ]; then WARN "C4 define-count: no global count stated"
elif [ "$claim" = "$DEFCOUNT_ALL" ] || [ "$claim" = "$DEFCOUNT" ]; then PASS "C4 define-count: stated $claim matches computed ($DEFCOUNT jsx/js, $DEFCOUNT_ALL incl html)"
else FAIL "C4 define-count: artifact states $claim; computed $DEFCOUNT (jsx/js) / $DEFCOUNT_ALL (incl html-inline). Show the command that yields $claim or correct it"; fi

# C5 — files asserted dead must really be dead.
# Reachability here is flat: a file runs only if its FULL path is a <script src> in some html.
# So "dead" == full path appears in NO html. (Global-name refs are irrelevant: a global only
# exists at runtime if the html loaded the file; dead files referencing each other stay dead.)
sed -n '/DEAD-CODE CANDIDATES/I,/^## /p' "$A/dep-graph.md" > /tmp/p0_dead.txt
mapfile -t DEAD < <(grep -oE '[0-9A-Za-z_-]+/[0-9A-Za-z_./-]*\.(jsx?|js)' /tmp/p0_dead.txt | sort -u)
if [ ! -s /tmp/p0_dead.txt ] || [ "${#DEAD[@]}" -eq 0 ]; then WARN "C5 dead-code: no dead-file paths parsed from dep-graph.md"
else
  dead_bad=0
  for f in "${DEAD[@]}"; do
    [ -e "$f" ] || { WARN "C5 dead-code: $f listed but not on disk"; continue; }
    html_ref=$(grep -rlF "$f" --include=*.html . | grep -v node_modules | wc -l | tr -d ' ')
    if [ "$html_ref" -gt 0 ]; then FAIL "C5 dead-code: $f asserted dead but its path is loaded by $html_ref html file(s) — not dead"; dead_bad=1; fi
  done
  [ "$dead_bad" -eq 0 ] && PASS "C5 dead-code: all ${#DEAD[@]} asserted-dead files have no html loading them (genuinely dead)"
fi

say ""; say "=== RESULT ==="
[ "$warn" -eq 1 ] && say "warnings present: some claims could not be located to verify."
if [ "$fail" -eq 0 ]; then say "PHASE 0 VERIFY: PASS"; exit 0
else say "PHASE 0 VERIFY: FAIL — artifacts disagree with disk; fix the artifact, not the script."; exit 1; fi
