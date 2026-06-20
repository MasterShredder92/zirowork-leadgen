# RUBRIC — Accept / Revise / Block + checkpoint ender schema

The independent checklist so the builder never grades itself. The gate bundle IS the rubric
for pass/fail; this file defines the verdict and the forced writeup that exposes what a green
gate can miss (subtly-wrong-but-passing, or a gate that was gamed).

## VERDICT
ACCEPT — all true:
1. The stage gate bundle exits 0 (every channel green).
2. `gate-integrity.sh` exits 0 (no gate script was altered).
3. The checkpoint ender exists and is complete (all 5 sections).
4. GAMING DISCLOSURE is empty.

REVISE — gate is red but the cause is in the WORK and is fixable within the attempt budget
(3 per channel). Fix the work, re-run. Never fix the gate.

BLOCK — STOP and surface to Zach when ANY of:
- Green is only reachable by changing a gate, test, or exclude.
- 3 attempts on one channel exhausted.
- A fact on disk contradicts the stage spec (Rule 14: code overrides docs).
- GAMING DISCLOSURE would be non-empty.

## CHECKPOINT ENDER SCHEMA (written to CHECKPOINTS/<stage>.md BEFORE declaring done)
Unbiased and adversarial on purpose. This is an AUDIT artifact, not proof of correctness.
Concatenated across all stages at the end = the forensic cheat-sheet of exactly what happened.

```
# CHECKPOINT — <stage> — <date>

## DID
- file-by-file: what was created/changed and why (one line each).

## GATE OUTPUT
- paste the literal verify-<stage>.sh output incl. every "exit=" line and RESULT.
- paste gate-integrity.sh RESULT.
(A reviewer re-runs these; fabricated output is caught on re-run.)

## DEVIATIONS
- anything done differently from the stage spec, and why. "none" if none.

## DID NOT VERIFY
- what is still unproven and why (e.g. "render-diff not run — Phase 3 gate not built yet").
- be specific; this is where subtly-wrong work hides.

## GAMING DISCLOSURE
- any gate / test / exclude / ignore touched: list it, or write "none".
- MUST be "none". If not, the verdict is BLOCK and you STOP here.
```
