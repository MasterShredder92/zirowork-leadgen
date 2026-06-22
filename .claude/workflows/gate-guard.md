# Workflow: gate-guard — wraps any ticket that could touch protected files.

1. GENERATE  do the ticket's scoped edits (never a *.sh gate or HASHES.txt).
2. GUARD     bash harness/gates/gate-integrity.sh
3. WALL      exit 0 → gates intact, continue.
             exit 1 → a gate changed. HALT. Print the FAIL line. Surface to Zach.
                      Do NOT revert silently, do NOT --update, do NOT proceed.
