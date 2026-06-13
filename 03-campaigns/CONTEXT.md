# 03-campaigns — Context

> **JUDGMENT IS NOT PERMITTED.** Follow these rules exactly. Situation not covered? STOP AND ASK.

## You are here
Campaigns — the per-landing-page funnel: views → clicks → leads → trials → enrolled, one row per page (client × instrument). Shows which pages are producing.

## Files in this folder
```
campaigns.jsx  — funnel table, reads window.usePageFunnel(), exports window.CampaignsView
```

Counts come from `window.usePageFunnel()` (`93-hooks/use-local-data.js`) — derived, never stored. See `94-knowledge/data-ssot.md`. View tracking is written by `schools/app.jsx` into the `page_events` table.

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
