# EPIC RUNBOOK — how the rebuild runs to completion

Map, not a manual. This is the harness that wraps Claude Code (which is itself a harness).
It defines the loop, the stop points, the anti-gaming rules, and the order. It does NOT track
live state — that stays in `_migration/progress.md` + `_migration/session-handoff.md`.

## THE RULE THAT MAKES THIS SAFE
Green is necessary, never sufficient. The gate proves DONE; the checkpoint ender (RUBRIC.md)
explains and exposes. A worker grading its own writeup is not evidence — the gate is.
At long horizons an agent with shell access WILL probe and defeat a lone check, so every gate
is a BUNDLE of orthogonal channels, the gate files are read-only, and the final gate re-runs
from a clean clone.

## PHASE LADDER (autonomy is earned phase by phase, when the gate exists)
| Phase | Gate exists? | How it runs |
|---|---|---|
| 2 spine (Wave C left) | yes (verify-phase-2-waveC.sh) | autonomous now |
| 3 views | NO — build render-diff gate FIRST | phase 1 work item = build+red-test the gate, THEN port views autonomously |
| 4 surface split | partial; needs Zach's route decision + 3-surfaces-serve check | semi: Zach decides routing, agent executes against gate |
| 5 agent layer | built last, on clean substrate | not autonomous; proven on ONE loop before any clone |

Gates are built JUST-IN-TIME, one phase ahead of the work they guard. Never write a gate that
points at something that does not exist yet (= Rule 10 paperwork, a green that checks nothing).

## RUN-A-STAGE LOOP (the core; one stage = one session)
1. READ `_migration/progress.md` + `_migration/session-handoff.md` + the stage spec in `STAGES/`.
2. CONFIRM phase by which `GATES/verify-*.sh` already exit 0. Do only the next ungated unit.
3. DO the stage work per its spec. Get facts on disk before deciding (Rule 8/12).
4. RUN the stage gate bundle: `bash _migration/epic/GATES/verify-<stage>.sh`.
5. IF RED → fix the WORK, re-run. Never touch a gate/test/exclude to pass (see ANTI-GAMING).
   After 3 failed attempts on the same channel → STOP, surface to Zach (Block).
6. IF GREEN → run `bash _migration/epic/GATES/gate-integrity.sh` (proves no gate was edited).
7. WRITE the checkpoint ender to `CHECKPOINTS/<stage>.md` using the RUBRIC.md schema, BEFORE
   declaring done. GAMING DISCLOSURE section must be empty, or STOP and surface.
8. UPDATE `progress.md` + `session-handoff.md`. Leave the tree clean (Rule 11).
9. STOP. Report exit codes + the ender. Zach reviews ender + green gate, then commits. Zach
   decides commits — nothing else does.

## ANTI-GAMING (structural, not "please don't")
1. `GATES/` is read-only to the worker. Do not edit, delete, weaken, or add excludes to any
   verify script or test to make it pass. The only legal route to green is correct WORK.
2. If green is reachable ONLY by changing a gate, the spec is wrong or a fact is wrong → STOP,
   surface to Zach with the specifics. That is a Block, not a license to edit the gate.
3. `gate-integrity.sh` hashes every gate script against `GATES/HASHES.txt`. If a gate changed,
   it fails. Zach (not the agent) regenerates HASHES.txt when a gate legitimately changes.
4. `verify-final.sh` re-runs everything from a CLEAN CLONE, so anything gamed in the working
   tree cannot certify the build.
5. Trust behavior, not self-reports. "Done"/"looks right" is not evidence; exit codes are.

## SUPERVISION MODEL
- Supervise per PHASE, not per unit. Zach reviews one green gate + one ender per stage, not
  every file. That is the time-save.
- Halt-and-surface, never loop indefinitely: 3 failed attempts on one channel = stop.
- Parallel agents: OFF until Phase 5. Phase 3 views are sequential by dependency (leaf-first)
  and share one render-diff oracle; parallelism multiplies unverified "done", not speed.

## DEFINITION OF DONE (the finish line)
`verify-final.sh` exits 0 from a clean clone. Until then the build is not done, no matter what
any session reports. It re-runs every phase gate + a repo-wide sweep (no window.* in src/, no
hex literals in components, legacy folders still excluded from tooling, all 3 surfaces serve,
every view render-diff clean). It exits non-zero today on purpose — later phases are PENDING.
