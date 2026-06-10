-- =============================================================
-- 021: Drop the orphan `pages` table
-- Run in PLATFORM Supabase SQL editor (txpgyuetfsrzfxxopwzf)
-- =============================================================
--
-- `client_pages` is the canonical landing-page table (created in 017).
-- All code uses it: onboard-form.jsx writes it, use-pages.js + schools/app.jsx
-- read it. The old `pages` table was never read or written by any code — it
-- only held 6 hand-seeded demo rows (client_id = NULL, fictional schools).
--
-- This drops the dead table so there is exactly one source of truth.
-- Safe: nothing references public.pages (no inbound foreign keys); the demo
-- rows contain no real client data.
-- =============================================================

drop table if exists public.pages cascade;
