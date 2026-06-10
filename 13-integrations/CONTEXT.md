# 13-integrations — Context

> **JUDGMENT IS NOT PERMITTED.** Follow these rules exactly. Situation not covered? STOP AND ASK.

## You are here
Integrations — third-party service connections (CRMs, calendars, communication tools).

## Files in this folder
```
integrations.jsx  — main view, integration list + connection status, exports window.IntegrationsView
```

## Enter ONLY if
Your task explicitly names: integrations, third-party connections, route `integrations`, or `window.IntegrationsView`.

## Do NOT enter if
- Task involves agent backend integrations (API calls, webhooks) → go to `99-agents/`
- Task involves Supabase wiring → go to `93-hooks/`
- Task involves seed data → go to `93-hooks/use-local-data.js`

## Load only
`13-integrations/integrations.jsx` — nothing else.

## Hard stop
You may NOT open any file outside this folder.
If you think you need another file — STOP AND ASK first.
