# CLAUDE.md — zirowork-leadgen (executor map)

Map, not a manual. What this repo is, how to run it, how to verify it, what you may not break.
Moving state (current phase, what's done/blocked) lives in `harness/state/progress.md` — read it first every session.

## WHAT THIS IS
Correcting a shipping lead-gen app, not building a new one. We are replacing the foundation
(CDN React + in-browser Babel + `window.*` globals + inline styles) with a real toolchain
(Next 16 App Router + TS strict + Tailwind v4 + ESLint 9), one view at a time, without changing
what the app does or how it looks. The migration is what makes the app controllable by an agent later.

## CURRENT STATE
Migration COMPLETE — Phases 0–5 all gated (2026-06-21/22). Source of truth: `harness/state/progress.md`.
Historical phase gate scripts preserved in git history (`archive/migration` branch).
North-path engine is NEXT — see `harness/north-path-plan.md`.

## HOW TO RUN
1. `npm install`
2. `npm run dev` → http://localhost:3000 (currently a blank page — that is correct; no views ported yet)
Scripts: `dev` `build` `start` `lint` (= `eslint`). Node ≥ 20.9.

## HOW TO VERIFY (the gate is the truth, not "looks done")
Run the current phase's checker. Green (exit 0) = the only valid "done". The worker writes claims; the script grades them.
- `bash harness/gates/verify-build.sh` — build + tsc + lint + serve. The standing gate. Use this.
- Historical per-phase gate scripts (`verify-phase-N.sh`) are in the `archive/migration` branch.
- A gate that can't go red is not a gate. After widening any exclude/ignore, plant an error in `src/` and confirm the gate fails, then revert.

## NON-NEGOTIABLES
1. Phases run IN ORDER. Phase N+1 is forbidden until Phase N's gate passes. The agent layer (Phase 5) is built LAST.
2. Migration ≠ redesign. Change how code is built/organized; never change behavior or pixels. Same views, same output.
3. Per-file gate when porting a view: it renders identically to the original + tsc + lint pass. Pixels differ → migration is wrong.
4. One change per commit. Never mix migration with improvements.
5. Mechanically-checkable rule → a script that exits non-zero (hex literals, missing columns, import style, types, lint). Never prose.
6. Trust behavior, not self-reports. "It runs / the gate passes" counts. "Done" / "production-ready" is not evidence.
7. Tooling is scoped to `src/` ON PURPOSE. `tsconfig` + `eslint` exclude all legacy folders (`00-*`…`99-agents`, `schools/`, `dashboard/`)
   until each view migrates into `src/`. Do NOT re-include them — legacy `.jsx`/Deno `.ts` will face-plant tsc. Coverage grows as views move.
8. Backend is UNCHANGED and lives in the Supabase project (ref `txpgyuetfsrzfxxopwzf`), not this repo. Don't touch it during view migration; it's a separate axis with its own commits.
9. Every session ends clean: phase work verified, no debug/half-commits, `progress.md` + `session-handoff.md` updated. "Clean up later" = never.

## STACK (pins, do not drift)
- next 16.2.9 · react / react-dom 19.2.4 · typescript ^5 (strict, noEmit = type gate) · tailwindcss ^4 + @tailwindcss/postcss ^4 · eslint ^9 + eslint-config-next (flat config)
- App Router only: Server Components default, `"use client"` opt-in. Do not blanket-`"use client"`.
- Tailwind v4 is CSS-first: theme in `src/app/globals.css` via `@theme`, components use `var(--token)`. No `tailwind.config.js`, no hex literals in components, no color utilities.
- In Next 16, `next build` does NOT run eslint and `next lint` is gone — lint is its own gate step.

## STRUCTURE (new tree coexists with old until migrated)
```
src/app/            ← new: layout.tsx, page.tsx, globals.css (App Router lives here)
src/components/      ← new (Phase 3): src/components/[domain]/ client components
src/hooks/           ← new (Phase 2/3): use[Domain]State.ts
harness/             ← agent harness (gates, state, loop, agent.md)
.claude/workflows/   ← new (Phase 5): orchestrators
harness/north-path-plan.md ← live north-path engine plan (moved from _migration/)
00-* … 99-agents/    ← LEGACY views (window.* jsx). Excluded from tooling. Deleted leaf-by-leaf as each ports to src/.
index.html, schools/, dashboard/, www/, legal/, vercel.json ← legacy entry points + routing. Routing moves into App Router at Phase 4; don't patch vercel.json before then.
```

## ROLES
Plan/architecture is produced upstream (file order, per-file specs, gates). This repo is the executor surface.
You commit; nothing else decides that. For multi-session work, keep `progress.md` and `session-handoff.md` current so the thread is never lost.

@AGENTS.md
