# ZiroWork — Music Academy OS

A full CRM and operations platform for managing music schools. Handles leads, families, students, teachers, invoices, scheduling, and payroll in a single React SPA.

**Status:** UI shell complete. Supabase backend not yet connected. All data is mock.

---

## Stack

- React 18 + Babel (no bundler — browser-native JSX via CDN)
- Supabase (planned — not yet wired)
- No build step. No package.json. No install.

---

## Running Locally

Open `index.html` in a browser. That's it.

For live reload during development, serve the folder with any static server:
```
npx serve .
# or
python -m http.server 8080
```

Then open `http://localhost:8080/index.html`.

---

## Architecture

The app is a single HTML file (`index.html`) that loads Babel-compiled `.jsx` component files as `<script type="text/babel">` tags. All components share the browser's global scope — a component defined in `roster.jsx` is available as `RosterView` inside `index.html`.

**Theme:** `theme.js` initializes `window.T` with all color tokens. Components access theme via `const T = window.T || {};`.

**Navigation:** State-driven. `App()` in `index.html` dispatches views via `setView()`. No URL routing.

See `knowledge/architecture.md` for the full file routing map and component patterns.

---

## Agent Navigation

- `CLAUDE.md` — start here (ICM L0 router)
- `knowledge/architecture.md` — component patterns, theme, nav routing
- `knowledge/api-contract.md` — API endpoint specs for Supabase wiring
- `knowledge/database-schema.md` — database table schemas
- `.brain/repo-digest.md` — quick reference + current file map
- `.brain/session-log.md` — what changed recently, what's next

---

## Key Files

| File | Purpose |
|---|---|
| `index.html` | App shell + inline components (3,600+ lines) |
| `theme.js` | Dual theme system, pixel-crawl animation |
| `sidebar.jsx` | Navigation + command palette |
| `student-profile.jsx` | Student profile page |
| `knowledge/handoff.md` | Comprehensive architecture + API handoff document |
