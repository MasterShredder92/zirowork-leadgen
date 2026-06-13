# 03-campaigns — Context

> **JUDGMENT IS NOT PERMITTED.** Follow these rules exactly. Situation not covered? STOP AND ASK.

## You are here
Campaigns — the per-landing-page funnel: views → clicks → leads → trials → enrolled, one row per page (client × instrument). Filterable by client / program / status / date range, with a summary metric band and a click-through detail panel (funnel bars + conversion donut + 30-day trend). Shows which pages are producing.

## Files in this folder
```
campaigns.jsx  — funnel table + filters + detail panel, reads window.usePageFunnel(sinceMs), exports window.CampaignsView
```

Counts come from `window.usePageFunnel(sinceMs)` (`93-hooks/use-local-data.js`) — derived, never stored; `sinceMs` windows the date-range filter. The detail panel's 30-day trend reads raw `page_events` rows via `window.sb`. See `94-knowledge/data-ssot.md`. View tracking is written by `schools/app.jsx` into the `page_events` table.

## Enter ONLY if
Your task explicitly names: campaigns, route `campaigns`, or `window.CampaignsView`.

## Do NOT enter if
- Task involves landing pages for campaigns → go to `04-pages/`
- Task involves leads coming from campaigns → go to `05-leads/`
- Task involves seed data → go to `93-hooks/use-local-data.js`

## Load only
`03-campaigns/campaigns.jsx` — nothing else.

## Hard stop
You may NOT open any file outside this folder.
If you think you need another file — STOP AND ASK first.
