# .brain/ — Session Memory

This folder is short-term memory. It changes every session. Not rules, not architecture — just where we are, what's left, and how to do repeatable tasks.

---

## GUARDRAILS

- **Load only what the task requires.** Use the load table below. Do not read everything.
- **Session log is history, not instructions.** Do not use it to infer patterns or make decisions.
- **Architecture and code rules live in `knowledge/` — not here.** Do not treat anything in this folder as a stable constraint.
- **If the task doesn't match a how-to guide — ask before proceeding.** Do not improvise a process.

---

## What's Here

| File / Folder | What It Does |
|---|---|
| `current-state.md` | Where we left off. Read this at the start of every session. |
| `session-log.md` | History of all past sessions. Never load on startup — reference only. |
| `whats-left.md` | Everything that still needs to be built or wired. |
| `how-to/` | Step-by-step guides for repeatable tasks (editing components, wiring Supabase, etc). |
| `cleanup/` | Auto-runs every session start. Don't touch unless something breaks. |

---

## When to Load What

| When | Load |
|---|---|
| Start of every session | `current-state.md` |
| Editing any `.jsx` file | `how-to/01-component-edit/CONTEXT.md` |
| Replacing mock data with Supabase | `how-to/02-api-wire/CONTEXT.md` |
| Adding a new view/page | `how-to/03-view-add/CONTEXT.md` |
| Closing a session | `how-to/session-close/CONTEXT.md` |
| Deep repo cleanup | `how-to/repo-cleanup/CONTEXT.md` |

---

## Do NOT

- Don't read `session-log.md` for coding patterns — that's in `94-knowledge/architecture.md`.
- Don't add architecture docs here — those belong in `94-knowledge/`.
- Don't edit `cleanup/` files — they're auto-maintained.
