# harness/ — the agent harness

Why this folder exists: when the agent fails, you fix the HARNESS, not the model.
You can only fix what you can find. This is the harness and how to change it.

## The 5 layers — where each lives, how to change it
| Layer | What | Lives at | Change by |
|---|---|---|---|
| Instructions | rules the agent follows | `/CLAUDE.md` (router) · `harness/agent.md` (governance) | edit file; no gate |
| Tools | what the agent may call | `.mcp.json` (root) · skills = **NOT BUILT (TODO)** | add MCP entry / build skill |
| Environment | runnable, typed, lintable setup | `package.json` `tsconfig.json` `eslint.config.mjs` `next.config.ts` `src/proxy.ts` — **pinned**, edit in place | cannot move — tools read these paths |
| State / memory | where we are across sessions | `harness/state/progress.md` · `harness/state/session-handoff.md` · `feature_list.json` (root) | update every session |
| Feedback | catches bad output before ship | `harness/gates/` · `.claude/workflows/` (loops) | see "Changing a gate" |

Pinned = the tool demands that path. Indexed here, not relocated.

## The loop (highest-ROI layer)
- `.claude/workflows/generate-guard-retry.md` — generate → guard → exit code drives retry. Worker writes, guard grades; never the same actor.
- `.claude/workflows/gate-guard.md` — wraps any ticket touching protected files; runs gate-integrity, halts on red.
- `harness/loop/` — worked example: `pct.mjs` (generator) + `pct.guard.mjs` (guard).

## Changing a gate (the one dangerous edit)
Gates are frozen so an agent can't edit one to force a pass.
1. Only Zach changes a gate.
2. After: `bash harness/gates/gate-integrity.sh --update` regenerates `HASHES.txt`.
3. Commit gate + HASHES together.
4. Prove it still goes red: mutate the gate, confirm gate-integrity FAILs, revert.

## Not here (by design)
- Backend (Supabase `txpgyuetfsrzfxxopwzf`) — separate axis, own commits.
- Product engine (lead state machine, booking) — `zirowork-youratlas-framework.md`. Different "engine" from this harness.
- Migration history — branch `archive/migration`, never in the working tree.
