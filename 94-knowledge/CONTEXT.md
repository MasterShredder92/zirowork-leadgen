# 94-knowledge — Context

> **JUDGMENT IS NOT PERMITTED.** Follow these rules exactly. Situation not covered? STOP AND ASK.

## You are here
Reference documentation — product vision, architecture, design system, and data model. Read-only reference layer (Layer 3 in ICM).

## Files in this folder
```
northstar-ideology.md  — product vision, business model, ZiroWork's role, operator questions per page
architecture.md        — system architecture, component relationships, data flow
design-system.md       — visual design rules, component patterns, theme usage
data-model.md          — Supabase schema, table relationships, field definitions
migrations/            — SQL migration files (reference only — run via Supabase, not from here)
page-designs/          — visual design mockups and specs (reference only)
skills/                — reusable skill/task reference docs
```

## Enter ONLY if
Your task requires understanding the product, architecture, design conventions, or data schema.

## Do NOT enter if
- Task involves writing code → go to the relevant feature folder first, come here for reference only
- Task involves running SQL migrations → those are run via Supabase dashboard, not here

## Load rules by sub-task
| Task | Load |
|---|---|
| Understand product purpose / business model | `northstar-ideology.md` only |
| Understand component relationships or data flow | `architecture.md` only |
| Understand visual patterns or theme usage | `design-system.md` only |
| Wire a new Supabase table or understand schema | `data-model.md` only |
| Migration reference | `migrations/` — read the specific migration file needed |

## Hard stop
This folder is REFERENCE ONLY. Do not modify these files unless explicitly asked to update documentation.
No code lives here. No writes happen here during normal tasks.
