# Workflow: generate-guard-retry — generate → guard → exit-code drives retry.

INPUT: target file + mechanical guard (exit 0 pass / ≠0 fail) + max_attempts N.

1. GENERATE  write/edit ONLY the target file toward the spec.
2. GUARD     run the guard; capture exit code.
3. WALL
   exit 0  → PASS. Stop. Surface green to Zach (Zach commits).
   exit ≠0 → read FAIL lines, fix target, attempt++.
             attempt < N → goto 1.
             attempt = N → STOP. Surface last FAIL + "exhausted N attempts". Never claim done.

RULES: only the target is writable. Never edit the guard to pass. Never commit.
