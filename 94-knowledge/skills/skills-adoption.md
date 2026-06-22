# ZiroWork — Skills Adoption Policy

Reference, not instructions. This records ZiroWork's standing decisions about Matt Pocock's engineering skills: which are adopted, what task each fits, which are skipped. The source of truth for *how and when* to use a skill is that skill's own `description`. This file records *which ones ZiroWork uses, and for what*.

Scope: these are build-process skills for whatever agent builds ZiroWork. They are not runtime behaviors of the lead-working edge functions (`on-reply`, `billing`, etc.).

## Two classes

- **Standing infrastructure** — installed once for the repo. These execute and install things (git hooks, scripts). Installation is an owner-approved action, separate from routine task work, and not performed during the CDN→React migration.
- **Per-task workflow** — instruction-only skills that fit specific task types. Applying one is free and reversible.

## Standing infrastructure

| Skill | Installs | Why it fits |
|---|---|---|
| `misc/setup-pre-commit` | Husky + lint-staged: Prettier + typecheck + tests at commit | Doctrine §5 tsc/eslint gates, enforced at commit time |
| `misc/git-guardrails-claude-code` | Hooks blocking push / reset --hard / clean / branch -D | Preserves the owner-as-commit-funnel rule; destructive git is blocked |
| `engineering/setup-matt-pocock-skills` | Issue-tracker + triage labels + doc layout | Prerequisite only if the issue-tracker build loop is adopted (a workflow commitment) |

## Per-task fit

| Task type | Skill(s) that fit | ZiroWork tie |
|---|---|---|
| Building on the spine / billing / enrollment | `grill-with-docs`, `tdd`, `implement`, `review` | Money paths get spec'd, ADR'd, tested first |
| Terminology work ("enrolled", lead vocab) | `engineering/domain-modeling` | Holds doctrine §1 definitions against drift |
| Designing the availability/connector interface or a spine seam | `engineering/codebase-design` | Deep-module / clean-seam vocabulary |
| Conversation → spec | `engineering/to-prd`, `to-issues` | Vertical-slice issues; architect-plans / owner-commits |
| Stress-testing a plan | `productivity/grilling` | The chat grilling, formalized |
| Reviewing a branch / WIP | `in-progress/review` | Checks code vs Standards + Spec — drift caught at review |
| Hard bug / perf regression | `engineering/diagnosing-bugs` | — |
| Migration merge/rebase conflict | `engineering/resolving-merge-conflicts` | CDN→React lanes will collide |
| Testing a flow before committing (e.g. booking conversation) | `engineering/prototype` | Throwaway, not production |
| Ending a session | `productivity/handoff` | Formalizes the `_migration/progress.md` habit |
| Authoring a CONTEXT/SKILL/gate doc | `productivity/writing-great-skills` | Reference for writing our own skills well |

## Adopt / skip ledger

- Adopt (standing): `setup-pre-commit`, `git-guardrails-claude-code`.
- Adopt (per-task, core): `domain-modeling`, `grilling`/`grill-with-docs`, `handoff`, `codebase-design`, `tdd`.
- Adopt (per-task, as the build cadence forms): `to-prd`, `to-issues`, `implement`, `review` (in-progress).
- Situational: `diagnosing-bugs`, `resolving-merge-conflicts`, `prototype`, `triage`, `decision-mapping`, `ask-matt`.
- Reference only: `writing-great-skills`.
- Skip: all `deprecated/*`; `personal/*`; `in-progress/writing-*`; `misc/scaffold-exercises`; `productivity/teach`; `misc/migrate-to-shoehorn` (unless shoehorn is adopted for tests).

## Policy notes

- Standing infrastructure is installed only by owner decision; refactor-heavy skills are out of scope during the CDN→React migration.
- This document stays a thin reference. Skill bodies are not copied here, and their when-to-use is not re-documented — that would drift from the real skills.
- Skills define *how*; this document defines *which and when, for ZiroWork*.
