# Agent config — gate-integrity loop (Phase 5 unit 1)

READ:   harness/gates/verify-build.sh, harness/gates/HASHES.txt, this file, .claude/workflows/gate-guard.md
TOOLS:  bash (to RUN gate-integrity.sh), read. No write to any *.sh gate or HASHES.txt.
RULE:   Gate scripts + HASHES.txt are frozen. Never edit them.
LEGIT CHANGE: if a gate must change, STOP and surface to Zach. Only Zach runs `--update` + commits.
STOP:   gate-integrity.sh exits non-zero → halt, surface the FAIL line, do not proceed, do not self-fix.
