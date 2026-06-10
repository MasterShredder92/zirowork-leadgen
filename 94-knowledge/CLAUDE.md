# 94-knowledge/ — Reference Material

Stable reference files. Don't change session-to-session. Define how the app works, what the API expects, what the database looks like.

---

## File Map

| File | What It Does |
|---|---|
| `design-system.md` | **The law** — layout patterns, KPI stats, tables, buttons, badges, typography. Load before any new view. |
| `architecture.md` | Stack, theme tokens, component patterns, key design decisions |
| `api-contract.md` | All API endpoints with method, path, body, response — the spec for wiring Supabase |
| `database-schema.md` | Supabase table schemas with column types, FK relationships |
| `CLAUDE.md` | This file |

---

## Load Table

| Resource | When | Why |
|---|---|---|
| `94-knowledge/design-system.md` | **Building any new view or component** | The canonical design rules — layout, KPIs, tables, buttons. Never skip this. |
| `94-knowledge/architecture.md` | Theme bugs, navigation changes, drag-and-drop issues | Theme tokens + component patterns |
| `94-knowledge/api-contract.md` | Wiring any API endpoint, replacing mock data with real Supabase calls | Exact endpoint spec — method, body shape, response shape |
| `94-knowledge/database-schema.md` | Schema questions, adding columns, writing migrations | Column types, relationships, enum values |

Do NOT load all at once. Load only the one the task requires.

---

## Danger Zone

`database-schema.md` and `api-contract.md` describe the **intended** schema and API contracts. Neither has been connected to a live Supabase instance yet. Before treating any entry here as ground truth, verify it against the actual Supabase schema using the MCP Supabase tools or Supabase dashboard.

Do not modify these files to match a diverged live schema without updating `handoff.md` to match.
