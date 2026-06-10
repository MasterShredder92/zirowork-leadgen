# ZiroWork Lead-Gen Platform

ZiroWork works leads for music-school clients and hands off enrolled students. This repo is the whole platform — **one repo, one Vercel project**.

**Stack:** React 18 + Babel (browser-native JSX via CDN — no bundler, no build step). Supabase (live). Agent/edge-function backend under `99-agents/`.

## Surfaces

One Vercel project (Root Directory `.`), routed by root `vercel.json`:

| URL | Folder | What |
|---|---|---|
| `/` | `index.html` + `00-…16-` numbered folders | Operator CRM (internal) |
| `/schools/{slug}/{instrument}` | `schools/` | Student landing pages |
| `/dashboard` | `dashboard/` | Client portal |
| `/onboard.html` | `onboard.html` + `02-onboarding/onboard-form.jsx` | Public self-serve onboarding |

## Running locally

No build step. Serve the repo root with any static server:

```
npx serve .
# operator CRM:   http://localhost:3000/
# a school page:  http://localhost:3000/schools/index.html
```

> The `/schools/{slug}/{instrument}` and `/dashboard` clean URLs are produced by `vercel.json` rewrites in production; a plain static server serves the section `index.html` files directly.

## Where to look

- **`CLAUDE.md`** — start here. The L0 router: repo tree, safety gates, key globals, navigation.
- **`CONTEXT.md`** — task router (which folder for which task).
- **`ZiroWork-Client-Flow`** — single source of truth / doctrine.
- **`94-knowledge/`** — architecture, data model, design system, northstar.
- **`99-agents/README.md`** — agent / edge-function backend.

## Deploy

Push to `main` on `github.com/MasterShredder92/zirowork-leadgen` → Vercel auto-deploys (Root Directory `.`).
